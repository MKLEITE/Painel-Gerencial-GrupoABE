# ADR-0001 — Stack tecnológico (linguagem/frameworks)

Status: **Aceito**
Data: 2026-06-18 · Atualizado: 2026-06-24

## Contexto

O portal é um SaaS multi-tenant com integrações, dashboard e ações financeiras críticas. Precisamos de uma stack que dê velocidade, segurança, tipagem forte e operação enxuta para uma equipe pequena.

## Decisão

- **Frontend + API serverless:** TypeScript com **Next.js 15** (App Router), deploy na **Vercel** (`apps/web`).
- **Backend de dados:** **Supabase** — PostgreSQL + Auth + RLS.
- **Operações admin:** Next.js **Route Handlers** em `apps/web/app/api/admin/*`, usando `SUPABASE_SERVICE_ROLE_KEY` no servidor.
- **Autenticação:** **Supabase Auth** via `@supabase/ssr` (`apps/web/lib/auth.ts`).
- **Schema:** SQL versionado em `supabase/migrations/`.
- **Seed:** `supabase/seed.mjs` (`pnpm db:seed`).
- **Monorepo:** pnpm workspaces + Turborepo para tipos compartilhados (`packages/canonical-model`).

## Consequências

**Positivas**

- Um idioma (TypeScript) entre front, Route Handlers e workers futuros.
- Infraestrutura gerenciada (Vercel + Supabase) — sem servidores, sem IaC próprio.
- Auth, RLS e PostgreSQL integrados no Supabase.
- Deploy automático por PR (preview Vercel).

**Negativas**

- Service role key exige disciplina — nunca expor ao browser.
- Lógica admin concentrada no Next.js — monitorar cold starts e limites serverless.
- Dependência de dois provedores (Vercel + Supabase).

## Alternativas consideradas

- **NestJS + PostgreSQL self-hosted:** mais controle, mais operação — rejeitado em favor de simplicidade.
- **Java + Spring Boot:** excelente para domínio financeiro; equipe e prazo favorecem TypeScript.
- **Firebase:** menos adequado para RLS multi-tenant complexo e SQL relacional.
