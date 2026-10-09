import { CreditTransactionType } from '../generated/prisma/client';

export interface CreditOperation {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  referenceId: string;
}
