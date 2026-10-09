import { Transform } from 'class-transformer';
import { IsPhoneNumber } from 'class-validator';

export class SendPhoneCodeDTO {
  /** Brazilian phone number with area code, e.g. +5511999999999 */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? toE164(value) : value,
  )
  @IsPhoneNumber('BR')
  phone: string;
}

function toE164(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('55') && digits.length >= 12
    ? `+${digits}`
    : `+55${digits}`;
}
