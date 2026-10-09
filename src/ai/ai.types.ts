import { ChallengeLevel } from '../generated/prisma/client';

export interface ChallengeGenerationInput {
  stack: string;
  framework: string;
  language: string;
  level: ChallengeLevel;
  /** Titles already generated for the user, so the model avoids repeating them. */
  avoidTitles: string[];
}

/** The challenge layout: Contexto, Desafio, Stack and Entregas. */
export interface GeneratedChallenge {
  title: string;
  context: string;
  description: string;
  technologies: string[];
  deliverables: string[];
}

export interface ChallengeGenerationResult {
  content: GeneratedChallenge;
  model: string;
}
