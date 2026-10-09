import { Matches } from 'class-validator';

export class ConfirmCodeDTO {
  @Matches(/^\d{6}$/, { message: 'code must have 6 digits' })
  code: string;
}
