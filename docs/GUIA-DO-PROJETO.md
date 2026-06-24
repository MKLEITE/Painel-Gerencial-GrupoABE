# Guia do Projeto — Painel Gerencial Grupo ABE

> **Documento vivo.** Leia isto antes de alterar qualquer código.
> Atualizado em: **24/06/2026** · Fase atual: **0 → início da Fase 1**

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

## 2. Stack tecnológica

| Camada | Tecnologia | Onde |
|--------|------------|------|
| **Frontend** | Next.js 15 (App Router) | `apps/web` — deploy na **Vercel** |
| **Backend de dados** | Supabase (PostgreSQL + Auth + RLS) | `https://vkzefmedwxvpqcivparz.supabase.co` |
| **Operações admin** | Next.js Route Handlers | `apps/web/app/api/admin/*` |
| **Autenticação** | Supabase Auth via `@supabase/ssr` | `apps/web/lib/auth.ts` |
| **Schema** | SQL versionado | `supabase/migrations/001_initial_schema.sql` |
| **Seed** | Script Node | `supabase/seed.mjs` (`pnpm db:seed`) |

---

## 3. Estado atual do código (o que já funciona vs. mock)

| Área | Status | Observação |
|------|--------|------------|
| Monorepo (pnpm + Turbo) | ✅ Pronto | `pnpm dev` sobe `@abe/web` |
| Supabase Auth + sessão SSR | ✅ Funcional | Login, logout, perfil via `lib/auth.ts` |
| PostgreSQL (Supabase) + RLS | ✅ Funcional | `tenants`, `usuarios`, `credores`, `codigos_cliente` |
| Seed | ✅ | `pnpm db:seed` — ver credenciais na seção 5 |
| Homepage (landing) | ✅ UI | Conteúdo marketing |
| Login | ✅ UI + auth | Vidro estilo Apple, tema dark padrão nesta rota |
| **Admin plataforma** (`/admin`) | ✅ Funcional | Credores + usuários — apenas `SUPER_ADMIN` |
| Route Handlers admin | ✅ Funcional | `app/api/admin/*` com service role |
| Dashboard credor | ⚠️ UI mock | KPIs em `apps/web/lib/dashboard-mock.ts` |
| Integrações (4 fontes) | ❌ Não iniciado | Workers esqueleto apenas |
| Modelo canônico (titulos, acordos…) | ❌ Schema pendente | Tipos em `packages/canonical-model` |
| Workers ETL | ❌ Esqueleto | `apps/workers/src/connector.ts` placeholder |

---

## 4. Estrutura do monorepo

```text
Painel-Gerencial-GrupoABE/
├── apps/
│   ├── web/                 # Frontend + Route Handlers (Next.js 15)
│   └── workers/             # Workers de integração/ETL (futuro)
├── packages/
│   ├── canonical-model/     # Enums e tipos compartilhados
│   └── config/              # ESLint compartilhado
├── supabase/
│   ├── migrations/          # Schema SQL versionado
│   └── seed.mjs             # Seed de desenvolvimento
├── docs/                    # Documentação técnica + ADRs + ESTE GUIA
├── package.json             # Scripts raiz (turbo)
└── turbo.json
```

### 4.1 `apps/web` — Frontend + backend serverless

```text
apps/web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx             # Landing
│   ├── login/
│   ├── dashboard/           # Cockpit credor (KPIs mock)
│   ├── admin/               # Gestão credores + usuários (SUPER_ADMIN)
│   └── api/admin/           # Route Handlers (service role)
│       ├── credores/
│       └── usuarios/
├── components/
├── lib/
│   ├── auth.ts              # login, logout, perfil (Supabase Auth)
│   ├── api-client.ts        # fetch → /api
│   ├── supabase/            # client, server, admin, middleware
│   └── server/              # admin-auth, admin-credores, admin-usuarios
├── middleware.ts            # refresh de sessão Supabase
└── .env.local               # chaves Supabase (não commitar)
```

