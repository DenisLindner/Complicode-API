import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { GenerativeService } from './generative.service';
import { ConfigService } from '@nestjs/config';
import { CreateChallengeDTO } from '../dto/create-challenge.dto';

@Injectable()
export class GeminiService extends GenerativeService {
  private readonly ai: GoogleGenAI;
  private readonly logger = new Logger(GeminiService.name);
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.error('API key not found in the environment');
    }

    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const model = configService.get<string>('GEMINI_MODEL');

    if (!model) {
      this.logger.error('AI model not found in the environment');
    }

    this.model = model ?? 'gemini-3.1-flash-lite-preview';
  }

  async generateContent(data: CreateChallengeDTO): Promise<string> {
    const stack = data.stack.join(', ');

    const systemInstruction = `
      Você é um Tech Lead de backend. Sua tarefa é gerar desafios técnicos 
      seguindo estritamente o formato: Contexto, Requisitos, O que usar e Tempo para a conclusão,
      não escreva nada além do desafio, e tenha como base para a complexidade do desafio o tempo que será
      passado e o nível do desafio que será passado, caso o usuáio não passe um tema, passe algum tema
      voltado para o mundo real da programação e desafios que saiam do comum (exemplo de desafios comuns:
      biblioteca e loja de produtos), as dificuldade são: (INICIANTE, JUNIOR, PLENO, SÊNIOR, PRINCIPAL),
      o desafio deve ter no mínimo 4000 caracteres de comprimento, faça sempre em formato markdown para ser
      colocado em README do github, separando de maneira certa os títulos e subtópicos
    `;

    const userPrompt = `
      Gere um desafio de backend com base nestes dados:
      Tema: "${data.theme ?? 'não foi passado o tema pelo usuário'}"
      Tecnologias obrigatórias: ${stack}
      Tempo para Conclusão: ${data.time}
      Dificuldade do Desafio: ${data.dificuldade ?? 'INICIANTE'}
      
      Siga o padrão:
      Contexto: [Breve descrição do problema]
      Requisitos: [Lista de itens técnicos]
      O que usar: [A stack passada pelo usuário]
      Tempo para Conclusão: [O tempo passado pelo usuário]
    `;

    try {
      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        this.logger.error(
          'Error generating content with Gemini: The response came back blank',
        );
        throw new InternalServerErrorException(
          'Error generating content with Gemini, please try again later',
        );
      }

      return text;
    } catch (error) {
      this.logger.error('Error generating content with Gemini:', error);
      throw new InternalServerErrorException(
        'Error generating content with Gemini',
      );
    }
  }
}
