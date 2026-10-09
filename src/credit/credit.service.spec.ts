import { HttpException } from '@nestjs/common';
import { CreditTransactionType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreditService } from './credit.service';

describe('CreditService', () => {
  const operation = {
    userId: 'user-1',
    amount: 2,
    type: CreditTransactionType.SIGNUP_BONUS,
    referenceId: 'signup',
  };

  let tx: {
    user: Record<string, jest.Mock>;
    creditTransaction: Record<string, jest.Mock>;
  };
  let service: CreditService;

  beforeEach(() => {
    tx = {
      user: {
        update: jest.fn().mockResolvedValue({ credits: 2 }),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ credits: 1 }),
      },
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };
    service = new CreditService({} as PrismaService);
  });

  describe('grant', () => {
    it('increments the balance and records the transaction', async () => {
      await expect(service.grant(tx as never, operation)).resolves.toBe(true);

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { credits: { increment: 2 } },
      });
      expect(tx.creditTransaction.create).toHaveBeenCalledWith({
        data: { ...operation, amount: 2, balanceAfter: 2 },
      });
    });

    it('skips operations that were already applied', async () => {
      tx.creditTransaction.findUnique.mockResolvedValue({ id: 'tx-1' });

      await expect(service.grant(tx as never, operation)).resolves.toBe(false);
      expect(tx.user.update).not.toHaveBeenCalled();
    });
  });

  describe('debit', () => {
    const debit = {
      ...operation,
      amount: 1,
      type: CreditTransactionType.CHALLENGE_GENERATION,
      referenceId: 'challenge-1',
    };

    it('decrements the balance when there are enough credits', async () => {
      tx.user.updateMany.mockResolvedValue({ count: 1 });

      await service.debit(tx as never, debit);

      expect(tx.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-1', credits: { gte: 1 } },
        data: { credits: { decrement: 1 } },
      });
      expect(tx.creditTransaction.create).toHaveBeenCalledWith({
        data: { ...debit, amount: -1, balanceAfter: 1 },
      });
    });

    it('fails with 402 when the balance is insufficient', async () => {
      tx.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.debit(tx as never, debit)).rejects.toMatchObject({
        status: 402,
      } satisfies Partial<HttpException>);
      expect(tx.creditTransaction.create).not.toHaveBeenCalled();
    });
  });
});
