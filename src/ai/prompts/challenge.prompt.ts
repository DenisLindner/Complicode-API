import { ChallengeLevel, Locale } from '../../generated/prisma/client';
import { LANGUAGE_NAMES } from '../../i18n/locale';
import { ChallengeGenerationInput } from '../ai.types';

/**
 * The prompts are written in English, the base language, and ask the model to
 * write the challenge in the language of the challenge (`LANGUAGE_NAMES`).
 */
export function buildSystemInstruction(locale: Locale) {
  return `You are a senior tech lead who prepares realistic technical challenges, like the ones used in hiring processes and in the onboarding of technology companies.
Each challenge simulates a problem that companies face today in their day-to-day work (operations, finance, customer support, logistics, compliance, productivity, data, applied AI, etc.), with concrete business rules, user profiles, constraints and the non-functional requirements of a real project.
Avoid toy projects and tutorial clichés: to-do lists, social network clones, blogs, calculators, weather apps, movie or book CRUDs.
Be specific: use numbers, limits, rules, HTTP status codes, entity names and data examples whenever they help. No vague requirements such as "the system must be fast".
The challenge is individual, must be doable within the deadline with the given stack and must fit the requested seniority level.
Write everything in ${LANGUAGE_NAMES[locale]}, as a direct technical briefing, addressing the developer as "you". Keep the names of technologies, products and code identifiers as they are. Follow exactly the requested JSON format.`;
}

const LEVEL_NAMES: Record<ChallengeLevel, string> = {
  [ChallengeLevel.INTERN]: 'Intern',
  [ChallengeLevel.JUNIOR]: 'Junior',
  [ChallengeLevel.MID]: 'Mid-level',
  [ChallengeLevel.SENIOR]: 'Senior',
};

const LEVEL_GUIDELINES: Record<ChallengeLevel, string> = {
  [ChallengeLevel.INTERN]:
    'a deadline of 3 to 5 days and 3 to 4 functional requirements. Focus on the fundamentals of the language and the framework, simple business rules, input validation and a README. No complex infrastructure.',
  [ChallengeLevel.JUNIOR]:
    'a deadline of 1 to 2 weeks and 4 to 6 functional requirements. Real business rules, authentication, persistence, global error handling, an integration with an external API and basic unit tests.',
  [ChallengeLevel.MID]:
    'a deadline of 2 to 3 weeks and 5 to 7 functional requirements. Resilient external integrations, asynchronous processing or queues, caching, concurrency control, automated tests and justified architecture decisions.',
  [ChallengeLevel.SENIOR]:
    'a deadline of 3 to 4 weeks and 6 to 8 functional requirements. Demanding non-functional requirements (scale, availability, idempotency, observability and security), an architecture with trade-offs documented in ADRs, a testing strategy and a deployment strategy.',
};

