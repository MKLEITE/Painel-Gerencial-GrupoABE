# @abe/api — Backend (NestJS)

API do Painel Gerencial Grupo ABE. Ver desenho completo em [`docs/04-backend.md`](../../docs/04-backend.md).

## Rodar localmente

```bash
cp .env.example .env   # ajuste os valores
pnpm --filter @abe/api dev
```

A API sobe em `http://localhost:3333/api`. Health: `GET http://localhost:3333/api/health`.

## Estrutura

```text
src/
  main.ts                 # bootstrap (helmet, CORS, validação, versionamento)
  app.module.ts           # módulo raiz
  config/                 # validação de env (zod)
  common/
    filters/              # erros padronizados (problem+json)
    guards/               # isolamento de tenant, RBAC
    interceptors/         # auditoria, logging
  modules/
    health/               # health check
    # auth, carteira, devedores, financeiro, admin-acoes, auditoria (Fase 1)
```

## Boas práticas já aplicadas

- Validação estrita de toda entrada (`whitelist` + `forbidNonWhitelisted`).
- `tenantId` sempre do token (nunca do cliente) — ver `common/guards/tenant.guard.ts`.
- Erros sem vazamento de detalhes internos, com `traceId`.
- Helmet + CORS restrito ao domínio do frontend.
