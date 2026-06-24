# 06 — Segurança e LGPD

> Este é o documento mais importante da Fase 0. O sistema será **acessado pela internet por terceiros
> (credores)** e lida com **dados pessoais e financeiros de devedores**. Segurança e LGPD são
> requisitos de produto, não "extras".

## 6.1 Modelo de ameaças (resumo STRIDE)

| Ameaça | Exemplo no nosso contexto | Mitigação principal |
|--------|---------------------------|---------------------|
| **Spoofing** | Alguém se passa por um credor | OIDC + MFA, tokens curtos, sessão segura |
| **Tampering** | Alterar dados em trânsito/repouso | TLS, integridade, RLS, auditoria |
| **Repudiation** | Negar que executou uma transferência | Audit log imutável (quem/quando/IP) |
| **Information Disclosure** | Vazar CPF/dívida de um devedor | Criptografia, mascaramento, isolamento de tenant |
| **Denial of Service** | Derrubar o portal | WAF, rate limit, CloudFront, autoscaling |
| **Elevation of Privilege** | Operador virar admin / ver outro tenant | RBAC + RLS, negar por padrão |

> Um threat model detalhado (por fluxo) é entregável da Fase 0 — ver doc 09. Onde houver dúvida,
> assume-se a opção mais restritiva.

## 6.2 Isolamento de tenant (multicamada)

O maior risco de um SaaS multiempresa é **um credor ver dados de outro**. Defesa em profundidade:

1. **No token:** o `tenant_id` vem do token (assinado), nunca do cliente.
2. **Na aplicação:** um guard injeta o tenant no contexto; todo repositório filtra por ele.
3. **No banco (RLS):** **Row-Level Security** no PostgreSQL garante que, mesmo com bug na aplicação,
   uma sessão só enxergue linhas do seu tenant.

Exemplo de política RLS (conceitual):

```sql
ALTER TABLE titulo ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON titulo
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

A aplicação define `app.tenant_id` por conexão/transação a partir do token. **Nenhuma query** roda
sem esse contexto.

## 6.3 Autenticação

- **Protocolo:** OAuth2/OIDC. Provedor: Amazon Cognito **ou** Keycloak ([ADR-0003](adr/0003-identidade-autenticacao.md)).
- **MFA obrigatório** para `admin` e `super_admin`; recomendado para todos.
- **Tokens:** access token curto (~15 min) + refresh token rotacionado e revogável.
- **Armazenamento do token:** cookie `HttpOnly` + `Secure` + `SameSite=Strict`.
- **Senhas** (se houver login local): hashing **Argon2id** (ou bcrypt forte), política de força,
  bloqueio progressivo após tentativas falhas, proteção contra credential stuffing.
- **Sessão:** expiração por inatividade; logout invalida refresh token.

## 6.4 Autorização (RBAC + escopo de tenant)

- Papéis: `super_admin` (MK), `admin_credor`, `operador`, `viewer` (ver doc 01).
- **Negar por padrão**: sem permissão explícita = 403.
- Permissões por recurso/ação (ex.: `acoes:transferir` só `admin_credor`).
- Toda rota declara o papel/permissão mínima; testes garantem que papéis menores são barrados.

## 6.5 Criptografia

| Onde | Como |
|------|------|
| **Em trânsito** | TLS 1.2+ obrigatório (HSTS). mTLS no canal do agente on-premise. |
| **Em repouso** | Criptografia do RDS, S3, snapshots e filas (chaves no **AWS KMS**). |
| **Campos sensíveis** | CPF/CNPJ do devedor criptografado em coluna + `hash` para busca por igualdade. |
| **Segredos** | **AWS Secrets Manager** (tokens das fontes, credenciais). Rotação automática. |

> **Nada de segredo no repositório.** Há varredura de segredos na CI (ver doc 07) e no pre-commit.

## 6.6 OWASP Top 10 — como tratamos cada item

| Risco OWASP | Mitigação no projeto |
|-------------|----------------------|
| **A01 Broken Access Control** | RBAC + RLS + escopo de tenant pelo token; testes de autorização |
| **A02 Cryptographic Failures** | TLS, KMS, criptografia de campos sensíveis, sem dados sensíveis em log |
| **A03 Injection** | ORM com queries parametrizadas (Prisma); validação de entrada; sem SQL dinâmico |
| **A04 Insecure Design** | Threat modeling na Fase 0; padrões seguros por default; revisão de arquitetura |
| **A05 Security Misconfiguration** | IaC revisado, headers seguros, sem default credentials, hardening de imagens |
| **A06 Vulnerable Components** | Scan de dependências (SCA) na CI; atualização contínua; SBOM |
| **A07 Auth Failures** | OIDC, MFA, tokens curtos, lockout, rotação de refresh |
| **A08 Software & Data Integrity** | Assinatura de webhooks (HMAC), pipelines confiáveis, imagens versionadas |
| **A09 Logging & Monitoring Failures** | Logs estruturados, auditoria, alertas (doc 08) |
| **A10 SSRF** | Allow-list de destinos das integrações; egress controlado; sem URL vinda do usuário |

## 6.7 Proteções de borda (web)

- **CloudFront + AWS WAF**: regras gerenciadas (OWASP), bloqueio de IP/geo se necessário, regras
  contra bots.
- **Rate limiting** por IP/usuário/rota (especialmente login e busca).
- **AWS Shield** para DDoS.
- **Headers HTTP de segurança**: `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **CORS** restrito aos domínios do portal.
- **Validação de entrada** estrita em toda borda; **output encoding** para evitar XSS.

