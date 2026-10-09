import { ServiceUnavailableException } from '@nestjs/common';
import { GENERATED_CHALLENGE } from '../../test/fixtures/generated-challenge';
import { GeminiService } from '../ai/gemini.service';
import { CatalogService } from '../catalog/catalog.service';
import { CreditService } from '../credit/credit.service';
import {
  ChallengeLevel,
  ChallengeStatus,
  CreditTransactionType,
  type User,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeService } from './challenge.service';

describe('ChallengeService', () => {
  const user = { id: 'user-1' } as User;
  const stack = { id: 'stack-1', name: 'Backend' };
  const framework = { id: 'fw-1', name: 'NestJS', language: 'TypeScript' };

  let prisma: {
    $transaction: jest.Mock;
    challenge: Record<string, jest.Mock>;
    challengeVersion: Record<string, jest.Mock>;
  };
  let credit: { debit: jest.Mock; grant: jest.Mock };
  let gemini: { generateChallenge: jest.Mock };
  let service: ChallengeService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: unknown) => unknown)(prisma)
          : Promise.all(arg as unknown[]),
      ),
      challenge: {
        create: jest.fn().mockResolvedValue({ id: 'ch-1' }),
        update: jest.fn().mockResolvedValue({ id: 'ch-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          { title: 'Sistema de Reservas', projectName: 'DeskFlow' },
          { title: 'Legado', projectName: null },
        ]),
      },
      challengeVersion: { create: jest.fn() },
    };
    credit = { debit: jest.fn(), grant: jest.fn() };
    gemini = {
      generateChallenge: jest.fn().mockResolvedValue({
        challenge: GENERATED_CHALLENGE,
        model: 'gemini-test',
      }),
    };
    const catalog = {
      findSelection: jest.fn().mockResolvedValue({ stack, framework }),
    };

    service = new ChallengeService(
      prisma as unknown as PrismaService,
      catalog as unknown as CatalogService,
      credit as unknown as CreditService,
      gemini as unknown as GeminiService,
    );
  });

  describe('generate', () => {
    const dto = {
      stackId: stack.id,
      frameworkId: framework.id,
      level: ChallengeLevel.JUNIOR,
    };

    it('charges one credit and stores the first version', async () => {
      await service.generate(user, dto);

      expect(credit.debit).toHaveBeenCalledWith(prisma, {
        userId: user.id,
        amount: 1,
        type: CreditTransactionType.CHALLENGE_GENERATION,
        referenceId: 'ch-1',
      });
      expect(gemini.generateChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          avoidTitles: ['Sistema de Reservas (DeskFlow)', 'Legado'],
        }),
      );
      expect(prisma.challenge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ...GENERATED_CHALLENGE, status: ChallengeStatus.READY },
        }),
      );
      expect(prisma.challengeVersion.create).toHaveBeenCalledWith({
        data: {
          challengeId: 'ch-1',
          version: 1,
          model: 'gemini-test',
          ...GENERATED_CHALLENGE,
        },
      });
    });

    it('marks the challenge as failed and refunds the credit', async () => {
      gemini.generateChallenge.mockRejectedValue(
        new ServiceUnavailableException(),
      );

      await expect(service.generate(user, dto)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(prisma.challenge.update).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
        data: { status: ChallengeStatus.FAILED },
      });
      expect(credit.grant).toHaveBeenCalledWith(prisma, {
        userId: user.id,
        amount: 1,
        type: CreditTransactionType.REFUND,
        referenceId: 'ch-1',
      });
      expect(prisma.challengeVersion.create).not.toHaveBeenCalled();
    });
  });

  describe('regenerate', () => {
    const owned = {
      id: 'ch-1',
      frameworkId: framework.id,
      level: ChallengeLevel.MID,
      status: ChallengeStatus.READY,
      regenerationsUsed: 0,
      stack,
      framework,
    };

    it('regenerates for free and stores the second version', async () => {
      prisma.challenge.findFirst.mockResolvedValue(owned);

      await service.regenerate(user, 'ch-1');

      expect(credit.debit).not.toHaveBeenCalled();
      expect(prisma.challengeVersion.create).toHaveBeenCalledWith({
        data: {
          challengeId: 'ch-1',
          version: 2,
          model: 'gemini-test',
          ...GENERATED_CHALLENGE,
        },
      });
    });

    it('allows only one regeneration', async () => {
      prisma.challenge.findFirst.mockResolvedValue({
        ...owned,
        regenerationsUsed: 1,
      });

      await expect(service.regenerate(user, 'ch-1')).rejects.toThrow(
        'Challenge already regenerated',
      );
      expect(gemini.generateChallenge).not.toHaveBeenCalled();
    });

    it('rejects concurrent regenerations', async () => {
      prisma.challenge.findFirst.mockResolvedValue(owned);
      prisma.challenge.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.regenerate(user, 'ch-1')).rejects.toThrow(
        'Challenge is not ready to be regenerated',
      );
    });

    it('gives the regeneration back when the model fails', async () => {
      prisma.challenge.findFirst.mockResolvedValue(owned);
      gemini.generateChallenge.mockRejectedValue(
        new ServiceUnavailableException(),
      );

      await expect(service.regenerate(user, 'ch-1')).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(prisma.challenge.update).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
        data: { status: ChallengeStatus.READY, regenerationsUsed: 0 },
      });
    });
  });
});
