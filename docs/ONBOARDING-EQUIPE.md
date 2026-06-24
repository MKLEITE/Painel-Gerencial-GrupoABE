# Onboarding da equipe (3 pessoas · GitHub Free · Vercel)

Guia simples para trabalhar no **Painel Gerencial Grupo ABE** sem sobrescrever o trabalho uns dos outros.

## GitHub Free serve?

**Sim.** Para repositório **privado** com **até 3 colaboradores** no plano Free, o GitHub atende bem:

- Repositório privado
- Pull Requests e code review
- GitHub Actions (CI) — minutos grátis por mês
- Integração nativa com **Vercel**

Planos pagos só entram em cena com times maiores ou minutos de CI muito altos.

## Repositório

- **URL:** https://github.com/MKLEITE/Painel-Gerencial-GrupoABE
- **Branch principal:** `main` (código estável)
- **Branch de integração (opcional):** `develop` — ver `CONTRIBUTING.md`

## Setup em 5 passos (novo dev)

```powershell
git clone https://github.com/MKLEITE/Painel-Gerencial-GrupoABE.git
cd Painel-Gerencial-GrupoABE
corepack enable
pnpm install
```

Copiar variáveis de ambiente (pedir valores ao líder do projeto — **nunca** vão no Git):

```powershell
copy .env.example .env
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
```

Banco e seed:

```powershell
cd apps\api
pnpm db:migrate
pnpm db:seed
cd ..\..
pnpm dev
```

- Web: http://localhost:3000  
- API: http://localhost:3333/api  

## Como trabalhar no dia a dia (sem pisar no outro)

```text
1. Escolher uma tarefa (issue ou combinado no chat)
2. git pull origin main
3. git checkout -b feat/nome-curto-da-tarefa
4. Codar + testar local
5. git add . && git commit -m "feat: descrição"
6. git push -u origin feat/nome-curto-da-tarefa
7. Abrir Pull Request no GitHub → pedir review → merge
```

**Regra de ouro:** ninguém faz push direto em `main` (proteger branch no GitHub quando tiver 2+ devs).

## Divisão sugerida do monorepo

| Dev | Foco | Pastas |
|-----|------|--------|
| A | Admin + credores (web) | `apps/web/app/admin`, `components/admin` |
| B | API + banco | `apps/api/src`, `apps/api/prisma` |
| C | Dashboard credor | `apps/web/app/dashboard`, `components/dashboard` |

Cada um em **branch diferente**. Mesmo arquivo = Git avisa conflito; resolvem juntos no PR.

## Vercel (frontend)

1. Conectar repositório GitHub em [vercel.com](https://vercel.com) → Import Project.
2. **Root Directory:** `apps/web`
3. **Framework:** Next.js (detectado automaticamente)
4. **Install Command:** `cd ../.. && pnpm install`
5. **Build Command:** `cd ../.. && pnpm build --filter @abe/web`
6. Variáveis de ambiente: `NEXT_PUBLIC_API_URL` apontando para a API (Railway/Render/RDS — API ainda local ou em outro host).

Cada PR pode gerar **URL de preview** automática (útil para review visual).

## CI (GitHub Actions)

A cada push/PR roda lint, typecheck, testes e build — arquivo `.github/workflows/ci.yml`.

Se falhar, corrigir antes do merge.

## Commits

Use prefixos curtos:

- `feat:` nova funcionalidade
- `fix:` correção
- `docs:` documentação
- `chore:` ferramentas, deps

Exemplo: `feat: paginação na tabela de credores`

## Dúvidas sobre credor vs usuário?

Leia **[10-modelo-tenant-usuarios-credores.md](10-modelo-tenant-usuarios-credores.md)** antes de mexer em cadastro ou permissões.

## Quem vem do Bitbucket?

O fluxo é o mesmo: branch → commit → push → Pull Request. Só muda o site (GitHub em vez de Bitbucket).
