import { IsEnum } from 'class-validator';
import { Locale } from './locale';

export class UpdateLocaleDTO {
  @IsEnum(Locale)
  locale: Locale;
}
