import { KeycloakService } from '../auth/keycloak/keycloak.service';
import { CreditService } from '../credit/credit.service';
import {
  CreditTransactionType,
  type User,
  VerificationChannel,
} from '../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { VerificationService } from './verification.service';

describe('VerificationService (phone via Telegram)', () => {
  const pending = { id: 'code-1', userId: 'user-1' };

  let prisma: {
    $transaction: jest.Mock;
    user: Record<string, jest.Mock>;
    verificationCode: Record<string, jest.Mock>;
  };
  let credit: { grant: jest.Mock };
  let service: VerificationService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: unknown) => unknown)(prisma)
          : Promise.all(arg as unknown[]),
      ),
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest
          .fn()
          .mockResolvedValue({ emailVerified: true, phoneVerified: true }),
      },
      verificationCode: {
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn(),
        create: jest.fn((args: { data: object }) => ({
          id: 'code-1',
          ...args.data,
        })),
      },
    };
    credit = { grant: jest.fn().mockResolvedValue(true) };
    const telegram = {
      deepLink: (token: string) => `https://t.me/ComplicodeBot?start=${token}`,
    };

    service = new VerificationService(
      prisma as unknown as PrismaService,
      credit as unknown as CreditService,
      {} as MailService,
      {} as KeycloakService,
      telegram as unknown as TelegramService,
    );
  });

  describe('startPhoneVerification', () => {
    it('returns a deep link whose token is stored hashed', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(null);

      const result = await service.startPhoneVerification({
        id: 'user-1',
        phoneVerified: false,
      } as User);

      const token = result.deepLink.split('start=')[1];
      expect(token).toMatch(/^[\w-]{16}$/);
      const { data } = prisma.verificationCode.create.mock.calls[0][0] as {
        data: { codeHash: string; channel: VerificationChannel };
      };
      expect(data.channel).toBe(VerificationChannel.PHONE);
      expect(data.codeHash).not.toContain(token);
    });

    it('rejects users with a verified phone', async () => {
      await expect(
        service.startPhoneVerification({ phoneVerified: true } as User),
      ).rejects.toThrow('Phone already verified');
    });
  });

  describe('linkTelegram', () => {
    it('links the Telegram user to the pending code', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue({
        ...pending,
        user: { phoneVerified: false },
      });

      await service.linkTelegram('token', '42');

      expect(prisma.verificationCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { externalId: '42' },
      });
    });

    it('fails for invalid or expired tokens', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(null);

      await expect(service.linkTelegram('token', '42')).rejects.toMatchObject({
        reason: 'CODE_NOT_FOUND',
      });
    });

    it('fails when the Telegram account belongs to another user', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue({
        ...pending,
        user: { phoneVerified: false },
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2' });

      await expect(service.linkTelegram('token', '42')).rejects.toMatchObject({
        reason: 'TELEGRAM_IN_USE',
      });
    });
  });

  describe('confirmTelegramContact', () => {
    const contact = { phone: '5511987654321', telegramId: '42' };

    it('verifies the phone and grants the signup bonus', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(pending);

      await expect(
        service.confirmTelegramContact('42', contact),
      ).resolves.toEqual({ bonusGranted: true });

      expect(prisma.verificationCode.updateMany).toHaveBeenCalledWith({
        where: { id: 'code-1', consumedAt: null },
        data: { consumedAt: expect.any(Date), target: '+5511987654321' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          phone: '+5511987654321',
          phoneVerified: true,
          telegramId: '42',
        },
      });
      expect(credit.grant).toHaveBeenCalledWith(
        prisma,
        expect.objectContaining({ type: CreditTransactionType.SIGNUP_BONUS }),
      );
    });

    it('does not grant the bonus while the email is not verified', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(pending);
      prisma.user.update.mockResolvedValue({
        emailVerified: false,
        phoneVerified: true,
      });

      await expect(
        service.confirmTelegramContact('42', contact),
      ).resolves.toEqual({ bonusGranted: false });
      expect(credit.grant).not.toHaveBeenCalled();
    });

    it("rejects someone else's contact", async () => {
      await expect(
        service.confirmTelegramContact('42', { ...contact, telegramId: '7' }),
      ).rejects.toMatchObject({ reason: 'NOT_OWN_CONTACT' });
    });

    it('rejects contacts without a started verification', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(null);

      await expect(
        service.confirmTelegramContact('42', contact),
      ).rejects.toMatchObject({ reason: 'NOT_STARTED' });
    });

    it('rejects phones already used by another user', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(pending);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2' });

      await expect(
        service.confirmTelegramContact('42', contact),
      ).rejects.toMatchObject({ reason: 'PHONE_IN_USE' });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
