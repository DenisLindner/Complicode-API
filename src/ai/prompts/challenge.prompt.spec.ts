import { ChallengeLevel } from '../../generated/prisma/client';
import { buildChallengePrompt } from './challenge.prompt';

describe('buildChallengePrompt', () => {
  const input = {
    stack: 'Backend',
    framework: 'NestJS',
    language: 'TypeScript',
    level: ChallengeLevel.MID,
    avoidTitles: [],
  };

  it('describes the selection and the challenge layout', () => {
    const prompt = buildChallengePrompt(input, () => 0);

    expect(prompt).toContain('Área (stack): Backend');
    expect(prompt).toContain('Framework principal: NestJS (TypeScript)');
    expect(prompt).toContain('Nível: Pleno');
    expect(prompt).toContain('agricultura urbana');
    for (const field of ['Contexto', 'Desafio', 'Stack', 'Entregas']) {
      expect(prompt).toContain(field);
    }
    expect(prompt).not.toContain('Não repita');
  });

  it('asks the model to avoid previous titles', () => {
    const prompt = buildChallengePrompt({
      ...input,
      avoidTitles: ['Colmeia Conectada'],
    });

    expect(prompt).toContain('Não repita');
    expect(prompt).toContain('- Colmeia Conectada');
  });
});
