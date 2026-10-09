import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PaginationDTO } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreditOperation } from './credit.types';

@Injectable()
export class CreditService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { credits: true },
    });

    return { balance: user.credits };
  }

  async listTransactions(userId: string, pagination: PaginationDTO) {
    const where = { userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.creditTransaction.count({ where }),
    ]);

    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  /**
   * Adds credits to the user. Idempotent per (userId, type, referenceId):
   * returns false when the operation was already applied.
   */
  async grant(tx: Prisma.TransactionClient, operation: CreditOperation) {
    if (await this.alreadyApplied(tx, operation)) {
      return false;
    }

    const user = await tx.user.update({
      where: { id: operation.userId },
      data: { credits: { increment: operation.amount } },
    });
    await this.record(tx, operation, operation.amount, user.credits);

    return true;
  }

  /**
   * Removes credits from the user, failing with 402 when the balance is
   * insufficient. The conditional update keeps concurrent debits safe.
   */
  async debit(tx: Prisma.TransactionClient, operation: CreditOperation) {
    const { count } = await tx.user.updateMany({
      where: { id: operation.userId, credits: { gte: operation.amount } },
      data: { credits: { decrement: operation.amount } },
    });

    if (count === 0) {
      throw new HttpException(
        'Insufficient credits',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: operation.userId },
      select: { credits: true },
    });
    await this.record(tx, operation, -operation.amount, user.credits);
  }

  private async alreadyApplied(
    tx: Prisma.TransactionClient,
    { userId, type, referenceId }: CreditOperation,
  ) {
    const existing = await tx.creditTransaction.findUnique({
      where: { userId_type_referenceId: { userId, type, referenceId } },
    });

    return existing !== null;
  }

  private async record(
    tx: Prisma.TransactionClient,
    { userId, type, referenceId }: CreditOperation,
    amount: number,
    balanceAfter: number,
  ) {
    await tx.creditTransaction.create({
      data: { userId, type, referenceId, amount, balanceAfter },
    });
  }
}