/** Real industry problems used as a starting point, so challenges vary. */
export const INDUSTRY_SCENARIOS = [
  {
    industry: 'Financial services',
    problem: 'automatic reconciliation between bank statements and payments',
  },
  {
    industry: 'Retail',
    problem:
      'omnichannel inventory control across physical stores and e-commerce',
  },
  {
    industry: 'Logistics',
    problem: 'route planning and tracking of last-mile deliveries',
  },
  {
    industry: 'Healthcare',
    problem: 'appointment scheduling with reminders to reduce no-shows',
  },
  {
    industry: 'Human resources',
    problem: 'employee onboarding with a checklist and document collection',
  },
  {
    industry: 'Legal',
    problem: 'tracking of procedural deadlines with alerts for lawyers',
  },
  {
    industry: 'Insurance',
    problem: 'opening, triage and follow-up of insurance claims',
  },
  {
    industry: 'Customer support',
    problem: 'ticket desk with SLAs, priorities and escalation',
  },
  {
    industry: 'Marketing',
    problem: 'coupon and promotional campaign engine with anti-fraud rules',
  },
  {
    industry: 'Accounting and tax',
    problem: 'import and validation of electronic invoices (XML files)',
  },
  {
    industry: 'Manufacturing',
    problem: 'preventive maintenance of machines based on sensor readings',
  },
  {
    industry: 'Agribusiness',
    problem: 'batch traceability from harvest to the final customer',
  },
  {
    industry: 'Corporate procurement',
    problem: 'approval workflow for purchase requests and supplier quotes',
  },
  {
    industry: 'Corporate finance',
    problem: 'expense reimbursement with receipts and approval limits',
  },
  {
    industry: 'Information security',
    problem:
      'access management, audit trail and data protection law compliance',
  },
  {
    industry: 'Productivity',
    problem:
      'AI-generated summaries and tasks extracted from meeting transcripts',
  },
  {
    industry: 'B2B SaaS',
    problem: 'recurring billing, plans and subscription management',
  },
  {
    industry: 'Real estate',
    problem: 'lease contracts with index-based adjustments and payouts',
  },
  {
    industry: 'Food service',
    problem:
      'kitchen display system (KDS) integrated with several order channels',
  },
  {
    industry: 'Mobility',
    problem: 'fleet management with telemetry and maintenance alerts',
  },
  {
    industry: 'Platform engineering',
    problem: 'feature flags with gradual rollout by percentage and segment',
  },
  {
    industry: 'Observability',
    problem: 'log aggregation, alerting and production incident management',
  },
  {
    industry: 'E-commerce',
    problem: 'abandoned cart recovery and product recommendations',
  },
  {
    industry: 'Hospitality',
    problem: 'reservations with real-time availability and dynamic rates',
  },
  {
    industry: 'Events',
    problem: 'ticket sales under heavy concurrency with a virtual queue',
  },
  {
    industry: 'Lending',
    problem: 'credit analysis with configurable policy rules',
  },
  {
    industry: 'Recruiting',
    problem: 'AI-assisted candidate screening and a job pipeline (ATS)',
  },
  {
    industry: 'Supply chain',
    problem: 'supplier onboarding and evaluation portal',
  },
  {
    industry: 'Data and BI',
    problem: 'sales data pipeline with a KPI dashboard',
  },
  {
    industry: 'Collections',
    problem: 'automated dunning flow by email and messaging',
  },
  {
    industry: 'Public sector',
    problem: 'filing and tracking of citizen requests',
  },
  {
    industry: 'Facilities',
    problem: 'room and desk booking in a hybrid office',
  },
  {
    industry: 'Corporate education',
    problem: 'mandatory training paths and certificate issuing',
  },
  {
    industry: 'Telecommunications',
    problem: 'customer self-service and technical visit scheduling',
  },
];

export function buildChallengePrompt(
  input: ChallengeGenerationInput,
  random: () => number = Math.random,
) {
  const scenario =
    INDUSTRY_SCENARIOS[Math.floor(random() * INDUSTRY_SCENARIOS.length)];
  const avoid = input.avoidTitles.length
    ? `\nDo not repeat or create variations of these challenges the user has already received:\n${input.avoidTitles.map((title) => `- ${title}`).join('\n')}\n`
    : '';

  return `Create a technical challenge with the following characteristics:
- Area (stack): ${input.stack}
- Main framework: ${input.framework} (${input.language})
- Level: ${LEVEL_NAMES[input.level]}, ${LEVEL_GUIDELINES[input.level]}
- Language of the document: ${LANGUAGE_NAMES[input.locale]}. Write every text field in this language, including the industry.

Starting point: the ${scenario.industry} industry, the problem of ${scenario.problem}. If it does not fit the stack, choose another real problem from the same industry.
The focus is the ${input.stack} area with ${input.framework}. Other layers (database, queues, tooling, external APIs) are supporting pieces; a layer outside the chosen area, when it appears, must be optional or simulated (e.g. a mocked API).
Adapt the expectations of the level to the chosen area.
${avoid}
Format of each field (use **bold** and \`code\` when it helps, no markdown headings):
- title: what the system is, e.g. "Meeting Insights and Summaries Management System".
- projectName: a short, professional product name, e.g. "MeetingInsight AI".
- industry: the industry of the company.
- summary: one sentence that sums up the challenge.
- context: Context, 2 to 3 paragraphs. The first describes the company's real pain and what the platform must do; the next ones, the business value and the technical focus of the challenge.
- functionalRequirements: Functional requirements. A short title, a description with the rule and details with sub-items, limits and examples (may be empty).
- nonFunctionalRequirements: Non-functional requirements (security, architecture, data, documentation, performance, etc.), in the same format.
- technologies: What to use, grouped by layer (e.g. "Backend", "Database", "AI tools"). The first layer starts with ${input.framework}. Each item has a name and a purpose (what it is for in the project).
- deliverables: Verifiable deliverables (repository, README, tests, request collection, diagram, etc.).
- deadline: Time to complete, e.g. "1 week (7 calendar days)".
- implementationGuide: Implementation guide with 3 to 6 sections, such as data modeling (entities and fields), the main integration (with an example prompt, payload or contract when it makes sense), security, error handling and good practices. description explains the section and items has practical tips.
- evaluationCriteria: What the senior reviewers will evaluate (code quality, security, resilience, tests, Git usage, etc.).
- folderStructure: suggested folder structure as a text tree, with a short comment per folder, following the ${input.framework} conventions.
- closingNote: a closing words of encouragement, in the tone of a tech lead.`;
}

