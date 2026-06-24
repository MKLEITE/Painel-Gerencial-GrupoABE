# 09 — Roadmap e Entregáveis da Fase 0

## 9.1 Visão de faseamento

| Fase | Nome | Objetivo | Resultado |
|------|------|----------|-----------|
| **0** | **Fundação** | Planejar, documentar e preparar a base | Esta documentação + esqueleto técnico |
| **1** | **MVP** | 1 integração real + dashboard + busca + auth | Portal usável por 1 credor piloto |
| **2** | **Integrações completas** | Conectar as 4 fontes + ações admin | Visão 360º completa |
| **3** | **Multiempresa & produto** | Onboarding self-service, planos, billing | Vendável em escala |
| **4** | **Inteligência** | Relatórios avançados, BI, previsões | Diferenciação competitiva |

> Faseamento detalhado de 1–4 será refinado ao fim da Fase 0. O foco agora é entregar a Fase 0 bem feita.

## 9.2 O que é a Fase 0 (escopo desta fase)

A Fase 0 **não escreve o produto**. Ela cria a **fundação** sobre a qual o produto será construído com
segurança e qualidade. Entregáveis:

### A) Documentação (este diretório `docs/`) — ✅ em andamento
- Visão/escopo, arquitetura, dados, backend, frontend, segurança/LGPD, infra, resiliência, roadmap.

### B) Decisões registradas (ADRs) — `docs/adr/`
- Stack, estilo arquitetural, identidade, multi-tenant, acesso ao legado.

### C) Esqueleto do repositório (sem lógica de negócio ainda)
- Monorepo (`apps/api`, `apps/web`, `apps/workers`, `packages/*`, `infra/`).
- Configuração de lint, format, commit hooks, Conventional Commits.
- Pipeline de CI base (lint, testes, scan de segredos, build).
- `.gitignore`, `.editorconfig`, `README` de cada app.

### D) Modelo de dados canônico (rascunho versionado)
- Esquema lógico das entidades (doc 03) + primeira migração base (tenants/usuários/RLS).
- Tabela de-para de status (configuração).

### E) Baseline de segurança
- **Threat model** por fluxo (login, busca, ação admin, sincronização).
- Política de mascaramento de CPF/CNPJ definida.
- Definição do provedor de identidade (ADR-0003) e desenho de RBAC + RLS.

### F) Esqueleto de infraestrutura (IaC)
- Estrutura Terraform (`infra/modules`, `infra/envs`) **sem provisionar recursos pagos** ainda
  (ou só uma VPC/dev mínima), pronta para a Fase 1.

### G) Padrões e governança
- Definition of Done, padrão de PR, política de branches, padrão de testes.
- Plano de resposta a incidentes (rascunho) e processo LGPD (RoPA, DPO).

## 9.3 Checklist de conclusão da Fase 0

- [x] Documentação técnica completa em `docs/`.
- [ ] ADRs revisados e aprovados.
- [ ] Decisões pendentes (seção 9.5) confirmadas com o time/negócio.
- [ ] Acesso e documentação das APIs das fontes confirmados (Avantpay, ABEWeb, Acordo Seguro).
- [ ] Forma de acesso seguro ao SQL Server 2005 validada com a equipe ABE.
- [ ] Esqueleto do monorepo criado e no GitHub.
- [ ] CI base rodando verde.
- [ ] Esqueleto de IaC versionado.
- [ ] Modelo canônico inicial + primeira migração com RLS.
- [ ] Threat model documentado.
- [ ] Provedor de identidade escolhido.
- [ ] Plano da Fase 1 (MVP) detalhado e estimado.

## 9.4 Proposta de MVP (Fase 1) — para alinhar expectativas

Menor fatia que entrega valor e prova a arquitetura:
1. **Auth** (OIDC + RBAC + tenant) com 1 tenant piloto.
2. **Uma integração real** (sugestão: **Acordo Seguro via webhook** ou **Avantpay via API**, a que
   tiver acesso/documentação primeiro).
3. **Sincronização → réplica PostgreSQL** (modelo canônico) com idempotência.
4. **Dashboard** com KPIs reais daquela fonte + **listagem consolidada**.
5. **Busca por CPF/CNPJ** (mascarada) na fonte integrada.
6. **Observabilidade e auditoria** mínimas + deploy em staging.

Isso valida ponta a ponta (segurança, dados, UI) com risco controlado, antes de plugar as 4 fontes.

## 9.5 Decisões a confirmar (antes/início da Fase 1)

Estas decisões têm um **default recomendado**, mas precisam do seu aval por impactarem custo/equipe:

| # | Decisão | Recomendação (default) | Alternativa |
|---|---------|------------------------|-------------|
| 1 | Linguagem do backend | **TypeScript/NestJS** | Java/Spring Boot |
| 2 | Provedor de identidade | **Amazon Cognito** (gerenciado) | Keycloak (auto-hospedado, mais controle) |
| 3 | Primeira fonte a integrar (MVP) | a de **acesso/documentação mais fácil** | definir com a equipe ABE |
| 4 | Conta(s) AWS | contas separadas por ambiente | conta única com isolamento por tags |
| 5 | Equipe e prazo | a definir | a definir |

## 9.6 Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| APIs das fontes sem documentação/instáveis | Atraso na integração | Validar acesso na Fase 0; começar pela mais madura |
| SQL Server 2005 (EOL) | Performance/segurança do legado | Agente on-premise, leitura incremental fora de pico, nunca em tempo real |
| Vazamento entre tenants | Crítico (LGPD/reputação) | RLS + RBAC + testes de isolamento + auditoria |
| Cobrança duplicada na transferência | Financeiro/confiança | Idempotência + reconciliação + auditoria |
| Escopo crescer demais (scope creep) | Atraso | Faseamento rígido; MVP enxuto |
| Custo de nuvem | Financeiro | Começar enxuto, autoscaling, tags de custo |

## 9.7 Próximos passos imediatos

1. Revisar e aprovar esta documentação e os ADRs.
2. Confirmar as decisões da seção 9.5.
3. Levantar acesso/documentação das APIs das fontes.
4. Criar o esqueleto do monorepo + CI e subir ao GitHub.
5. Detalhar e estimar a Fase 1 (MVP).
