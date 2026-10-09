import { ChallengeLevel } from '../../generated/prisma/client';
import {
  buildChallengePrompt,
  CHALLENGE_RESPONSE_SCHEMA,
} from './challenge.prompt';

describe('buildChallengePrompt', () => {
  const input = {
    stack: 'Backend',
    framework: 'NestJS',
    language: 'TypeScript',
    level: ChallengeLevel.MID,
    avoidTitles: [],
  };

  it('describes the selection and a real industry scenario', () => {
    const prompt = buildChallengePrompt(input, () => 0);

    expect(prompt).toContain('Área (stack): Backend');
    expect(prompt).toContain('Framework principal: NestJS (TypeScript)');
    expect(prompt).toContain('Nível: Pleno, prazo de 2 a 3 semanas');
    expect(prompt).toContain(
      'setor de Serviços financeiros, problema de conciliação automática',
    );
    expect(prompt).not.toContain('Não repita');
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

    expect(prompt).toContain('Não repita');
    expect(prompt).toContain('- Sistema de Reservas (DeskFlow)');
  });
});
