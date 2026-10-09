import { ChallengeLevel } from '../generated/prisma/client';

export const LEVEL_LABELS: Record<ChallengeLevel, string> = {
  [ChallengeLevel.INTERN]: 'Estagiário',
  [ChallengeLevel.JUNIOR]: 'Júnior',
  [ChallengeLevel.MID]: 'Pleno',
  [ChallengeLevel.SENIOR]: 'Sênior',
};
