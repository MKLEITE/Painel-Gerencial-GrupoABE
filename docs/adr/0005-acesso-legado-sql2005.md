# ADR-0005 — Acesso ao legado SQL Server 2005

Status: Proposto
Data: 2026-06-18

## Contexto
O sistema interno do ABE roda em **Delphi + SQL Server 2005**, que está em **fim de vida** (sem
suporte/atualizações de segurança) e é a base operacional crítica. O documento original alerta para
**não consultar esse banco em tempo real** pelo portal, sob risco de travar a operação. Também não
podemos expor o SQL 2005 à internet.

## Decisão
Implementar um **agente de sincronização on-premise**, executado no ambiente do ABE, que:
1. Lê **incrementos** do SQL 2005 (via coluna de controle `data_alteracao` ou triggers que populam uma
   **tabela de staging** dedicada), em janelas agendadas e **fora de pico**.
2. **Empurra** os incrementos para a AWS por **canal seguro** (HTTPS com mTLS, ou VPN/Direct Connect,
   ou fila), nunca abrindo o banco para a internet.
3. A AWS faz **upsert idempotente** no modelo canônico. O **portal só lê a réplica**.

## Consequências
**Positivas**
- O legado nunca é exposto nem consultado em tempo real pelo portal.
- Carga controlada e fora de pico → sem impacto na operação Delphi.
- Permite reconstruir a réplica por re-sincronização em caso de perda.

**Negativas**
- Consistência **eventual** (a réplica fica alguns minutos atrás) — tratada com indicador de frescor na UI.
- Requer instalar e manter um agente no ambiente do cliente (operacional).
- SQL 2005 não tem CDC moderno → detecção de mudança depende de coluna de controle/triggers (a validar
  com a equipe ABE).

## Alternativas consideradas
- **Conexão direta do portal ao SQL 2005:** rejeitada (risco à operação e à segurança).
- **Migrar o SQL 2005 para versão moderna primeiro:** ideal a longo prazo, mas fora do escopo/Prazo
  desta fase; pode ser recomendado ao cliente como evolução.
- **Replicação nativa do SQL Server:** limitada/arriscada nessa versão antiga e pode exigir mudanças no legado.
