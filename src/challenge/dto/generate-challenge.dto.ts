import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ChallengeLevel, Locale } from '../../generated/prisma/client';

export class GenerateChallengeDTO {
  @IsUUID()
  stackId: string;

  @IsUUID()
  frameworkId: string;

  @IsEnum(ChallengeLevel)
  level: ChallengeLevel;

  /** Language of the document; defaults to the language of the user. */
  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;
}
