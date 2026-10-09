import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import { KeycloakService } from '../auth/keycloak/keycloak.service';
import {
  SIGNUP_BONUS_CREDITS,
  SIGNUP_BONUS_REFERENCE,
} from '../credit/credit.constants';
import { CreditService } from '../credit/credit.service';
import {
  CreditTransactionType,
  type Prisma,
  type User,
  VerificationChannel,
} from '../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { PhoneVerificationError } from './phone-verification.error';
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
    private readonly telegram: TelegramService,
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

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const created = await this.issueCode(user.id, VerificationChannel.EMAIL, {
      target: user.email,
      codeHash: this.hash(`${user.id}:${code}`),
    });

    try {
      await this.mail.sendVerificationCode(user.email, user.name, code);
    } catch (error) {
      await this.prisma.verificationCode.delete({ where: { id: created.id } });
      throw error;
    }
  }

  async confirmEmail(user: User, code: string) {
    const record = await this.prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        channel: VerificationChannel.EMAIL,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Verification code expired or not found');
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts, request a new code');
    }
    if (!this.safeEqual(record.codeHash, this.hash(`${user.id}:${code}`))) {
      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code');
    }

    const bonusGranted = await this.complete(record.id, user.id, {
      emailVerified: true,
    });
    if (bonusGranted === undefined) {
      throw new BadRequestException('Verification code already used');
    }

    await this.keycloak
      .markEmailVerified(user.keycloakId)
      .catch((error: Error) =>
        this.logger.warn(`Keycloak email sync failed: ${error.message}`),
      );

    return { ...(await this.getStatus(user.id)), bonusGranted };
  }

  /**
   * Starts the phone verification: the user opens the Telegram deep link and
   * shares the contact of their own Telegram account with the bot.
   */
  async startPhoneVerification(user: User) {
    if (user.phoneVerified) {
      throw new BadRequestException('Phone already verified');
    }

    const token = randomBytes(12).toString('base64url');
    const created = await this.issueCode(user.id, VerificationChannel.PHONE, {
      codeHash: this.hash(token),
    });

    return {
      deepLink: this.telegram.deepLink(token),
      expiresAt: created.expiresAt,
    };
  }

  /** Step 1 in the bot: `/start <token>` links the Telegram user to the code. */
  async linkTelegram(token: string, telegramId: string) {
    const record = await this.prisma.verificationCode.findFirst({
      where: {
        codeHash: this.hash(token),
        channel: VerificationChannel.PHONE,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!record) {
      throw new PhoneVerificationError('CODE_NOT_FOUND');
    }
    if (record.user.phoneVerified) {
      throw new PhoneVerificationError('ALREADY_VERIFIED');
    }

    const owner = await this.prisma.user.findUnique({ where: { telegramId } });
    if (owner && owner.id !== record.userId) {
      throw new PhoneVerificationError('TELEGRAM_IN_USE');
    }

    await this.prisma.verificationCode.update({
      where: { id: record.id },
      data: { externalId: telegramId },
    });
  }

  /** Step 2 in the bot: the shared contact proves the phone number. */
  async confirmTelegramContact(
    telegramId: string,
    contact: { phone: string; telegramId?: string },
  ) {
    if (contact.telegramId !== telegramId) {
      throw new PhoneVerificationError('NOT_OWN_CONTACT');
    }

    const record = await this.prisma.verificationCode.findFirst({
      where: {
        externalId: telegramId,
        channel: VerificationChannel.PHONE,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) {
      throw new PhoneVerificationError('NOT_STARTED');
    }

    const phone = toE164(contact.phone);
    const owner = await this.prisma.user.findUnique({ where: { phone } });
    if (owner && owner.id !== record.userId) {
      throw new PhoneVerificationError('PHONE_IN_USE');
    }

    const bonusGranted = await this.complete(record.id, record.userId, {
      phone,
      phoneVerified: true,
      telegramId,
    });
    if (bonusGranted === undefined) {
      throw new PhoneVerificationError('NOT_STARTED');
    }

    return { bonusGranted };
  }

  /**
   * Consumes the code and applies the user changes. When both email and phone
   * end up verified, the signup bonus is granted (only once per user).
   * Returns undefined when the code was consumed concurrently.
   */
  private async complete(
    codeId: string,
    userId: string,
    data: Prisma.UserUpdateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.verificationCode.updateMany({
        where: { id: codeId, consumedAt: null },
        data: {
          consumedAt: new Date(),
          ...(typeof data.phone === 'string' && { target: data.phone }),
        },
      });
      if (count === 0) {
        return undefined;
      }

      const updated = await tx.user.update({ where: { id: userId }, data });
      if (!updated.emailVerified || !updated.phoneVerified) {
        return false;
      }

      return this.credit.grant(tx, {
        userId,
        amount: SIGNUP_BONUS_CREDITS,
        type: CreditTransactionType.SIGNUP_BONUS,
        referenceId: SIGNUP_BONUS_REFERENCE,
      });
    });
  }

  /** Replaces pending codes of the channel, respecting the resend cooldown. */
  private async issueCode(
    userId: string,
    channel: VerificationChannel,
    data: { codeHash: string; target?: string },
  ) {
    const last = await this.prisma.verificationCode.findFirst({
      where: { userId, channel, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new HttpException(
        'Wait before requesting a new code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const [, created] = await this.prisma.$transaction([
      this.prisma.verificationCode.deleteMany({
        where: { userId, channel, consumedAt: null },
      }),
      this.prisma.verificationCode.create({
        data: {
          userId,
          channel,
          ...data,
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      }),
    ]);

    return created;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private safeEqual(a: string, b: string) {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  }
}

/** Telegram sends the number with or without the leading "+". */
function toE164(phone: string) {
  return `+${phone.replace(/\D/g, '')}`;
}
