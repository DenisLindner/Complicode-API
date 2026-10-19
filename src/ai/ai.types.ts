import { ChallengeLevel, Locale } from '../generated/prisma/client';

export interface ChallengeGenerationInput {
  stack: string;
  framework: string;
  language: string;
  level: ChallengeLevel;
  /** Language the document is written in. */
  locale: Locale;
  /** Titles already generated for the user, so the model avoids repeating them. */
  avoidTitles: string[];
}

// The challenge types are type aliases (not interfaces) so they are
// assignable to Prisma's JSON input type.

export type ChallengeRequirement = {
  title: string;
  description: string;
  details: string[];
};

export type ChallengeTechnologyGroup = {
  /** Layer of the solution, e.g. Backend, Database, Tooling. */
  category: string;
  items: { name: string; purpose: string }[];
};

export type ChallengeGuideSection = {
  title: string;
  description: string;
  items: string[];
};

export type ChallengeEvaluationCriterion = {
  title: string;
  description: string;
};

/** Sections of the challenge document, stored as JSON. */
export type ChallengeContent = {
  /** Context, one paragraph per item. */
  context: string[];
  functionalRequirements: ChallengeRequirement[];
  nonFunctionalRequirements: ChallengeRequirement[];
  /** What to use, grouped by layer. */
  technologies: ChallengeTechnologyGroup[];
  deliverables: string[];
  /** Time to complete, e.g. "1 week (7 calendar days)". */
  deadline: string;
  implementationGuide: ChallengeGuideSection[];
  evaluationCriteria: ChallengeEvaluationCriterion[];
  /** Suggested folder tree, as plain text. */
  folderStructure: string;
  closingNote: string;
};

export type GeneratedChallenge = {
  /** What the system is, e.g. "Meeting Summaries Management System". */
  title: string;
  /** Product name, e.g. "MeetingInsight AI". */
  projectName: string;
  industry: string;
  /** One sentence pitch, used in listings. */
  summary: string;
  content: ChallengeContent;
};

export interface ChallengeGenerationResult {
  challenge: GeneratedChallenge;
  model: string;
}
