import { GoogleGenAI } from '@google/genai';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChallengeGenerationInput,
  ChallengeGenerationResult,
} from './ai.types';
import { parseGeneratedChallenge } from './challenge.parser';
import {
  buildChallengePrompt,
  CHALLENGE_RESPONSE_SCHEMA,
  CHALLENGE_SYSTEM_INSTRUCTION,
} from './prompts/challenge.prompt';

/** The full challenge document takes a while to write, especially on fallbacks. */
const REQUEST_TIMEOUT_MS = 90_000;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  /** Primary model first; the others are tried when it fails or is overloaded. */
  private readonly models: string[];

  constructor(config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: config.getOrThrow<string>('GEMINI_API_KEY'),
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
    });
    const fallbacks = (config.get<string>('GEMINI_FALLBACK_MODELS') ?? '')
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);
    this.models = [
      ...new Set([config.getOrThrow<string>('GEMINI_MODEL'), ...fallbacks]),
    ];
  }

  async generateChallenge(
    input: ChallengeGenerationInput,
  ): Promise<ChallengeGenerationResult> {
    const contents = buildChallengePrompt(input);

    for (const model of this.models) {
      try {
        return await this.generateWith(model, contents);
      } catch (error) {
        this.logger.warn(
          `Challenge generation with ${model} failed: ${(error as Error).message}`,
        );
      }
    }

    this.logger.error('Challenge generation failed with every model');
    throw new ServiceUnavailableException(
      'Could not generate the challenge, try again later',
    );
  }

  private async generateWith(
    model: string,
    contents: string,
  ): Promise<ChallengeGenerationResult> {
    const response = await this.client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: CHALLENGE_SYSTEM_INSTRUCTION,
        temperature: 1,
        responseMimeType: 'application/json',
        responseJsonSchema: CHALLENGE_RESPONSE_SCHEMA,
      },
    });

    return {
      challenge: parseGeneratedChallenge(response.text),
      model: response.modelVersion ?? model,
    };
  }
}
