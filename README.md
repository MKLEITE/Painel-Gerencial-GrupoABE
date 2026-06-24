# Painel Gerencial Grupo ABE

Portal SaaS que consolida, em uma única interface, a régua de cobrança hoje espalhada por quatro
sistemas (Avantpay, ABE Interno/Delphi, ABEWeb e Acordo Seguro). Acessado externamente por clientes
credores, com foco em **segurança**, **isolamento multi-tenant**, **conformidade LGPD** e
**resiliência**.

> 📚 **Comece pela documentação:** [`docs/GUIA-DO-PROJETO.md`](docs/GUIA-DO-PROJETO.md) (guia vivo para quem altera código) · [`docs/README.md`](docs/README.md) (índice técnico).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js + TypeScript + Tailwind |
| Backend | NestJS + TypeScript |
| Workers de integração | TypeScript |
| Banco | PostgreSQL (AWS RDS) |
| Infra | AWS + Terraform |
| Monorepo | pnpm workspaces + Turborepo |

## Estrutura do repositório

```text
apps/
  api/       # backend (NestJS)
  web/       # frontend (Next.js)
  workers/   # workers de integração com as fontes
packages/
  canonical-model/  # tipos/enums do modelo de dados (compartilhado)
  config/           # configurações compartilhadas (ESLint)
infra/       # infraestrutura como código (Terraform)
docs/        # documentação técnica + ADRs
```

## Começar a desenvolver

```bash
corepack enable        # habilita o pnpm (já vem com o Node)
pnpm install
cp .env.example .env
pnpm dev
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:3333/api> (health: `/api/health`)

Veja o [guia de contribuição](CONTRIBUTING.md) para o fluxo completo.

## Documentação

| Documento | Assunto |
|-----------|---------|
| [docs/ONBOARDING-EQUIPE](docs/ONBOARDING-EQUIPE.md) | GitHub, Vercel e fluxo em equipe |
| [docs/10](docs/10-modelo-tenant-usuarios-credores.md) | Modelo tenant, credores e usuários |
| [docs/01](docs/01-visao-e-escopo.md) | Visão, escopo, personas, glossário |
| [docs/02](docs/02-arquitetura-geral.md) | Arquitetura geral |
| [docs/03](docs/03-arquitetura-de-dados.md) | Dados, integração e ETL |
| [docs/04](docs/04-backend.md) | Backend e APIs |
| [docs/05](docs/05-frontend.md) | Frontend |
| [docs/06](docs/06-seguranca-e-lgpd.md) | Segurança e LGPD |
| [docs/07](docs/07-infraestrutura-e-devops.md) | Infraestrutura e DevOps |
| [docs/08](docs/08-resiliencia-e-observabilidade.md) | Resiliência e observabilidade |
| [docs/09](docs/09-roadmap-e-fase-0.md) | Roadmap e Fase 0 |
| [docs/adr](docs/adr/) | Registros de decisões arquiteturais |

## Status

**Fase 0 — Fundação.** Esqueleto do monorepo e documentação prontos. Próximo: Fase 1 (MVP).

## Licença

Software proprietário — MK Solutions / Grupo ABE. Todos os direitos reservados.
