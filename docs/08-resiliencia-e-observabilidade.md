# 08 — Resiliência e Observabilidade

> O portal depende de 4 sistemas externos e não pode "cair junto" quando um deles falha. Também
> precisa garantir que **ações financeiras nunca dupliquem**. Este documento define como.

## 8.1 Princípios de resiliência

1. **Falha isolada, não total.** Uma fonte indisponível não derruba o portal; mostra-se o que há,
   com indicação de defasagem.
2. **Assíncrono e desacoplado.** Integrações e ações passam por filas/workers (futuro); o portal não
   fica "preso" esperando sistemas lentos.
3. **Idempotência em tudo que escreve.** Reprocessar nunca duplica.
4. **Degradação graciosa.** Recurso indisponível → estado claro na UI, não erro genérico.

## 8.2 Padrões aplicados nas integrações (futuro)

| Padrão | Para quê |
|--------|----------|
| **Timeout** | Nenhuma chamada externa fica pendurada indefinidamente |
| **Retry com backoff exponencial + jitter** | Recuperar de falhas transitórias |
| **Circuit breaker** | Parar de bater numa fonte que está fora |
| **Bulkhead** | Isolar recursos por fonte |
| **Dead-letter queue** | Mensagens que falham N vezes vão para análise |
| **Idempotência** | Upserts por chave natural; comandos por `idempotency-key` |
| **Reconciliação** | Job diário reconcilia estado entre fontes e réplica |

### Ação crítica "Transferir" — garantia anti-duplicidade

1. Requisição com `Idempotency-Key`; grava `comando_admin` com status `PENDENTE`.
2. Worker executa em etapas idempotentes.
3. Falha parcial → reprocessa só a etapa pendente.
4. Tudo auditado; falha definitiva gera alerta.

## 8.3 Disponibilidade e dados

| Camada | Resiliência |
|--------|-------------|
| **Vercel** | Edge global, auto-failover, redeploy rápido para rollback |
| **Supabase PostgreSQL** | HA gerenciada pelo Supabase; PITR conforme plano |
| **Supabase Auth** | Serviço gerenciado com SLA do provedor |

- Backups automáticos no Supabase — **testar restauração** periodicamente.
- Route Handlers stateless — escalam horizontalmente na Vercel.

## 8.4 Defasagem transparente (frescor dos dados)

- Cada fonte registra `ultima_exec` em `sync_state`.
- A UI mostra "atualizado há X min" por fonte.
- Se atraso > limite (ex.: 1h), aviso na UI + alerta interno.

## 8.5 Observabilidade

### Vercel

| Recurso | O que captura |
|---------|---------------|
| **Runtime Logs** | Erros de Route Handlers, build, function crashes |
| **Analytics** (opcional) | Tráfego, Web Vitals |
| **Speed Insights** (opcional) | Performance frontend |

### Supabase

| Recurso | O que captura |
|---------|---------------|
| **Dashboard → Logs** | Queries, Auth events, API errors |
| **Dashboard → Reports** | Database health, connections |
| **Auth logs** | Login, signup, token refresh |

Regras de log:

- **Nunca** logar CPF/CNPJ, token, senha ou `SUPABASE_SERVICE_ROLE_KEY`.
- Prefixar logs de admin: `[admin/credores GET]`, etc.
- Logs de auditoria separados dos operacionais (doc 06).

## 8.6 Métricas-chave (SLI) e metas (SLO)

| SLI | SLO inicial |
|-----|-------------|
| Disponibilidade do portal (Vercel) | 99,5% |
| Latência p95 do dashboard | < 2s |
| Latência p95 da busca | < 2s |
| Sucesso de sincronização por fonte | > 99% |
| Atraso de sincronização | < 15 min (alerta se > 1h) |
| Erro 5xx nas Route Handlers | < 0,5% |

## 8.7 Alertas

Alertar quando:

- Erro 5xx acima do limite na Vercel.
- Circuit breaker aberto para uma fonte.
- Sincronização parada além do limite.
- Falha em ação administrativa (transferir/pausar).
- Picos suspeitos de falha de login.
- Supabase: conexões ou storage em nível crítico (Dashboard).

Canais: e-mail/Slack (definir). Runbooks associados a cada alerta.

## 8.8 Continuidade de negócio (DR)

- **RPO:** definir conforme plano Supabase (PITR em Pro).
- **RTO:** redeploy Vercel (~minutos) + restore Supabase se necessário.
- Como a fonte da verdade são os sistemas de origem, a réplica pode ser **reconstruída** via re-sincronização.

## 8.9 Testes de resiliência

- Testes de carga em staging (k6/Artillery) antes do go-live.
- Simular fonte fora do ar → degradação graciosa na UI.
- Simular reprocessamento de eventos → idempotência.
- Testar rollback de deploy na Vercel.
