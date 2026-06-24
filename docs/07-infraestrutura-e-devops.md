# 07 — Infraestrutura e DevOps

## 7.1 Plataforma: Supabase + Vercel

A infraestrutura do portal é **gerenciada** (PaaS), sem servidores ou IaC próprios:

| Camada | Provedor | Responsabilidade |
|--------|----------|------------------|
| **Frontend + API serverless** | [Vercel](https://vercel.com) | Next.js 15 (`apps/web`), Route Handlers, CDN, TLS, deploy automático |
| **Backend de dados** | [Supabase](https://supabase.com) | PostgreSQL, Auth, RLS, backups, Dashboard |
| **Repositório + CI** | GitHub | Código, Pull Requests, GitHub Actions |

Projeto Supabase: `https://vkzefmedwxvpqcivparz.supabase.co`

## 7.2 Componentes

| Componente | Uso |
|------------|-----|
| **Vercel (Next.js)** | UI do portal, Route Handlers em `/api/admin/*`, middleware de sessão |
| **Supabase Auth** | Login, sessão, tokens — via `@supabase/ssr` |
| **Supabase PostgreSQL** | Banco multi-tenant com Row-Level Security |
| **Supabase Dashboard** | SQL Editor, logs, métricas, gestão de chaves API |
| **GitHub Actions** | CI: lint, typecheck, testes, build, scan de segredos |

## 7.3 Topologia

```text
Internet (Credores / Admin MK)
   │  HTTPS
   ▼
┌─────────────────────────────────────┐
│  Vercel — Next.js 15 (apps/web)      │
│  ├── Páginas (App Router)            │
│  ├── Route Handlers /api/admin/*     │
│  └── Middleware (@supabase/ssr)       │
└─────────────────────────────────────┘
   │ Auth (anon key)          │ service role (servidor)
   ▼                          ▼
┌─────────────────────────────────────┐
│  Supabase                            │
│  ├── Auth (auth.users)               │
│  ├── PostgreSQL + RLS (public.*)     │
│  └── Backups / PITR (plano Supabase) │
└─────────────────────────────────────┘
   ▲
   │ push seguro (HTTPS, futuro)
   Agente on-premise (ambiente ABE) ──► coleta do SQL Server 2005
```

Regras:

- Chave **anon** no browser; chave **service_role** **somente** no servidor (Route Handlers, seed).
- Segredos de integração futuras ficam em variáveis de ambiente da Vercel ou Supabase Vault — nunca no repositório.
- O legado SQL 2005 **nunca** é exposto à internet (ver ADR-0005).

## 7.4 Ambientes

| Ambiente | Propósito | Onde |
|----------|-----------|------|
| **local** | desenvolvimento | `pnpm dev` + projeto Supabase (ou branch de dev) |
| **preview** | review de PR | Vercel Preview + mesmo Supabase ou projeto staging |
| **production** | produção | Vercel Production + Supabase Production |

- Cada ambiente usa **variáveis de ambiente** distintas (chaves Supabase, URLs).
- **Nunca** copiar dados reais de produção para dev/staging sem anonimização.

## 7.5 Schema e migrations

- SQL versionado em `supabase/migrations/` (ex.: `001_initial_schema.sql`).
- Aplicar migrations pelo **SQL Editor** ou **Supabase CLI** — não há Terraform.
- Seed de desenvolvimento: `pnpm db:seed` (`supabase/seed.mjs`).

Ver [`supabase/README.md`](../supabase/README.md).

## 7.6 CI/CD (GitHub Actions)

Repositório no GitHub → pipeline em `.github/workflows/ci.yml`.

### Pipeline de CI (em todo PR)

1. Checkout + setup (Node/pnpm).
2. Lint + format check.
3. **Scan de segredos** (gitleaks).
4. Testes unitários e de integração.
5. **SAST** (análise estática) + **SCA** (dependências).
6. Build (`pnpm build --filter @abe/web`).

### Pipeline de CD

- **Merge na `main`** → deploy automático na **Vercel** (Production).
- **Pull Request** → **Preview deployment** na Vercel (URL temporária).
- Migrações de banco aplicadas **manualmente ou via script** no Supabase antes/depois do deploy (com backup).
- **Rollback** na Vercel: redeploy de deployment anterior estável.

### Branching

- `main` (produção) ← `feature/*` (ou `develop` se adotado).
- Proteção de branch: PR obrigatório, checks verdes, 1+ aprovação, sem push direto na `main`.
- **Conventional Commits** + versionamento semântico.

## 7.7 Configuração e segredos

| Variável | Onde configurar |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env` local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env` local |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (servidor) + `.env` local — **nunca no browser** |
| `NEXT_PUBLIC_API_BASE_URL` | Vercel + `.env` local — valor `/api` |

- `.env` apenas local e **no `.gitignore`**.
- Chaves obtidas em Supabase Dashboard → Project Settings → API.

## 7.8 Custos (princípios)

- **Vercel:** plano Hobby/Pro conforme tráfego e equipe; preview deployments incluídos.
- **Supabase:** plano Free/Pro conforme storage, MAU e backups; escalar quando necessário.
- Tags e projetos separados por ambiente para acompanhar custo.
- Workers de integração futuros podem rodar como Vercel Cron, Supabase Edge Functions ou processo dedicado — decidir na Fase 1.

## 7.9 Estrutura no repositório

```text
supabase/
  migrations/           # SQL versionado (schema, RLS)
  README.md             # setup Supabase

apps/web/               # deploy na Vercel (Root Directory)
  app/api/admin/        # Route Handlers (service role)
  lib/supabase/         # clientes @supabase/ssr
  lib/auth.ts           # login, logout, perfil
```

> Detalhes de deploy: [`VERCEL-DEPLOY.md`](VERCEL-DEPLOY.md).
