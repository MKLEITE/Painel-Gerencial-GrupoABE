# 03 — Arquitetura de Dados e Integração

Este é o coração do projeto. O portal só funciona se os dados das 4 fontes forem **padronizados,
isolados por tenant e sincronizados com segurança**, sem nunca sobrecarregar o legado.

## 3.1 Princípios de dados

1. **Fonte da verdade ≠ portal.** Os sistemas de origem continuam donos do dado operacional. O portal
   tem uma **réplica de leitura consolidada** no Supabase PostgreSQL.
2. **Modelo canônico.** Todo dado vira um formato único, independente da origem.
3. **Multi-tenant com isolamento forte.** `tenant_id` em toda tabela + Row-Level Security.
4. **Sincronização idempotente.** Reprocessar o mesmo evento não duplica nem corrompe.
5. **Rastreabilidade.** Todo registro guarda origem, id externo e momento da última sincronização.
6. **Minimização (LGPD).** Só replicamos o que o portal precisa exibir.

## 3.2 Topologia de dados

```text
Fontes ──► Camada de ingestão (workers) ──► Staging (bruto) ──► Transformação ──► Modelo canônico
                                                                                      │
                                                              ┌───────────────────────┤
                                                              ▼                        ▼
                                                    Views materializadas         Next.js / Supabase
                                                    (KPIs / agregados)           (leitura com RLS)
```

- **Staging (raw):** payload bruto por fonte (auditoria + reprocessamento).
- **Canônico (core):** tabelas normalizadas em `public.*` no Supabase.
- **Agregados (mart):** views materializadas para KPIs.

## 3.3 Banco de dados — Supabase PostgreSQL

| Aspecto | Detalhe |
|---------|---------|
| **Provedor** | Supabase |
| **Projeto** | `https://vkzefmedwxvpqcivparz.supabase.co` |
| **Schema versionado** | `supabase/migrations/` |
| **Auth** | `auth.users` (Supabase Auth) |
| **Perfil** | `public.usuarios` (`id` = `auth.users.id`) |
| **RLS** | Habilitado desde `001_initial_schema.sql` |

### Tabelas atuais (Fase 0)

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Cliente credor ou tenant plataforma |
| `usuarios` | Perfil (papel, tenant) — sem senha local |
| `credores` | Dados da empresa credora (1:1 com tenant) |
| `codigos_cliente` | Códigos adicionais de cliente por credor |

### Entidades planejadas (Fase 1+)

| Entidade | Descrição | Campos-chave |
|----------|-----------|--------------|
| `devedor` | Pessoa/empresa devedora | `tenant_id`, `documento` (criptografado), `documento_hash` |
| `titulo` | Dívida individual | `tenant_id`, `fase`, `status_canonico`, `sistema_origem`, `id_externo` |
| `interacao` | Evento na linha do tempo | `tenant_id`, `titulo_id`, `tipo`, `sistema_origem` |
| `pagamento` | Recebimento detectado | `tenant_id`, `titulo_id`, `valor`, `sistema_origem` |
| `acordo` | Acordo firmado | `tenant_id`, `titulo_id`, `parcelas`, `status` |
| `comando_admin` | Ação administrativa | `idempotency_key`, `status` |
| `audit_log` | Trilha de auditoria | append-only |
| `sync_state` | Controle de sincronização | `fonte`, `tenant_id`, `ultima_exec` |

## 3.4 Row-Level Security (RLS)

Políticas implementadas em `001_initial_schema.sql`:

- **Credores:** leem/escrevem apenas dados do próprio `tenant_id`.
- **SUPER_ADMIN:** acesso total via `is_super_admin()`.
- Função auxiliar `current_tenant_id()` extrai tenant do JWT/perfil.

Operações admin (criar credor, usuários) usam **service role** nas Route Handlers, após validar `SUPER_ADMIN`.

## 3.5 Mapa de tradução de status (de cada fonte → canônico)

| Fase canônica | `status_canonico` (exemplos) | Avantpay | ABE Interno/ABEWeb | Acordo Seguro |
|---------------|------------------------------|----------|--------------------|---------------|
| **Preventiva** | `lembrete_enviado`, `aguardando_envio` | lembrete, pré-vencimento | — | — |
| **Cobrança Ativa** | `em_negociacao`, `atraso` | atraso > 10d | negociação humana | — |
| **Acordo** | `acordo_firmado`, `parcela_paga` | — | parcelamento | assinatura, parcela |
| **Liquidação** | `quitado` | pago | baixa por pagamento | acordo cumprido |
| **Insucesso/Baixa** | `baixado`, `quebra_acordo` | insucesso | baixa por prazo | quebra de acordo |

## 3.6 Estratégia de sincronização por fonte

| Fonte | Mecanismo | Frequência | Risco/cuidado |
|-------|-----------|------------|---------------|
| **Acordo Seguro** | Webhook + reconciliação | tempo quase real | validar assinatura; idempotência por `event_id` |
| **Avantpay** | Polling de API | a cada X min | rate limit; paginação |
| **ABEWeb** | Polling de API | a cada X min | idem |
| **SQL Server 2005** | Agente on-premise → push | agendado (~15 min) | **nunca** consultar em tempo real |

### SQL Server 2005 (legado)

Ver [ADR-0005](adr/0005-acesso-legado-sql2005.md):

1. Agente on-premise lê incrementos do SQL 2005.
2. Empurra para o **Supabase PostgreSQL** (modelo canônico) via HTTPS.
3. Portal **só lê** a réplica no Supabase.

## 3.7 Idempotência e consistência

- Chave natural: `sistema_origem` + `id_externo` → upsert.
- Webhooks deduplicados por `event_id`.
- Comandos admin com `idempotency_key`.
- Consistência **eventual** — UI mostra "atualizado há X min" por fonte.

## 3.8 Views materializadas (KPIs — futuro)

- `mv_kpi_carteira` — total em cobrança por fase/sistema.
- `mv_kpi_recuperado_mes` — pagamentos do mês.
- `mv_roll_rate` — % preventivo → ativo.
- Refrescar via cron ou trigger pós-sync.

## 3.9 Retenção, backup e ciclo de vida

| Dado | Retenção | Política |
|------|----------|----------|
| Staging (bruto) | 30–90 dias | descartável após consolidação |
| Canônico | enquanto contrato ativo | base operacional |
| Audit log | ≥ 5 anos | imutável |
| Backups Supabase | conforme plano (PITR disponível em Pro) | teste de restauração periódico |
| Após offboarding | conforme LGPD | anonimização/eliminação |

Backups gerenciados pelo **Supabase** — configurar retenção e PITR no Dashboard conforme plano contratado.

## 3.10 Migrações de banco

- SQL versionado em `supabase/migrations/`.
- Aplicar via **SQL Editor** ou **Supabase CLI**.
- Nunca alterar schema manualmente em produção sem migration versionada.
- Toda migration revisada em PR.
