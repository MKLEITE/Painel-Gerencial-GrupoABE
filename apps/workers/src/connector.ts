import type { Titulo } from '@abe/canonical-model';

/**
 * Contrato comum de um conector de fonte.
 *
 * Cada fonte (Avantpay, ABEWeb, Acordo Seguro, legado SQL 2005) implementa esta
 * interface, traduzindo seus dados para o modelo canônico. A sincronização deve
 * ser IDEMPOTENTE: reprocessar o mesmo dado não pode duplicar nem corromper.
 *
 * Ver docs/03-arquitetura-de-dados.md (estratégia de sincronização por fonte).
 */
export interface ResultadoSincronizacao {
  titulosAtualizados: Titulo[];
  /** Cursor para a próxima execução incremental (ex.: maior updatedAt processado). */
  proximoCursor: string | null;
}

export interface SourceConnector {
  readonly nome: string;

  /**
   * Busca incrementos desde o cursor informado.
   * @param tenantId tenant alvo
   * @param cursor cursor da última execução (null = primeira carga)
   */
  sincronizar(tenantId: string, cursor: string | null): Promise<ResultadoSincronizacao>;
}
