import { IsEnum, IsUUID } from 'class-validator';
import { ChallengeLevel } from '../../generated/prisma/client';

export class GenerateChallengeDTO {
  @IsUUID()
  stackId: string;

  @IsUUID()
  frameworkId: string;

  @IsEnum(ChallengeLevel)
  level: ChallengeLevel;
}
