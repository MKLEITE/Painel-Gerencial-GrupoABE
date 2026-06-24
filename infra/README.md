# Infraestrutura como Código (IaC)

Toda a infraestrutura na AWS é provisionada por **Terraform**. Nada é criado manualmente no console
em produção. Ver [`docs/07-infraestrutura-e-devops.md`](../docs/07-infraestrutura-e-devops.md).

## Estrutura

```text
infra/
  modules/        # módulos reutilizáveis (vpc, ecs, rds, waf, ...)
  envs/
    dev/
    staging/
    prod/
```

## Status (Fase 0)

Esta é a **estrutura** de IaC. Os recursos (que geram custo) ainda **não** são provisionados;
serão implementados na Fase 1, começando por um ambiente `dev` mínimo.

## Componentes planejados (Fase 1)

VPC, subnets públicas/privadas, ALB, ECS Fargate (API + workers), RDS PostgreSQL Multi-AZ,
S3 + CloudFront + WAF, SQS + DLQ, EventBridge, Secrets Manager, KMS, CloudWatch, ECR.

## Convenções

- Backend de estado remoto (S3 + DynamoDB lock) por ambiente.
- Variáveis sensíveis nunca versionadas (`*.tfvars` no `.gitignore`; usar `*.tfvars.example`).
- `terraform plan` revisado em PR antes de qualquer `apply` (via pipeline).
