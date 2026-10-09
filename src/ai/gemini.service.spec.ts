import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChallengeLevel } from '../generated/prisma/client';
import { GeminiService } from './gemini.service';

describe('GeminiService', () => {
  const input = {
    stack: 'Backend',
    framework: 'NestJS',
    language: 'TypeScript',
    level: ChallengeLevel.JUNIOR,
    avoidTitles: [],
  };
  const content = {
    title: 'Colmeia Conectada',
    context: 'Contexto',
    description: 'Desafio',
    technologies: ['NestJS', 'PostgreSQL'],
    deliverables: ['API', 'Testes', 'README'],
  };
  const settings: Record<string, string> = {
    GEMINI_API_KEY: 'key',
    GEMINI_MODEL: 'primary',
    GEMINI_FALLBACK_MODELS: 'fallback-a, fallback-b,primary',
  };

  let generateContent: jest.SpyInstance;
  let service: GeminiService;

  beforeEach(() => {
    const config = {
      get: (key: string) => settings[key],
      getOrThrow: (key: string) => settings[key],
    } as unknown as ConfigService;
    service = new GeminiService(config);
    generateContent = jest.spyOn(
      (service as unknown as { client: { models: object } }).client.models as {
        generateContent: () => Promise<unknown>;
      },
      'generateContent',
    );
  });

  it('uses the primary model when it answers', async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(content) });

    await expect(service.generateChallenge(input)).resolves.toEqual({
      content,
      model: 'primary',
    });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('falls back to the next model when one fails or answers badly', async () => {
    generateContent
      .mockRejectedValueOnce(new Error('503 high demand'))
      .mockResolvedValueOnce({ text: '{"title":""}' })
      .mockResolvedValueOnce({
        text: JSON.stringify(content),
        modelVersion: 'fallback-b-001',
      });

    await expect(service.generateChallenge(input)).resolves.toEqual({
      content,
      model: 'fallback-b-001',
    });
    expect(
      generateContent.mock.calls.map(
        ([args]) => (args as { model: string }).model,
      ),
    ).toEqual(['primary', 'fallback-a', 'fallback-b']);
  });

  it('fails with 503 when every model fails', async () => {
    generateContent.mockRejectedValue(new Error('503 high demand'));

    await expect(service.generateChallenge(input)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(generateContent).toHaveBeenCalledTimes(3);
  });
});
