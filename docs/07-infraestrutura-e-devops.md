# 07 — Infraestrutura e DevOps

## 7.1 Nuvem: AWS

Mantemos a recomendação do documento original (AWS). Tudo provisionado por **Infraestrutura como
Código (Terraform)** — nada criado manualmente no console em produção.

## 7.2 Componentes AWS (MVP)

| Serviço | Uso |
|---------|-----|
| **VPC** | Rede isolada; subnets públicas (ALB) e privadas (app, banco, workers) |
| **CloudFront** | CDN do frontend + borda HTTPS |
| **AWS WAF + Shield** | Proteção L7 / DDoS |
| **S3** | Hospedagem estática do frontend, artefatos, exportações de relatório |
| **ALB** | Balanceador para a API (em subnet privada) |
| **ECS Fargate** | API e workers em contêineres (sem gerenciar servidores) |
| **RDS PostgreSQL (Multi-AZ)** | Banco do portal (réplica de leitura consolidada) |
| **SQS** | Filas de ações/sincronização + **DLQ** |
| **EventBridge** | Agendamento de jobs e roteamento de eventos |
| **Secrets Manager** | Segredos e credenciais das integrações |
| **KMS** | Chaves de criptografia |
| **Cognito** *(ou Keycloak em ECS)* | Identidade/autenticação |
| **CloudWatch** | Logs, métricas, alarmes, dashboards |
| **ECR** | Registro de imagens Docker |

## 7.3 Topologia de rede (segurança)

```text
Internet
   │
CloudFront + WAF ──► S3 (frontend estático)
   │
   └──► ALB (subnet pública, só 443) ──► API (ECS, subnet privada)
                                              │
                 ┌────────────────────────────┼───────────────────────────┐
                 ▼                             ▼                            ▼
            RDS PostgreSQL              SQS / EventBridge            Secrets Manager
          (subnet privada,             (privado)                    (privado)
           sem IP público)
                 ▲
                 │ (push seguro, mTLS/VPN)
        Agente on-premise (ambiente ABE) ──► coleta do SQL Server 2005
```

Regras:
- Banco e workers **sem IP público**; só acessíveis dentro da VPC.
- Acesso administrativo via **SSM Session Manager** (sem SSH aberto).
- Security Groups de menor privilégio (cada componente só fala com quem precisa).
- Egress controlado (allow-list de destinos das integrações — mitiga SSRF/exfiltração).

## 7.4 Ambientes

| Ambiente | Propósito | Dados |
|----------|-----------|-------|
| **dev** | desenvolvimento e integração contínua | sintéticos/anonimizados |
| **staging** | homologação, DAST, testes de carga | anonimizados (nunca produção real) |
| **prod** | produção | reais, sob LGPD |

- Cada ambiente é uma stack Terraform isolada (idealmente contas AWS separadas).
- **Nunca** copiar dados reais de produção para dev/staging sem anonimização.

## 7.5 Containerização

- **Docker** para API e workers; imagens mínimas (distroless/alpine), usuário não-root.
- Imagens escaneadas (ECR scan) e versionadas por SHA do commit.
- Build reprodutível; sem segredos embutidos na imagem.

## 7.6 CI/CD (GitHub Actions)

Como o repositório fica no GitHub, usamos **GitHub Actions**.

### Pipeline de CI (em todo PR)
1. Checkout + setup (Node/pnpm).
2. Lint + format check.
3. **Scan de segredos** (gitleaks).
4. Testes unitários e de integração.
5. **SAST** (análise estática) + **SCA** (dependências).
6. Build (API, workers, web) + build de imagens Docker.
7. **IaC scan** (tfsec/checkov) no Terraform.

### Pipeline de CD
- **Merge na branch `develop`** → deploy automático em **staging** → DAST + smoke tests.
- **Tag/Release na `main`** → deploy em **prod** com **aprovação manual** (gate).
- Estratégia de deploy: **rolling** ou **blue/green** (ECS) para zero downtime.
- Migrações de banco aplicadas de forma controlada no pipeline (com backup antes).
- **Rollback** documentado e testado (voltar para a imagem/versão anterior).

### Branching
- `main` (produção) ← `develop` (homologação) ← `feature/*`.
- Proteção de branch: PR obrigatório, checks verdes, 1+ aprovação, sem push direto na `main`.
- **Conventional Commits** + versionamento semântico + changelog automático.

## 7.7 Configuração e segredos

- Configuração por ambiente via variáveis (12-factor); nada sensível no código.
- Segredos no **Secrets Manager**, lidos em runtime; rotação automática quando possível.
- `.env` apenas local e **no `.gitignore`** (ver `CONEXAO-GITHUB.md`).

## 7.8 Custos (princípios)

- Começar enxuto (Fargate pequeno, RDS `t`-class Multi-AZ) e escalar conforme adesão.
- Tags de custo por ambiente/tenant para acompanhar.
- Autoscaling baseado em métricas (CPU/fila) para pagar pelo uso.

## 7.9 Estrutura de IaC no repositório

```text
infra/
  modules/            # módulos reutilizáveis (vpc, ecs, rds, waf, ...)
  envs/
    dev/
    staging/
    prod/
  README.md           # como aplicar (plan/apply), pré-requisitos
```

> O esqueleto de IaC (ainda sem provisionar recursos pagos) é um entregável da Fase 0 — doc 09.
