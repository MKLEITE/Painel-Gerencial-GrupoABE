# Onboarding da equipe (3 pessoas · GitHub Free · Vercel · Supabase)

Guia simples para trabalhar no **Painel Gerencial Grupo ABE** sem sobrescrever o trabalho uns dos outros.

## GitHub Free serve?

**Sim.** Para repositório **privado** com **até 3 colaboradores** no plano Free:

- Repositório privado
- Pull Requests e code review
- GitHub Actions (CI)
- Integração nativa com **Vercel**

## Repositório

- **URL:** https://github.com/MKLEITE/Painel-Gerencial-GrupoABE
- **Branch principal:** `main` (código estável)

## Setup em 5 passos (novo dev)

```powershell
git clone https://github.com/MKLEITE/Painel-Gerencial-GrupoABE.git
cd Painel-Gerencial-GrupoABE
corepack enable
pnpm install
```

Copiar variáveis de ambiente (pedir chaves ao líder — **nunca** vão no Git):

```powershell
copy .env.example .env
# ou: copy apps\web\.env.example apps\web\.env.local
```

Preencher no `.env`:

| Variável | Onde obter |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` (fixo) |

Schema e seed (primeira vez):

1. Aplicar `supabase/migrations/001_initial_schema.sql` no **SQL Editor** do Supabase.
2. Rodar seed:

```powershell
pnpm db:seed
pnpm dev
```

- Web: http://localhost:3000
- Supabase Dashboard: https://supabase.com/dashboard

## Como trabalhar no dia a dia

```text
1. Escolher uma tarefa (issue ou combinado no chat)
2. git pull origin main
3. git checkout -b feat/nome-curto-da-tarefa
4. Codar + testar local
5. git add . && git commit -m "feat: descrição"
6. git push -u origin feat/nome-curto-da-tarefa
7. Abrir Pull Request no GitHub → pedir review → merge
```

**Regra de ouro:** ninguém faz push direto em `main`.

## Divisão sugerida do monorepo

| Dev | Foco | Pastas |
|-----|------|--------|
| A | Admin + credores (web) | `apps/web/app/admin`, `components/admin` |
| B | Route Handlers + Supabase | `apps/web/app/api/admin`, `lib/server`, `supabase/migrations` |
| C | Dashboard credor | `apps/web/app/dashboard`, `components/dashboard` |

Cada um em **branch diferente**. Mesmo arquivo = conflito no PR; resolvem juntos.

## Vercel (deploy)

1. Conectar repositório GitHub em [vercel.com](https://vercel.com) → Import Project.
2. **Root Directory:** `apps/web`
3. **Framework:** Next.js (detectado automaticamente)
4. Variáveis de ambiente (Production + Preview):

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` |

Detalhes: [`VERCEL-DEPLOY.md`](VERCEL-DEPLOY.md)

Cada PR gera **URL de preview** automática.

## Supabase (banco + auth)

- Projeto: `https://vkzefmedwxvpqcivparz.supabase.co`
- Migrations: `supabase/migrations/` — aplicar no SQL Editor ou CLI.
- **Não compartilhar** a service role key fora da equipe ou em canais inseguros.

Ver [`supabase/README.md`](../supabase/README.md).

## CI (GitHub Actions)

A cada push/PR roda lint, typecheck, testes e build — `.github/workflows/ci.yml`.

Se falhar, corrigir antes do merge.

## Commits

- `feat:` nova funcionalidade
- `fix:` correção
- `docs:` documentação
- `chore:` ferramentas, deps

Exemplo: `feat: paginação na tabela de credores`

## Dúvidas sobre credor vs usuário?

Leia **[10-modelo-tenant-usuarios-credores.md](10-modelo-tenant-usuarios-credores.md)** antes de mexer em cadastro ou permissões.
