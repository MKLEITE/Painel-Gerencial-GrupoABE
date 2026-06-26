DECLARE @CodCliente INTEGER = 18476;

DECLARE @DataInicial DATE = CONVERT(DATE, '01/01/2015', 103);
DECLARE @DataFinal   DATE = CAST(GETDATE() AS DATE);

-- ==========================================================
-- CTEs para eliminar subqueries correlacionadas repetidas
-- Nenhuma lógica foi alterada — apenas pré-calculado uma vez
-- ==========================================================

;WITH CodPrincipalAlvo AS (
    -- Resolve o CodPrincipal do cliente uma única vez
    SELECT CodPrincipal
    FROM Cliente
    WHERE CodCliente = @CodCliente
),

-- Pré-calcula contagens e somas do DemonstrativoTitulo por SeqTitulo
AggDT AS (
    SELECT
        DT.SeqTitulo,

        -- Primeiro SeqDemonstrativo elegível (P/D/G ou NULL, exceto D+D)
        MIN(CASE
              WHEN (DT.Tipo IN ('P','D','G') OR DT.Tipo IS NULL)
               AND ( (DT.Indicador IS NULL AND DT.Tipo IS NULL)
                  OR ( (DT.Indicador IS NOT NULL OR DT.Tipo IS NOT NULL)
                       AND (DT.Indicador <> 'D' OR DT.Tipo <> 'D') ) )
              THEN DT.SeqDemonstrativo
            END)                                                        AS FirstSeqDemoEligivel,

        -- Primeiro SeqDemonstrativo P/D/G
        MIN(CASE WHEN DT.Tipo IN ('P','D','G') THEN DT.SeqDemonstrativo END) AS FirstSeqDemoPDG,

        -- Contagem de registros P/D/G (usado no Valor Original Título)
        SUM(CASE WHEN DT.Tipo IN ('P','D','G') THEN 1 ELSE 0 END)      AS CntPDG,

        -- Contagem de registros com Indicador F
        SUM(CASE WHEN DT.Indicador = 'F' THEN 1 ELSE 0 END)            AS CntIndicadorF,

        -- Contagem de P com Indicador F (usado em Posição/Recebido)
        SUM(CASE WHEN DT.Tipo = 'P' AND DT.Indicador = 'F' THEN 1 ELSE 0 END) AS CntP_F,

        -- Contagem total (usado em Posição/Ativo)
        COUNT(*)                                                        AS CntAll,

        -- Soma P/D/G (Valor Pago)
        SUM(CASE WHEN DT.Tipo IN ('P','D','G')
                 THEN COALESCE(DT.ValorOriginal,0) + COALESCE(DT.ValorCorrecao,0)
                    + COALESCE(DT.ValorProtesto,0) + COALESCE(DT.ValorMulta,0)
                 ELSE 0 END)                                            AS SumPDG,

        -- Soma I (Valor Saldo Devedor parte 1)
        SUM(CASE WHEN DT.Tipo = 'I'
                 THEN COALESCE(DT.ValorOriginal,0) + COALESCE(DT.ValorCorrecao,0)
                    + COALESCE(DT.ValorProtesto,0) + COALESCE(DT.ValorMulta,0)
                 ELSE 0 END)                                            AS SumI,

        -- Soma A+E (Valor Saldo Devedor parte 1)
        SUM(CASE WHEN DT.Tipo IN ('A','E')
                 THEN COALESCE(DT.ValorOriginal,0) + COALESCE(DT.ValorCorrecao,0)
                    + COALESCE(DT.ValorProtesto,0) + COALESCE(DT.ValorMulta,0)
                 ELSE 0 END)                                            AS SumAE,

        -- Soma I+A (Valor Saldo Devedor parte 2)
        SUM(CASE WHEN DT.Tipo IN ('I','A')
                 THEN COALESCE(DT.ValorOriginal,0) + COALESCE(DT.ValorCorrecao,0)
                    + COALESCE(DT.ValorProtesto,0) + COALESCE(DT.ValorMulta,0)
                 ELSE 0 END)                                            AS SumIA,

        -- Flag: tem registros fora de I/A? (filtro da parte 2)
        SUM(CASE WHEN DT.Tipo NOT IN ('I','A') THEN 1 ELSE 0 END)      AS CntNotIA
    FROM DemonstrativoTitulo DT WITH (NOLOCK)
    GROUP BY DT.SeqTitulo
),

