# Guia de Contribuição

Bem-vindo(a)! Este guia ajuda novos desenvolvedores a trabalharem de forma organizada no projeto.

## Pré-requisitos

- **Node.js** (versão em `.nvmrc`) — ≥ 20.
- **pnpm** via Corepack: `corepack enable`.
- **Git**.
- Acesso às chaves do projeto **Supabase** (pedir ao líder).

## Primeiros passos

```bash
git clone https://github.com/MKLEITE/Painel-Gerencial-GrupoABE.git
cd Painel-Gerencial-GrupoABE
corepack enable
pnpm install
cp .env.example .env
```

Preencher `.env` com as chaves Supabase (Dashboard → Settings → API).

Aplicar schema (uma vez) no SQL Editor do Supabase: `supabase/migrations/001_initial_schema.sql`.

```bash
pnpm db:seed
pnpm dev
```

Frontend: http://localhost:3000

## Estrutura do monorepo

```text
apps/
  web/        # Next.js 15 — frontend + Route Handlers (PRINCIPAL)
  workers/    # workers de integração (futuro)
packages/
  canonical-model/  # tipos/enums compartilhados
  config/           # ESLint compartilhado
supabase/
  migrations/       # schema SQL versionado
  seed.mjs          # seed de desenvolvimento (`pnpm db:seed`)
docs/               # documentação técnica (LEIA ISTO PRIMEIRO)
```

## Fluxo de trabalho

1. Crie uma branch a partir de `main`: `feat/minha-mudanca`.
2. Commits no padrão **Conventional Commits** (`feat:`, `fix:`, `docs:`...).
   - Hooks (husky) validam lint e mensagem de commit.
3. Abra Pull Request para `main` e preencha o template.
4. CI precisa passar (lint, typecheck, testes, build).
5. Pelo menos 1 aprovação no review.

## Regras de ouro

- **Nunca** commitar segredos (`.env`, `SUPABASE_SERVICE_ROLE_KEY`). Use `.env.example`.
- **Nunca** expor service role key no browser ou em variáveis `NEXT_PUBLIC_*`.
- **Toda** consulta respeita isolamento de tenant (RLS — ver `docs/06`).
- **Toda** entrada de API é validada nas Route Handlers.
- Decisões arquiteturais → **ADR** em `docs/adr/`.

## Scripts úteis

| Comando | O que faz |
|---------|-----------|
| `pnpm dev` | Sobe `@abe/web` em desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm lint` | Lint em todo o monorepo |
| `pnpm typecheck` | Checagem de tipos |
| `pnpm test` | Testes |
| `pnpm db:seed` | Seed no Supabase |
| `pnpm format` | Prettier |

## Documentação

- [Guia do Projeto](docs/GUIA-DO-PROJETO.md) — leia primeiro.
- [Onboarding](docs/ONBOARDING-EQUIPE.md) — setup em equipe.
- [Supabase](../supabase/README.md) — banco e auth.
