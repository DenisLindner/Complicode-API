import { GENERATED_CHALLENGE } from '../../test/fixtures/generated-challenge';
import { ChallengeLevel } from '../generated/prisma/client';
import { renderChallengeMarkdown } from './challenge.markdown';

describe('renderChallengeMarkdown', () => {
  const challenge = {
    ...GENERATED_CHALLENGE,
    level: ChallengeLevel.JUNIOR,
    stack: { name: 'Backend' },
    framework: { name: 'NestJS', language: 'TypeScript' },
  };

  it('renders every section of the challenge document', () => {
    const markdown = renderChallengeMarkdown(challenge);

    expect(markdown).toContain(
      '# Desafio Técnico: Sistema de Gestão de Insights e Resumos de Reuniões (MeetingInsight AI)',
    );
    expect(markdown).toContain(
      '> **Setor:** Produtividade · **Nível:** Júnior · **Stack:** Backend com NestJS (TypeScript)',
    );
    expect(markdown).toContain(
      '### 1. Requisitos Funcionais\n- **Autenticação e Autorização:** Login e cadastro com perfis USER e ADMIN.\n- **Processamento via IA:** Integrar com uma API de IA para processar o texto.\n  - Um resumo executivo.',
    );
    expect(markdown).toContain('### 2. Requisitos Não Funcionais');
    expect(markdown).toContain(
      '### Backend\n- **NestJS:** Framework principal da API REST.',
    );
    expect(markdown).toContain('## Tempo para Conclusão\n\n**1 semana');
    expect(markdown).toContain(
      '### 1. Modelagem de Dados\nDesenhe um modelo relacional com, no mínimo:\n- User',
    );
    expect(markdown).toContain(
      '1. **Resiliência:** O sistema trava se a API de IA estiver fora do ar?',
    );
    expect(markdown).toContain('```text\nsrc/\n├── auth/');
    expect(markdown.trimEnd().endsWith('Boa sorte!')).toBe(true);
  });

  it('leaves out the sections missing from challenges in the old layout', () => {
    const markdown = renderChallengeMarkdown({
      ...challenge,
      title: 'VoltGrid',
      projectName: 'VoltGrid',
      industry: null,
      content: {
        ...GENERATED_CHALLENGE.content,
        nonFunctionalRequirements: [],
        deadline: '',
        implementationGuide: [],
        evaluationCriteria: [],
        folderStructure: '',
        closingNote: '',
      },
    });

    expect(markdown).toContain('# Desafio Técnico: VoltGrid\n');
    expect(markdown).toContain('> **Nível:** Júnior');
    expect(markdown).toContain('### 1. Requisitos Funcionais');
    for (const section of [
      'Não Funcionais',
      'Tempo para Conclusão',
      'Guia de Implementação',
      'O que será avaliado',
      'Estrutura de Pastas',
    ]) {
      expect(markdown).not.toContain(section);
    }
  });
});
