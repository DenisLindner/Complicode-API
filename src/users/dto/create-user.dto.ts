import {
  IsAlphanumeric,
  IsEmail,
  IsLowercase,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  NotContains,
} from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(60)
  @IsLowercase()
  @NotContains(' ', { message: 'The username cannot have blank spaces' })
  @IsAlphanumeric('en-US')
  username: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  @MaxLength(60)
  name?: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;
}
