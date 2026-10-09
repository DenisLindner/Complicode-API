import { LEVEL_LABELS } from '../../catalog/catalog.constants';
import { ChallengeLevel } from '../../generated/prisma/client';
import { ChallengeGenerationInput } from '../ai.types';

export const CHALLENGE_SYSTEM_INSTRUCTION = `Você é um tech lead sênior que prepara desafios técnicos realistas, como os usados em processos seletivos e no onboarding de empresas de tecnologia.
Cada desafio simula um problema que empresas enfrentam hoje no dia a dia (operação, finanças, atendimento, logística, compliance, produtividade, dados, IA aplicada etc.), com regras de negócio concretas, perfis de usuário, restrições e requisitos não funcionais de um projeto de verdade.
Evite projetos de brinquedo e clichês de tutorial: lista de tarefas, clone de rede social, blog, calculadora, app de clima, CRUD de filmes ou de livros.
Seja específico: use números, limites, regras, códigos de status HTTP, nomes de entidades e exemplos de dados quando ajudarem. Nada de requisitos vagos como "o sistema deve ser rápido".
O desafio é individual, precisa ser realizável no prazo com a stack informada e adequado ao nível de senioridade pedido.
Escreva em português do Brasil, em tom de briefing técnico direto, falando com o desenvolvedor ("você"). Siga exatamente o formato JSON solicitado.`;

const LEVEL_GUIDELINES: Record<ChallengeLevel, string> = {
  [ChallengeLevel.INTERN]:
    'prazo de 3 a 5 dias e 3 a 4 requisitos funcionais. Foco em fundamentos da linguagem e do framework, regras de negócio simples, validação de entrada e README. Sem infraestrutura complexa.',
  [ChallengeLevel.JUNIOR]:
    'prazo de 1 a 2 semanas e 4 a 6 requisitos funcionais. Regras de negócio reais, autenticação, persistência, tratamento global de erros, integração com uma API externa e testes unitários básicos.',
  [ChallengeLevel.MID]:
    'prazo de 2 a 3 semanas e 5 a 7 requisitos funcionais. Integrações externas resilientes, processamento assíncrono ou filas, cache, controle de concorrência, testes automatizados e decisões de arquitetura justificadas.',
  [ChallengeLevel.SENIOR]:
    'prazo de 3 a 4 semanas e 6 a 8 requisitos funcionais. Requisitos não funcionais exigentes (escala, disponibilidade, idempotência, observabilidade e segurança), arquitetura com trade-offs documentados em ADRs, estratégia de testes e de deploy.',
};

