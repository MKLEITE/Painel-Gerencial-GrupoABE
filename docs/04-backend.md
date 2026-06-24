# 04 — Backend e APIs

## 4.1 Stack

| Item | Escolha | Por quê |
|------|---------|---------|
| Runtime | **Next.js 15** (Route Handlers) | Same-origin com o frontend; deploy serverless na Vercel |
| Banco + Auth | **Supabase** | PostgreSQL gerenciado, Auth integrado, RLS nativo |
| Cliente Supabase | **@supabase/ssr** | Sessão SSR, cookies seguros |
| Validação | **Zod** | Validar entrada nas Route Handlers |
| Tipos compartilhados | **@abe/canonical-model** | Contratos entre front e back |
| Testes | **Vitest/Jest** | Unit + integração (a expandir) |

> Decisão registrada em [ADR-0001](adr/0001-stack-tecnologico.md). Backend em Route Handlers + Supabase.

## 4.2 Organização

```text
apps/web/
  app/api/admin/              # Route Handlers (operações SUPER_ADMIN)
    credores/
      route.ts                # GET, POST
      [id]/
        route.ts              # GET
        responsavel/route.ts  # PATCH
    usuarios/
      route.ts                # GET, POST
      [id]/route.ts           # PATCH
  lib/
    auth.ts                   # login, logout, perfil (Supabase Auth)
    supabase/
      client.ts               # browser
      server.ts               # server components / handlers
      admin.ts                # service role (servidor)
      middleware.ts           # refresh de sessão
    server/
      admin-auth.ts           # requireSuperAdmin, adminDb
      admin-credores.ts       # regras de negócio credores
      admin-usuarios.ts       # regras de negócio usuários
    api-client.ts             # fetch para /api (browser)

supabase/
  migrations/                 # schema SQL versionado

scripts/
  supabase-seed.mjs           # seed de desenvolvimento

packages/
  canonical-model/            # tipos/enums compartilhados
```

## 4.3 Padrão de camadas

```text
Route Handler  → valida sessão (SUPER_ADMIN), parseia body, retorna JSON
lib/server/*  → regra de negócio, orquestra Supabase (service role)
Supabase       → PostgreSQL + RLS + Auth
```

Regras invioláveis:

- **Toda query respeita tenant** — RLS no banco + filtros explícitos no código.
- **Toda entrada é validada** na borda (Zod ou checks manuais).
- **Service role somente no servidor** — nunca expor `SUPABASE_SERVICE_ROLE_KEY` ao browser.
- **CPF/CNPJ nunca sai em texto puro** sem mascaramento conforme o papel.

## 4.4 Contrato de API

Convenções:

- Prefixo `/api/admin/` para operações de plataforma.
- JSON; datas em ISO-8601.
- Erros: `{ title, status }` em português.
- Autenticação via sessão Supabase (cookies) — não Bearer token manual no browser.

### Endpoints implementados (admin)

| Método | Rota | Descrição | Papel mínimo |
|--------|------|-----------|--------------|
| GET | `/api/admin/credores` | Lista credores | `SUPER_ADMIN` |
| POST | `/api/admin/credores` | Cria credor + tenant + responsável | `SUPER_ADMIN` |
| GET | `/api/admin/credores/:id` | Detalhe do credor | `SUPER_ADMIN` |
| PATCH | `/api/admin/credores/:id/responsavel` | Atualiza responsável | `SUPER_ADMIN` |
| GET | `/api/admin/usuarios` | Lista usuários da plataforma | `SUPER_ADMIN` |
| POST | `/api/admin/usuarios` | Cria usuário | `SUPER_ADMIN` |
| PATCH | `/api/admin/usuarios/:id` | Atualiza usuário | `SUPER_ADMIN` |

### Endpoints planejados (Fase 1+)

| Método | Rota | Descrição | Papel mínimo |
|--------|------|-----------|--------------|
| GET | `/api/carteira/kpis` | KPIs do dashboard | `VIEWER` |
| GET | `/api/carteira/titulos` | Listagem consolidada | `VIEWER` |
| GET | `/api/devedores/busca` | Busca unificada | `OPERADOR` |
| POST | `/api/admin/acoes/transferir` | Transferir Avantpay→ABEWeb (idempotente) | `ADMIN_CREDOR` |

> Endpoints de leitura para credores podem usar cliente Supabase **anon** com RLS diretamente no frontend ou Route Handlers conforme complexidade.

## 4.5 Autenticação e autorização

### Login (browser)

1. `lib/auth.ts` → `supabase.auth.signInWithPassword`.
2. Busca perfil em `public.usuarios`.
3. Valida `ativo === true`.
4. Redireciona conforme `papel` (`adminHomePath`).

### Route Handlers admin

1. `requireSuperAdmin()` lê sessão via `createServerClient` (`@supabase/ssr`).
2. Verifica `papel === 'SUPER_ADMIN'` em `public.usuarios`.
3. Operações de escrita usam `adminDb()` (cliente service role).

### Autorização por tenant (credores)

- Queries com cliente **anon** + JWT do usuário → RLS filtra por `tenant_id`.
- O backend **nunca** aceita `tenant_id` do corpo do request para escopo — vem do perfil/sessão.

## 4.6 Tratamento de erros

- Route Handlers retornam `NextResponse.json({ title, status }, { status })`.
- Nunca vazar stack trace, SQL ou detalhe interno ao cliente.
- Logs estruturados no servidor (`console.error` com prefixo `[admin/...]`).

## 4.7 Comunicação com fontes (futuro — workers)

- Workers em `apps/workers/` (ou Vercel Cron / Edge Functions).
- Segredos das fontes em variáveis de ambiente — nunca no repositório.
- Webhooks de entrada validam assinatura HMAC e deduplicam por `event_id`.

## 4.8 Padrões de código

- Lint + format obrigatórios (ESLint + Prettier) no pre-commit e na CI.
- Conventional Commits.
- Code review obrigatório (mínimo 1 aprovação) antes do merge.