-- Resolve Data Repasse uma única vez (elimina subquery duplicada)
Repasse AS (
    SELECT
        CC.CodCliente,
        CC.IdPrestacaoDemonstrativo,
        MIN(PCC.Data) AS DataRepasse
    FROM ContaCliente CC
    JOIN PrestacaoContaCliente PCC
      ON PCC.CodCliente  = CC.CodCliente
     AND PCC.IDPrestacao = CC.IDPrestacao
    GROUP BY CC.CodCliente, CC.IdPrestacaoDemonstrativo
),

-- Pré-calcula contagem de títulos saldo zero por processo (Posição/Pagto.Direto)
TitulosSaldoZero AS (
    SELECT
        NumProcesso,
        SUM(CASE WHEN Saldo = 0 THEN 1 ELSE 0 END) AS CntSaldoZero
    FROM Titulo
    GROUP BY NumProcesso
),

-- Pré-calcula existência de FichaFinanceira e Acordo por processo (Posição/Ativo)
AcordoFinanceiro AS (
    SELECT NumProcesso FROM FichaFinanceira
    UNION
    SELECT NumProcesso FROM Acordo
)

-- ==========================================================
-- 1) Títulos sem demonstrativo ou com demonstrativo P/D/G
-- ==========================================================
SELECT
    C.CodCliente                                                AS 'Codigo Cliente',
    C.Nome                                                      AS 'Nome Cliente',
    COALESCE(DRE.Valor, '')                                     AS 'EMP',
    COALESCE(DRR.Valor, '')                                     AS 'Remessa',
    CONVERT(INTEGER, P.NumProcesso)                             AS 'Processo',
    COALESCE(P.CodigoNoCliente, '')                             AS 'Código Devedor',
    D.Nome                                                      AS 'Razão Social Devedor',
    D.CGC                                                       AS 'CNPJ/CPF',
    D.Cidade                                                    AS 'Cidade',
    D.Sigla                                                     AS 'Estado',
    T.NumTitulo                                                 AS 'Nr. Título',
    CONVERT(CHAR(10),    T.DataVencimento, 103)                 AS 'Vencimento',
    CONVERT(VARCHAR(10), P.DataAbertura,   103)                 AS 'Data Inclusão',
    DATEDIFF(DAY, T.DataVencimento, P.DataAbertura)             AS 'Idade Titulo Cadastramento',

    -- Valor Original Título — lógica original preservada via CntPDG e FirstSeqDemoEligivel
    CASE
        WHEN DT.SeqDemonstrativo IS NULL
            THEN REPLACE(CONVERT(VARCHAR(20), T.ValorOriginal), '.', ',')
        WHEN DT.SeqDemonstrativo IS NOT NULL THEN
            CASE
                WHEN COALESCE(ADT.CntPDG, 0) = 1
                    THEN REPLACE(CONVERT(VARCHAR(20), T.ValorOriginal), '.', ',')
                ELSE
                    CASE
                        WHEN DT.SeqDemonstrativo = ADT.FirstSeqDemoEligivel
                            THEN REPLACE(CONVERT(VARCHAR(20), T.ValorOriginal), '.', ',')
                        ELSE '0,00'
                    END
            END
        ELSE '0,00'
    END                                                         AS 'Valor Original Título',

    P.ValorCustas                                               AS 'Protesto',

    -- Valor Pago — lógica original preservada via FirstSeqDemoPDG e SumPDG
    CONVERT(MONEY,
        CASE
            WHEN ADT.SeqTitulo IS NULL THEN 0
            WHEN DT.SeqDemonstrativo = ADT.FirstSeqDemoPDG
                THEN COALESCE(ADT.SumPDG, 0)
            ELSE 0
        END
    )                                                           AS 'Valor Pago',

    COALESCE(REPLACE(CONVERT(VARCHAR(15), CONVERT(MONEY, ROUND(
        (DT.ValorOriginal + DT.ValorCorrecao + DT.ValorProtesto + DT.ValorMulta) *
        ((CASE WHEN DT.Tipo = 'P' THEN P.PercentualRecebimento ELSE 0.00 END) * 0.01), 2)
    )), '.', ','), '0,00')                                      AS 'Juros',

    COALESCE(REPLACE(CONVERT(VARCHAR(15), CONVERT(MONEY, ROUND(
        (DT.ValorOriginal + DT.ValorCorrecao + DT.ValorProtesto + DT.ValorMulta) *
        ((CASE WHEN DT.Tipo = 'P' THEN 0.00 ELSE P.PercentualPagtoDireto END) * 0.01), 2)
    )), '.', ','), '0,00')                                      AS 'Comissão',

    COALESCE(REPLACE(CONVERT(VARCHAR(15), CONVERT(MONEY,
        (DT.ValorOriginal + DT.ValorCorrecao + DT.ValorProtesto + DT.ValorMulta)
        - ROUND(
            (DT.ValorOriginal + DT.ValorCorrecao + DT.ValorProtesto + DT.ValorMulta) *
            ((CASE WHEN DT.Tipo = 'P' THEN P.PercentualRecebimento ELSE P.PercentualPagtoDireto END) * 0.01)
          , 2)
    )), '.', ','), '0,00')                                      AS 'Total Liquido',

    -- Valor Saldo Devedor — lógica original preservada
    CONVERT(MONEY,
        COALESCE(
            CASE
                WHEN ADT.SeqTitulo IS NOT NULL THEN
                    CASE
                        WHEN DT.SeqDemonstrativo = ADT.FirstSeqDemoEligivel THEN
                            COALESCE(ADT.SumI, 0) + COALESCE(ADT.SumAE, 0) - COALESCE(ADT.SumPDG, 0)
                        ELSE 0
                    END
                ELSE
                    CASE WHEN (T.Saldo = 0) AND (T.Status IS NOT NULL) THEN 0.00 ELSE T.ValorOriginal END
            END,
        T.ValorOriginal)
    )                                                           AS 'Valor Saldo Devedor',

    COALESCE(CONVERT(VARCHAR(10), R.DataRepasse, 103), '')      AS 'Data Repasse',
    COALESCE(DATEDIFF(DAY, P.DataAbertura, R.DataRepasse), 0)   AS 'Idade No Recebimento',

    CASE
        WHEN (DT.Indicador = 'F' AND DT.Tipo = 'P') THEN 'Pagamento Final'
        WHEN (DT.Indicador = 'P' AND DT.Tipo = 'P') THEN 'Pagamento Parcial'
        WHEN (DT.Indicador = 'F' AND DT.Tipo = 'G') THEN 'Pagamento Direto Final'
        WHEN (DT.Indicador = 'P' AND DT.Tipo = 'G') THEN 'Pagamento Direto Parcial'
        ELSE COALESCE(DT.Indicador, '')
    END                                                         AS 'Tipo',

    CASE WHEN P.Status <> '13' THEN S.Nome
         ELSE CASE WHEN P.SaldoCliente > 0 THEN 'Baixado Com Saldo' ELSE S.Nome END
    END                                                         AS 'Status',

    CONVERT(VARCHAR(10), P.DataBaixa, 103)                      AS 'Data Baixa',
    S.Nome                                                      AS 'Motivo da Baixa',

    CASE
        WHEN S.Nome IN ('Unificado', 'Duplicidade') THEN 'ERRO'
        ELSE CASE WHEN T.Saldo = 0 THEN 'Bx Solicitação'
        ELSE CASE WHEN S.Nome IN ('Incobrável', 'Não Estab.', 'Não Proc.', 'Ajuizado') THEN 'Devolvido'
        ELSE CASE WHEN S.Nome = 'Recebido'
            THEN CASE WHEN COALESCE(ADT.CntP_F, 0) > 0 THEN 'Recebido' ELSE 'Devolvido' END
        ELSE CASE WHEN S.Nome = 'Pagto. Direto'
            THEN CASE WHEN COALESCE(TZ.CntSaldoZero, 0) = 0 THEN 'Bx Solicitação' ELSE 'Devolvido' END
        ELSE CASE WHEN S.Nome IN ('Ativo', 'Indefinido')
            THEN CASE
                WHEN COALESCE(ADT.CntAll, 0) > 0
                    THEN CASE WHEN COALESCE(ADT.CntIndicadorF, 0) > 0 THEN 'Acordo Recebido' ELSE 'Acordo a Receber' END
                ELSE CASE WHEN AF.NumProcesso IS NOT NULL THEN 'Acordo a Receber' ELSE 'Em Cobrança' END
            END
        ELSE S.Nome
        END END END END END END                                  AS 'Posição',

    REPLACE(COALESCE(SUBSTRING(P.HistoricoRelatorio1, 1, 255), ''), '"', '') AS 'Último Relatório',
    dbo.F_CalcularStatusNegociacao(P.NumProcesso)               AS 'Visão Geral da Carteira'

