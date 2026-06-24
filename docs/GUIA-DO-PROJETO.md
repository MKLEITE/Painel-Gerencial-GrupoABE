# Guia do Projeto — Painel Gerencial Grupo ABE

> **Documento vivo.** Leia isto antes de alterar qualquer código.
> Atualizado em: **23/06/2026** · Fase atual: **0 → início da Fase 1**

---

## 1. O que é este projeto

**Painel Gerencial Grupo ABE** é um portal SaaS multi-tenant para credores do Grupo ABE. Consolida em uma única interface a régua de cobrança hoje espalhada em quatro sistemas de origem:

| Sistema | Empresa | Papel na régua |
|---------|---------|----------------|
| **AvantPay** | AvantPay | Cobrança preventiva (pré-vencimento) |
| **Acordo Seguro** | Acordo Seguro | Negociação digital amigável |
| **ABE Delphi** | ABE + Grejo | Cobrança ativa, acordos, baixas, jurídico |
| **ABE Web** | ABE + Grejo | Cobrança ativa (mesma visão consolidada como **ABE** na UI) |

**Fluxo do crédito:** Credor → AvantPay → Acordo Seguro → ABE → Grejo Advogados

**Regra de produto:** o painel exibe apenas os sistemas que o credor contratou. Na tela, **ABE = Delphi + ABE Web** (agrupados); drill-down separa origem internamente.

Documentação de visão/arquitetura detalhada: pasta [`docs/`](README.md) (01–09) e [`docs/adr/`](adr/README.md).

---

## 2. Estado atual do código (o que já funciona vs. mock)

Use esta tabela para não confundir **implementado** com **planejado**.

| Área | Status | Observação |
|------|--------|------------|
| Monorepo (pnpm + Turbo) | ✅ Pronto | `pnpm dev` sobe web + api + workers |
| Autenticação JWT + cookies httpOnly | ✅ Funcional | Login, logout, `/me`, refresh |
| PostgreSQL (Prisma) | ✅ Funcional | `tenants`, `usuarios`, `credores`, `codigos_cliente` + RLS |
| Seed | ✅ | Ver credenciais na seção 4 |
| Homepage (landing) | ✅ UI | Conteúdo marketing, sem API |
| Login | ✅ UI + auth | Vidro estilo Apple, tema dark padrão nesta rota |
| **Admin plataforma** (`/admin`) | ✅ Funcional | Credores + usuários — apenas `SUPER_ADMIN` |
| Dashboard credor | ⚠️ UI mock | KPIs em `apps/web/lib/dashboard-mock.ts` — **sem API real ainda** |
| Integrações (4 fontes) | ❌ Não iniciado | Workers esqueleto apenas |
| Modelo canônico (titulos, acordos…) | ❌ Schema Prisma pendente | Tipos em `packages/canonical-model` |
| Workers ETL | ❌ Esqueleto | `apps/workers/src/connector.ts` placeholder |
| Infra Terraform | 📋 Documentado | Ver `docs/07` |

---

## 3. Estrutura do monorepo

```text
Painel-Gerencial-GrupoABE/
├── apps/
│   ├── api/                 # Backend NestJS (porta 3333)
│   ├── web/                 # Frontend Next.js 15 (porta 3000)
│   └── workers/             # Workers de integração/ETL (futuro)
├── packages/
│   ├── canonical-model/     # Enums e tipos compartilhados (fonte, fase, KPIs…)
│   └── config/              # ESLint compartilhado
├── docs/                    # Documentação técnica + ADRs + ESTE GUIA
├── infra/                   # IaC (Terraform) — quando aplicável
├── package.json             # Scripts raiz (turbo)
└── turbo.json
```

### 3.1 `apps/api` — Backend

```text
apps/api/
├── prisma/
│   ├── schema.prisma        # Modelo do banco (auth hoje)
│   ├── seed.ts              # Usuário admin de dev
│   └── migrations/          # Versionadas — nunca editar SQL manual em prod
├── src/
│   ├── main.ts              # Bootstrap NestJS
│   ├── app.module.ts
│   ├── config/              # Validação Zod das env vars
│   ├── prisma/              # PrismaService
│   ├── common/
│   │   ├── filters/         # http-exception.filter (problem+json, PT-BR)
│   │   ├── guards/          # JWT, roles, tenant
│   │   ├── decorators/      # @CurrentUser, @Roles
│   │   └── interceptors/    # audit (preparado)
│   └── modules/
│       ├── auth/            # login, logout, refresh, me
│       ├── users/
│       ├── admin/           # credores + usuários (SUPER_ADMIN)
│       └── health/          # GET /api/health
└── .env                     # NÃO commitar — ver .env.example
```

**Prefixo global:** `/api` · **Versionamento:** `/v1/...`

