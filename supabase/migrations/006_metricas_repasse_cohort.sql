-- Borderô: Data Inclusão no intervalo.
-- Recebimentos: processos do borderô do intervalo + Data Repasse no mesmo intervalo.

CREATE OR REPLACE FUNCTION public.calcular_metricas_credor(
  p_credor_id UUID,
  p_data_inicio DATE,
  p_data_fim DATE,
  p_sistema TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado JSONB;
  v_ativo NUMERIC(15, 2);
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_super_admin()
     AND NOT EXISTS (
       SELECT 1
       FROM public.credores c
       JOIN public.usuarios u ON u.tenant_id = c.tenant_id
       WHERE c.id = p_credor_id
         AND u.id = auth.uid()
         AND u.ativo = true
     ) THEN
    RAISE EXCEPTION 'Acesso negado ao credor %', p_credor_id;
  END IF;

  WITH bordero_cohort AS (
    SELECT DISTINCT processo
    FROM public.carteira_snapshot
    WHERE credor_id = p_credor_id
      AND data_inclusao IS NOT NULL
      AND data_inclusao BETWEEN p_data_inicio AND p_data_fim
      AND (p_sistema IS NULL OR sistema_origem = p_sistema)
  ),
  bordero_linhas AS (
    SELECT *
    FROM public.carteira_snapshot
    WHERE credor_id = p_credor_id
      AND data_inclusao IS NOT NULL
      AND data_inclusao BETWEEN p_data_inicio AND p_data_fim
      AND (p_sistema IS NULL OR sistema_origem = p_sistema)
  ),
  pagamentos AS (
    SELECT cs.*
    FROM public.carteira_snapshot cs
    INNER JOIN bordero_cohort bc ON bc.processo = cs.processo
    WHERE cs.credor_id = p_credor_id
      AND cs.data_repasse IS NOT NULL
      AND cs.data_repasse BETWEEN p_data_inicio AND p_data_fim
      AND (p_sistema IS NULL OR cs.sistema_origem = p_sistema)
  )
  SELECT jsonb_build_object(
    'bordero_total', COALESCE((
      SELECT SUM(valor_original_titulo) FROM bordero_linhas
    ), 0),
    'bordero_qtd', COALESCE((
      SELECT COUNT(DISTINCT processo) FROM bordero_linhas
    ), 0),
    'recebido_abe', COALESCE((
      SELECT SUM(valor_pago)
      FROM pagamentos
      WHERE tipo IN ('Pagamento Final', 'Pagamento Parcial')
    ), 0),
    'pagamento_direto', COALESCE((
      SELECT SUM(valor_pago)
      FROM pagamentos
      WHERE tipo IN ('Pagamento Direto Final', 'Pagamento Direto Parcial')
         OR (
           status ILIKE 'Pagto. Direto'
           AND (tipo IS NULL OR btrim(tipo) = '')
         )
    ), 0),
    'devolvido_nao_processado', COALESCE((
      SELECT SUM(valor_original_titulo)
      FROM bordero_linhas
      WHERE status ILIKE 'Não processado' OR status ILIKE 'Nao processado'
    ), 0),
    'devolvido_nao_estabelecido', COALESCE((
      SELECT SUM(valor_original_titulo)
      FROM bordero_linhas
      WHERE status ILIKE 'Não Estabelecido' OR status ILIKE 'Nao Estabelecido'
    ), 0),
    'devolvido_incobavel', COALESCE((
      SELECT SUM(valor_original_titulo)
      FROM bordero_linhas
      WHERE status ILIKE 'Incobrável' OR status ILIKE 'Incobravel'
    ), 0),
    'acordo_com_pagamento', COALESCE((
      SELECT SUM(valor_original_titulo)
      FROM bordero_linhas
      WHERE visao_geral_carteira ILIKE '%acordo com pagamento%'
    ), 0),
    'acordo_a_receber', COALESCE((
      SELECT SUM(valor_original_titulo)
      FROM bordero_linhas
      WHERE visao_geral_carteira ILIKE '%acordo a receber%'
    ), 0),
    'em_cobranca', COALESCE((
      SELECT SUM(valor_original_titulo)
      FROM bordero_linhas
      WHERE visao_geral_carteira ILIKE '%em cobrança%'
        OR visao_geral_carteira ILIKE '%em cobranca%'
    ), 0),
    'quebra_de_acordo', COALESCE((
      SELECT SUM(valor_original_titulo)
      FROM bordero_linhas
      WHERE visao_geral_carteira ILIKE '%quebra de acordo%'
    ), 0)
  )
  INTO resultado
  FROM (SELECT 1) AS _one;

  SELECT COALESCE(SUM(valor_saldo_devedor), 0)
  INTO v_ativo
  FROM public.carteira_snapshot
  WHERE credor_id = p_credor_id
    AND status ILIKE 'Ativo'
    AND (p_sistema IS NULL OR sistema_origem = p_sistema);

  resultado := resultado || jsonb_build_object('ativo_saldo_devedor', v_ativo);

  RETURN resultado;
END;
$$;
