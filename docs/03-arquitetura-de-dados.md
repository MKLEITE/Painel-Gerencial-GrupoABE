# 03 — Arquitetura de Dados e Integração

Este é o coração do projeto. O portal só funciona se os dados das 4 fontes forem **padronizados,
isolados por tenant e sincronizados com segurança**, sem nunca sobrecarregar o legado.

## 3.1 Princípios de dados

1. **Fonte da verdade ≠ portal.** Os sistemas de origem continuam donos do dado operacional. O portal
   tem uma **réplica de leitura consolidada**.
2. **Modelo canônico.** Todo dado vira um formato único, independente da origem (tradução de status).
3. **Multi-tenant com isolamento forte.** `tenant_id` em toda tabela + Row-Level Security no PostgreSQL.
4. **Sincronização idempotente.** Reprocessar o mesmo evento não duplica nem corrompe.
5. **Rastreabilidade.** Todo registro guarda origem, id externo e momento da última sincronização.
6. **Minimização (LGPD).** Só replicamos o que o portal precisa exibir; nada além.

## 3.2 Topologia de dados

```text
Fontes ──► Camada de ingestão (workers) ──► Staging (bruto) ──► Transformação ──► Modelo canônico
                                                                                      │
                                                              ┌───────────────────────┤
                                                              ▼                        ▼
                                                    Views materializadas         APIs do portal
                                                    (KPIs / agregados)           (leitura)
```

- **Staging (raw):** guarda o payload bruto recebido de cada fonte (auditoria + reprocessamento).
- **Canônico (core):** tabelas normalizadas que o portal consome.
- **Agregados (mart):** views materializadas para KPIs rápidos (total em cobrança, recuperado, roll rate).

## 3.3 Modelo canônico (entidades principais)

> Esquema lógico inicial. Detalhes de colunas evoluem na Fase 1, mas a forma é esta.

| Entidade | Descrição | Campos-chave |
|----------|-----------|--------------|
| `tenant` | Cliente credor | `id`, `nome`, `status`, `plano` |
| `empresa` (CNPJ) | Unidade do credor | `id`, `tenant_id`, `cnpj`, `razao_social` |
| `usuario` | Usuário do portal | `id`, `tenant_id`, `email`, `papel`, `mfa` |
| `devedor` | Pessoa/empresa devedora | `id`, `tenant_id`, `documento` (CPF/CNPJ, **criptografado**), `nome`, `documento_hash` |
| `titulo` | Dívida individual | `id`, `tenant_id`, `empresa_id`, `devedor_id`, `valor_original`, `valor_atualizado`, `fase`, `status_canonico`, `sistema_origem`, `id_externo` |
| `interacao` | Evento na linha do tempo | `id`, `tenant_id`, `titulo_id`, `tipo`, `descricao`, `data`, `sistema_origem` |
| `pagamento` | Recebimento detectado | `id`, `tenant_id`, `titulo_id`, `valor`, `data`, `sistema_origem` |
| `acordo` | Acordo firmado | `id`, `tenant_id`, `titulo_id`, `parcelas`, `status`, `sistema_origem` |
| `comando_admin` | Ação administrativa | `id`, `tenant_id`, `tipo` (transferir/pausar), `idempotency_key`, `status`, `resultado` |
| `audit_log` | Trilha de auditoria | `id`, `tenant_id`, `ator`, `acao`, `entidade`, `antes`, `depois`, `ip`, `data` |
| `sync_state` | Controle de sincronização | `fonte`, `tenant_id`, `ultimo_cursor`, `ultima_exec`, `status` |

### Dados sensíveis
- **CPF/CNPJ do devedor:** armazenado **criptografado** (coluna `documento`) + **hash** (`documento_hash`)
  para busca por igualdade sem expor o valor. Exibição **mascarada** na UI conforme o papel.
- Ver tratamento completo no doc 06 (LGPD).

## 3.4 Mapa de tradução de status (de cada fonte → canônico)

