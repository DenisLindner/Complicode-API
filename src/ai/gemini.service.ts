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
  GeneratedChallenge,
} from './ai.types';
import {
  buildChallengePrompt,
  CHALLENGE_RESPONSE_SCHEMA,
  CHALLENGE_SYSTEM_INSTRUCTION,
} from './prompts/challenge.prompt';

const REQUEST_TIMEOUT_MS = 90_000;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: config.getOrThrow<string>('GEMINI_API_KEY'),
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
    });
    this.model = config.getOrThrow<string>('GEMINI_MODEL');
  }

  async generateChallenge(
    input: ChallengeGenerationInput,
  ): Promise<ChallengeGenerationResult> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: buildChallengePrompt(input),
        config: {
          systemInstruction: CHALLENGE_SYSTEM_INSTRUCTION,
          temperature: 1,
          responseMimeType: 'application/json',
          responseJsonSchema: CHALLENGE_RESPONSE_SCHEMA,
        },
      });

      return {
        content: this.parse(response.text),
        model: response.modelVersion ?? this.model,
      };
    } catch (error) {
      this.logger.error(
        `Challenge generation failed: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Could not generate the challenge, try again later',
      );
    }
  }

  private parse(text: string | undefined): GeneratedChallenge {
    const data = JSON.parse(text ?? '') as Partial<GeneratedChallenge>;
    const isText = (value: unknown) =>
      typeof value === 'string' && value.trim().length > 0;
    const isList = (value: unknown) =>
      Array.isArray(value) && value.length > 0 && value.every(isText);

    if (
      !isText(data.title) ||
      !isText(data.context) ||
      !isText(data.description) ||
      !isList(data.technologies) ||
      !isList(data.deliverables)
    ) {
      throw new Error('Model response does not match the challenge layout');
    }

    return data as GeneratedChallenge;
  }
}
