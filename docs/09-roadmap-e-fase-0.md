# 09 — Roadmap e Entregáveis da Fase 0

## 9.1 Visão de faseamento

| Fase | Nome | Objetivo | Resultado |
|------|------|----------|-----------|
| **0** | **Fundação** | Planejar, documentar e preparar a base | Documentação + esqueleto técnico |
| **1** | **MVP** | 1 integração real + dashboard + busca + auth | Portal usável por 1 credor piloto |
| **2** | **Integrações completas** | Conectar as 4 fontes + ações admin | Visão 360º completa |
| **3** | **Multiempresa & produto** | Onboarding self-service, planos, billing | Vendável em escala |
| **4** | **Inteligência** | Relatórios avançados, BI, previsões | Diferenciação competitiva |

## 9.2 O que é a Fase 0 (escopo desta fase)

A Fase 0 **não escreve o produto completo**. Ela cria a **fundação** sobre a qual o produto será construído.

### A) Documentação (`docs/`) — ✅ em andamento

Visão, arquitetura, dados, backend, frontend, segurança/LGPD, infra, resiliência, roadmap.

### B) Decisões registradas (ADRs) — `docs/adr/`

Stack Supabase + Next.js, estilo arquitetural, identidade, multi-tenant, acesso ao legado.

### C) Esqueleto do repositório

- Monorepo (`apps/web`, `apps/workers`, `packages/*`, `supabase/`).
- Seed em `supabase/seed.mjs`.
- Lint, format, commit hooks, Conventional Commits.
- CI base (GitHub Actions).

### D) Modelo de dados inicial

- Schema em `supabase/migrations/001_initial_schema.sql` (tenants, usuarios, credores, RLS).

### E) Baseline de segurança

- Supabase Auth + RLS.
- Service role restrita a Route Handlers admin.
- Política de mascaramento de CPF/CNPJ definida.

### F) Infraestrutura

- **Supabase** (PostgreSQL + Auth) — projeto provisionado.
- **Vercel** — deploy do `apps/web` documentado.
- Sem IaC próprio — configuração via Dashboards.

### G) Padrões e governança

- Definition of Done, padrão de PR, política de branches.

## 9.3 Checklist de conclusão da Fase 0

- [x] Documentação técnica completa em `docs/`.
- [x] Stack Supabase + Next.js + Vercel definida (ADR-0001, ADR-0003).
- [x] Schema inicial + RLS no Supabase.
- [x] Auth funcional (Supabase Auth + admin Route Handlers).
- [ ] ADRs revisados e aprovados.
- [ ] Acesso e documentação das APIs das fontes confirmados.
- [ ] Forma de acesso seguro ao SQL Server 2005 validada com a equipe ABE.
- [ ] CI base rodando verde.
- [ ] Deploy Vercel em produção/preview testado.
- [ ] Threat model documentado.
- [ ] Plano da Fase 1 (MVP) detalhado e estimado.

## 9.4 Proposta de MVP (Fase 1)

Menor fatia que entrega valor:

1. **Auth** (Supabase Auth + RBAC + tenant) com 1 tenant piloto.
2. **Uma integração real** (Acordo Seguro via webhook ou Avantpay via API).
3. **Sincronização → Supabase PostgreSQL** com idempotência.
4. **Dashboard** com KPIs reais + listagem consolidada.
5. **Busca por CPF/CNPJ** (mascarada).
6. **Observabilidade e auditoria** mínimas + deploy Vercel.

## 9.5 Decisões confirmadas / pendentes

| # | Decisão | Status | Escolha |
|---|---------|--------|---------|
| 1 | Frontend + API serverless | ✅ Decidido | Next.js 15 na Vercel |
| 2 | Backend de dados | ✅ Decidido | Supabase (PostgreSQL + Auth + RLS) |
| 3 | Provedor de identidade | ✅ Decidido | Supabase Auth (ADR-0003) |
| 4 | Primeira fonte a integrar (MVP) | ⏳ Pendente | a de acesso/documentação mais fácil |
| 5 | Workers de integração (hosting) | ⏳ Pendente | Vercel Cron / processo dedicado / Edge Functions |
| 6 | Equipe e prazo | ⏳ Pendente | a definir |

## 9.6 Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| APIs das fontes sem documentação | Atraso na integração | Validar acesso na Fase 0; começar pela mais madura |
| SQL Server 2005 (EOL) | Performance/segurança do legado | Agente on-premise → Supabase; nunca em tempo real |
| Vazamento entre tenants | Crítico (LGPD) | RLS + RBAC + testes de isolamento |
| Cobrança duplicada na transferência | Financeiro/confiança | Idempotência + reconciliação |
| Exposição da service role key | Crítico | Somente servidor; nunca `NEXT_PUBLIC_*` |
| Escopo crescer demais | Atraso | Faseamento rígido; MVP enxuto |

## 9.7 Próximos passos imediatos

1. Revisar e aprovar documentação e ADRs atualizados.
2. Confirmar primeira fonte para MVP (seção 9.5).
3. Levantar acesso/documentação das APIs das fontes.
4. Deploy Vercel em produção com variáveis Supabase.
5. Detalhar e estimar a Fase 1 (MVP).
