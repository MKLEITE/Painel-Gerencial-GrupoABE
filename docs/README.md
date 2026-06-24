# Painel Gerencial Grupo ABE

> Documentação técnica da **Fase 0 (Fundação)**.
> Este conjunto de documentos é a base sobre a qual todo o restante do projeto será construído.

## ⭐ Comece aqui (desenvolvedores)

**[GUIA-DO-PROJETO.md](GUIA-DO-PROJETO.md)** — documento vivo com estrutura do código, como rodar, o que está pronto vs. mock, convenções e “onde mexer”. **Leia antes de alterar qualquer coisa.**

## O que é este projeto

Um **portal SaaS** que consolida, em uma única interface, a régua de cobrança hoje espalhada por
quatro sistemas (Avantpay, ABE Interno/Delphi, ABEWeb e Acordo Seguro). Será **vendido e acessado
externamente** por clientes credores, o que exige um padrão elevado de **segurança**, **isolamento
de dados (multi-tenant)**, **conformidade com a LGPD** e **resiliência a falhas**.

## Como ler esta documentação

Leia na ordem. Cada documento assume que você leu o anterior.

| # | Documento | Para quê serve |
|---|-----------|----------------|
| 01 | [Visão, Escopo e Glossário](01-visao-e-escopo.md) | Entender o problema, objetivos, quem usa e a linguagem comum |
| 02 | [Arquitetura Geral](02-arquitetura-geral.md) | Visão macro do sistema, componentes e estilo arquitetural |
| 03 | [Arquitetura de Dados e Integração](03-arquitetura-de-dados.md) | Modelo canônico, multi-tenant, ETL/sincronização das 4 fontes |
| 04 | [Backend e APIs](04-backend.md) | Stack, organização de serviços, contratos de API |
| 05 | [Frontend](05-frontend.md) | Stack, estrutura, UX do dashboard |
| 06 | [Segurança e LGPD](06-seguranca-e-lgpd.md) | OWASP, autenticação/autorização, criptografia, LGPD, auditoria |
| 07 | [Infraestrutura e DevOps](07-infraestrutura-e-devops.md) | AWS, IaC, CI/CD, ambientes |
| 08 | [Resiliência e Observabilidade](08-resiliencia-e-observabilidade.md) | Tolerância a falhas, idempotência, logs/métricas/tracing |
| 09 | [Roadmap e Entregáveis da Fase 0](09-roadmap-e-fase-0.md) | Faseamento, MVP, checklist do que entregar agora |

Complementos:

- [`adr/`](adr/) — **Architecture Decision Records** (decisões importantes, com contexto e consequências).
- **[Modelo Tenant · Credores · Usuários](10-modelo-tenant-usuarios-credores.md)** — regras de cadastro e isolamento (leia antes de alterar admin/auth).
- **[Onboarding da equipe](ONBOARDING-EQUIPE.md)** — GitHub, Vercel e fluxo de trabalho em time pequeno.
- [`../CONEXAO-GITHUB.md`](../CONEXAO-GITHUB.md) — conexão com o repositório remoto.

## Princípios que guiam o projeto

1. **Segurança por padrão (Secure by default).** Nada é exposto sem necessidade; o mínimo privilégio é a regra.
2. **Privacidade por padrão (Privacy by design).** Dados pessoais (CPF/CNPJ, dívidas) tratados sob a LGPD desde o desenho.
3. **Isolamento de tenant.** Um credor nunca acessa dado de outro — garantido em múltiplas camadas.
4. **Nunca tocar o sistema legado em tempo real.** O SQL Server 2005 é a operação; o portal lê de uma réplica moderna.
5. **Idempotência em ações críticas.** Transferir/baixar cobrança nunca pode duplicar ou cobrar em dobro.
6. **Falha isolada, não falha total.** Se uma fonte cai, o portal continua mostrando o resto com indicação de defasagem.
7. **Tudo versionado e documentado.** Código, infraestrutura (IaC) e decisões (ADR).

## Status

| Item | Status |
|------|--------|
| Fase | **0 — Fundação (planejamento e documentação)** |
| Decisões pendentes de confirmação | Ver seção "Decisões a confirmar" no doc 09 |
| Próximo marco | Aprovar Fase 0 → iniciar Fase 1 (MVP de 1 integração + dashboard) |
