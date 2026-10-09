/** Credits charged for each new challenge (regeneration is free). */
export const GENERATION_COST = 1;
export const MAX_REGENERATIONS = 1;
/** How many previous titles are sent to the model to avoid repetitions. */
export const AVOID_TITLES_LIMIT = 20;
/** Generations older than this still in GENERATING are considered stuck. */
export const STUCK_GENERATION_MS = 5 * 60 * 1000;

export const CHALLENGE_SUMMARY_INCLUDE = {
  stack: { select: { id: true, slug: true, name: true } },
  framework: { select: { id: true, slug: true, name: true, language: true } },
} as const;
