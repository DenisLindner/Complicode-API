# Complicode API

Backend do **Complicode**, um gerador de ideias de projetos de programação que fogem do convencional. O usuário escolhe a stack, o framework e o nível, e a API gera com o Gemini um desafio único no formato **Contexto, Desafio, Stack e Entregas**.

Construído com NestJS 12, Prisma 7 (PostgreSQL), Keycloak, Gemini e AbacatePay.

## Regras de negócio

- Ao verificar **email e telefone** (código por email e por WhatsApp), o usuário ganha **2 créditos**, uma única vez. Cada telefone só pode estar em uma conta.
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
                    └─► SMTP / WhatsApp Cloud API (códigos de verificação)
```

| Módulo | Responsabilidade |
| - | - |
| `auth` | Cadastro, login, refresh e logout via Keycloak; guard JWT global (`@Public()` libera a rota) |
| `user` | Usuário local, vinculado ao Keycloak pelo `sub` (`GET /users/me`) |
| `verification` | Códigos de 6 dígitos por email e WhatsApp e bônus de cadastro |
| `credit` | Saldo e extrato (ledger idempotente) |
| `catalog` | Stacks, frameworks e níveis |
| `ai` | Integração com o Gemini (saída JSON estruturada) |
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
| `WHATSAPP_PROVIDER` | `console` (dev: o código aparece no log) ou `meta` |
| `WHATSAPP_META_*` | Credenciais da WhatsApp Cloud API e nome do template |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Chave do Google AI Studio e modelo (padrão `gemini-flash-latest`) |
| `ABACATEPAY_*` | Chave da API, secret do webhook e ID do produto de créditos |

### Gemini

Crie uma chave gratuita em https://aistudio.google.com/apikey. O plano gratuito tem limite de requisições por minuto e por dia, então a rota de geração tem rate limit próprio.

### WhatsApp (Meta Cloud API)

1. Crie um app no Meta for Developers com o produto WhatsApp e anote o *Phone number ID* e o *access token*.
2. Crie um template da categoria **Authentication**, com botão de copiar código. O nome padrão esperado é `verification_code`, em `pt_BR`.
3. Configure `WHATSAPP_PROVIDER=meta` e as variáveis `WHATSAPP_META_*`.

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
| POST | `/verification/phone/send` | Envia o código por WhatsApp (`{ "phone": "+5511999999999" }`) |
| POST | `/verification/phone/confirm` | Confirma o código do telefone |
| GET | `/credits` | Saldo |
| GET | `/credits/transactions` | Extrato paginado (`?page=&limit=`) |
| GET | `/catalog/stacks` | Stacks com seus frameworks (público) |
| GET | `/catalog/levels` | Níveis (público) |
| POST | `/challenges/generate` | Gera um desafio (`{ stackId, frameworkId, level }`, consome 1 crédito) |
| POST | `/challenges/:id/regenerate` | Regera o desafio (1 vez, grátis) |
| GET | `/challenges` | Meus desafios (paginado) |
| GET | `/challenges/public` | Galeria pública (público) |
| GET | `/challenges/:id` | Detalhe: o dono vê todas as versões; os demais, só desafios públicos |
| PATCH | `/challenges/:id/visibility` | Torna público ou privado (`{ "public": true }`) |
| DELETE | `/challenges/:id` | Remove um desafio |
| POST | `/payments/checkout` | Cria o checkout dos 10 créditos e retorna a `checkoutUrl` |
| GET | `/payments` | Meus pagamentos |
| GET | `/payments/:id` | Status de um pagamento |
| POST | `/webhooks/abacatepay` | Webhook da AbacatePay |

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