**Route Handlers admin** (sessão SUPER_ADMIN + `SUPABASE_SERVICE_ROLE_KEY`):

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/credores` | Lista credores |
| POST | `/api/admin/credores` | Cria credor + tenant + responsável |
| GET | `/api/admin/credores/:id` | Detalhe do credor |
| PATCH | `/api/admin/credores/:id/responsavel` | Atualiza responsável |
| GET | `/api/admin/usuarios` | Lista usuários da plataforma |
| POST | `/api/admin/usuarios` | Cria usuário |
| PATCH | `/api/admin/usuarios/:id` | Atualiza usuário |

**Papéis (`PapelUsuario`):** `SUPER_ADMIN`, `ADMIN_CREDOR`, `OPERADOR`, `VIEWER`

| Papel | Acesso |
|-------|--------|
| `SUPER_ADMIN` | `/admin` — gerencia credores e usuários da plataforma |
| `ADMIN_CREDOR` | `/dashboard` — administra o tenant do credor |
| `OPERADOR` | `/dashboard` — operação/consulta |
| `VIEWER` | `/dashboard` — somente leitura |

### 4.2 `supabase/`

- `migrations/001_initial_schema.sql` — schema inicial com RLS.
- Ver [`supabase/README.md`](../supabase/README.md) para setup.

### 4.4 `packages/canonical-model`

Tipos e enums compartilhados. Ao adicionar entidade de negócio, comece aqui antes das migrations SQL.

---

## 5. Como rodar localmente

### Pré-requisitos

- Node.js **≥ 20**
- pnpm **≥ 9** (`corepack enable`)
- Projeto Supabase configurado (chaves no Dashboard)

### Passos

```bash
corepack enable
pnpm install

# Copiar variáveis de ambiente
cp .env.example .env
# ou: cp apps/web/.env.example apps/web/.env.local

# Preencher NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY (ver Supabase Dashboard → API)

# Aplicar schema (uma vez) — SQL Editor do Supabase:
# supabase/migrations/001_initial_schema.sql

# Seed
pnpm db:seed

# Subir frontend
pnpm dev
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Login | http://localhost:3000/login |
| Admin plataforma | http://localhost:3000/admin |
| Dashboard credor | http://localhost:3000/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |

**Credenciais (seed):**

| E-mail | Senha | Papel | Após login |
|--------|-------|-------|------------|
| `meykson@abe.com.br` | `12qw!@QW142536` | `SUPER_ADMIN` | `/admin/credores` |
| `admin@grupoabe.com.br` | `Admin@123` | `ADMIN_CREDOR` | `/dashboard` |

### Comandos úteis

```bash
pnpm typecheck          # TypeScript em todo o monorepo
pnpm lint               # ESLint
pnpm build              # Build de produção
pnpm db:seed            # Reaplica seed no Supabase
```

---

## 6. Variáveis de ambiente

### Raiz (`.env`) ou `apps/web/.env.local`

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (browser + servidor) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role — **somente servidor** |
| `NEXT_PUBLIC_API_BASE_URL` | Base das chamadas API — padrão `/api` |

**Nunca** commitar `.env` com segredos reais. **Nunca** expor `SUPABASE_SERVICE_ROLE_KEY` no browser.

---

## 7. Banco de dados

- **Provedor:** Supabase PostgreSQL
- **Projeto:** `https://vkzefmedwxvpqcivparz.supabase.co`
- **Migrations:** `supabase/migrations/` — aplicar via SQL Editor ou Supabase CLI
- **RLS:** habilitado em `001_initial_schema.sql`
- **Auth:** credenciais em `auth.users`; perfil em `public.usuarios` (`id` = `auth.users.id`)

**Modelos atuais:** `tenants`, `usuarios`, `credores`, `codigos_cliente`. Modelo de negócio (titulos, acordos, KPIs) **virá na Fase 1**.

---

## 8. Autenticação (fluxo completo)

```text
Browser                    Next.js (:3000)              Supabase
   │                              │                          │
   │ signInWithPassword           │                          │
   │─────────────────────────────►│─────────────────────────►│ Auth
   │                              │                          │
   │◄ cookies de sessão (SSR)     │◄─────────────────────────│
   │                              │                          │
   │ fetchProfile (usuarios)      │─────────────────────────►│ Postgres + RLS
```

- Sessão gerenciada por `@supabase/ssr` (cookies httpOnly)
- Perfil (`papel`, `tenant_id`, `ativo`) em `public.usuarios`
- Operações admin usam service role após validar `SUPER_ADMIN`
- Erros mapeados para português em `lib/auth.ts`

---

