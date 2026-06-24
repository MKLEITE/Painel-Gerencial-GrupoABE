# 08 — Resiliência e Observabilidade

> O portal depende de 4 sistemas externos e não pode "cair junto" quando um deles falha. Também
> precisa garantir que **ações financeiras nunca dupliquem**. Este documento define como.

## 8.1 Princípios de resiliência

1. **Falha isolada, não total.** Uma fonte indisponível não derruba o portal; mostra-se o que há,
   com indicação de defasagem.
2. **Assíncrono e desacoplado.** Integrações e ações passam por filas; o portal não fica "preso"
   esperando sistemas lentos.
3. **Idempotência em tudo que escreve.** Reprocessar nunca duplica.
4. **Degradação graciosa.** Recurso indisponível → estado claro na UI, não erro genérico.

## 8.2 Padrões aplicados nas integrações

| Padrão | Para quê |
|--------|----------|
| **Timeout** | Nenhuma chamada externa fica pendurada indefinidamente |
| **Retry com backoff exponencial + jitter** | Recuperar de falhas transitórias sem efeito manada |
| **Circuit breaker** | Parar de bater numa fonte que está fora, e se recuperar sozinho |
| **Bulkhead** | Isolar recursos por fonte (uma fila/worker por fonte) |
| **Dead-Letter Queue (DLQ)** | Mensagens que falham N vezes vão para análise, sem travar a fila |
| **Idempotência** | Upserts por chave natural; comandos por `idempotency-key` |
| **Outbox / reconciliação** | Garantir que evento processado = estado consistente; job diário reconcilia |

### Ação crítica "Transferir" — garantia anti-duplicidade
1. Requisição com `Idempotency-Key`; backend grava `comando_admin` com status `PENDENTE` (uma vez por chave).
2. Worker executa em etapas idempotentes: (a) criar/atualizar no ABEWeb; (b) pausar no Avantpay.
3. Cada etapa verifica se já foi feita (consulta id externo) antes de repetir.
4. Falha parcial → marca a etapa pendente e reprocessa só ela; nunca recomeça do zero cobrando de novo.
5. Tudo auditado; falha definitiva vai para DLQ e gera **alerta**.

## 8.3 Disponibilidade e dados

- **RDS Multi-AZ** (failover automático) + **PITR** (point-in-time recovery).
- Backups automáticos + snapshots; **teste de restauração** periódico (backup que não se testa não existe).
- Workers stateless e escaláveis horizontalmente.
- Filas absorvem picos; autoscaling por profundidade de fila.

## 8.4 Defasagem transparente (frescor dos dados)

- Cada fonte registra `ultima_exec` em `sync_state`.
- A UI mostra "atualizado há X min" por fonte.
- Se uma fonte está atrasada além do limite (ex.: > 1h), exibe-se aviso e alerta interno é disparado.

## 8.5 Observabilidade (os 3 pilares)

| Pilar | Ferramenta | O que capturamos |
|-------|------------|------------------|
| **Logs** | CloudWatch (estruturados em JSON) | Eventos da aplicação com `traceId`, `tenantId` (sem dados sensíveis) |
| **Métricas** | CloudWatch / OpenTelemetry | Latência, erros, throughput, profundidade de fila, saúde das fontes |
| **Tracing** | OpenTelemetry | Rastreio distribuído ponta a ponta (request → worker → fonte) |

Regras de log:
- **Nunca** logar CPF/CNPJ, token, senha ou payload sensível.
- Todo log carrega `traceId` para correlação com o erro mostrado ao usuário.
- Logs de auditoria são separados dos logs operacionais (ver doc 06).

## 8.6 Métricas-chave (SLI) e metas (SLO)

| SLI | SLO inicial |
|-----|-------------|
| Disponibilidade da API | 99,5% (evoluir p/ 99,9%) |
| Latência p95 do dashboard | < 2s |
| Latência p95 da busca | < 2s |
| Sucesso de sincronização por fonte | > 99% das execuções |
| Atraso de sincronização | < 15 min (alerta se > 1h) |
| Erro 5xx | < 0,5% das requisições |

## 8.7 Alertas

Alertar (com severidade) quando:
- Erro 5xx acima do limite, ou circuit breaker aberto para uma fonte.
- Mensagens acumulando na DLQ.
- Sincronização de uma fonte parada além do limite.
- Falha em ação administrativa (transferir/pausar).
- Falha de login em massa / picos suspeitos (sinal de ataque).
- RDS com CPU/conexões/armazenamento em nível crítico.

Canais: e-mail/Slack/PagerDuty (definir). Runbooks associados a cada alerta (o que fazer).

## 8.8 Continuidade de negócio (DR)

- **RPO** (perda máxima aceitável de dados): definir (ex.: 15 min) — coberto por PITR + filas.
- **RTO** (tempo máximo para voltar): definir (ex.: 1h) — coberto por Multi-AZ + IaC para recriar.
- Como a fonte da verdade são os sistemas de origem, o portal pode ser **reconstruído** via
  re-sincronização em caso de perda total da réplica (vantagem do desenho).

## 8.9 Testes de resiliência

- Testes de carga em staging (k6/Artillery) antes do go-live.
- Simular fonte fora do ar e verificar degradação graciosa.
- Simular reprocessamento de eventos (garantir idempotência).
- Game day / chaos leve antes de escalar para muitos credores.
