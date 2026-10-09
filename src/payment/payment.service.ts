import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaginationDTO } from '../common/dto/pagination.dto';
import { CreditService } from '../credit/credit.service';
import {
  CreditTransactionType,
  PaymentStatus,
  Prisma,
  type User,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AbacatePayService } from './abacatepay/abacatepay.service';
import {
  AbacatePayCheckout,
  AbacatePayWebhookEvent,
} from './abacatepay/abacatepay.types';
import { ABACATEPAY_PROVIDER, CREDIT_PACKAGE } from './payment.constants';

const PAYMENT_SELECT = {
  id: true,
  status: true,
  amountCents: true,
  credits: true,
  checkoutUrl: true,
  paidAt: true,
  createdAt: true,
} as const;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly productId: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly credit: CreditService,
    private readonly abacatePay: AbacatePayService,
    config: ConfigService,
  ) {
    this.productId = config.getOrThrow<string>('ABACATEPAY_CREDITS_PRODUCT_ID');
    this.frontendUrl = config.getOrThrow<string>('FRONTEND_URL');
  }

  /** Creates a hosted checkout for the credit package. */
  async createCheckout(user: User) {
    const payment = await this.prisma.payment.create({
      data: {
        userId: user.id,
        amountCents: CREDIT_PACKAGE.amountCents,
        credits: CREDIT_PACKAGE.credits,
      },
    });

    try {
      const checkout = await this.abacatePay.createCheckout({
        productId: this.productId,
        externalId: payment.id,
        returnUrl: `${this.frontendUrl}/credits`,
        completionUrl: `${this.frontendUrl}/credits?payment=${payment.id}`,
        metadata: { userId: user.id },
      });

      return await this.prisma.payment.update({
        where: { id: payment.id },
        data: { providerId: checkout.id, checkoutUrl: checkout.url },
        select: PAYMENT_SELECT,
      });
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CANCELLED },
      });
      throw error;
    }
  }

  async findMine(userId: string, pagination: PaginationDTO) {
    const where = { userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        select: PAYMENT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async findById(userId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, userId },
      select: PAYMENT_SELECT,
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Processes a verified webhook once per event id. Retries of an event that
   * was already processed are acknowledged without side effects.
   */
  async handleWebhook(event: AbacatePayWebhookEvent, eventId: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.webhookEvent.create({
          data: {
            id: eventId,
            provider: ABACATEPAY_PROVIDER,
            event: event.event,
            payload: event as unknown as Prisma.InputJsonValue,
          },
        });

        const checkout = event.data.checkout;
        if (!checkout) {
          return;
        }

        if (event.event === 'checkout.completed') {
          await this.markAsPaid(tx, checkout);
        } else if (event.event === 'checkout.refunded') {
          await this.markAsRefunded(tx, checkout);
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.log(`Webhook event ${eventId} already processed`);
        return;
      }
      throw error;
    }
  }

  private async markAsPaid(
    tx: Prisma.TransactionClient,
    checkout: AbacatePayCheckout,
  ) {
    const payment = await this.findByCheckout(tx, checkout);
    if (!payment || payment.status === PaymentStatus.PAID) {
      return;
    }

    if ((checkout.paidAmount ?? 0) < payment.amountCents) {
      this.logger.error(
        `Payment ${payment.id} paid ${checkout.paidAmount} of ${payment.amountCents} cents, credits not granted`,
      );
      return;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        providerId: checkout.id,
        paidAt: new Date(),
      },
    });
    await this.credit.grant(tx, {
      userId: payment.userId,
      amount: payment.credits,
      type: CreditTransactionType.PURCHASE,
      referenceId: payment.id,
    });
  }

  /** Removes the purchased credits that were not spent yet. */
  private async markAsRefunded(
    tx: Prisma.TransactionClient,
    checkout: AbacatePayCheckout,
  ) {
    const payment = await this.findByCheckout(tx, checkout);
    if (!payment || payment.status !== PaymentStatus.PAID) {
      return;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });

    const user = await tx.user.findUniqueOrThrow({
      where: { id: payment.userId },
      select: { credits: true },
    });
    const amount = Math.min(user.credits, payment.credits);
    if (amount > 0) {
      await this.credit.debit(tx, {
        userId: payment.userId,
        amount,
        type: CreditTransactionType.PURCHASE_REFUND,
        referenceId: payment.id,
      });
    }
  }

  private async findByCheckout(
    tx: Prisma.TransactionClient,
    checkout: AbacatePayCheckout,
  ) {
    const payment = await tx.payment.findFirst({
      where: {
        OR: [
          { providerId: checkout.id },
          ...(checkout.externalId ? [{ id: checkout.externalId }] : []),
        ],
      },
    });

    if (!payment) {
      this.logger.warn(`No payment found for checkout ${checkout.id}`);
    }

    return payment;
  }
}
