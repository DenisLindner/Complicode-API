import { ChallengeLevel, Locale } from '../generated/prisma/client';

export const LEVEL_LABELS: Record<Locale, Record<ChallengeLevel, string>> = {
  [Locale.en]: {
    [ChallengeLevel.INTERN]: 'Intern',
    [ChallengeLevel.JUNIOR]: 'Junior',
    [ChallengeLevel.MID]: 'Mid-level',
    [ChallengeLevel.SENIOR]: 'Senior',
  },
  [Locale.pt]: {
    [ChallengeLevel.INTERN]: 'Estagiário',
    [ChallengeLevel.JUNIOR]: 'Júnior',
    [ChallengeLevel.MID]: 'Pleno',
    [ChallengeLevel.SENIOR]: 'Sênior',
  },
  [Locale.es]: {
    [ChallengeLevel.INTERN]: 'Pasante',
    [ChallengeLevel.JUNIOR]: 'Junior',
    [ChallengeLevel.MID]: 'Semi senior',
    [ChallengeLevel.SENIOR]: 'Senior',
  },
};
