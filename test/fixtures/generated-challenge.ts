import { GeneratedChallenge } from '../../src/ai/ai.types';

/** A challenge as stored by the API, based on a real generation. */
export const GENERATED_CHALLENGE: GeneratedChallenge = {
  title: 'Sistema de Gestão de Insights e Resumos de Reuniões',
  projectName: 'MeetingInsight AI',
  industry: 'Produtividade',
  summary:
    'Plataforma que resume transcrições de reuniões e extrai tarefas com IA.',
  content: {
    context: [
      'Em grandes corporações, as transcrições de reuniões raramente são analisadas.',
      'O desafio é focado em arquitetura modular, segurança e integração com IA.',
    ],
    functionalRequirements: [
      {
        title: 'Autenticação e Autorização',
        description: 'Login e cadastro com perfis USER e ADMIN.',
        details: [],
      },
      {
        title: 'Processamento via IA',
        description: 'Integrar com uma API de IA para processar o texto.',
        details: ['Um resumo executivo.', 'Uma lista de tarefas.'],
      },
    ],
    nonFunctionalRequirements: [
      {
        title: 'Segurança',
        description: 'CORS restrito à origem do frontend.',
        details: [],
      },
    ],
    technologies: [
      {
        category: 'Backend',
        items: [
          { name: 'NestJS', purpose: 'Framework principal da API REST.' },
        ],
      },
      {
        category: 'Banco de Dados',
        items: [{ name: 'PostgreSQL', purpose: 'Persistência dos insights.' }],
      },
    ],
    deliverables: ['Repositório público', 'README com instruções'],
    deadline: '1 semana (7 dias corridos)',
    implementationGuide: [
      {
        title: 'Modelagem de Dados',
        description: 'Desenhe um modelo relacional com, no mínimo:',
        items: ['User: (id, email, role)', 'Insight: (id, user_id, summary)'],
      },
    ],
    evaluationCriteria: [
      {
        title: 'Resiliência',
        description: 'O sistema trava se a API de IA estiver fora do ar?',
      },
    ],
    folderStructure:
      'src/\n├── auth/     # Login e guards\n└── insight/  # Insights',
    closingNote: 'Boa sorte!',
  },
};

/** The same challenge as the flat JSON answered by the model. */
export const MODEL_ANSWER = JSON.stringify({
  title: GENERATED_CHALLENGE.title,
  projectName: GENERATED_CHALLENGE.projectName,
  industry: GENERATED_CHALLENGE.industry,
  summary: GENERATED_CHALLENGE.summary,
  ...GENERATED_CHALLENGE.content,
});
