# @abe/workers — Workers de Integração

Serviços que sincronizam as 4 fontes para a réplica do portal, traduzindo para o
modelo canônico. Ver [`docs/03-arquitetura-de-dados.md`](../../docs/03-arquitetura-de-dados.md).

## Conectores previstos (Fase 1+)

| Fonte | Mecanismo | Pasta (a criar) |
|-------|-----------|-----------------|
| Avantpay | Polling de API / arquivo | `src/integrations/avantpay/` |
| ABEWeb | Polling de API | `src/integrations/abeweb/` |
| Acordo Seguro | Webhook + reconciliação | `src/integrations/acordo-seguro/` |
| SQL Server 2005 | Push do agente on-premise | `src/integrations/legado-sql2005/` |

Cada conector implementa a interface `SourceConnector` (`src/connector.ts`) e deve ser
**idempotente** (reprocessar não duplica).