FROM Processo P
JOIN VW_Devedor D     ON D.CodDevedor  = P.CodDevedor
JOIN Titulo T         ON T.NumProcesso = P.NumProcesso
JOIN StatusProcesso S ON S.Status      = P.Status
JOIN Cliente C        ON C.CodCliente  = P.CodCliente
LEFT JOIN DemonstrativoTitulo DT  ON DT.SeqTitulo  = T.SeqTitulo
LEFT JOIN AggDT ADT               ON ADT.SeqTitulo = T.SeqTitulo
LEFT JOIN DadosRetorno DRE        ON DRE.SeqTitulo  = T.SeqTitulo AND DRE.Nome = 'EMP'
LEFT JOIN DadosRetorno DRR        ON DRR.SeqTitulo  = T.SeqTitulo AND DRR.Nome = 'REMESSA'
LEFT JOIN Repasse R               ON R.CodCliente              = C.CodCliente
                                 AND R.IdPrestacaoDemonstrativo = DT.IdPrestacaoDemonstrativo
LEFT JOIN TitulosSaldoZero TZ     ON TZ.NumProcesso = P.NumProcesso
LEFT JOIN AcordoFinanceiro AF     ON AF.NumProcesso = P.NumProcesso
WHERE
    P.Status NOT IN ('18','20')
    AND C.CodPrincipal IN (SELECT CodPrincipal FROM CodPrincipalAlvo)
    AND (DT.Tipo IN ('P','D','G') OR DT.Tipo IS NULL)
    AND P.DataAbertura >= @DataInicial
    AND P.DataAbertura <= @DataFinal