**Endpoints de auth hoje:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/login` | Login → cookies httpOnly |
| POST | `/api/v1/auth/logout` | Limpa cookies |
| POST | `/api/v1/auth/refresh` | Renova access token |
| GET | `/api/v1/auth/me` | Usuário autenticado (JWT) |

**Papéis (`PapelUsuario`):** `SUPER_ADMIN`, `ADMIN_CREDOR`, `OPERADOR`, `VIEWER`

| Papel | Acesso |
|-------|--------|
| `SUPER_ADMIN` | `/admin` — gerencia credores e usuários de toda a plataforma |
| `ADMIN_CREDOR` | `/dashboard` — administra o tenant do credor (futuro: usuários do próprio credor) |
| `OPERADOR` | `/dashboard` — operação/consulta |
| `VIEWER` | `/dashboard` — somente leitura |

**Endpoints admin** (JWT + `@Roles(SUPER_ADMIN)`):

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/admin/credores` | Lista credores cadastrados |
| POST | `/api/v1/admin/credores` | Cria credor + tenant |
| GET | `/api/v1/admin/credores/:id` | Detalhe do credor |
| GET | `/api/v1/admin/usuarios` | Lista usuários (`?tenantId=` opcional) |
| POST | `/api/v1/admin/usuarios` | Cria usuário |
| PATCH | `/api/v1/admin/usuarios/:id` | Atualiza nome, papel, senha, ativo |
| GET | `/api/v1/admin/tenants` | Tenants para selects (credor + plataforma) |

**Modelo `Credor`:** 1:1 com `Tenant`. Chaveamento futuro de clientes por `codClientePrincipal`, `CodigoCliente` adicionais e `cnpj` (grupos empresariais com vários CNPJs/códigos).

### 3.2 `apps/web` — Frontend

```text
apps/web/
├── app/
│   ├── layout.tsx           # Tema SSR (cookie), metadata, fontes
│   ├── page.tsx             # Landing (homepage)
│   ├── login/
│   │   ├── layout.tsx       # LoginPageShell (tema/fallback)
│   │   └── page.tsx         # Tela de login
│   ├── dashboard/
│   │   └── page.tsx         # Cockpit credor (KPIs mock)
│   ├── admin/
│   │   └── page.tsx         # Gestão credores + usuários (SUPER_ADMIN)
│   └── globals.css          # Design tokens + glass login + login-scrim
├── components/
│   ├── brand/logo.tsx
│   ├── dashboard/           # Filtros, KPIs, gráficos, tabelas
│   ├── login/               # GlassLoginPanel, LoginPageShell
│   ├── site/                # Header/footer da landing
│   └── theme/               # ThemeProvider, ThemeToggle
├── lib/
│   ├── api-client.ts        # fetch → /api (rewrite Next.js)
│   ├── auth.ts              # login, logout, me
│   └── dashboard-mock.ts    # Dados fake do dashboard
├── middleware.ts            # Repassa x-pathname (tema login)
├── public/
│   ├── brand/               # GRUPOABE.png
│   ├── backgrounds/         # woman-background-login.png
│   └── sources/             # Logos Avantpay, ABE, Acordo Seguro…
└── next.config.mjs          # CSP, rewrite /api → backend
```

**Proxy da API:** o browser chama `/api/v1/...` no mesmo host (`localhost:3000`); Next.js reescreve para `http://localhost:3333/api/v1/...`. Isso mantém cookies **same-origin** (essencial para httpOnly).

### 3.3 `packages/canonical-model`

Tipos e enums que **front e back compartilham**. Ao adicionar entidade de negócio, comece aqui antes do Prisma.

Arquivos principais: `src/enums.ts` (`SistemaOrigem`, `FaseCobranca`, …), `src/entities.ts` (`Titulo`, `KpisCarteira`, …).

Após alterar: `pnpm --filter @abe/canonical-model build` (o `turbo dev` já faz isso).

### 3.4 `apps/workers`

Placeholder para ETL/sincronização das 4 fontes. **Não consultar SQL Server 2005 em tempo real** — ver ADR-0005.

---

## 4. Como rodar localmente

### Pré-requisitos

- Node.js **≥ 20**
- pnpm **≥ 9** (`corepack enable`)
- PostgreSQL acessível (local Docker ou RDS)

### Passos