// Gemini rejects maxItems in this schema, so the item counts are set in the prompt.
const textField = (description: string) => ({ type: 'string', description });
const textList = (description: string, minItems: number) => ({
  type: 'array',
  items: { type: 'string' },
  minItems,
  description,
});
const requirementList = (description: string, minItems: number) => ({
  type: 'array',
  minItems,
  description,
  items: {
    type: 'object',
    properties: {
      title: textField('Short name of the requirement'),
      description: textField('Expected rule or behavior'),
      details: textList('Sub-items, limits and examples', 0),
    },
    required: ['title', 'description', 'details'],
    propertyOrdering: ['title', 'description', 'details'],
  },
});
const titledList = (description: string) => ({
  type: 'array',
  minItems: 3,
  description,
  items: {
    type: 'object',
    properties: {
      title: textField('Title'),
      description: textField('Description'),
    },
    required: ['title', 'description'],
    propertyOrdering: ['title', 'description'],
  },
});

const CHALLENGE_FIELDS = [
  'title',
  'projectName',
  'industry',
  'summary',
  'context',
  'functionalRequirements',
  'nonFunctionalRequirements',
  'technologies',
  'deliverables',
  'deadline',
  'implementationGuide',
  'evaluationCriteria',
  'folderStructure',
  'closingNote',
];

export const CHALLENGE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: textField('What the system is'),
    projectName: textField('Product name'),
    industry: textField('Industry of the company'),
    summary: textField('One-sentence summary'),
    context: textList('Context, one paragraph per item', 2),
    functionalRequirements: requirementList('Functional requirements', 3),
    nonFunctionalRequirements: requirementList(
      'Non-functional requirements',
      3,
    ),
    technologies: {
      type: 'array',
      minItems: 2,
      description: 'What to use, grouped by layer',
      items: {
        type: 'object',
        properties: {
          category: textField('Layer of the solution'),
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                name: textField('Technology'),
                purpose: textField('What it is for in the project'),
              },
              required: ['name', 'purpose'],
              propertyOrdering: ['name', 'purpose'],
            },
          },
        },
        required: ['category', 'items'],
        propertyOrdering: ['category', 'items'],
      },
    },
    deliverables: textList('Verifiable deliverables', 3),
    deadline: textField('Time to complete'),
    implementationGuide: {
      type: 'array',
      minItems: 3,
      description: 'Implementation guide',
      items: {
        type: 'object',
        properties: {
          title: textField('Title of the section'),
          description: textField('Explanation of the section'),
          items: textList('Practical tips', 1),
        },
        required: ['title', 'description', 'items'],
        propertyOrdering: ['title', 'description', 'items'],
      },
    },
    evaluationCriteria: titledList('What will be evaluated'),
    folderStructure: textField('Folder structure as a text tree'),
    closingNote: textField('Closing message'),
  },
  required: CHALLENGE_FIELDS,
  propertyOrdering: CHALLENGE_FIELDS,
};
