# 02 — Arquitetura Geral

## 2.1 Estilo arquitetural

Adotamos uma arquitetura **modular em camadas, orientada a integração**, hospedada na AWS:

- **Não é** um monolito acoplado ao legado.
- **Não é** (ainda) microserviços completos — começamos com um **monólito modular** (modular monolith)
  para o backend, com **workers de integração separados**. Isso dá velocidade no início e permite
  extrair microserviços depois, se necessário.
- A comunicação com as fontes é **assíncrona e desacoplada** (filas/eventos), para que falhas em uma
  fonte não derrubem o portal.

> Decisão registrada em [ADR-0002](adr/0002-monolito-modular-vs-microservicos.md).

## 2.2 Visão de contêineres (C4 — nível 2)

```text
                                  Internet (Credores / Admin MK)
                                            │  HTTPS
                                            ▼
                          ┌─────────────────────────────────┐
                          │   CloudFront (CDN) + AWS WAF     │  ◄── proteção L7, rate-limit, TLS
                          └─────────────────────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────┐
                          │  Frontend (Next.js)  — estático  │
                          │  servido via CloudFront/S3       │
                          └─────────────────────────────────┘
                                            │ chamadas API (HTTPS, JWT)
                                            ▼
                          ┌─────────────────────────────────┐
                          │   ALB (Load Balancer)            │
                          └─────────────────────────────────┘
                                            │
                                            ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │  API / Backend (NestJS) — ECS Fargate (privado)                    │
        │  ┌──────────┬───────────┬───────────┬───────────┬──────────────┐   │
        │  │  Auth    │ Carteira  │ Devedores │ Financeiro│  Admin/Ações │   │
        │  └──────────┴───────────┴───────────┴───────────┴──────────────┘   │
        └──────────────────────────────────────────────────────────────────┘
            │ leitura/escrita                         ▲ eventos/comandos
            ▼                                         │
   ┌──────────────────┐                  ┌────────────────────────────┐
   │ PostgreSQL (RDS) │                  │  Filas: SQS + EventBridge   │
   │ Multi-AZ, RLS    │ ◄────────────────│  (jobs e ações assíncronas) │
   │ réplica leitura  │   sincronização  └────────────────────────────┘
   └──────────────────┘                                ▲
            ▲                                           │
            │ carga (ETL)                               │ comandos (transferir/pausar)
   ┌──────────────────────────────────────────────────────────────────┐
   │  Workers de Integração (ECS Fargate / agendados)                   │
   │  ┌───────────┬───────────┬───────────┬─────────────────────────┐  │
   │  │ Avantpay  │ ABEWeb    │ Acordo Seg│  Agente SQL 2005 (on-prem)│ │
   │  │ (API/file)│ (API)     │ (webhook) │  push → réplica           │ │
   │  └───────────┴───────────┴───────────┴─────────────────────────┘  │
   └──────────────────────────────────────────────────────────────────┘
            │ pull/push seguro
            ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  Sistemas de origem: Avantpay · ABEWeb · Acordo Seguro · SQL 2005  │
   └──────────────────────────────────────────────────────────────────┘
```

## 2.3 Componentes e responsabilidades

| Componente | Responsabilidade | Tecnologia (recomendada) |
|------------|------------------|--------------------------|
| **CDN + WAF** | TLS, cache estático, mitigação de DDoS/OWASP, rate limit | CloudFront + AWS WAF + Shield |
| **Frontend** | UI do portal (dashboard, busca, financeiro, admin) | Next.js + TypeScript |
| **API Gateway interno (ALB)** | Roteamento, health check, TLS interno | AWS ALB |
| **Backend (API)** | Regras de negócio, autenticação/autorização, contratos | NestJS (Node + TS) |
| **Banco do portal** | Réplica de leitura consolidada, multi-tenant (RLS) | PostgreSQL (RDS Multi-AZ) |
| **Filas/eventos** | Desacoplar ações e sincronizações; retentativas; DLQ | SQS + EventBridge |
| **Workers de integração** | Conectar nas fontes, normalizar para o modelo canônico | NestJS workers / Lambda |
| **Agente on-premise** | Extrair do SQL 2005 sem expor o legado à internet | serviço .NET/Node no ambiente ABE |
| **Identidade** | Login, MFA, tokens, federação | Amazon Cognito *ou* Keycloak (ver ADR-0003) |
| **Segredos** | Senhas, chaves, tokens das integrações | AWS Secrets Manager |
| **Observabilidade** | Logs, métricas, tracing, alertas | CloudWatch + OpenTelemetry |

## 2.4 Fluxos principais

### A) Sincronização (entrada de dados)
1. Cada fonte tem seu mecanismo: **webhook** (Acordo Seguro), **polling de API** (Avantpay/ABEWeb),
   **push do agente on-premise** (SQL 2005).
2. O worker recebe/coleta o dado bruto, **normaliza para o modelo canônico** (ver doc 03).
3. Faz **upsert** idempotente na réplica PostgreSQL, registrando origem e carimbo de sincronização.
4. Atualiza **views materializadas** que alimentam os KPIs.

### B) Consulta (saída para o credor)
1. Credor autentica (login + MFA quando aplicável) → recebe **JWT com tenant + papel**.
2. Frontend chama a API; o backend **força o filtro de tenant** (app) e o banco **reforça via RLS**.
3. Backend lê da réplica (nunca do legado) e devolve dados já consolidados e mascarados conforme o papel.

### C) Ação administrativa (transferir / pausar) — crítica
1. Admin do credor seleciona títulos e clica em **Transferir** (Avantpay → ABEWeb).
2. Backend valida permissão + cria um **comando idempotente** (com `idempotency-key`) na fila.
3. Worker executa: chama API do ABEWeb (criar/atualizar) **e** comanda o Avantpay a **pausar**.
4. Resultado e cada etapa são gravados em **trilha de auditoria**; falhas vão para **DLQ** e alertam.
5. A réplica é atualizada e a UI reflete o novo estado.

> A idempotência aqui é inegociável: **nunca** cobrar em dobro nem perder a baixa. Ver doc 08.

## 2.5 Decisões macro (resumo)

| Decisão | Escolha | ADR |
|---------|---------|-----|
| Estilo do backend | Monólito modular + workers | [0002](adr/0002-monolito-modular-vs-microservicos.md) |
| Linguagem backend | TypeScript / NestJS (alternativa: Java/Spring) | [0001](adr/0001-stack-tecnologico.md) |
| Frontend | Next.js + TypeScript | [0001](adr/0001-stack-tecnologico.md) |
| Banco | PostgreSQL (RDS) com RLS | [0004](adr/0004-multi-tenant-isolamento.md) |
| Acesso ao legado | Agente on-premise (sem acesso direto) | [0005](adr/0005-acesso-legado-sql2005.md) |
| Identidade | Cognito ou Keycloak | [0003](adr/0003-identidade-autenticacao.md) |

## 2.6 Diagramas como código

Os diagramas devem ser mantidos versionados (Mermaid neste repositório ou C4/PlantUML). Evite imagens
soltas; prefira texto para revisão por diff. Exemplo de KPI de fonte → canônico está no doc 03.