```bash
corepack enable
pnpm install

# API — copiar e ajustar DATABASE_URL
cp apps/api/.env.example apps/api/.env

# Migrar + seed
cd apps/api
pnpm exec prisma migrate deploy
pnpm exec prisma db seed

# Raiz — sobe web + api + workers
cd ../..
pnpm dev
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Login | http://localhost:3000/login |
| Admin plataforma | http://localhost:3000/admin |
| Dashboard credor | http://localhost:3000/dashboard |
| API health | http://localhost:3333/api/health |

**Credenciais (seed):**

| E-mail | Senha | Papel | Após login |
|--------|-------|-------|------------|
| `meykson@abe.com.br` | `12qw!@QW142536` | `SUPER_ADMIN` | `/admin` |
| `admin@grupoabe.com.br` | `Admin@123` | `ADMIN_CREDOR` | `/dashboard` |

### Comandos úteis

```bash
pnpm typecheck          # TypeScript em todo o monorepo
pnpm lint               # ESLint
pnpm build              # Build de produção
pnpm exec prisma studio # UI do banco (dentro de apps/api)
```

---

## 5. Variáveis de ambiente

### API (`apps/api/.env`)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL (local ou RDS) |
| `API_PORT` | Padrão `3333` |
| `WEB_ORIGIN` | CORS — padrão `http://localhost:3000` |
| `JWT_ACCESS_SECRET` | Mín. 32 chars — **trocar em produção** |
| `JWT_REFRESH_SECRET` | Mín. 32 chars — **trocar em produção** |
| `COOKIE_SECURE` | `true` em HTTPS produção |

### Web

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_BASE_URL` | Padrão `/api` (rewrite) |
| `API_INTERNAL_URL` | Backend para rewrite — padrão `http://localhost:3333` |

**Nunca** commitar `.env` com segredos reais.

---

## 6. Banco de dados

- **ORM:** Prisma
- **Produção:** AWS RDS PostgreSQL (`painel_abe`)
- **Migrations:** sempre via `prisma migrate dev` (dev) / `migrate deploy` (prod)
- **RLS:** migration `20250619180001_rls` prepara Row-Level Security por tenant

**Modelos atuais:** apenas `Tenant` e `Usuario`. Modelo de negócio (titulos, acordos, lotes, views KPI) **virá na Fase 1**.

---

## 7. Autenticação (fluxo completo)

```text
Browser                    Next.js (:3000)              API (:3333)
   │                              │                          │
   │ POST /api/v1/auth/login      │ rewrite                  │
   │─────────────────────────────►│─────────────────────────►│
   │                              │                          │ valida Argon2
   │◄ Set-Cookie access+refresh   │◄─────────────────────────│
   │                              │                          │
   │ GET /api/v1/auth/me          │                          │
   │ (cookies automáticos)        │─────────────────────────►│ JwtAuthGuard
```

- Tokens em cookies **httpOnly** — não usar `localStorage`
- Access: ~15 min · Refresh: ~7 dias
- Erros: JSON `{ title, status, traceId?, errors? }` em português

---

## 8. Frontend — decisões importantes

### 8.1 Tema claro/escuro

- **Padrão global:** claro
- **Rota `/login`:** escuro por padrão (sem cookie de preferência)
- Cookie `theme=light|dark` persiste escolha do usuário
- `ThemeProvider` + classe `dark` no `<html>`

### 8.2 Login — particularidades

| Item | Detalhe |
|------|---------|
| Fundo | Imagem `fixed` full-screen — **não duplicar** dentro do card |
| Vinheta | `.login-scrim` — gradiente único (evita corte na junção 50/50) |
| Card vidro | `GlassLoginPanel` — camadas DOM reais (compatível Firefox) |
| Cores do form | Classes `.login-glass-*` — **fixas**, não usam `text-foreground` |
| Header | Voltar + ThemeToggle flutuam (`login-chrome-btn`) |

### 8.3 Paleta Grupo ABE

Definida em `apps/web/app/globals.css`:

- Azul institucional `#153981` · Navy `#213359`
- Dourado `#BD9941` · Grafite `#4A4E69`

### 8.4 Dashboard (briefing KPI)

Estrutura alinhada ao briefing “Dashboard Inteligente”:

- Filtros globais (CodCliente, lote, período, CNPJ, UF)
- Blocos: Borderô, Financeiro, Carteira ativa, Acordos, Baixas, Gráficos, UF
- Composição por ator: ABE | Acordo Seguro | AvantPay
- Dados: **`apps/web/lib/dashboard-mock.ts`** até existir API

**Próximo passo técnico:** módulo `carteira` na API + views materializadas no Postgres.

---

## 9. Arquitetura de dados (visão — ainda não implementada)

```text
Fontes (Delphi, Web, AvantPay, Acordo Seguro)
        │ ETL / webhooks / agente on-premise
        ▼
   Staging (bruto, por fonte)
        ▼
   Modelo canônico (PostgreSQL)
        ▼
   Views materializadas (KPIs)
        ▼
   API → Dashboard
```

**Regras críticas:**

