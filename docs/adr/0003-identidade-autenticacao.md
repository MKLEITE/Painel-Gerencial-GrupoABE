# ADR-0003 — Provedor de identidade e autenticação

Status: **Aceito**
Data: 2026-06-18 · Atualizado: 2026-06-24

## Contexto

O portal é acessado por usuários externos (credores), com múltiplos papéis. Precisamos de autenticação robusta, gestão de usuários por tenant e MFA, sem reinventar segurança de identidade nem armazenar senhas em tabelas próprias.

## Decisão

Usar **Supabase Auth** como provedor de identidade, integrado ao stack Supabase + Next.js:

- Credenciais em `auth.users` (gerenciadas pelo Supabase).
- Perfil de aplicação em `public.usuarios` (`id` = `auth.users.id`) — **sem coluna `senha_hash`**.
- Sessão SSR via `@supabase/ssr` (`apps/web/lib/supabase/`).
- Login/logout em `apps/web/lib/auth.ts`.
- Operações admin (criar usuário) usam **Supabase Auth Admin API** com service role nas Route Handlers.

Projeto: `https://vkzefmedwxvpqcivparz.supabase.co`

## Consequências

**Positivas**

- Auth integrado ao PostgreSQL e RLS.
- Sem implementação própria de hash de senha, refresh token ou OIDC.
- MFA disponível via Supabase Auth (habilitar para admins em produção).
- Cookies httpOnly gerenciados pelo middleware SSR.

**Negativas**

- Customização de telas de login limitada ao que o Supabase oferece (usamos UI própria com `signInWithPassword`).
- Dependência do Supabase Auth para disponibilidade de login.

## Alternativas consideradas

- **Auth0 / Clerk:** excelente DX, custo adicional e mais um provedor — rejeitado.
- **Autenticação própria (JWT + Argon2):** rejeitada — substituída por Supabase Auth.
- **Keycloak self-hosted:** mais controle, mais operação — rejeitado para equipe pequena.
