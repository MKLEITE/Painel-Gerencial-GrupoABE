# ADR-0005 — Acesso ao legado SQL Server 2005

Status: **Aceito**
Data: 2026-06-18 · Atualizado: 2026-06-24

## Contexto

O sistema interno do ABE roda em **Delphi + SQL Server 2005**, que está em **fim de vida** (sem
suporte/atualizações de segurança) e é a base operacional crítica. O portal **não pode consultar
esse banco em tempo real**, sob risco de travar a operação. Também não podemos expor o SQL 2005 à internet.

## Decisão

Implementar um **agente de sincronização on-premise**, executado no ambiente do ABE, que:

1. Lê **incrementos** do SQL 2005 (via coluna de controle `data_alteracao` ou triggers que populam uma
   **tabela de staging** dedicada), em janelas agendadas e **fora de pico**.
2. **Empurra** os incrementos para o **Supabase PostgreSQL** (modelo canônico) por **HTTPS** autenticado,
   nunca abrindo o banco legado para a internet.
3. Faz **upsert idempotente** nas tabelas `public.*` do Supabase. O **portal só lê a réplica**.

Destino dos dados: projeto Supabase `https://vkzefmedwxvpqcivparz.supabase.co`.

## Consequências

**Positivas**

- O legado nunca é exposto nem consultado em tempo real pelo portal.
- Carga controlada e fora de pico → sem impacto na operação Delphi.
- Réplica no Supabase pode ser reconstruída por re-sincronização.
- RLS e Auth já disponíveis no destino.

**Negativas**

- Consistência **eventual** (réplica minutos atrás) — indicador de frescor na UI.
- Requer instalar e manter agente no ambiente ABE.
- SQL 2005 não tem CDC moderno → detecção de mudança via coluna de controle/triggers (validar com equipe ABE).

## Alternativas consideradas

- **Conexão direta do portal ao SQL 2005:** rejeitada (risco à operação e à segurança).
- **Migrar SQL 2005 antes do portal:** ideal a longo prazo, fora do escopo atual.
- **Replicação nativa SQL Server:** limitada nessa versão; risco ao legado.
