# 02 — Arquitetura Geral

## 2.1 Estilo arquitetural

Adotamos uma arquitetura **modular em camadas, orientada a integração**, hospedada em **Vercel + Supabase**:

- **Não é** um monolito acoplado ao legado.
- **Não é** microserviços completos — o backend de aplicação vive no **Next.js** (Route Handlers + Supabase), com **workers de integração separados** (futuro).
- A comunicação com as fontes será **assíncrona e desacoplada**, para que falhas em uma fonte não derrubem o portal.

> Decisão registrada em [ADR-0002](adr/0002-monolito-modular-vs-microservicos.md).

## 2.2 Visão de contêineres (C4 — nível 2)

```text
                                  Internet (Credores / Admin MK)
                                            │  HTTPS
                                            ▼
                          ┌─────────────────────────────────┐
                          │   Vercel — CDN + TLS + WAF       │  ◄── edge, rate-limit, HTTPS
                          └─────────────────────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────┐
                          │  Next.js 15 (apps/web)           │
                          │  ┌──────────┬──────────────────┐ │
                          │  │ Páginas  │ Route Handlers   │ │
                          │  │ App Router│ /api/admin/*    │ │
                          │  └──────────┴──────────────────┘ │
                          │  Auth: @supabase/ssr (lib/auth)  │
                          └─────────────────────────────────┘
                                            │ Supabase client (anon / service role)
                                            ▼
                          ┌─────────────────────────────────┐
                          │  Supabase                        │
                          │  ┌──────────┬──────────────────┐ │
                          │  │ Auth     │ PostgreSQL + RLS │ │
                          │  │(auth.users)│ (public.*)     │ │
                          │  └──────────┴──────────────────┘ │
                          └─────────────────────────────────┘
                                            ▲
                                            │ carga (ETL, futuro)
                          ┌─────────────────────────────────┐
                          │  Workers de Integração (futuro)  │
                          │  ┌───────────┬───────────┬─────┐ │
                          │  │ Avantpay  │ ABEWeb    │ ... │ │
                          │  └───────────┴───────────┴─────┘ │
                          └─────────────────────────────────┘
                                            │ push seguro
                                            ▼
                          ┌─────────────────────────────────┐
                          │  Agente on-premise (SQL 2005)    │
                          └─────────────────────────────────┘
                                            │
                                            ▼
                          ┌─────────────────────────────────┐
                          │  Sistemas de origem              │
                          │  Avantpay · ABEWeb · Acordo Seg  │
                          │  · SQL Server 2005 (Delphi)      │
                          └─────────────────────────────────┘
```

## 2.3 Componentes e responsabilidades

| Componente | Responsabilidade | Tecnologia |
|------------|------------------|------------|
| **Edge (Vercel)** | TLS, CDN, deploy serverless, preview por PR | Vercel |
| **Frontend** | UI do portal (dashboard, busca, financeiro, admin) | Next.js 15 + TypeScript |
| **Route Handlers** | Operações admin (credores, usuários), validação SUPER_ADMIN | Next.js App Router (`app/api/admin/*`) |
| **Autenticação** | Login, sessão, tokens | Supabase Auth + `@supabase/ssr` |
| **Banco do portal** | Réplica consolidada, multi-tenant (RLS) | Supabase PostgreSQL |
| **Workers de integração** | Conectar nas fontes, normalizar para o modelo canônico | Futuro (`apps/workers`) |
| **Agente on-premise** | Extrair do SQL 2005 sem expor o legado à internet | Serviço no ambiente ABE |
| **Observabilidade** | Logs, métricas, alertas | Vercel Analytics/Logs + Supabase Dashboard |

## 2.4 Fluxos principais

### A) Autenticação e sessão

1. Usuário envia e-mail/senha na tela de login.
2. `apps/web/lib/auth.ts` chama `supabase.auth.signInWithPassword`.
3. Supabase Auth valida credenciais em `auth.users`.
4. O app busca perfil em `public.usuarios` (papel, tenant, ativo).
5. Sessão persistida via cookies gerenciados por `@supabase/ssr` (middleware).

### B) Consulta (saída para o credor)

1. Credor autenticado → sessão Supabase com JWT.
2. Queries ao Postgres usam cliente **anon** com RLS — cada tenant só vê seus dados.
3. Frontend consome dados consolidados (futuro: views materializadas).

### C) Operação administrativa (SUPER_ADMIN)

1. Admin acessa `/admin/*`.
2. Route Handler em `app/api/admin/*` valida sessão + papel `SUPER_ADMIN`.
3. Operações de escrita usam cliente **service role** (bypass RLS controlado no código).
4. Trilha de auditoria registrada (futuro).

### D) Sincronização (entrada de dados — futuro)

1. Cada fonte: webhook, polling ou push do agente on-premise.
2. Worker normaliza para o modelo canônico.
3. Upsert idempotente no Supabase PostgreSQL.
4. Views materializadas alimentam KPIs.

## 2.5 Decisões macro (resumo)

| Decisão | Escolha | ADR |
|---------|---------|-----|
| Frontend + API serverless | Next.js 15 na Vercel | [0001](adr/0001-stack-tecnologico.md) |
| Backend de dados | Supabase (PostgreSQL + Auth + RLS) | [0001](adr/0001-stack-tecnologico.md) |
| Estilo do backend | Route Handlers + Supabase (monólito modular) | [0002](adr/0002-monolito-modular-vs-microservicos.md) |
| Identidade | Supabase Auth | [0003](adr/0003-identidade-autenticacao.md) |
| Banco | PostgreSQL com RLS | [0004](adr/0004-multi-tenant-isolamento.md) |
| Acesso ao legado | Agente on-premise → Supabase | [0005](adr/0005-acesso-legado-sql2005.md) |

## 2.6 Diagramas como código

Os diagramas devem ser mantidos versionados (Mermaid ou texto ASCII neste repositório). Evite imagens soltas; prefira texto para revisão por diff.
