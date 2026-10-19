import { ChallengeContent } from '../ai/ai.types';
import { LEVEL_LABELS } from '../catalog/catalog.constants';
import type { Challenge } from '../generated/prisma/client';
import { Locale } from '../i18n/locale';

type RenderableChallenge = Pick<
  Challenge,
  'title' | 'projectName' | 'industry' | 'level' | 'content' | 'locale'
> & {
  stack: { name: string };
  framework: { name: string; language: string };
};

interface MarkdownLabels {
  heading: string;
  industry: string;
  level: string;
  stack: string;
  stackWith: string;
  context: string;
  requirements: string;
  functional: string;
  nonFunctional: string;
  technologies: string;
  deliverables: string;
  deadline: string;
  implementationGuide: string;
  evaluationCriteria: string;
  folderStructure: string;
}

const LABELS: Record<Locale, MarkdownLabels> = {
  [Locale.en]: {
    heading: 'Technical Challenge',
    industry: 'Industry',
    level: 'Level',
    stack: 'Stack',
    stackWith: 'with',
    context: 'Context',
    requirements: 'Requirements',
    functional: 'Functional Requirements',
    nonFunctional: 'Non-Functional Requirements',
    technologies: 'What to Use',
    deliverables: 'Deliverables',
    deadline: 'Time to Complete',
    implementationGuide: 'Implementation Guide',
    evaluationCriteria: 'What Will Be Evaluated',
    folderStructure: 'Suggested Folder Structure',
  },
  [Locale.pt]: {
    heading: 'Desafio Técnico',
    industry: 'Setor',
    level: 'Nível',
    stack: 'Stack',
    stackWith: 'com',
    context: 'Contexto',
    requirements: 'Requisitos',
    functional: 'Requisitos Funcionais',
    nonFunctional: 'Requisitos Não Funcionais',
    technologies: 'O que usar',
    deliverables: 'Entregas',
    deadline: 'Tempo para Conclusão',
    implementationGuide: 'Guia de Implementação',
    evaluationCriteria: 'O que será avaliado',
    folderStructure: 'Estrutura de Pastas Sugerida',
  },
  [Locale.es]: {
    heading: 'Desafío Técnico',
    industry: 'Sector',
    level: 'Nivel',
    stack: 'Stack',
    stackWith: 'con',
    context: 'Contexto',
    requirements: 'Requisitos',
    functional: 'Requisitos Funcionales',
    nonFunctional: 'Requisitos No Funcionales',
    technologies: 'Qué usar',
    deliverables: 'Entregables',
    deadline: 'Plazo de Entrega',
    implementationGuide: 'Guía de Implementación',
    evaluationCriteria: 'Qué se evaluará',
    folderStructure: 'Estructura de Carpetas Sugerida',
  },
};

const SEPARATOR = '---';

const bullets = (items: string[], indent = '') =>
  items.map((item) => `${indent}- ${item}`).join('\n');

function heading(
  { title, projectName }: RenderableChallenge,
  labels: MarkdownLabels,
) {
  const name = projectName && projectName !== title ? ` (${projectName})` : '';
  return `# ${labels.heading}: ${title}${name}`;
}

function details(challenge: RenderableChallenge, labels: MarkdownLabels) {
  const items = [
    challenge.industry && `**${labels.industry}:** ${challenge.industry}`,
    `**${labels.level}:** ${LEVEL_LABELS[challenge.locale][challenge.level]}`,
    `**${labels.stack}:** ${challenge.stack.name} ${labels.stackWith} ${challenge.framework.name} (${challenge.framework.language})`,
  ].filter(Boolean);

  return `> ${items.join(' · ')}`;
}

function requirements(content: ChallengeContent, labels: MarkdownLabels) {
  const groups = [
    [labels.functional, content.functionalRequirements],
    [labels.nonFunctional, content.nonFunctionalRequirements],
  ] as const;

  const sections = groups
    .filter(([, list]) => list.length > 0)
    .map(([name, list], index) => {
      const items = list.map((requirement) => {
        const line = `- **${requirement.title}:** ${requirement.description}`;
        return requirement.details.length
          ? `${line}\n${bullets(requirement.details, '  ')}`
          : line;
      });
      return `### ${index + 1}. ${name}\n${items.join('\n')}`;
    });

  return sections.length
    ? `## ${labels.requirements}\n\n${sections.join('\n\n')}`
    : '';
}

function technologies(content: ChallengeContent, labels: MarkdownLabels) {
  if (content.technologies.length === 0) {
    return '';
  }

  const groups = content.technologies.map(({ category, items }) => {
    const lines = items.map(({ name, purpose }) =>
      purpose ? `- **${name}:** ${purpose}` : `- **${name}**`,
    );
    return `### ${category}\n${lines.join('\n')}`;
  });

  return `## ${labels.technologies}\n\n${groups.join('\n\n')}`;
}

function implementationGuide(
  content: ChallengeContent,
  labels: MarkdownLabels,
) {
  if (content.implementationGuide.length === 0) {
    return '';
  }

  const sections = content.implementationGuide.map(
    ({ title, description, items }, index) =>
      [`### ${index + 1}. ${title}`, description, bullets(items)]
        .filter(Boolean)
        .join('\n'),
  );

  return `## ${labels.implementationGuide}\n\n${sections.join('\n\n')}`;
}

function evaluationCriteria(content: ChallengeContent, labels: MarkdownLabels) {
  if (content.evaluationCriteria.length === 0) {
    return '';
  }

  const items = content.evaluationCriteria.map(
    ({ title, description }, index) =>
      `${index + 1}. **${title}:** ${description}`,
  );

  return `## ${labels.evaluationCriteria}\n\n${items.join('\n')}`;
}

/**
 * Renders the challenge as a markdown document, ready to be pasted into the
 * README of the user's repository, in the language of the challenge. Empty
 * sections (from challenges created with the old layout) are left out.
 */
export function renderChallengeMarkdown(challenge: RenderableChallenge) {
  const content = challenge.content as ChallengeContent;
  const labels = LABELS[challenge.locale];

  const sections = [
    content.context.length &&
      `## ${labels.context}\n\n${content.context.join('\n\n')}`,
    requirements(content, labels),
    technologies(content, labels),
    content.deliverables.length &&
      `## ${labels.deliverables}\n\n${bullets(content.deliverables)}`,
    content.deadline && `## ${labels.deadline}\n\n**${content.deadline}**`,
    implementationGuide(content, labels),
    evaluationCriteria(content, labels),
    content.folderStructure &&
      `## ${labels.folderStructure}\n\n\`\`\`text\n${content.folderStructure}\n\`\`\``,
    content.closingNote,
  ].filter(Boolean);

  return `${heading(challenge, labels)}\n\n${details(challenge, labels)}\n\n${sections.join(`\n\n${SEPARATOR}\n\n`)}\n`;
}