## 6.8 Auditoria (trilha imutável)

Toda ação sensível gera registro **append-only** em `audit_log`:
- Quem (usuário + tenant), o quê (ação), quando, de onde (IP/origem), antes/depois.
- Foco especial em: login/logout, falhas de auth, **transferir/pausar**, revelar documento,
  exportar relatório, mudanças de permissão.
- Logs de auditoria são separados, protegidos contra alteração e retidos conforme jurídico (≥ 5 anos).

## 6.9 LGPD (Lei 13.709/2018)

O portal trata **dados pessoais** (CPF/CNPJ, nome, dívida) e **dados financeiros**. Obrigações:

### Papéis LGPD
- **Controlador:** o credor (e/ou Grupo ABE, conforme contrato).
- **Operador:** a plataforma (MK Solutions), que trata dados em nome do controlador.
- Definir contrato de tratamento (DPA) entre as partes.

### Princípios aplicados
| Princípio | Como cumprimos |
|-----------|----------------|
| **Finalidade** | Dados só usados para gestão de cobrança contratada |
| **Minimização** | Replicamos apenas o necessário para exibir; nada além |
| **Base legal** | Execução de contrato / legítimo interesse (cobrança) — confirmar com jurídico |
| **Segurança** | Criptografia, RLS, auditoria, controle de acesso |
| **Transparência** | Política de privacidade; registro de tratamento |
| **Direitos do titular** | Processo para acesso/correção/eliminação e relatório de dados |

### Medidas práticas
- **Mascaramento** de CPF/CNPJ na UI por padrão (`123.***.***-00`); revelar só com permissão + auditoria.
- **Anonimização/eliminação** no offboarding do credor (processo documentado — doc 03).
- **Registro das operações de tratamento** (RoPA).
- **Plano de resposta a incidentes** com notificação à ANPD e aos titulares quando aplicável.
- **DPO/Encarregado** definido (pessoa/contato responsável).
- Acesso de funcionários por **menor privilégio** e auditado.

## 6.10 Segurança no ciclo de desenvolvimento (DevSecOps)

| Etapa | Controle |
|-------|----------|
| Pre-commit | Lint, format, **scan de segredos** (ex.: gitleaks) |
| Pull Request | Code review obrigatório, checks verdes |
| CI | **SAST** (análise estática), **SCA** (dependências), testes, build |
| Pré-deploy | **DAST** (varredura dinâmica) em staging |
| Infra | **IaC scanning** (tfsec/checkov), imagens escaneadas |
| Periódico | **Pentest** antes do go-live e a cada release maior; revisão de acessos |
| Runtime | WAF, alertas de anomalia, monitoramento (doc 08) |

## 6.11 Gestão de acessos internos (MK Solutions)

- Acesso à AWS via **SSO + MFA**, papéis IAM de menor privilégio, sem chaves de longa duração.
- Acesso a produção **just-in-time** e auditado; ninguém usa conta root no dia a dia.
- Bastion/SSM para acesso a recursos privados; nada de banco exposto à internet.

## 6.12 Checklist mínimo antes do go-live

- [ ] RLS ativo e testado em todas as tabelas com `tenant_id`.
- [ ] MFA obrigatório para admins.
- [ ] WAF + rate limit + headers de segurança ativos.
- [ ] Criptografia em repouso (RDS/S3/filas) + KMS.
- [ ] CPF/CNPJ criptografado e mascarado na UI.
- [ ] Auditoria cobrindo todas as ações sensíveis.
- [ ] Scan de segredos, SAST, SCA e DAST passando na CI.
- [ ] Pentest realizado e correções aplicadas.
- [ ] Plano de resposta a incidentes e backup/restore testados.
- [ ] Política de privacidade e RoPA publicados; DPO definido.
