import { Locale, localeFromLanguageCode } from './locale';

describe('localeFromLanguageCode', () => {
  it.each([
    ['pt-BR', Locale.pt],
    ['PT', Locale.pt],
    ['es_MX', Locale.es],
    ['en-GB', Locale.en],
  ])('maps %s', (code, expected) => {
    expect(localeFromLanguageCode(code)).toBe(expected);
  });

  it.each(['fr', '', undefined, null])(
    'falls back to English for %p',
    (code) => {
      expect(localeFromLanguageCode(code)).toBe(Locale.en);
    },
  );
});