UNION

-- ==========================================================
-- 2) Títulos com apenas demonstrativo tipo I (sem P/D/G fora de I/A)
-- ==========================================================
SELECT
    C.CodCliente                                                AS 'Codigo Cliente',
    C.Nome                                                      AS 'Nome Cliente',
    COALESCE(DRE.Valor, '')                                     AS 'EMP',
    COALESCE(DRR.Valor, '')                                     AS 'Remessa',
    CONVERT(INTEGER, P.NumProcesso)                             AS 'Processo',
    COALESCE(P.CodigoNoCliente, '')                             AS 'Código Devedor',
    D.Nome                                                      AS 'Razão Social Devedor',
    D.CGC                                                       AS 'CNPJ/CPF',
    D.Cidade                                                    AS 'Cidade',
    D.Sigla                                                     AS 'Estado',
    T.NumTitulo                                                 AS 'Nr. Título',
    CONVERT(CHAR(10),    T.DataVencimento, 103)                 AS 'Vencimento',
    CONVERT(VARCHAR(10), P.DataAbertura,   103)                 AS 'Data Inclusão',
    DATEDIFF(DAY, T.DataVencimento, P.DataAbertura)             AS 'Idade Titulo Cadastramento',
    REPLACE(CONVERT(VARCHAR(20), T.ValorOriginal), '.', ',')    AS 'Valor Original Título',
    P.ValorCustas                                               AS 'Protesto',
    COALESCE(REPLACE(CONVERT(VARCHAR(15), 0.0), '.', ','), '0,00') AS 'Valor Pago',
    COALESCE(REPLACE(CONVERT(VARCHAR(15), 0.0), '.', ','), '0,00') AS 'Juros',
    COALESCE(REPLACE(CONVERT(VARCHAR(15), 0.0), '.', ','), '0,00') AS 'Comissão',
    COALESCE(REPLACE(CONVERT(VARCHAR(15), 0.0), '.', ','), '0,00') AS 'Total Liquido',

    -- Valor Saldo Devedor — lógica original preservada via SumIA
    COALESCE(
        CASE
            WHEN ADT.SeqTitulo IS NOT NULL
                THEN COALESCE(ADT.SumIA, 0)
        END,
    T.ValorOriginal)                                            AS 'Valor Saldo Devedor',

    COALESCE(CONVERT(VARCHAR(10), R.DataRepasse, 103), '')      AS 'Data Repasse',
    COALESCE(DATEDIFF(DAY, P.DataAbertura, R.DataRepasse), 0)   AS 'Idade No Recebimento',
    ''                                                          AS 'Tipo',

    CASE WHEN P.Status <> '13' THEN S.Nome
         ELSE CASE WHEN P.SaldoCliente > 0 THEN 'Baixado Com Saldo' ELSE S.Nome END
    END                                                         AS 'Status',

    CONVERT(VARCHAR(10), P.DataBaixa, 103)                      AS 'Data Baixa',
    S.Nome                                                      AS 'Motivo da Baixa',

    CASE
        WHEN S.Nome IN ('Unificado', 'Duplicidade') THEN 'ERRO'
        ELSE CASE WHEN T.Saldo = 0 THEN 'Bx Solicitação'
        ELSE CASE WHEN S.Nome IN ('Incobrável', 'Não Estab.', 'Não Proc.', 'Ajuizado') THEN 'Devolvido'
        ELSE CASE WHEN S.Nome = 'Recebido'
            THEN CASE WHEN COALESCE(ADT.CntP_F, 0) > 0 THEN 'Recebido' ELSE 'Devolvido' END
        ELSE CASE WHEN S.Nome = 'Pagto. Direto'
            THEN CASE WHEN COALESCE(TZ.CntSaldoZero, 0) = 0 THEN 'Bx Solicitação' ELSE 'Devolvido' END
        ELSE CASE WHEN S.Nome IN ('Ativo', 'Indefinido')
            THEN CASE
                WHEN COALESCE(ADT.CntAll, 0) > 0
                    THEN CASE WHEN COALESCE(ADT.CntIndicadorF, 0) > 0 THEN 'Acordo Recebido' ELSE 'Acordo a Receber' END
                ELSE CASE WHEN AF.NumProcesso IS NOT NULL THEN 'Acordo a Receber' ELSE 'Em Cobrança' END
            END
        ELSE S.Nome
        END END END END END END                                  AS 'Posição',

    REPLACE(COALESCE(SUBSTRING(P.HistoricoRelatorio1, 1, 255), ''), '"', '') AS 'Último Relatório',
    dbo.F_CalcularStatusNegociacao(P.NumProcesso)               AS 'Visão Geral da Carteira'

