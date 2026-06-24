# Guia de Contribuição

Bem-vindo(a)! Este guia ajuda novos desenvolvedores a trabalharem de forma organizada no projeto.

## Pré-requisitos

- **Node.js** (versão em `.nvmrc`).
- **pnpm** via Corepack: `corepack enable` (já vem com o Node).
- **Git**.

## Primeiros passos

```bash
git clone https://github.com/MKLEITE/Painel-Gerencial-GrupoABE.git
cd Painel-Gerencial-GrupoABE
corepack enable
pnpm install
cp .env.example .env
```

Rodar tudo em modo dev:

```bash
pnpm dev
```

Ou um app específico:

```bash
pnpm --filter @abe/api dev
pnpm --filter @abe/web dev
```

## Estrutura do monorepo

```text
apps/
  api/      # backend (NestJS)
  web/      # frontend (Next.js)
  workers/  # workers de integração
packages/
  canonical-model/  # tipos/enums compartilhados
  config/           # configs compartilhadas (ESLint)
infra/      # infraestrutura como código (Terraform)
docs/       # documentação técnica (LEIA ISTO PRIMEIRO)
```

## Fluxo de trabalho

1. Crie uma branch a partir de `develop`: `feature/minha-mudanca`.
2. Faça commits no padrão **Conventional Commits** (`feat:`, `fix:`, `docs:`...).
   - Os hooks de git (husky) validam lint e mensagem de commit automaticamente.
3. Abra um Pull Request para `develop` e preencha o template.
4. A CI precisa passar (lint, typecheck, testes, build, scan de segredos).
5. Precisa de pelo menos 1 aprovação no review.

## Regras de ouro

- **Nunca** commitar segredos (`.env`, tokens, chaves). Use `.env.example`.
- **Toda** consulta a dados respeita o isolamento de tenant (ver `docs/06`).
- **Toda** entrada de API é validada.
- **Ações sensíveis** sempre auditadas.
- Antes de decisões arquiteturais, registre um **ADR** em `docs/adr/`.

## Scripts úteis

| Comando | O que faz |
|---------|-----------|
| `pnpm dev` | Sobe todos os apps em modo desenvolvimento |
| `pnpm build` | Build de todos os pacotes |
| `pnpm lint` | Lint em todo o monorepo |
| `pnpm typecheck` | Checagem de tipos |
| `pnpm test` | Testes |
| `pnpm format` | Formata o código (Prettier) |
