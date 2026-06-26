/* Definição dos Parâmetros de Entrada */
DECLARE @idCliente INT = '40032'; -- (1) Informe o Código do Cliente
DECLARE @DataInicial VARCHAR(10) = '01/01/2026'; -- (2) Informe a Data Inicial (formato DD/MM/AAAA)
DECLARE @DataFinal VARCHAR(10) = '31/12/2026'; -- (3) Informe a Data Final (formato DD/MM/AAAA)
DECLARE @pageNumber INT = 0; -- Informe o número da página (OFFSET)
DECLARE @pageSize INT = 50; -- Informe a quantidade de registros por página

/* Lógica Interna */
DECLARE @idClientePrincipal INTEGER;
SET @idClientePrincipal = (SELECT idClientePrincipal FROM Cliente WHERE idCliente = @idCliente);

SELECT 
    P.idCliente AS [Codigo Cliente],
    C.Nome AS [Nome Cliente],
    CONVERT(INTEGER, P.idProcesso) AS [Processo],
    COALESCE(P.CodigoNoCliente, '') AS [Código Devedor],
    D.razaoSocial AS [Razão Social Devedor],
    D.cnpjCpf AS [CNPJ-CPF],
    D.Cidade AS [Cidade],
    D.idEstado AS [Estado],
    T.numero AS [Nr. Título],
    CONVERT(VARCHAR(10), T.DataVencimento, 103) AS [Vencimento],
    CONVERT(VARCHAR(10), P.DataAbertura, 103) AS [Data Inclusão],
    DATEDIFF(DAY, T.DataVencimento, P.DataAbertura) AS [Idade Titulo Cadastramento],
    REPLACE(CONVERT(VARCHAR(20), (CASE 
        WHEN (FF.idFichaFinanceira IS NULL) THEN T.valorOriginal
        WHEN (FF.idFichaFinanceira IS NOT NULL) THEN 
            (CASE 
                WHEN ( (SELECT COUNT(*) FROM FichaFinanceira FF2 WHERE (FF2.idTitulo = T.idTitulo) ) = 1 ) THEN T.valorOriginal
                ELSE (CASE 
                        WHEN (FF.idFichaFinanceira = (SELECT TOP 1 FF2.idFichaFinanceira FROM FichaFinanceira FF2 WHERE (FF2.idTitulo = T.idTitulo) ORDER BY FF2.idFichaFinanceira) ) THEN T.valorOriginal
                        ELSE 0 
                      END)
            END)
        ELSE 0 
    END)), '.', ',') AS [Valor Original Título],
    REPLACE(CONVERT(VARCHAR(20), (CASE WHEN FF.idPagamentoDireto IS NULL THEN COALESCE(FF.valorComissaoPagaCliente, 0) ELSE 0 END) ), '.', ',') AS [Juros],
    REPLACE(CONVERT(VARCHAR(20), COALESCE(T.valorProtestoInicial, 0) ), '.', ',') AS [Protesto],
    REPLACE(CONVERT(VARCHAR(20), (CASE 
        WHEN (FF.idFichaFinanceira IS NULL) THEN 0
        WHEN (FF.idFichaFinanceira IS NOT NULL) THEN 
            (CASE 
                WHEN (FF.idFichaFinanceira = (SELECT TOP 1 FF2.idFichaFinanceira FROM FichaFinanceira FF2 WHERE (FF2.idTitulo = T.idTitulo) ORDER BY FF2.idFichaFinanceira) ) 
                THEN COALESCE( ( SELECT SUM(FF2.valorSaldoPrincipal + FF2.valorJurosCliente + FF2.ValorProtesto + FF2.ValorMulta) FROM FichaFinanceira FF2 WHERE (FF2.idTitulo = T.idTitulo) ), 0 )
                ELSE 0 
            END)
        ELSE 0 
    END)), '.', ',') AS [Valor Pago],
    REPLACE(CONVERT(VARCHAR(20), (CASE WHEN FF.idPagamentoDireto IS NOT NULL THEN FF.valorComissaoPagaCliente ELSE 0 END) ), '.', ',') AS [Comissão],
    REPLACE(CONVERT(VARCHAR(20), (CASE 
        WHEN (FF.idFichaFinanceira IS NULL) THEN 0
        WHEN (FF.idFichaFinanceira IS NOT NULL) THEN 
            (CASE 
                WHEN (FF.idFichaFinanceira = (SELECT TOP 1 FF2.idFichaFinanceira FROM FichaFinanceira FF2 WHERE (FF2.idTitulo = T.idTitulo) ORDER BY FF2.idFichaFinanceira) ) 
                THEN ( (FF.valorSaldoPrincipal + FF.valorJurosCliente + FF.ValorProtesto + FF.ValorMulta) - FF.valorComissaoPagaCliente)
                ELSE 0 
            END)
        ELSE 0 
    END)), '.', ',') AS [Total Liquido],
    REPLACE(CONVERT(VARCHAR(20), (CASE 
        WHEN (FF.idFichaFinanceira IS NULL) THEN T.valorOriginal
        WHEN (FF.idFichaFinanceira IS NOT NULL) THEN 
            (CASE 
                WHEN (FF.idFichaFinanceira = (SELECT TOP 1 FF2.idFichaFinanceira FROM FichaFinanceira FF2 WHERE (FF2.idTitulo = T.idTitulo) ORDER BY FF2.idFichaFinanceira) ) 
                THEN (T.valorSaldoPrincipal + T.valorJurosCliente + T.ValorProtesto + T.ValorMulta)
                ELSE 0 
            END)
        ELSE 0 
    END)), '.', ',') AS [Valor Saldo Devedor],
    COALESCE(CONVERT(VARCHAR(10), (SELECT TOP 1 PCC.dataPrestacao 
                                   FROM ContaCorrenteCliente CC 
                                   JOIN ContaCorrenteClienteFicha CCF ON CCF.idContaCorrenteCliente = CC.idContaCorrenteCliente 
                                   JOIN PrestacaoContaCliente PCC ON CC.idCliente = PCC.idCliente AND CC.idPrestacao = PCC.idPrestacao 
                                   WHERE CC.idCliente = C.idCliente AND CCF.idFichaFinanceira = FF.idFichaFinanceira), 103), '') AS [Data Repasse],
    COALESCE(DATEDIFF(DAY, P.DataAbertura, (SELECT TOP 1 PCC.dataPrestacao 
                                            FROM ContaCorrenteCliente CC 
                                            JOIN ContaCorrenteClienteFicha CCF ON CCF.idContaCorrenteCliente = CC.idContaCorrenteCliente 
                                            JOIN PrestacaoContaCliente PCC ON CC.idCliente = PCC.idCliente AND CC.idPrestacao = PCC.idPrestacao 
                                            WHERE CC.idCliente = C.idCliente AND CCF.idFichaFinanceira = FF.idFichaFinanceira)), 0) AS [Idade No Recebimento],
    CONVERT(VARCHAR(40), CASE 
        WHEN FF.idFichaFinanceira IS NULL THEN ''
        ELSE (CASE 
                WHEN ( COALESCE( (FF.valorSaldoPrincipal + FF.valorProtesto + FF.valorMulta + FF.valorJurosCliente + FF.valorJurosABE + FF.valorHonorarios),0 ) >= 
                       COALESCE( (FF.valorSaldoPrincipalInicial + FF.valorProtestoInicial + FF.valorMultaInicial + FF.valorJurosClienteInicial + FF.valorJurosABEInicial + FF.valorHonorariosInicial),0) ) 
                THEN (CASE WHEN FF.idPagamentoDireto IS NULL THEN 'Pagamento Final' ELSE 'Pagamento Direto Final' END)
                ELSE (CASE WHEN FF.idPagamentoDireto IS NULL THEN 'Pagamento Parcial' ELSE 'Pagamento Direto Parcial' END)
              END)
    END) AS [Tipo],
    dbo.F_CalcularDescricaoStatus(dbo.F_ajustarStatus(P.idMotivoBaixa, P.existirCobrancaJudicial)) AS [Status],
    CONVERT(VARCHAR(255), SUBSTRING(COALESCE((SELECT TOP 1 PA.texto FROM ProcessoAcompanhamento PA WHERE PA.idProcesso = P.idProcesso AND PA.idTipoAcompanhamento = 6 ORDER BY PA.idProcessoAcompanhamento DESC), ''), 1, 255) ) AS [Último Relatório],
    dbo.F_CalcularStatusNegociacao(P.idProcesso) AS [Visão Geral da Carteira],
    CONVERT(VARCHAR(10), P.databaixa, 103) AS [Data Baixa],
    MB.descricao AS [Motivo Baixa]
FROM Processo P
JOIN V_Devedor D ON (P.idDevedor = D.idDevedor)
JOIN Titulo T ON (P.idProcesso = T.idProcesso)
LEFT JOIN MotivoBaixa MB ON (P.idMotivoBaixa = MB.idMotivoBaixa)
JOIN Cliente C ON (C.idCliente = P.idCliente)
LEFT JOIN FichaFinanceira FF ON (FF.idTitulo = T.idTitulo)
WHERE (C.idClientePrincipal = @idClientePrincipal)
  AND ( (P.idMotivoBaixa IS NULL) OR ( (P.idMotivoBaixa IS NOT NULL) AND (P.idMotivoBaixa NOT IN (6,8)) ) ) 
  AND (P.DataAbertura >= CONVERT(DATE, @DataInicial, 103)) 
  AND (P.DataAbertura <= CONVERT(DATE, @DataFinal, 103))
ORDER BY 1, 3
OFFSET @pageNumber ROWS FETCH NEXT @pageSize ROWS ONLY;