FROM Processo P
JOIN VW_Devedor D     ON D.CodDevedor  = P.CodDevedor
JOIN Titulo T         ON T.NumProcesso = P.NumProcesso
JOIN StatusProcesso S ON S.Status      = P.Status
JOIN Cliente C        ON C.CodCliente  = P.CodCliente
JOIN DemonstrativoTitulo DT   ON DT.SeqTitulo  = T.SeqTitulo
JOIN AggDT ADT                ON ADT.SeqTitulo = T.SeqTitulo
LEFT JOIN DadosRetorno DRE    ON DRE.SeqTitulo  = T.SeqTitulo AND DRE.Nome = 'EMP'
LEFT JOIN DadosRetorno DRR    ON DRR.SeqTitulo  = T.SeqTitulo AND DRR.Nome = 'REMESSA'
LEFT JOIN Repasse R            ON R.CodCliente              = C.CodCliente
                              AND R.IdPrestacaoDemonstrativo = DT.IdPrestacaoDemonstrativo
LEFT JOIN TitulosSaldoZero TZ  ON TZ.NumProcesso = P.NumProcesso
LEFT JOIN AcordoFinanceiro AF  ON AF.NumProcesso = P.NumProcesso
WHERE
    P.Status NOT IN ('18','20')
    AND C.CodPrincipal IN (SELECT CodPrincipal FROM CodPrincipalAlvo)
    AND DT.Tipo = 'I'
    AND P.DataAbertura >= @DataInicial
    AND P.DataAbertura <= @DataFinal
    AND COALESCE(ADT.CntNotIA, 0) = 0

ORDER BY 1, 3;
