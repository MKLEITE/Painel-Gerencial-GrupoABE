# Conexão com o GitHub

Este documento descreve como vincular esta pasta local ao repositório remoto do projeto.

## Repositório

| Item | Valor |
|------|-------|
| **URL HTTPS** | `https://github.com/MKLEITE/Painel-Gerencial-GrupoABE.git` |
| **URL SSH** | `git@github.com:MKLEITE/Painel-Gerencial-GrupoABE.git` |
| **Página** | [https://github.com/MKLEITE/Painel-Gerencial-GrupoABE](https://github.com/MKLEITE/Painel-Gerencial-GrupoABE) |

## Pasta local

```
c:\Users\Meykson Leite\Documents\SISTEMAS-MK SOLUTIONS\Painel-Gerencial-GrupoABE
```

## Primeira configuração

O repositório Git fica **nesta pasta do projeto** (não na pasta do usuário Windows).

```powershell
cd "c:\Users\Meykson Leite\Documents\SISTEMAS-MK SOLUTIONS\Painel-Gerencial-GrupoABE"
git init
git remote add origin https://github.com/MKLEITE/Painel-Gerencial-GrupoABE.git
git branch -M main
```

## Primeiro envio para o GitHub

```powershell
git add .
git commit -m "feat: estrutura inicial do monorepo"
git push -u origin main
```

> Se o repositório remoto já tiver commits (por exemplo, um README criado no GitHub), use antes do push:
>
> ```powershell
> git pull origin main --allow-unrelated-histories
> ```

## Clonar em outra máquina

```powershell
git clone https://github.com/MKLEITE/Painel-Gerencial-GrupoABE.git
cd Painel-Gerencial-GrupoABE
```

## Fluxo de trabalho diário

```powershell
# Atualizar do remoto
git pull origin main

# Ver alterações
git status

# Enviar alterações
git add .
git commit -m "descrição da alteração"
git push origin main
```

## Autenticação

O GitHub não aceita mais senha de conta para `git push` via HTTPS. Use uma destas opções:

1. **Personal Access Token (PAT)** — gere em [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) e use no lugar da senha.
2. **GitHub CLI** — `gh auth login` e depois `gh repo clone MKLEITE/Painel-Gerencial-GrupoABE`.
3. **SSH** — configure uma chave SSH e use a URL `git@github.com:MKLEITE/Painel-Gerencial-GrupoABE.git`.

## Arquivos que não devem ir para o repositório

Considere criar um `.gitignore` com entradas como:

```
.env
*.log
node_modules/
dist/
build/
.DS_Store
Thumbs.db
~$*
```
