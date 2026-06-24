# 04 — Backend e APIs

## 4.1 Stack recomendada

| Item | Escolha | Por quê |
|------|---------|---------|
| Linguagem | **TypeScript** | Tipagem forte, mesmo idioma do frontend, menos contexto trocado |
| Framework | **NestJS** | Estrutura modular opinativa, DI, guards/interceptors (ótimo p/ segurança e auditoria) |
| ORM | **Prisma** | Migrações versionadas, type-safe, bom DX |
| Validação | **Zod** / `class-validator` | Validar toda entrada na borda |
| Filas | **AWS SQS** (+ `@nestjs` consumers) | Desacoplar ações/sincronizações com DLQ |
| Auth | **OIDC/OAuth2** (Cognito ou Keycloak) | Padrão de mercado, MFA, federação |
| Testes | **Jest** + **Supertest** | Unit + integração |
| Docs de API | **OpenAPI (Swagger)** | Contrato gerado e versionado |

> Alternativa válida: **Java + Spring Boot** se houver mais expertise Java na equipe. A decisão e o
> trade-off estão em [ADR-0001](adr/0001-stack-tecnologico.md). O restante do desenho não muda.

## 4.2 Organização (monólito modular)

```text
apps/
  api/                      # backend principal (NestJS)
    src/
      modules/
        auth/               # login, tokens, MFA, sessão
        tenants/            # tenants, empresas (CNPJ), onboarding
        users/              # usuários e papéis (RBAC)
        carteira/           # KPIs, régua, listagem consolidada
        devedores/          # busca unificada, linha do tempo
        financeiro/         # extrato consolidado, recebimentos
        admin-acoes/        # transferir/pausar (ações críticas, idempotentes)
        auditoria/          # trilha de auditoria (append-only)
      common/
        guards/             # auth, tenant, RBAC
        interceptors/       # logging, auditoria, mascaramento
        filters/            # tratamento global de erros
        pipes/              # validação
  workers/                  # workers de integração (consumidores de fila / agendados)
    avantpay/
    abeweb/
    acordo-seguro/
    legado-sql2005/         # recebe push do agente on-premise
packages/
  canonical-model/          # tipos/contratos do modelo canônico (compartilhado)
  config/                   # configs compartilhadas
infra/                      # IaC (Terraform) — ver doc 07
```

> Monorepo (ex.: **pnpm workspaces** + **Turborepo**) para compartilhar tipos entre API, workers e
> frontend. Estrutura final confirmada no doc 09.

## 4.3 Padrão de camadas dentro de cada módulo

```text
Controller  → valida entrada, aplica guards (auth/tenant/RBAC), nunca tem regra de negócio
Service     → regra de negócio, orquestra
Repository  → acesso a dados (Prisma), sempre filtrando por tenant
DTO/Schema  → contratos de entrada/saída validados (Zod/class-validator)
```

Regras invioláveis:
- **Toda query carrega `tenant_id`** (reforçado por RLS no banco — doc 06).
- **Toda entrada é validada** na borda (nada confia no cliente).
- **Toda ação sensível gera audit log** (via interceptor).
- **CPF/CNPJ nunca sai em texto puro** sem passar pelo mascaramento conforme o papel.

## 4.4 Contrato de API (REST + OpenAPI)

Convenções:
- Versionado: prefixo `/api/v1`.
- JSON; datas em ISO-8601; valores monetários em centavos (inteiro) para evitar erro de ponto flutuante.
- Erros padronizados (RFC 7807 / problem+json): `{ type, title, status, detail, traceId }`.
- Paginação por cursor em listagens grandes.
- `Idempotency-Key` obrigatório em ações administrativas.

### Endpoints (rascunho do MVP)

| Método | Rota | Descrição | Papel mínimo |
|--------|------|-----------|--------------|
| `POST` | `/api/v1/auth/login` | Login (inicia fluxo OIDC) | público |
| `POST` | `/api/v1/auth/refresh` | Renovar token | autenticado |
| `GET`  | `/api/v1/carteira/kpis?empresaId=` | KPIs do dashboard | viewer |
| `GET`  | `/api/v1/carteira/regua?empresaId=` | Distribuição por fase (funil) | viewer |
| `GET`  | `/api/v1/carteira/titulos` | Listagem consolidada (filtros/paginação) | viewer |
| `GET`  | `/api/v1/devedores/busca?doc=` | Busca unificada por CPF/CNPJ/nome | operador |
| `GET`  | `/api/v1/devedores/:id/timeline` | Linha do tempo do devedor | operador |
| `GET`  | `/api/v1/financeiro/extrato` | Extrato consolidado | operador |
| `POST` | `/api/v1/admin/acoes/transferir` | Transferir Avantpay→ABEWeb (idempotente) | admin |
| `POST` | `/api/v1/admin/acoes/pausar` | Pausar cobrança automática | admin |
| `GET`  | `/api/v1/admin/usuarios` | Gestão de usuários do tenant | admin |
| `GET`  | `/api/v1/health` | Health check | interno |

### Exemplo — ação crítica (idempotente)

```http
POST /api/v1/admin/acoes/transferir
Authorization: Bearer <jwt>
Idempotency-Key: 7c1f...-única-por-tentativa
Content-Type: application/json

{
  "titulos": ["uuid-1", "uuid-2"],
  "motivo": "Atraso superior a 11 dias"
}
```

Resposta `202 Accepted` (processamento assíncrono):

```json
{
  "comandoId": "uuid-comando",
  "status": "EM_PROCESSAMENTO",
  "traceId": "abc123"
}
```

O resultado final é consultável e auditado; reenvio com a **mesma** `Idempotency-Key` não reexecuta.

## 4.5 Autenticação e autorização (resumo; detalhe no doc 06)

- **Autenticação:** OIDC; access token (curto, ~15min) + refresh token (rotacionado). MFA obrigatório
  para papéis `admin` e `super_admin`.
- **Autorização:** guard de **tenant** (extrai `tenant_id` do token e injeta no contexto) + guard de
  **RBAC** (papel × permissão). Negar por padrão.
- O backend **nunca** aceita `tenant_id` vindo do corpo/cliente para escopo — só do token.

## 4.6 Tratamento de erros e validação

- Filtro global converte exceções em `problem+json` com `traceId` (correlaciona com logs/tracing).
- Nunca vazar stack trace, SQL ou detalhe interno para o cliente.
- Validação de entrada estrita (allow-list), rejeitando campos desconhecidos.

## 4.7 Comunicação com as fontes (workers)

- Cada worker encapsula um **cliente** da fonte (com timeout, retry com backoff, circuit breaker).
- Segredos das fontes ficam no **Secrets Manager** (nunca no código/repо).
- Toda chamada externa é registrada (latência, status) para observabilidade.
- Webhooks de entrada (Acordo Seguro) validam **assinatura HMAC** e deduplicam por `event_id`.

## 4.8 Padrões de código

- Lint + format obrigatórios (ESLint + Prettier) no pre-commit e na CI.
- Conventional Commits (`feat:`, `fix:`, `docs:`...) — facilita changelog e versionamento.
- Cobertura mínima de testes definida na CI (ex.: 70% nas regras de negócio críticas).
- Code review obrigatório (mínimo 1 aprovação) antes do merge.
