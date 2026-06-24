# Deploy na Vercel (frontend)

## Configuração do projeto

| Campo | Valor |
|--------|--------|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js (auto) |

O arquivo `apps/web/vercel.json` já define install/build do monorepo.

## Environment Variables (Vercel → Settings → Environment Variables)

| Variável | Valor | Obrigatória |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | Sim |
| `API_INTERNAL_URL` | URL pública da API NestJS (ex. `https://api.seudominio.com`) | Sim, para login funcionar |

**Importante:** `API_INTERNAL_URL` aponta para `localhost` **não funciona** na Vercel — lá não existe sua API local. A **página inicial** deve abrir mesmo sem API; **login/admin** só funcionam quando a API estiver no ar.

## Erro 500 — NestJS / Prisma nos logs (`DATABASE_URL undefined`)

Se os **Runtime logs** mostram `NestFactory Starting Nest application` e
`Invalid value undefined for datasource "db"`, a Vercel está executando a **API NestJS**
em vez do **Next.js**. Isso acontece quando o **Root Directory** do projeto **não** está
em `apps/web`.

### Corrigir no painel da Vercel

1. **Project Settings → General → Root Directory** → `apps/web` → Save.
2. **Framework Settings → Production Overrides** (alerta amarelo):
   - Se aparecer **NestJS** em Production Overrides, clique em **Reset** / remova o override.
   - O framework de produção deve ser **Next.js**, igual ao Project Settings.
3. **Build & Development Settings**:
   - Framework: **Next.js**
   - Build Command: deixe vazio (usa `apps/web/vercel.json`) **ou** `cd ../.. && pnpm build --filter @abe/web`
   - **Não** use `turbo run build` (isso builda a API NestJS junto).
4. **Settings → General → Include source files outside of the Root Directory**: **Enabled** (monorepo pnpm).
5. Redeploy (Deployments → ⋯ → Redeploy).

Logs corretos após o fix: requisições em `/` servem HTML do Next.js, **sem** `[NestFactory]`.

O arquivo `vercel.json` na **raiz do repositório** e `.vercelignore` evitam build/deploy acidental da API
se o Root Directory ainda estiver na raiz — mesmo assim, **Root Directory = `apps/web` é obrigatório**.

## Erro 500 "Serverless Function has crashed" (Next.js)

Causa comum corrigida no repo: `output: 'standalone'` no `next.config.mjs` é **só para Docker**, não para Vercel.

Após o fix, faça redeploy. Se persistir: Vercel → Deployments → Functions → ver logs.

## API (backend)

A Vercel hospeda só o **Next.js**. A API (`apps/api`) precisa de outro host (Railway, Render, AWS, etc.) com PostgreSQL (RDS).

Fluxo:

```text
Browser → Vercel (Next.js) → rewrite /api → API_INTERNAL_URL (NestJS) → RDS
```