/** Real industry problems used as a starting point, so challenges vary. */
export const INDUSTRY_SCENARIOS = [
  {
    industry: 'Serviços financeiros',
    problem: 'conciliação automática entre extratos bancários e pagamentos',
  },
  {
    industry: 'Varejo',
    problem: 'controle de estoque multicanal entre lojas físicas e e-commerce',
  },
  {
    industry: 'Logística',
    problem: 'roteirização e rastreamento de entregas de última milha',
  },
  {
    industry: 'Saúde',
    problem: 'agendamento de consultas com lembretes para reduzir faltas',
  },
  {
    industry: 'Recursos humanos',
    problem: 'onboarding de colaboradores com checklist e coleta de documentos',
  },
  {
    industry: 'Jurídico',
    problem: 'controle de prazos processuais e alertas para advogados',
  },
  {
    industry: 'Seguros',
    problem: 'abertura, triagem e acompanhamento de sinistros',
  },
  {
    industry: 'Atendimento ao cliente',
    problem: 'central de tickets com SLA, prioridade e escalonamento',
  },
  {
    industry: 'Marketing',
    problem: 'motor de cupons e campanhas promocionais com regras antifraude',
  },
  {
    industry: 'Contabilidade e fiscal',
    problem:
      'importação e validação de notas fiscais eletrônicas (XML da NF-e)',
  },
  {
    industry: 'Indústria',
    problem:
      'manutenção preventiva de máquinas a partir de leituras de sensores',
  },
  {
    industry: 'Agronegócio',
    problem: 'rastreabilidade de lotes da colheita até o cliente final',
  },
  {
    industry: 'Compras corporativas',
    problem: 'fluxo de aprovação de requisições e cotações com fornecedores',
  },
  {
    industry: 'Financeiro corporativo',
    problem: 'reembolso de despesas com comprovantes e alçadas de aprovação',
  },
  {
    industry: 'Segurança da informação',
    problem: 'gestão de acessos, trilha de auditoria e requisitos da LGPD',
  },
  {
    industry: 'Produtividade',
    problem: 'resumos e tarefas extraídos de transcrições de reuniões com IA',
  },
  {
    industry: 'SaaS B2B',
    problem: 'cobrança recorrente, planos e gestão de assinaturas',
  },
  {
    industry: 'Mercado imobiliário',
    problem: 'contratos de locação com reajuste por índice e repasses',
  },
  {
    industry: 'Food service',
    problem: 'painel de pedidos da cozinha (KDS) integrado a vários canais',
  },
  {
    industry: 'Mobilidade',
    problem: 'gestão de frota com telemetria e alertas de manutenção',
  },
  {
    industry: 'Engenharia de plataforma',
    problem: 'feature flags com rollout gradual por percentual e segmento',
  },
  {
    industry: 'Observabilidade',
    problem: 'agregação de logs, alertas e gestão de incidentes de produção',
  },
  {
    industry: 'E-commerce',
    problem: 'recuperação de carrinhos abandonados e recomendação de produtos',
  },
  {
    industry: 'Hotelaria',
    problem: 'reservas com disponibilidade em tempo real e tarifas dinâmicas',
  },
  {
    industry: 'Eventos',
    problem: 'venda de ingressos com alta concorrência e fila virtual',
  },
  {
    industry: 'Crédito',
    problem: 'análise de crédito com políticas de regras configuráveis',
  },
  {
    industry: 'Recrutamento',
    problem: 'triagem de candidatos com IA e pipeline de vagas (ATS)',
  },
  {
    industry: 'Supply chain',
    problem: 'portal de homologação e avaliação de fornecedores',
  },
  {
    industry: 'Dados e BI',
    problem: 'pipeline de dados de vendas com dashboard de KPIs',
  },
  {
    industry: 'Cobrança',
    problem: 'régua de cobrança automatizada por email e mensagens',
  },
  {
    industry: 'Setor público',
    problem: 'protocolo e acompanhamento de solicitações de cidadãos',
  },
  {
    industry: 'Facilities',
    problem: 'reserva de salas e estações de trabalho em escritório híbrido',
  },
  {
    industry: 'Educação corporativa',
    problem: 'trilhas de treinamento obrigatório e emissão de certificados',
  },
  {
    industry: 'Telecomunicações',
    problem: 'autoatendimento de clientes e agendamento de visitas técnicas',
  },
];

