# Deploy na Vercel (frontend + Route Handlers)

## Configuração do projeto

| Campo | Valor |
|--------|--------|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js (auto) |

O arquivo `apps/web/vercel.json` já define install/build do monorepo.

## Environment Variables (Vercel → Settings → Environment Variables)

| Variável | Valor | Obrigatória | Onde usar |
|----------|--------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vkzefmedwxvpqcivparz.supabase.co` | Sim | Browser + servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave **anon public** do Supabase Dashboard | Sim | Browser + servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave **service_role** do Supabase Dashboard | Sim | **Somente servidor** (Route Handlers, seed) |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | Sim | Browser (chamadas same-origin) |

**Importante:**

- `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ser exposta ao browser. Configure apenas em Production, Preview e Development na Vercel — ela é lida pelas Route Handlers em `apps/web/app/api/admin/*`.
- Não é necessário configurar URL externa de backend: login, sessão e operações admin rodam no próprio Next.js + Supabase.

## Fluxo em produção

```text
Browser → Vercel (Next.js 15)
            ├── Supabase Auth (@supabase/ssr) — login/sessão
            ├── Route Handlers /api/admin/* — operações SUPER_ADMIN (service role)
            └── Supabase Postgres + RLS — dados multi-tenant
```

## Erro 500 — build ou deploy incorreto

### Root Directory errado

Se os **Runtime logs** mostram erros de aplicação legada ou framework incorreto, verifique:

1. **Project Settings → General → Root Directory** → `apps/web` → Save.
2. **Framework Settings → Production Overrides**:
   - O framework de produção deve ser **Next.js**, igual ao Project Settings.
3. **Build & Development Settings**:
   - Framework: **Next.js**
   - Build Command: deixe vazio (usa `apps/web/vercel.json`) **ou** `cd ../.. && pnpm build --filter @abe/web`
4. **Settings → General → Include source files outside of the Root Directory**: **Enabled** (monorepo pnpm).
5. Redeploy (Deployments → ⋯ → Redeploy).

Logs corretos após o fix: requisições em `/` servem HTML do Next.js; login chama Supabase Auth.

### Erro 500 "Serverless Function has crashed" (Next.js)

Causa comum corrigida no repo: `output: 'standalone'` no `next.config.mjs` é **só para Docker**, não para Vercel.

Após o fix, faça redeploy. Se persistir: Vercel → Deployments → Functions → ver logs.

### Login ou admin retornam 401/403

Verifique:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` corretos.
- `SUPABASE_SERVICE_ROLE_KEY` configurada (Route Handlers admin dependem dela).
- Schema aplicado no Supabase (`supabase/migrations/001_initial_schema.sql`).
- Seed executado (`pnpm db:seed`) ou usuários criados manualmente no Supabase Auth.

## Preview deployments

Cada Pull Request pode gerar URL de preview automática. Use as **mesmas variáveis** (ou um projeto Supabase de staging) para testar login e admin antes do merge.

## Banco de dados (Supabase)

A Vercel **não** hospeda o banco. O PostgreSQL, Auth e RLS ficam no Supabase:

- **Projeto:** `https://vkzefmedwxvpqcivparz.supabase.co`
- **Migrations:** `supabase/migrations/`
- **Seed:** `pnpm db:seed` (local ou CI, com `SUPABASE_SERVICE_ROLE_KEY`)

Migrations são aplicadas pelo SQL Editor ou CLI do Supabase — não fazem parte do deploy da Vercel.
