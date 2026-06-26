/**
 * Checagem leve no ABE WEB — detecta se houve alteração desde o último sync.
 * Muito mais rápido que puxar todas as páginas da query 749.
 */

import sql from 'mssql';

const CHECK_BORDERO_SQL = `
DECLARE @idClientePrincipal INTEGER;
SET @idClientePrincipal = (SELECT idClientePrincipal FROM Cliente WHERE idCliente = @idCliente);

SELECT
  COUNT(*) AS novos_processos,
  MAX(P.DataAbertura) AS ultima_abertura
FROM Processo P
JOIN Cliente C ON C.idCliente = P.idCliente
WHERE C.idClientePrincipal = @idClientePrincipal
  AND (P.idMotivoBaixa IS NULL OR (P.idMotivoBaixa IS NOT NULL AND P.idMotivoBaixa NOT IN (6, 8)))
  AND (@since IS NULL OR P.DataAbertura > @since);
`;

const CHECK_REPASSE_SQL = `
DECLARE @idClientePrincipal INTEGER;
SET @idClientePrincipal = (SELECT idClientePrincipal FROM Cliente WHERE idCliente = @idCliente);

SELECT COUNT(*) AS novos_repasses
FROM Processo P
JOIN Cliente C ON C.idCliente = P.idCliente
JOIN Titulo T ON T.idProcesso = P.idProcesso
JOIN FichaFinanceira FF ON FF.idTitulo = T.idTitulo
JOIN ContaCorrenteClienteFicha CCF ON CCF.idFichaFinanceira = FF.idFichaFinanceira
JOIN ContaCorrenteCliente CC ON CC.idContaCorrenteCliente = CCF.idContaCorrenteCliente
JOIN PrestacaoContaCliente PCC ON CC.idCliente = PCC.idCliente AND CC.idPrestacao = PCC.idPrestacao
WHERE C.idClientePrincipal = @idClientePrincipal
  AND (@since IS NULL OR PCC.dataPrestacao > @since);
`;

export async function checkAbeWebChanges(pool, codCliente, sinceDate = null) {
  const idCliente = Number.parseInt(String(codCliente), 10);
  if (!Number.isFinite(idCliente)) {
    throw new Error(`Código cliente inválido: ${codCliente}`);
  }

  const since = sinceDate ? new Date(sinceDate) : null;

  const borderoReq = pool.request().input('idCliente', sql.Int, idCliente);
  if (since) borderoReq.input('since', sql.DateTime2, since);
  else borderoReq.input('since', sql.DateTime2, null);

  const repasseReq = pool.request().input('idCliente', sql.Int, idCliente);
  if (since) repasseReq.input('since', sql.DateTime2, since);
  else repasseReq.input('since', sql.DateTime2, null);

  const [borderoRes, repasseRes] = await Promise.all([
    borderoReq.query(CHECK_BORDERO_SQL),
    repasseReq.query(CHECK_REPASSE_SQL),
  ]);

  const bordero = borderoRes.recordset?.[0] ?? {};
  const repasse = repasseRes.recordset?.[0] ?? {};

  const novosProcessos = Number(bordero.novos_processos ?? 0);
  const novosRepasses = Number(repasse.novos_repasses ?? 0);
  const ultimaAbertura = bordero.ultima_abertura ?? null;

  return {
    precisaSync: novosProcessos > 0 || novosRepasses > 0,
    novosProcessos,
    novosRepasses,
    ultimaAbertura,
    motivo:
      novosProcessos > 0 && novosRepasses > 0
        ? 'borderô e repasses'
        : novosProcessos > 0
          ? 'novos borderôs'
          : novosRepasses > 0
            ? 'novos repasses'
            : 'sem alterações',
  };
}
