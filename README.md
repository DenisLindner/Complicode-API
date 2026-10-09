# Complicode API

Backend do **Complicode**, um gerador de desafios técnicos que simulam problemas reais das empresas. O usuário escolhe a stack, o framework e o nível, e a API gera com o Gemini um desafio único no formato de um briefing técnico (veja [Formato do desafio](#formato-do-desafio)).

Construído com NestJS 12, Prisma 7 (PostgreSQL), Keycloak, Gemini e AbacatePay.

## Regras de negócio

- Ao verificar **email e telefone** (código por email e contato compartilhado com o bot do Telegram), o usuário ganha **2 créditos**, uma única vez. Cada telefone só pode estar em uma conta.
- Cada desafio gerado consome **1 crédito**. Se a geração falhar, o crédito é estornado.
- Cada desafio pode ser **regerado 1 vez, sem custo**. As duas versões ficam salvas.
- O usuário pode comprar **10 créditos por R$ 10,00** pelo checkout da AbacatePay (PIX ou cartão).
- Os desafios podem ser marcados como públicos e aparecem na galeria pública.
- Níveis disponíveis: Estagiário, Júnior, Pleno e Sênior.

## Arquitetura

```
Next.js ──► Complicode API (NestJS) ──► Keycloak (usuários e tokens)
                    │
                    ├─► PostgreSQL (Prisma)
                    ├─► Gemini API (geração dos desafios)
                    ├─► AbacatePay v2 (checkout e webhook)
                    ├─► SMTP (código de verificação por email)
                    └─► Telegram Bot API (verificação do telefone)
```

| Módulo | Responsabilidade |
| - | - |
| `auth` | Cadastro, login, refresh e logout via Keycloak; guard JWT global (`@Public()` libera a rota) |
| `user` | Usuário local, vinculado ao Keycloak pelo `sub` (`GET /users/me`) |
| `verification` | Código de 6 dígitos por email, bot do Telegram para o telefone e bônus de cadastro |
| `telegram` | Cliente da Telegram Bot API |
| `credit` | Saldo e extrato (ledger idempotente) |
| `catalog` | Stacks, frameworks e níveis |
| `ai` | Integração com o Gemini (saída JSON estruturada, validada antes de salvar) |
| `challenge` | Geração, regeneração, listagens e visibilidade dos desafios |
| `payment` | Checkout da AbacatePay e webhook |

A autenticação usa o Keycloak com access token de **30 minutos** e refresh token de **3 dias** (rotacionado a cada uso). As configurações ficam em `keycloak/complicode-realm.json`.

## Requisitos

- Node.js **24.9+** (o NestJS 12 é ESM-only; veja `.nvmrc`)
- Docker

## Como rodar

```bash
cp .env.example .env           # preencha as chaves (veja abaixo)
docker compose up -d           # Postgres, Keycloak e Mailpit
npm install                    # também gera o Prisma Client
npm run prisma:deploy          # aplica as migrations
npm run prisma:seed            # popula stacks e frameworks
npm run dev
```

| Serviço | URL |
| - | - |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/docs |
| Keycloak (admin/admin) | http://localhost:8080 |
| Mailpit (emails de dev) | http://localhost:8025 |

O realm `complicode` é importado automaticamente na primeira subida do Keycloak.

## Variáveis de ambiente

Todas são validadas no boot (`src/config/env.validation.ts`). As principais:

| Variável | Descrição |
| - | - |
| `FRONTEND_URL` | Origem liberada no CORS e base das URLs de retorno do checkout |
| `KEYCLOAK_*` | URL, realm e credenciais do client `complicode-api` |
| `SMTP_*`, `MAIL_FROM` | Envio de email (em dev aponta para o Mailpit) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` | Bot que verifica o telefone (criado no @BotFather) |
| `TELEGRAM_UPDATES_MODE` | `polling` (dev), `webhook` (produção) ou `disabled` |
| `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET` | Só no modo webhook |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Chave do Google AI Studio e modelo (padrão `gemini-flash-latest`) |
| `GEMINI_FALLBACK_MODELS` | Modelos tentados em ordem quando o principal falha ou está sobrecarregado |
| `ABACATEPAY_*` | Chave da API, secret do webhook e ID do produto de créditos |

### Gemini

Crie uma chave gratuita em https://aistudio.google.com/apikey. O plano gratuito tem limite de requisições por minuto e por dia, então a rota de geração tem rate limit próprio. Como os modelos gratuitos às vezes ficam sobrecarregados (erro 503), a API tenta os modelos de `GEMINI_FALLBACK_MODELS` antes de desistir e estornar o crédito. Uma geração leva em torno de 20 a 30 segundos.

### Formato do desafio

Cada desafio parte de um cenário real da indústria (conciliação bancária, venda de ingressos com alta concorrência, triagem de sinistros, rastreabilidade no agro etc.) e segue a estrutura:

| Seção | Campo |
| - | - |
| Título e nome do produto | `title`, `projectName` |
| Setor e resumo (usados nas listagens) | `industry`, `summary` |
| Contexto | `content.context` (parágrafos) |
| Requisitos funcionais e não funcionais | `content.functionalRequirements`, `content.nonFunctionalRequirements` |
| O que usar, por camada | `content.technologies` |
| Entregas | `content.deliverables` |
| Tempo para conclusão | `content.deadline` |
| Guia de implementação | `content.implementationGuide` |
| O que será avaliado | `content.evaluationCriteria` |
| Estrutura de pastas sugerida | `content.folderStructure` |
| Mensagem final | `content.closingNote` |

O prazo e o escopo variam com o nível. As listagens não trazem o `content`; ele vem no detalhe (`GET /challenges/:id`). `GET /challenges/:id/markdown` devolve o desafio pronto em markdown, para colar no README do repositório.

### Email (Gmail SMTP, gratuito)

Em dev os emails vão para o Mailpit. Em produção, use um Gmail próprio do projeto (limite de ~500 emails por dia):

1. Ative a verificação em 2 etapas da conta e gere uma senha de app em https://myaccount.google.com/apppasswords.
2. Configure `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=<seu gmail>`, `SMTP_PASSWORD=<senha de app>` e `MAIL_FROM="Complicode <seu gmail>"`.

### Telefone (bot do Telegram, gratuito)

O telefone é verificado por um bot do Telegram. O número vem do próprio Telegram, então não há SMS nem custo.

1. O front chama `POST /verification/phone/start` e abre o `deepLink` retornado (`https://t.me/<bot>?start=<token>`). O link expira em 10 minutos.
2. No Telegram, o usuário toca em **Iniciar** e depois em **📱 Compartilhar meu telefone**.
3. A API confere que o contato é da própria conta do Telegram, salva o telefone e, se o email também estiver verificado, concede o bônus.
4. O front acompanha o resultado consultando `GET /verification`.

Para configurar, crie o bot com o [@BotFather](https://t.me/BotFather) (`/newbot`) e preencha `TELEGRAM_BOT_TOKEN` e `TELEGRAM_BOT_USERNAME`. Em `TELEGRAM_UPDATES_MODE`:

- `polling` (dev): a API busca as mensagens no Telegram e não precisa de URL pública.
- `webhook` (produção): no boot, a API registra `TELEGRAM_WEBHOOK_URL` (`https://<sua-api>/api/webhooks/telegram`) com o `TELEGRAM_WEBHOOK_SECRET`.
- `disabled`: o bot não recebe mensagens.

Cada conta do Telegram e cada telefone ficam vinculados a um único usuário.

### AbacatePay

1. Crie no painel um produto avulso **"10 créditos"** por **R$ 10,00** e coloque o ID em `ABACATEPAY_CREDITS_PRODUCT_ID`.
2. Crie uma chave de API (use o dev mode para testes) com a permissão `CHECKOUT:CREATE`.
3. Crie um webhook com o evento `checkout.completed` (e, se quiser, `checkout.refunded`), apontando para `https://<sua-api>/api/webhooks/abacatepay`. Use o mesmo `secret` de `ABACATEPAY_WEBHOOK_SECRET`.

O webhook valida o `webhookSecret` da URL e a assinatura HMAC do header `X-Webhook-Signature`. Ele também ignora eventos repetidos pelo `id`. Para testar localmente, exponha a API com um túnel HTTPS (ex.: `ngrok http 3000`) ou use o `listen` da CLI da AbacatePay.

## Endpoints

Todas as rotas têm o prefixo `/api` e exigem `Authorization: Bearer <accessToken>`, exceto as marcadas como públicas.

| Método | Rota | Descrição |
| - | - | - |
| POST | `/auth/register` | Cadastro (público), retorna os tokens |
| POST | `/auth/login` | Login (público) |
| POST | `/auth/refresh` | Novo par de tokens a partir do refresh token (público) |
| POST | `/auth/logout` | Encerra a sessão do refresh token (público) |
| GET | `/users/me` | Dados do usuário logado |
| GET | `/verification` | Status da verificação e créditos |
| POST | `/verification/email/send` | Envia o código por email |
| POST | `/verification/email/confirm` | Confirma o código do email |
| POST | `/verification/phone/start` | Retorna o `deepLink` do bot do Telegram que verifica o telefone |
| GET | `/credits` | Saldo |
| GET | `/credits/transactions` | Extrato paginado (`?page=&limit=`) |
| GET | `/catalog/stacks` | Stacks com seus frameworks (público) |
| GET | `/catalog/levels` | Níveis (público) |
| POST | `/challenges/generate` | Gera um desafio (`{ stackId, frameworkId, level }`, consome 1 crédito) |
| POST | `/challenges/:id/regenerate` | Regera o desafio (1 vez, grátis) |
| GET | `/challenges` | Meus desafios (paginado) |
| GET | `/challenges/public` | Galeria pública (público) |
| GET | `/challenges/:id` | Detalhe: o dono vê todas as versões; os demais, só desafios públicos |
| GET | `/challenges/:id/markdown` | O desafio em markdown (`text/markdown`), com as mesmas regras de visibilidade |
| PATCH | `/challenges/:id/visibility` | Torna público ou privado (`{ "public": true }`) |
| DELETE | `/challenges/:id` | Remove um desafio |
| POST | `/payments/checkout` | Cria o checkout dos 10 créditos e retorna a `checkoutUrl` |
| GET | `/payments` | Meus pagamentos |
| GET | `/payments/:id` | Status de um pagamento |
| POST | `/webhooks/abacatepay` | Webhook da AbacatePay |
| POST | `/webhooks/telegram` | Webhook do bot do Telegram (modo `webhook`) |

Erros relevantes para o front: `401` (token inválido ou expirado), `402` (créditos insuficientes), `409` (email ou telefone em uso), `429` (rate limit ou cooldown de reenvio de código) e `503` (Gemini ou AbacatePay indisponível).

## Scripts

| Script | Descrição |
| - | - |
| `npm run dev` | API em modo watch |
| `npm run build` | Build de produção |
| `npm test` | Testes unitários |
| `npm run lint` | Oxlint |
| `npm run format` | Prettier |
| `npm run prisma:migrate` | Cria e aplica uma migration em dev |
| `npm run prisma:deploy` | Aplica as migrations (produção) |
| `npm run prisma:seed` | Popula o catálogo |

## Git flow

- `main`: produção
- `develop`: integração
- `feature/*` e `chore/*`: partem de `develop` e voltam por Pull Request

Os commits seguem [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`).
