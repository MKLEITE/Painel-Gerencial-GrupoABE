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

## Erro 500 "Serverless Function has crashed"

Causa comum corrigida no repo: `output: 'standalone'` no `next.config.mjs` é **só para Docker**, não para Vercel.

Após o fix, faça redeploy. Se persistir: Vercel → Deployments → Functions → ver logs.

## API (backend)

A Vercel hospeda só o **Next.js**. A API (`apps/api`) precisa de outro host (Railway, Render, AWS, etc.) com PostgreSQL (RDS).

Fluxo:

```text
Browser → Vercel (Next.js) → rewrite /api → API_INTERNAL_URL (NestJS) → RDS
```
