/**
 * Ponto de entrada dos workers de integração.
 *
 * Na Fase 1, aqui ficará o consumo das filas (SQS) e o agendamento das
 * sincronizações. Cada conector implementa `SourceConnector` (ver connector.ts).
 */
export * from './connector.js';

console.warn('[workers] esqueleto — implementação dos conectores na Fase 1');