1. Portal **nunca** consulta SQL Server 2005 em tempo real (ADR-0005)
2. Todo registro canônico carrega `tenant_id` + `sistema_origem`
3. Sincronização **idempotente** (chave natural: origem + id externo)
4. Consistência eventual — UI pode mostrar “atualizado há X min” por fonte

Detalhes: [`docs/03-arquitetura-de-dados.md`](03-arquitetura-de-dados.md)

---

## 10. Convenções de desenvolvimento

### 10.1 Commits

[Conventional Commits](https://www.conventionalcommits.org/) — validado por commitlint:

```text
feat(carteira): adiciona endpoint de KPIs
fix(web): corrige glass login no Firefox
docs: atualiza guia do projeto
```

### 10.2 TypeScript

- Strict mode
- Imports ESM na API (`*.js` nos paths relativos do Nest)
- Tipos de domínio em `@abe/canonical-model`

### 10.3 Estilo

- Prettier + ESLint (config em `packages/config`)
- Tailwind no frontend — preferir tokens CSS (`--primary`, etc.)
- Componentes pequenos em `components/` — páginas orquestram

### 10.4 Segurança (resumo)

- Autorização **sempre no backend** — front só reflete permissões
- Não vazar stack trace/SQL nos erros (`http-exception.filter`)
- CPF/CNPJ mascarados na UI (LGPD)
- Ver [`docs/06-seguranca-e-lgpd.md`](06-seguranca-e-lgpd.md)

---

## 11. Tarefas comuns — “onde mexer?”

| Quero… | Onde |
|--------|------|
| Alterar tela de login | `apps/web/app/login/`, `components/login/`, `.login-scrim` / `.glass-login*` em `globals.css` |
| Alterar dashboard KPI | `apps/web/app/dashboard/page.tsx`, `lib/dashboard-mock.ts`, `components/dashboard/` |
| Novo endpoint API | `apps/api/src/modules/<nome>/`, registrar em `app.module.ts` |
| Novo model de banco | `prisma/schema.prisma` → `prisma migrate dev` → atualizar `canonical-model` |
| Nova fonte de dados | `apps/workers/`, staging tables, doc 03 |
| Cores / tema global | `apps/web/app/globals.css`, `tailwind.config.ts` |
| Metadata / título aba | `apps/web/app/layout.tsx` |
| Mensagens de erro API | `apps/api/src/common/filters/http-exception.filter.ts` |
| Mensagens de erro front | `apps/web/lib/api-client.ts` |

---

## 12. Armadilhas conhecidas

| Problema | Causa | Solução |
|----------|-------|---------|
| Login OK no Chrome, cores erradas no Firefox | `text-foreground` depende do tema | Usar classes `.login-glass-*` no card |
| Vidro opaco no Firefox | `backdrop-filter` em `::before` | Usar `GlassLoginPanel` com divs reais |
| API “Bad Request Exception” | Validação Nest | Já corrigido — mensagens PT em `http-exception.filter` |
| Cookies não funcionam | Chamar API direto na :3333 | Usar `/api` via Next rewrite |
| `class-validator` missing | deps API | `pnpm install` na raiz |
| Junção escura/clara no login | Overlay só no aside | Usar `.login-scrim` full-screen |
| Turbo dev falha canonical-model | pacote não buildado | `pnpm dev` roda `^build` antes |

---

## 13. Roadmap resumido

| Fase | Foco |
|------|------|
| **0** ✅ | Documentação, monorepo, auth, UI shell |
| **1** 🔜 | 1ª integração real + KPIs API + dashboard conectado |
| **2** | 4 fontes + ETL clientes (ABE/Web/AvantPay/Acordo Seguro) |
| **3** | Multiempresa, onboarding, billing |
| **4** | BI avançado, previsões |

Ver [`docs/09-roadmap-e-fase-0.md`](09-roadmap-e-fase-0.md)

---

## 14. Histórico de atualizações deste guia

| Data | Alteração |
|------|-----------|
| 23/06/2026 | Criação inicial — estado pós auth, login glass, dashboard mock, rename para Painel Gerencial Grupo ABE |
| 23/06/2026 | Admin plataforma — credores, usuários, RBAC, seed `meykson@abe.com.br`, redirect `/admin` |

---

## 15. Links rápidos

- [Documentação técnica (índice)](README.md)
- [ADR — decisões arquiteturais](adr/README.md)
- [ADR-0005 — Legado SQL 2005](adr/0005-acesso-legado-sql2005.md)
- [Backend (contratos API)](04-backend.md)
- [Frontend (telas MVP)](05-frontend.md)
- [Arquitetura de dados](03-arquitetura-de-dados.md)

---

**Dúvida antes de codar?** Leia a seção 11 deste guia e o doc específico em `docs/`. Ao entregar feature nova, **atualize a seção 2 (estado atual) e a seção 14 (histórico)** deste arquivo.
