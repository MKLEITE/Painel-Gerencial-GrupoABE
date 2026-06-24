# Modelo Tenant · Credores · Usuários

Documento de referência para evitar erros de cadastro, permissão e isolamento de dados conforme o produto crescer.

## Visão em uma frase

**Cada credor é um tenant isolado.** Usuários internos da ABE ficam em um tenant da plataforma (sem credor). Login e permissões dependem do **papel** e do **tenant** do usuário.

## Diagrama

```text
┌─────────────────────────────────────────────────────────────┐
│  TENANT PLATAFORMA (sem Credor)                             │
│  Ex.: "Plataforma ABE — Administração"                      │
│  Usuários: SUPER_ADMIN, OPERADOR (futuro)                   │
│  Acesso: /admin                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TENANT CREDOR (1 Credor : 1 Tenant)                        │
│  Ex.: "Grupo Coca-Cola SP"                                  │
│  Credor: razão social, CNPJ, endereço, paginasAcesso…       │
│  Usuários: ADMIN_CREDOR (responsável), OPERADOR, VIEWER…    │
│  Acesso: /dashboard (e páginas liberadas em paginasAcesso)  │
└─────────────────────────────────────────────────────────────┘
```

## Regras que NÃO devem ser quebradas

| # | Regra | Por quê |
|---|--------|---------|
| 1 | **Um credor = um tenant** (relação 1:1) | Isolamento multi-tenant; queries sempre filtram por `tenantId`. |
| 2 | **Cadastro de credor cria tenant + credor + responsável** | Garante que todo credor tenha login e dados completos desde o início. |
| 3 | **Responsável = usuário `ADMIN_CREDOR`** (primeiro do tenant) | É o login principal do dashboard daquele credor. |
| 4 | **`/admin/usuarios` só lista a equipe ABE** | `listPlatformUsers()` filtra tenants **sem** credor. Logins de credor **não** aparecem aqui. |
| 5 | **E-mail de login é único na plataforma inteira** | O login (`findByEmail`) não pergunta “qual tenant”; duplicar e-mail quebra autenticação. Hoje validado na API ao criar credor/responsável e admin; **recomendado:** índice único global em `usuarios.email` (migration futura). |
| 6 | **E-mail comercial ≠ e-mail de login** | Comercial fica no `Credor`; login fica no `Usuario` responsável. Podem ser iguais, mas são campos distintos. |
| 7 | **SUPER_ADMIN só no tenant plataforma** | Quem acessa `/admin` deve estar no tenant sem credor e ter papel `SUPER_ADMIN`. |
| 8 | **Alterar usuário de credor só via cadastro do credor** | `UsersService.update` bloqueia usuários cujo tenant tem credor — evita editar responsável por duas telas. |
| 9 | **`paginasAcesso` controla o menu do dashboard** | Credor só vê módulos liberados (hoje: `dashboard`). |
| 10 | **Nunca commitar `.env` ou senhas de produção** | Segredos ficam fora do Git (Vercel/RDS secrets). |

## Onde cada coisa é gerenciada

| O quê | Onde (UI) | API |
|-------|-----------|-----|
| Dados da empresa credora | `/admin/credores` | `POST/PATCH /admin/credores` |
| Login do credor (responsável) | Seção “Responsável” no formulário do credor | `POST /admin/credores`, `PATCH .../responsavel` |
| Equipe interna ABE | `/admin/usuarios` | `GET/POST/PATCH /admin/usuarios` |
| Perfil no dashboard | Sidebar (foto/iniciais) | `GET /auth/me` (`fotoUrl`) |

## Papéis (`PapelUsuario`)

| Papel | Tenant típico | Rotas |
|-------|---------------|-------|
| `SUPER_ADMIN` | Plataforma | `/admin/*` |
| `OPERADOR` | Plataforma (futuro) | Operações limitadas no admin |
| `ADMIN_CREDOR` | Credor | `/dashboard` + páginas do credor |
| `OPERADOR` | Credor (futuro) | Dashboard com permissões reduzidas |
| `VIEWER` | Credor (futuro) | Somente leitura |

## Fluxo correto de cadastro de credor

1. Super Admin preenche **Dados da empresa**, **Endereço**, **Controle de acesso**.
2. Preenche **Responsável** (nome, e-mail de login, senha, foto opcional).
3. API em **transação**: cria `Tenant` → `Credor` → `Usuario` (`ADMIN_CREDOR`).
4. Credenciais exibidas uma vez (copiar senha).

**Não fazer:** criar usuário em `/admin/usuarios` esperando que vire credor — isso só cria admin da plataforma.

## Erros comuns a evitar (futuro)

| Erro | Consequência | Prevenção |
|------|--------------|-----------|
| Dois credores no mesmo tenant | Impossível no schema (`Credor.tenantId` unique) | — |
| Mesmo e-mail em credor A e credor B | Login ambíguo / conflito | Validação na API + unique global no DB |
| Admin plataforma com e-mail igual ao de credor | Um dos logins falha ou sobrescreve expectativa | Checar unicidade antes de qualquer create |
| Editar responsável só em `/admin/usuarios` | API retorna 403 | Sempre pelo formulário do credor |
| Múltiplos `ADMIN_CREDOR` sem regra | Confusão sobre “quem é o responsável” | Hoje: primeiro criado; futuro: flag `principal` ou tela “equipe do credor” |
| Foto grande no banco | Performance / payload JWT grande | Limite 1 MB; futuro: S3 + URL |

## Evolução planejada (não implementado ainda)

- **Equipe do credor:** vários usuários (`OPERADOR`, `VIEWER`) no mesmo tenant — tela separada “Usuários do credor” no admin ou self-service do `ADMIN_CREDOR`.
- **E-mail único global:** migration `@@unique([email])` em `Usuario`.
- **Foto em object storage:** substituir base64 em `fotoUrl` por URL S3/CloudFront.
- **OPERADOR plataforma:** acesso parcial ao `/admin` sem ser `SUPER_ADMIN`.

## Seeds de desenvolvimento

| Usuário | E-mail | Papel | Destino após login |
|---------|--------|-------|---------------------|
| Meykson | `meykson@abe.com.br` | SUPER_ADMIN | `/admin/credores` |
| Admin Dev | `admin@grupoabe.com.br` | ADMIN_CREDOR | `/dashboard` |

Definidos em `apps/api/prisma/seed.ts`. **Trocar senhas em produção.**

## Checklist antes de release

- [ ] Senhas seed alteradas ou seed desabilitado em produção
- [ ] `DATABASE_URL` e JWT secrets só em variáveis de ambiente
- [ ] Teste: credor A não vê dados do credor B
- [ ] Teste: usuário credor não acessa `/admin`
- [ ] Teste: SUPER_ADMIN não aparece na lista de usuários de credor
