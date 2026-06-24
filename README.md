# Painel Gerencial Grupo ABE

Portal SaaS que consolida, em uma única interface, a régua de cobrança hoje espalhada por quatro
sistemas (Avantpay, ABE Interno/Delphi, ABEWeb e Acordo Seguro). Acessado externamente por clientes
credores, com foco em **segurança**, **isolamento multi-tenant**, **conformidade LGPD** e
**resiliência**.

> 📚 **Comece pela documentação:** [`docs/GUIA-DO-PROJETO.md`](docs/GUIA-DO-PROJETO.md) · [`supabase/README.md`](supabase/README.md)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind |
| Backend / Banco / Auth | **Supabase** (PostgreSQL + Auth + RLS) |
| Admin API | Next.js Route Handlers (`/api/admin/*`) |
| Deploy frontend | Vercel |
| Workers de integração | TypeScript (fase futura) |
| Monorepo | pnpm workspaces + Turborepo |

## Estrutura do repositório

```text
apps/
  web/       # frontend + Route Handlers admin (Next.js)
  workers/   # workers de integração com as fontes (fase futura)
packages/
  canonical-model/  # tipos/enums do modelo de dados (compartilhado)
  config/           # configurações compartilhadas (ESLint)
supabase/    # migrations SQL, seed, documentação do banco
docs/        # documentação técnica + ADRs
```

## Começar a desenvolver

```bash
corepack enable
pnpm install
cp .env.example .env
# Preencha NEXT_PUBLIC_SUPABASE_* e SUPABASE_SERVICE_ROLE_KEY (Dashboard Supabase → API)
# Execute supabase/migrations/001_initial_schema.sql no SQL Editor do Supabase
pnpm db:seed
pnpm dev
```

- Frontend: <http://localhost:3000>
- Supabase: <https://vkzefmedwxvpqcivparz.supabase.co>

Veja o [guia de contribuição](CONTRIBUTING.md) e [`supabase/README.md`](supabase/README.md).

## Documentação

| Documento | Assunto |
|-----------|---------|
| [supabase/README](supabase/README.md) | Setup Supabase, seed, RLS |
| [docs/GUIA-DO-PROJETO](docs/GUIA-DO-PROJETO.md) | Guia vivo para quem altera código |
| [docs/VERCEL-DEPLOY](docs/VERCEL-DEPLOY.md) | Deploy na Vercel |
| [docs/10](docs/10-modelo-tenant-usuarios-credores.md) | Modelo tenant, credores e usuários |
| [docs/README](docs/README.md) | Índice técnico completo |

## Status

**Fase 0 — Fundação.** Stack Supabase + Next.js operacional. Próximo: Fase 1 (MVP carteira).

## Licença

Software proprietário — MK Solutions / Grupo ABE. Todos os direitos reservados.
