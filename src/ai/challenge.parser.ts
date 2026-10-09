import {
  ChallengeEvaluationCriterion,
  ChallengeGuideSection,
  ChallengeRequirement,
  ChallengeTechnologyGroup,
  GeneratedChallenge,
} from './ai.types';

class InvalidChallengeError extends Error {
  constructor(field: string) {
    super(`Model response has an invalid "${field}" field`);
  }
}

type Data = Record<string, unknown>;

const isData = (value: unknown): value is Data =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function text(data: Data, field: string): string {
  const value = data[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InvalidChallengeError(field);
  }
  return value.trim();
}

function list<T>(
  data: Data,
  field: string,
  parseItem: (item: Data) => T,
  { allowEmpty = false } = {},
): T[] {
  const value = data[field];
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new InvalidChallengeError(field);
  }
  return value.map((item) => {
    if (!isData(item)) {
      throw new InvalidChallengeError(field);
    }
    return parseItem(item);
  });
}

function textList(data: Data, field: string, { allowEmpty = false } = {}) {
  const value = data[field];
  if (!Array.isArray(value)) {
    throw new InvalidChallengeError(field);
  }
  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!allowEmpty && items.length === 0) {
    throw new InvalidChallengeError(field);
  }
  return items;
}

const requirement = (item: Data): ChallengeRequirement => ({
  title: text(item, 'title'),
  description: text(item, 'description'),
  details: textList(item, 'details', { allowEmpty: true }),
});

const technologyGroup = (item: Data): ChallengeTechnologyGroup => ({
  category: text(item, 'category'),
  items: list(item, 'items', (technology) => ({
    name: text(technology, 'name'),
    purpose: text(technology, 'purpose'),
  })),
});

const guideSection = (item: Data): ChallengeGuideSection => ({
  title: text(item, 'title'),
  description: text(item, 'description'),
  items: textList(item, 'items', { allowEmpty: true }),
});

const criterion = (item: Data): ChallengeEvaluationCriterion => ({
  title: text(item, 'title'),
  description: text(item, 'description'),
});

/** Removes markdown fences the model sometimes wraps the folder tree with. */
const stripFences = (tree: string) =>
  tree
    .replace(/^```[\w-]*\n?/, '')
    .replace(/\n?```$/, '')
    .trimEnd();

/**
 * Validates the JSON answered by the model and normalizes it (trimmed
 * strings, no empty list items), throwing when a required field is missing.
 */
export function parseGeneratedChallenge(
  json: string | undefined,
): GeneratedChallenge {
  const data: unknown = JSON.parse(json ?? '');
  if (!isData(data)) {
    throw new InvalidChallengeError('root');
  }

  return {
    title: text(data, 'title'),
    projectName: text(data, 'projectName'),
    industry: text(data, 'industry'),
    summary: text(data, 'summary'),
    content: {
      context: textList(data, 'context'),
      functionalRequirements: list(data, 'functionalRequirements', requirement),
      nonFunctionalRequirements: list(
        data,
        'nonFunctionalRequirements',
        requirement,
      ),
      technologies: list(data, 'technologies', technologyGroup),
      deliverables: textList(data, 'deliverables'),
      deadline: text(data, 'deadline'),
      implementationGuide: list(data, 'implementationGuide', guideSection),
      evaluationCriteria: list(data, 'evaluationCriteria', criterion),
      folderStructure: stripFences(text(data, 'folderStructure')),
      closingNote: text(data, 'closingNote'),
    },
  };
}
