import { Locale } from '../generated/prisma/client';

export { Locale };

/** English is the base language. */
export const DEFAULT_LOCALE = Locale.en;

/** Name of each language as the model should be told to write in it. */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  [Locale.en]: 'English',
  [Locale.pt]: 'Brazilian Portuguese',
  [Locale.es]: 'Spanish (neutral, understood across Latin America and Spain)',
};

/** Maps a BCP 47 tag (e.g. a Telegram `language_code`) to a supported locale. */
export function localeFromLanguageCode(code?: string | null): Locale {
  const language = code?.toLowerCase().split(/[-_]/)[0];

  return (
    Object.values(Locale).find((locale) => locale === language) ??
    DEFAULT_LOCALE
  );
}
