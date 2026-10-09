import { LEVEL_LABELS } from '../../catalog/catalog.constants';
import { ChallengeLevel } from '../../generated/prisma/client';
import { ChallengeGenerationInput } from '../ai.types';

export const CHALLENGE_SYSTEM_INSTRUCTION = `Você é um mentor sênior de engenharia de software que cria desafios de projetos de programação para portfólio.
Seus desafios são únicos e fogem do convencional: evite ideias clichê como lista de tarefas, clone de rede social, e-commerce genérico, blog, calculadora, app de clima, CRUD de biblioteca ou de filmes.
Prefira domínios inusitados e problemas reais com regras de negócio e restrições interessantes, que façam o projeto se destacar em um portfólio.
O desafio precisa ser realizável com a stack informada e adequado ao nível de senioridade pedido.
Responda sempre em português do Brasil, seguindo exatamente o formato JSON solicitado.`;

const LEVEL_GUIDELINES: Record<ChallengeLevel, string> = {
  [ChallengeLevel.INTERN]:
    'escopo pequeno (1 a 2 semanas), foco em fundamentos da linguagem e do framework, sem infraestrutura complexa.',
  [ChallengeLevel.JUNIOR]:
    'escopo de 2 a 3 semanas, regras de negócio reais, persistência de dados, autenticação simples e testes básicos.',
  [ChallengeLevel.MID]:
    'integrações externas, tratamento de concorrência ou filas, cache, testes automatizados e decisões de arquitetura justificadas.',
  [ChallengeLevel.SENIOR]:
    'sistema com requisitos não funcionais exigentes (escala, resiliência, observabilidade, segurança), trade-offs documentados e desenho de arquitetura.',
};

const INSPIRATION_DOMAINS = [
  'agricultura urbana',
  'museus e patrimônio histórico',
  'logística de festivais de música',
  'apicultura',
  'bibliotecas comunitárias',
  'manutenção de bicicletas compartilhadas',
  'gestão de abrigos de animais',
  'astronomia amadora',
  'reciclagem e economia circular',
  'competições de e-sports universitários',
  'turismo de aventura',
  'cooperativas de pesca artesanal',
  'restauração de móveis',
  'brechós e moda sustentável',
  'clubes de leitura',
  'monitoramento de qualidade do ar',
  'escolas de música',
  'hortas escolares',
  'resgate e defesa civil',
  'feiras de produtores locais',
  'teatro independente',
  'cervejarias artesanais',
  'meteorologia para surfistas',
  'acessibilidade em transporte público',
  'colecionadores de plantas raras',
  'oficinas mecânicas de bairro',
  'eventos de cosplay',
  'saúde mental de estudantes',
  'arqueologia',
  'gestão de condomínios',
];

export function buildChallengePrompt(
  input: ChallengeGenerationInput,
  random: () => number = Math.random,
) {
  const inspiration =
    INSPIRATION_DOMAINS[Math.floor(random() * INSPIRATION_DOMAINS.length)];
  const avoid = input.avoidTitles.length
    ? `\nNão repita nem crie variações destes desafios que o usuário já recebeu:\n${input.avoidTitles.map((title) => `- ${title}`).join('\n')}\n`
    : '';

  return `Crie um desafio de projeto com as seguintes características:
- Área (stack): ${input.stack}
- Framework principal: ${input.framework} (${input.language})
- Nível: ${LEVEL_LABELS[input.level]}, ${LEVEL_GUIDELINES[input.level]}

Inspiração opcional de domínio (use apenas se fizer sentido): ${inspiration}.
${avoid}
Formato de cada campo:
- title: nome curto e criativo para o projeto.
- context: Contexto. Cenário, personagens e o problema de negócio que motiva o projeto (2 a 3 parágrafos).
- description: Desafio. O que deve ser construído: requisitos funcionais, regras de negócio e restrições, em markdown.
- technologies: Stack. Tecnologias obrigatórias e sugeridas, começando por ${input.framework}.
- deliverables: Entregas. Itens verificáveis que comprovam a conclusão do desafio.`;
}

export const CHALLENGE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Nome curto e criativo do projeto' },
    context: { type: 'string', description: 'Contexto do desafio' },
    description: {
      type: 'string',
      description: 'Desafio: requisitos e regras de negócio em markdown',
    },
    technologies: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      description: 'Stack do desafio',
    },
    deliverables: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      description: 'Entregas do desafio',
    },
  },
  required: ['title', 'context', 'description', 'technologies', 'deliverables'],
  propertyOrdering: [
    'title',
    'context',
    'description',
    'technologies',
    'deliverables',
  ],
};
