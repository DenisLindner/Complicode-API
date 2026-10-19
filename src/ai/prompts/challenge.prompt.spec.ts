import { ChallengeLevel, Locale } from '../../generated/prisma/client';
import {
  buildChallengePrompt,
  buildSystemInstruction,
  CHALLENGE_RESPONSE_SCHEMA,
} from './challenge.prompt';

describe('buildChallengePrompt', () => {
  const input = {
    stack: 'Backend',
    framework: 'NestJS',
    language: 'TypeScript',
    level: ChallengeLevel.MID,
    locale: Locale.en,
    avoidTitles: [],
  };

  it('describes the selection and a real industry scenario', () => {
    const prompt = buildChallengePrompt(input, () => 0);

    expect(prompt).toContain('Area (stack): Backend');
    expect(prompt).toContain('Main framework: NestJS (TypeScript)');
    expect(prompt).toContain('Level: Mid-level, a deadline of 2 to 3 weeks');
    expect(prompt).toContain(
      'the Financial services industry, the problem of automatic reconciliation',
    );
    expect(prompt).not.toContain('Do not repeat');
  });

  it.each([
    [Locale.en, 'English'],
    [Locale.pt, 'Brazilian Portuguese'],
    [Locale.es, 'Spanish'],
  ])('asks for the document in the language of %s', (locale, language) => {
    const prompt = buildChallengePrompt({ ...input, locale });

    expect(prompt).toContain(`Language of the document: ${language}`);
    expect(buildSystemInstruction(locale)).toContain(
      `Write everything in ${language}`,
    );
  });

  it('explains every field of the response schema', () => {
    const prompt = buildChallengePrompt(input);

    for (const field of CHALLENGE_RESPONSE_SCHEMA.required) {
      expect(prompt).toContain(`- ${field}:`);
    }
  });

  it('asks the model to avoid previous titles', () => {
    const prompt = buildChallengePrompt({
      ...input,
      avoidTitles: ['Sistema de Reservas (DeskFlow)'],
    });

    expect(prompt).toContain('Do not repeat');
    expect(prompt).toContain('- Sistema de Reservas (DeskFlow)');
  });
});