| Fase canônica | `status_canonico` (exemplos) | Avantpay | ABE Interno/ABEWeb | Acordo Seguro |
|---------------|------------------------------|----------|--------------------|---------------|
| **Preventiva** | `lembrete_enviado`, `aguardando_envio` | lembrete, pré-vencimento | — | — |
| **Cobrança Ativa** | `em_negociacao`, `atraso` | atraso > 10d | negociação humana, ligação | — |
| **Acordo** | `acordo_firmado`, `parcela_paga` | — | parcelamento | assinatura, parcela |
| **Liquidação** | `quitado` | pago | baixa por pagamento | acordo cumprido |
| **Insucesso/Baixa** | `baixado`, `quebra_acordo` | insucesso | baixa por prazo | quebra de acordo |

> Essa tabela de-para vive em **configuração versionada** (não hard-coded), por fonte, para permitir
> ajuste sem deploy. Cada credor pode ter nuances; o de-para suporta override por tenant.

## 3.5 Estratégia de sincronização por fonte

| Fonte | Mecanismo | Frequência | Detecção de mudança | Risco/cuidado |
|-------|-----------|------------|---------------------|---------------|
| **Acordo Seguro** | **Webhook** (push) + reconciliação por API | tempo quase real + diário | evento do webhook | validar assinatura do webhook; idempotência por `event_id` |
| **Avantpay** | **Polling de API** (ou arquivo) | a cada X min | cursor por `updated_at`/id | respeitar rate limit; paginação |
| **ABEWeb** | **Polling de API** | a cada X min | cursor por `updated_at` | idem |
| **SQL Server 2005** | **Agente on-premise → push** | agendado (ex.: 15 min) | tabela de staging + `timestamp`/coluna de controle | **nunca** consultar em tempo real pelo portal; SQL 2005 é EOL |

### Detalhe crítico: SQL Server 2005 (legado)
- O SQL 2005 **não tem CDC moderno** e está em fim de vida. **Não** expor à internet.
- Padrão recomendado (ver [ADR-0005](adr/0005-acesso-legado-sql2005.md)):
  1. Um **agente on-premise** (no ambiente do ABE) lê incrementos via consulta com coluna de controle
     (`data_alteracao`) ou triggers que populam uma **tabela de staging** dedicada.
  2. O agente **empurra** os incrementos para a AWS por canal seguro (HTTPS mTLS / VPN / fila).
  3. A AWS faz upsert no canônico. O portal **só lê a réplica**.
- Janela de consulta limitada e fora de pico para não impactar a operação Delphi.

## 3.6 Idempotência e consistência

- Toda mensagem de sincronização tem **chave natural** (`sistema_origem` + `id_externo`); upsert por ela.
- Eventos de webhook são deduplicados por `event_id` em uma tabela `processed_events`.
- Comandos administrativos usam `idempotency_key` única; reexecução retorna o resultado anterior.
- Consistência é **eventual** (a réplica pode estar minutos atrás). A UI mostra o **carimbo de
  "atualizado há X min"** por fonte, para transparência.

## 3.7 Views materializadas (KPIs)

Exemplos de agregados pré-calculados, refrescados após cada sincronização (por tenant/CNPJ):

- `mv_kpi_carteira` — total em cobrança por fase/sistema.
- `mv_kpi_recuperado_mes` — somatório de pagamentos do mês (bruto/líquido).
- `mv_roll_rate` — % que saiu do preventivo (Avantpay) para ativa (ABEWeb).
- `mv_carteira_por_cnpj` — visão multiempresa (total, recuperado, fase predominante).

## 3.8 Retenção, backup e ciclo de vida

| Dado | Retenção | Política |
|------|----------|----------|
| Staging (bruto) | 30–90 dias | descartável após consolidação; ajuda em reprocessamento |
| Canônico | enquanto o contrato do credor estiver ativo | base operacional do portal |
| Audit log | ≥ 5 anos (ou conforme jurídico) | imutável (append-only), exportável |
| Backups RDS | PITR 7–35 dias + snapshots | Multi-AZ; teste de restauração periódico |
| Após offboarding do credor | conforme LGPD | anonimização/eliminação documentada |

## 3.9 Migrações de banco

- Versionadas e automatizadas (ex.: **Prisma Migrate**, **Flyway** ou **Liquibase**).
- Nunca alterar schema manualmente em produção.
- Toda migração revisada em PR e aplicada via pipeline (doc 07).
