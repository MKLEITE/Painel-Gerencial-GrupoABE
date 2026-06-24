# Modelo Tenant · Credores · Usuários

Documento de referência para evitar erros de cadastro, permissão e isolamento de dados conforme o produto crescer.

## Visão em uma frase

**Cada credor é um tenant isolado.** Usuários internos da ABE ficam em um tenant da plataforma (sem credor). Login e permissões dependem do **papel** e do **tenant** do usuário. Credenciais ficam no **Supabase Auth** (`auth.users`); perfil em `public.usuarios` — **sem `senha_hash`**.

## Diagrama

```text
┌─────────────────────────────────────────────────────────────┐
│  TENANT PLATAFORMA (sem Credor)                             │
│  Ex.: "Plataforma ABE — Administração"                      │
│  Usuários: SUPER_ADMIN, OPERADOR (futuro)                   │
│  Auth: auth.users ←→ public.usuarios (id igual)             │
│  Acesso: /admin                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TENANT CREDOR (1 Credor : 1 Tenant)                        │
│  Ex.: "Grupo Coca-Cola SP"                                  │
│  Credor: razão social, CNPJ, endereço, paginasAcesso…       │
│  Usuários: ADMIN_CREDOR (responsável), OPERADOR, VIEWER…    │
│  Auth: auth.users ←→ public.usuarios                        │
│  Acesso: /dashboard (e páginas liberadas em paginasAcesso)  │
└─────────────────────────────────────────────────────────────┘
```

## Regras que NÃO devem ser quebradas

| # | Regra | Por quê |
|---|--------|---------|
| 1 | **Um credor = um tenant** (relação 1:1) | Isolamento multi-tenant; RLS filtra por `tenant_id`. |
| 2 | **Cadastro de credor cria tenant + credor + responsável** | Garante login e dados completos desde o início. |
| 3 | **Responsável = usuário `ADMIN_CREDOR`** (primeiro do tenant) | Login principal do dashboard daquele credor. |
| 4 | **`/admin/usuarios` só lista a equipe ABE** | Tenants **sem** credor. Logins de credor **não** aparecem aqui. |
| 5 | **E-mail de login é único na plataforma** | Índice `usuarios_email_key` em `lower(email)`. |
| 6 | **E-mail comercial ≠ e-mail de login** | Comercial em `credores.email_comercial`; login em `usuarios.email`. |
| 7 | **SUPER_ADMIN só no tenant plataforma** | Quem acessa `/admin` deve ter papel `SUPER_ADMIN`. |
| 8 | **Senha só no Supabase Auth** | `public.usuarios` não armazena hash de senha. |
| 9 | **`paginasAcesso` controla o menu do dashboard** | Credor só vê módulos liberados. |
| 10 | **Nunca commitar `.env` ou chaves Supabase** | Segredos na Vercel / `.env` local (gitignored). |

## Onde cada coisa é gerenciada

| O quê | Onde (UI) | API |
|-------|-----------|-----|
| Dados da empresa credora | `/admin/credores` | `POST/PATCH /api/admin/credores` |
| Login do credor (responsável) | Seção "Responsável" no formulário | `POST /api/admin/credores`, `PATCH .../responsavel` |
| Equipe interna ABE | `/admin/usuarios` | `GET/POST/PATCH /api/admin/usuarios` |
| Perfil no dashboard | Sidebar | `lib/auth.ts` → perfil em `usuarios` |

## Papéis (`PapelUsuario`)

| Papel | Tenant típico | Rotas |
|-------|---------------|-------|
| `SUPER_ADMIN` | Plataforma | `/admin/*` |
| `ADMIN_CREDOR` | Credor | `/dashboard` + páginas do credor |
| `OPERADOR` | Credor (futuro) | Dashboard com permissões reduzidas |
| `VIEWER` | Credor (futuro) | Somente leitura |

## Fluxo correto de cadastro de credor

1. Super Admin preenche **Dados da empresa**, **Endereço**, **Controle de acesso**.
2. Preenche **Responsável** (nome, e-mail de login, senha, foto opcional).
3. Route Handler em **transação** (service role):
   - Cria usuário em `auth.users` (Supabase Auth Admin API).
   - Cria `tenants` → `credores` → `usuarios` (`ADMIN_CREDOR`).
4. Credenciais exibidas uma vez (copiar senha).

**Não fazer:** criar usuário em `/admin/usuarios` esperando que vire credor — isso só cria admin da plataforma.

## Erros comuns a evitar

| Erro | Consequência | Prevenção |
|------|--------------|-----------|
| Usuário em Auth sem linha em `usuarios` | Login falha ("perfil não encontrado") | Sempre criar perfil junto com Auth |
| Mesmo e-mail em dois tenants | Conflito de login | Índice único global + validação na API |
| Service role no browser | Bypass total de RLS | Usar só em Route Handlers server-side |
| Editar responsável só em `/admin/usuarios` | Bloqueio ou inconsistência | Sempre pelo formulário do credor |

## Evolução planejada

- **Equipe do credor:** vários usuários no mesmo tenant — tela "Usuários do credor".
- **Foto em storage:** substituir base64 em `foto_url` por Supabase Storage + URL pública assinada.
- **MFA obrigatório** para admins via Supabase Auth.

## Seeds de desenvolvimento

| Usuário | E-mail | Papel | Destino após login |
|---------|--------|-------|---------------------|
| Meykson | `meykson@abe.com.br` | SUPER_ADMIN | `/admin/credores` |
| Admin Dev | `admin@grupoabe.com.br` | ADMIN_CREDOR | `/dashboard` |

Definidos em `supabase/seed.mjs`. **Trocar senhas em produção.**

## Checklist antes de release

- [ ] Senhas seed alteradas ou seed desabilitado em produção
- [ ] Chaves Supabase só em variáveis de ambiente (Vercel)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` não exposta ao browser
- [ ] Teste: credor A não vê dados do credor B (RLS)
- [ ] Teste: usuário credor não acessa `/admin`
- [ ] Teste: SUPER_ADMIN não aparece na lista de usuários de credor