## 9. Frontend — decisões importantes

### 9.1 Tema claro/escuro

- **Padrão global:** claro
- **Rota `/login`:** escuro por padrão
- Cookie `theme=light|dark` persiste escolha

### 9.2 Login

- Fundo full-screen, card vidro (`GlassLoginPanel`)
- Cores fixas `.login-glass-*` (compatível Firefox)

### 9.3 Dashboard (briefing KPI)

- Dados em **`apps/web/lib/dashboard-mock.ts`** até existir integração real
- **Próximo passo:** views materializadas no Supabase + queries no frontend

---

## 10. Arquitetura de dados (visão — parcialmente implementada)

```text
Fontes (Delphi, Web, AvantPay, Acordo Seguro)
        │ ETL / webhooks / agente on-premise
        ▼
   Supabase PostgreSQL (modelo canônico + RLS)
        ▼
   Views materializadas (KPIs)
        ▼
   Next.js → Dashboard
```

**Regras críticas:**

1. Portal **nunca** consulta SQL Server 2005 em tempo real (ADR-0005)
2. Todo registro canônico carrega `tenant_id` + `sistema_origem`
3. Sincronização **idempotente**
4. Consistência eventual — UI mostra “atualizado há X min”

Detalhes: [`docs/03-arquitetura-de-dados.md`](03-arquitetura-de-dados.md)

---

## 11. Convenções de desenvolvimento

### Commits

[Conventional Commits](https://www.conventionalcommits.org/) — validado por commitlint.

### TypeScript

- Strict mode
- Tipos de domínio em `@abe/canonical-model`

### Segurança (resumo)

- Autorização **sempre no servidor** (Route Handlers + RLS)
- `SUPABASE_SERVICE_ROLE_KEY` nunca no client
- CPF/CNPJ mascarados na UI (LGPD)

---

## 12. Tarefas comuns — “onde mexer?”

| Quero… | Onde |
|--------|------|
| Alterar tela de login | `apps/web/app/login/`, `components/login/` |
| Alterar dashboard KPI | `apps/web/app/dashboard/`, `lib/dashboard-mock.ts` |
| Novo endpoint admin | `apps/web/app/api/admin/<recurso>/route.ts` |
| Novo model de banco | `supabase/migrations/` → SQL Editor |
| Lógica admin compartilhada | `apps/web/lib/server/` |
| Auth / sessão | `apps/web/lib/auth.ts`, `lib/supabase/` |
| Seed de dev | `supabase/seed.mjs` |

---

## 13. Armadilhas conhecidas

| Problema | Causa | Solução |
|----------|-------|---------|
| Login falha com “perfil não encontrado” | Usuário em Auth sem linha em `usuarios` | Rodar seed ou criar perfil manualmente |
| Admin retorna 403 | Sessão sem `SUPER_ADMIN` | Verificar papel no seed/perfil |
| Admin retorna 500 | `SUPABASE_SERVICE_ROLE_KEY` ausente | Configurar no `.env` / Vercel |
| RLS bloqueia query | Cliente anon sem contexto de tenant | Usar service role no servidor ou política correta |

---

## 14. Roadmap resumido

| Fase | Foco |
|------|------|
| **0** ✅ | Documentação, monorepo, auth Supabase, UI shell, admin |
| **1** 🔜 | 1ª integração real + KPIs + dashboard conectado |
| **2** | 4 fontes + ETL |
| **3** | Multiempresa, onboarding, billing |
| **4** | BI avançado, previsões |

Ver [`docs/09-roadmap-e-fase-0.md`](09-roadmap-e-fase-0.md)

---

## 15. Histórico de atualizações deste guia

| Data | Alteração |
|------|-----------|
| 23/06/2026 | Criação inicial |
| 24/06/2026 | Migração para stack Supabase + Next.js + Vercel; remoção do backend NestJS legado |

---

## 16. Links rápidos

- [Documentação técnica (índice)](README.md)
- [Deploy Vercel](VERCEL-DEPLOY.md)
- [Supabase setup](../supabase/README.md)
- [Modelo Tenant · Credores · Usuários](10-modelo-tenant-usuarios-credores.md)
- [Backend (Route Handlers)](04-backend.md)

**Dúvida antes de codar?** Leia a seção 12 deste guia e o doc específico em `docs/`.
