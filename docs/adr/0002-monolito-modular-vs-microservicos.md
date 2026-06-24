# ADR-0002 — Monólito modular vs. microserviços

Status: Aceito (atualizado)
Data: 2026-06-18 · revisão Supabase: 2026-06-23

## Contexto

Precisamos decidir o estilo de decomposição do backend. O time é enxuto no início e o produto ainda
está validando mercado, mas há integrações que têm ciclos de falha independentes (4 fontes externas).

## Decisão

Adotar **Next.js Route Handlers** para regras administrativas e **workers de integração separados**
(fase futura, `apps/workers`), comunicando-se por filas ou jobs agendados (Supabase Edge Functions,
cron Vercel ou fila gerenciada — a definir na Fase 1).

A API principal de negócio do portal **não** é um monólito NestJS separado: vive no próprio app web +
Supabase (Postgres + RLS + Auth).

## Consequências

**Positivas**

- Velocidade de desenvolvimento; deploy único na Vercel para o portal.
- Workers separados dão **isolamento de falha** das integrações (bulkhead).
- Supabase concentra dados + auth sem operar servidor de API dedicado.

**Negativas**

- Route Handlers com service role exigem disciplina de autorização (validar SUPER_ADMIN antes de cada mutação).
- Workers ainda precisam ser implementados na Fase 1.

## Alternativas consideradas

- **Microserviços desde o início:** prematuro para a fase atual.
- **Backend NestJS dedicado:** rejeitado em favor de Supabase + Route Handlers (ADR-0001).
