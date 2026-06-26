# Supabase — Painel Gerencial Grupo ABE

Backend principal do projeto: **PostgreSQL + Auth + RLS** no [Supabase](https://supabase.com).

Projeto: `https://vkzefmedwxvpqcivparz.supabase.co`

## Setup inicial

1. No [Dashboard Supabase](https://supabase.com/dashboard) → **SQL Editor**, execute o conteúdo de:
   - `supabase/migrations/001_initial_schema.sql`

2. Copie as chaves em **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (somente servidor — nunca no browser)

3. Preencha o `.env` na raiz (veja `.env.example`).

4. Rode o seed:
   ```bash
   pnpm db:seed
   ```

5. Dashboard com dados reais (ABE WEB):
   - Execute `supabase/migrations/002_dashboard_carteira.sql` no SQL Editor
   - Edite `scripts/sync-abeweb-dashboard.mjs` com sua query SQL
   - Rode `pnpm sync:abeweb --demo` (teste) ou `pnpm sync:abeweb` (banco real)

## Usuários de desenvolvimento (seed)

| E-mail | Senha | Papel | Destino |
|--------|-------|-------|---------|
| meykson@abe.com.br | (ver seed) | SUPER_ADMIN | `/admin` |
| admin@grupoabe.com.br | Admin@123 | ADMIN_CREDOR | `/dashboard` |

## Arquitetura

```text
Browser → Vercel (Next.js)
            ├── Supabase Auth (login/sessão)
            ├── Route Handlers /api/admin/* (service role, SUPER_ADMIN)
            └── Supabase Postgres + RLS (dados multi-tenant)
```

## RLS

- **SUPER_ADMIN**: acesso total via políticas `is_super_admin()`.
- **Credores**: leem apenas dados do próprio `tenant_id`.
- Operações administrativas (criar credor, usuários) passam pelas Route Handlers com **service role**, após validar sessão SUPER_ADMIN.

## Migrations

Adicione novos arquivos SQL em `supabase/migrations/` e aplique pelo SQL Editor ou CLI do Supabase.
