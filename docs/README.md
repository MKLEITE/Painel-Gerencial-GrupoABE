# Painel Gerencial Grupo ABE

> Documentação técnica da **Fase 0 (Fundação)**.
> Este conjunto de documentos é a base sobre a qual todo o restante do projeto será construído.

## ⭐ Comece aqui (desenvolvedores)

**[GUIA-DO-PROJETO.md](GUIA-DO-PROJETO.md)** — documento vivo com estrutura do código, como rodar, o que está pronto vs. mock, convenções e “onde mexer”. **Leia antes de alterar qualquer coisa.**

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend + Route Handlers | Next.js 15 (`apps/web`) — **Vercel** |
| Backend de dados | **Supabase** (PostgreSQL + Auth + RLS) |
| Schema | `supabase/migrations/` |
| Backend | Supabase + Route Handlers (`apps/web/app/api/admin`) |

## O que é este projeto

Um **portal SaaS** que consolida, em uma única interface, a régua de cobrança hoje espalhada por
quatro sistemas (Avantpay, ABE Interno/Delphi, ABEWeb e Acordo Seguro). Será **vendido e acessado
externamente** por clientes credores, o que exige um padrão elevado de **segurança**, **isolamento
de dados (multi-tenant)**, **conformidade com a LGPD** e **resiliência a falhas**.

## Como ler esta documentação

Leia na ordem. Cada documento assume que você leu o anterior.

| # | Documento | Para quê serve |
|---|-----------|----------------|
| 01 | [Visão, Escopo e Glossário](01-visao-e-escopo.md) | Entender o problema, objetivos, quem usa e a linguagem comum |
| 02 | [Arquitetura Geral](02-arquitetura-geral.md) | Visão macro: Vercel + Supabase, componentes e fluxos |
| 03 | [Arquitetura de Dados e Integração](03-arquitetura-de-dados.md) | Modelo canônico, RLS, ETL/sincronização das 4 fontes |
| 04 | [Backend e APIs](04-backend.md) | Route Handlers, Supabase, contratos de API |
| 05 | [Frontend](05-frontend.md) | Stack, estrutura, UX do dashboard |
| 06 | [Segurança e LGPD](06-seguranca-e-lgpd.md) | Supabase Auth, RLS, service role, LGPD, auditoria |
| 07 | [Infraestrutura e DevOps](07-infraestrutura-e-devops.md) | Supabase + Vercel, CI/CD, ambientes |
| 08 | [Resiliência e Observabilidade](08-resiliencia-e-observabilidade.md) | Tolerância a falhas, idempotência, logs/métricas |
| 09 | [Roadmap e Entregáveis da Fase 0](09-roadmap-e-fase-0.md) | Faseamento, MVP, checklist |

Complementos:

- [`adr/`](adr/) — **Architecture Decision Records**.
- **[Modelo Tenant · Credores · Usuários](10-modelo-tenant-usuarios-credores.md)** — regras de cadastro e isolamento.
- **[Onboarding da equipe](ONBOARDING-EQUIPE.md)** — GitHub, Vercel, Supabase, fluxo de trabalho.
- **[Deploy Vercel](VERCEL-DEPLOY.md)** — variáveis de ambiente e troubleshooting.
- [`../supabase/README.md`](../supabase/README.md) — setup do banco e Auth.

## Princípios que guiam o projeto

1. **Segurança por padrão.** Service role só no servidor; RLS no banco.
2. **Privacidade por padrão (LGPD).** Dados pessoais tratados desde o desenho.
3. **Isolamento de tenant.** Um credor nunca acessa dado de outro — RLS + RBAC.
4. **Nunca tocar o legado em tempo real.** SQL Server 2005 → agente → Supabase.
5. **Idempotência em ações críticas.** Transferir/baixar nunca duplica.
6. **Falha isolada, não falha total.** Fonte indisponível → UI degrada com transparência.
7. **Tudo versionado e documentado.** Código, migrations SQL e decisões (ADR).

## Status

| Item | Status |
|------|--------|
| Fase | **0 — Fundação** |
| Stack | **Supabase + Next.js 15 + Vercel** (decidido) |
| Próximo marco | Aprovar Fase 0 → iniciar Fase 1 (MVP de 1 integração + dashboard) |
