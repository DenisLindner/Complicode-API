import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { KeycloakService } from '../auth/keycloak/keycloak.service';
import {
  SIGNUP_BONUS_CREDITS,
  SIGNUP_BONUS_REFERENCE,
} from '../credit/credit.constants';
import { CreditService } from '../credit/credit.service';
import {
  CreditTransactionType,
  type User,
  VerificationChannel,
} from '../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  WHATSAPP_PROVIDER,
  type WhatsAppProvider,
} from '../whatsapp/whatsapp.provider';
import {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
} from './verification.constants';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly credit: CreditService,
    private readonly mail: MailService,
    private readonly keycloak: KeycloakService,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsAppProvider,
  ) {}

  async getStatus(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        emailVerified: true,
        phoneVerified: true,
        phone: true,
        credits: true,
      },
    });
  }

  async sendEmailCode(user: User) {
    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.issueCode(user, VerificationChannel.EMAIL, user.email, (code) =>
      this.mail.sendVerificationCode(user.email, user.name, code),
    );
  }

  async sendPhoneCode(user: User, phone: string) {
    if (user.phoneVerified) {
      throw new BadRequestException('Phone already verified');
    }

    const owner = await this.prisma.user.findUnique({ where: { phone } });
    if (owner && owner.id !== user.id) {
      throw new ConflictException('Phone already in use');
    }

    await this.issueCode(user, VerificationChannel.PHONE, phone, (code) =>
      this.whatsapp.sendVerificationCode(phone, code),
    );
  }

  /**
   * Confirms the latest code of the channel. When both email and phone end up
   * verified, the signup bonus is granted (only once per user).
   */
  async confirm(user: User, channel: VerificationChannel, code: string) {
    const record = await this.prisma.verificationCode.findFirst({
      where: { userId: user.id, channel, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Verification code expired or not found');
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts, request a new code');
    }
    if (!this.matches(record.codeHash, user.id, code)) {
      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code');
    }

    const bonusGranted = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.verificationCode.updateMany({
        where: { id: record.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (count === 0) {
        throw new BadRequestException('Verification code already used');
      }

      const updated = await tx.user.update({
        where: { id: user.id },
        data:
          channel === VerificationChannel.EMAIL
            ? { emailVerified: true }
            : { phone: record.target, phoneVerified: true },
      });

      if (!updated.emailVerified || !updated.phoneVerified) {
        return false;
      }

      return this.credit.grant(tx, {
        userId: user.id,
        amount: SIGNUP_BONUS_CREDITS,
        type: CreditTransactionType.SIGNUP_BONUS,
        referenceId: SIGNUP_BONUS_REFERENCE,
      });
    });

    if (channel === VerificationChannel.EMAIL) {
      await this.keycloak
        .markEmailVerified(user.keycloakId)
        .catch((error: Error) =>
          this.logger.warn(`Keycloak email sync failed: ${error.message}`),
        );
    }

    return { ...(await this.getStatus(user.id)), bonusGranted };
  }

  private async issueCode(
    user: User,
    channel: VerificationChannel,
    target: string,
    send: (code: string) => Promise<void>,
  ) {
    const last = await this.prisma.verificationCode.findFirst({
      where: { userId: user.id, channel, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new HttpException(
        'Wait before requesting a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const [, created] = await this.prisma.$transaction([
      this.prisma.verificationCode.deleteMany({
        where: { userId: user.id, channel, consumedAt: null },
      }),
      this.prisma.verificationCode.create({
        data: {
          userId: user.id,
          channel,
          target,
          codeHash: this.hash(user.id, code),
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      }),
    ]);

    try {
      await send(code);
    } catch (error) {
      await this.prisma.verificationCode.delete({ where: { id: created.id } });
      throw error;
    }
  }

  private hash(userId: string, code: string) {
    return createHash('sha256').update(`${userId}:${code}`).digest('hex');
  }

  private matches(codeHash: string, userId: string, code: string) {
    return timingSafeEqual(
      Buffer.from(codeHash, 'hex'),
      Buffer.from(this.hash(userId, code), 'hex'),
    );
  }
}