export function buildChallengePrompt(
  input: ChallengeGenerationInput,
  random: () => number = Math.random,
) {
  const scenario =
    INDUSTRY_SCENARIOS[Math.floor(random() * INDUSTRY_SCENARIOS.length)];
  const avoid = input.avoidTitles.length
    ? `\nNão repita nem crie variações destes desafios que o usuário já recebeu:\n${input.avoidTitles.map((title) => `- ${title}`).join('\n')}\n`
    : '';

  return `Crie um desafio técnico com as seguintes características:
- Área (stack): ${input.stack}
- Framework principal: ${input.framework} (${input.language})
- Nível: ${LEVEL_LABELS[input.level]}, ${LEVEL_GUIDELINES[input.level]}

Ponto de partida: setor de ${scenario.industry}, problema de ${scenario.problem}. Se não combinar com a stack, escolha outro problema real do mesmo setor.
O foco é a área ${input.stack} com ${input.framework}. Outras camadas (banco de dados, filas, ferramentas, APIs externas) entram como apoio; uma camada fora da área escolhida, quando aparecer, deve ser opcional ou simulada (ex.: API mockada).
Adapte as expectativas do nível à área escolhida.
${avoid}
Formato de cada campo (use **negrito** e \`código\` quando ajudar, sem títulos markdown):
- title: o que é o sistema, ex.: "Sistema de Gestão de Insights e Resumos de Reuniões".
- projectName: nome de produto curto e profissional, ex.: "MeetingInsight AI".
- industry: setor da empresa.
- summary: uma frase que resume o desafio.
- context: Contexto, 2 a 3 parágrafos. O primeiro descreve a dor real da empresa e o que a plataforma deve fazer; o seguinte, o valor para o negócio e o foco técnico do desafio.
- functionalRequirements: Requisitos funcionais. title curto, description com a regra e details com sub-itens, limites e exemplos (pode ficar vazio).
- nonFunctionalRequirements: Requisitos não funcionais (segurança, arquitetura, dados, documentação, desempenho etc.), no mesmo formato.
- technologies: O que usar, agrupado por camada (ex.: "Backend", "Banco de Dados", "Ferramentas de IA"). A primeira camada começa por ${input.framework}. Cada item tem name e purpose (para que serve no projeto).
- deliverables: Entregas verificáveis (repositório, README, testes, coleção de requisições, diagrama etc.).
- deadline: Tempo para conclusão, ex.: "1 semana (7 dias corridos)".
- implementationGuide: Guia de implementação com 3 a 6 seções, como modelagem de dados (entidades e campos), a integração principal (com exemplo de prompt, payload ou contrato quando fizer sentido), segurança, tratamento de erros e boas práticas. description explica a seção e items traz dicas práticas.
- evaluationCriteria: O que será avaliado pelos revisores sêniores (qualidade de código, segurança, resiliência, testes, uso do Git etc.).
- folderStructure: estrutura de pastas sugerida em árvore de texto, com um comentário curto por pasta, no padrão de ${input.framework}.
- closingNote: frase final de incentivo, no tom de um tech lead.`;
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
      title: textField('Nome curto do requisito'),
      description: textField('Regra ou comportamento esperado'),
      details: textList('Sub-itens, limites e exemplos', 0),
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
      title: textField('Título'),
      description: textField('Descrição'),
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
    title: textField('O que é o sistema'),
    projectName: textField('Nome do produto'),
    industry: textField('Setor da empresa'),
    summary: textField('Resumo em uma frase'),
    context: textList('Contexto, um parágrafo por item', 2),
    functionalRequirements: requirementList('Requisitos funcionais', 3),
    nonFunctionalRequirements: requirementList('Requisitos não funcionais', 3),
    technologies: {
      type: 'array',
      minItems: 2,
      description: 'O que usar, agrupado por camada',
      items: {
        type: 'object',
        properties: {
          category: textField('Camada da solução'),
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                name: textField('Tecnologia'),
                purpose: textField('Para que serve no projeto'),
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
    deliverables: textList('Entregas verificáveis', 3),
    deadline: textField('Tempo para conclusão'),
    implementationGuide: {
      type: 'array',
      minItems: 3,
      description: 'Guia de implementação',
      items: {
        type: 'object',
        properties: {
          title: textField('Título da seção'),
          description: textField('Explicação da seção'),
          items: textList('Dicas práticas', 1),
        },
        required: ['title', 'description', 'items'],
        propertyOrdering: ['title', 'description', 'items'],
      },
    },
    evaluationCriteria: titledList('O que será avaliado'),
    folderStructure: textField('Estrutura de pastas em árvore de texto'),
    closingNote: textField('Mensagem final'),
  },
  required: CHALLENGE_FIELDS,
  propertyOrdering: CHALLENGE_FIELDS,
};
