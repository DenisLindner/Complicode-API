import { ChallengeContent } from '../ai/ai.types';
import { LEVEL_LABELS } from '../catalog/catalog.constants';
import type { Challenge } from '../generated/prisma/client';

type RenderableChallenge = Pick<
  Challenge,
  'title' | 'projectName' | 'industry' | 'level' | 'content'
> & {
  stack: { name: string };
  framework: { name: string; language: string };
};

const SEPARATOR = '---';

const bullets = (items: string[], indent = '') =>
  items.map((item) => `${indent}- ${item}`).join('\n');

function heading({ title, projectName }: RenderableChallenge) {
  const name = projectName && projectName !== title ? ` (${projectName})` : '';
  return `# Desafio Técnico: ${title}${name}`;
}

function details(challenge: RenderableChallenge) {
  const items = [
    challenge.industry && `**Setor:** ${challenge.industry}`,
    `**Nível:** ${LEVEL_LABELS[challenge.level]}`,
    `**Stack:** ${challenge.stack.name} com ${challenge.framework.name} (${challenge.framework.language})`,
  ].filter(Boolean);

  return `> ${items.join(' · ')}`;
}

function requirements(content: ChallengeContent) {
  const groups = [
    ['Requisitos Funcionais', content.functionalRequirements],
    ['Requisitos Não Funcionais', content.nonFunctionalRequirements],
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

  return sections.length ? `## Requisitos\n\n${sections.join('\n\n')}` : '';
}

function technologies(content: ChallengeContent) {
  if (content.technologies.length === 0) {
    return '';
  }

  const groups = content.technologies.map(({ category, items }) => {
    const lines = items.map(({ name, purpose }) =>
      purpose ? `- **${name}:** ${purpose}` : `- **${name}**`,
    );
    return `### ${category}\n${lines.join('\n')}`;
  });

  return `## O que usar\n\n${groups.join('\n\n')}`;
}

function implementationGuide(content: ChallengeContent) {
  if (content.implementationGuide.length === 0) {
    return '';
  }

  const sections = content.implementationGuide.map(
    ({ title, description, items }, index) =>
      [`### ${index + 1}. ${title}`, description, bullets(items)]
        .filter(Boolean)
        .join('\n'),
  );

  return `## Guia de Implementação\n\n${sections.join('\n\n')}`;
}

function evaluationCriteria(content: ChallengeContent) {
  if (content.evaluationCriteria.length === 0) {
    return '';
  }

  const items = content.evaluationCriteria.map(
    ({ title, description }, index) =>
      `${index + 1}. **${title}:** ${description}`,
  );

  return `## O que será avaliado\n\n${items.join('\n')}`;
}

/**
 * Renders the challenge as a markdown document, ready to be pasted into the
 * README of the user's repository. Empty sections (from challenges created
 * with the old layout) are left out.
 */
export function renderChallengeMarkdown(challenge: RenderableChallenge) {
  const content = challenge.content as ChallengeContent;

  const sections = [
    content.context.length && `## Contexto\n\n${content.context.join('\n\n')}`,
    requirements(content),
    technologies(content),
    content.deliverables.length &&
      `## Entregas\n\n${bullets(content.deliverables)}`,
    content.deadline && `## Tempo para Conclusão\n\n**${content.deadline}**`,
    implementationGuide(content),
    evaluationCriteria(content),
    content.folderStructure &&
      `## Estrutura de Pastas Sugerida\n\n\`\`\`text\n${content.folderStructure}\n\`\`\``,
    content.closingNote,
  ].filter(Boolean);

  return `${heading(challenge)}\n\n${details(challenge)}\n\n${sections.join(`\n\n${SEPARATOR}\n\n`)}\n`;
}
