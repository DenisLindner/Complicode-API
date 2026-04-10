import {
  IsAlphanumeric,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChallengeDTO {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @IsOptional()
  theme?: string;

  @IsArray()
  @IsNotEmpty()
  stack: string[];

  @IsString()
  @IsNotEmpty()
  @IsAlphanumeric('en-US')
  time: string;

  @IsString()
  @IsOptional()
  dificuldade?: string;
}
