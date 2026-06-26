-- ETL unificado: snapshot linha a linha + cache de métricas + vínculos legado
-- Complementa dashboard_carteira (JSON agregado) — não substitui.

-- Vínculos opcionais com sistemas legados (abe_cliente_id espelha cod_cliente_principal)
ALTER TABLE public.credores
  ADD COLUMN IF NOT EXISTS abe_cliente_id TEXT,
  ADD COLUMN IF NOT EXISTS avantpay_cliente_id TEXT,
  ADD COLUMN IF NOT EXISTS acordoseguro_id TEXT;

UPDATE public.credores
SET abe_cliente_id = cod_cliente_principal
WHERE abe_cliente_id IS NULL AND cod_cliente_principal IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.carteira_snapshot (
  id BIGSERIAL PRIMARY KEY,
  credor_id UUID NOT NULL REFERENCES public.credores (id) ON DELETE CASCADE,
  sistema_origem TEXT NOT NULL CHECK (
    sistema_origem IN ('ABE_DELPHI', 'ABE_WEB', 'AVANTPAY', 'ACORDOSEGURO')
  ),
  processo TEXT,
  data_inclusao DATE,
  data_repasse DATE,
  valor_original_titulo NUMERIC(15, 2) DEFAULT 0,
  valor_pago NUMERIC(15, 2) DEFAULT 0,
  valor_saldo_devedor NUMERIC(15, 2) DEFAULT 0,
  tipo TEXT,
  status TEXT,
  visao_geral_carteira TEXT,
  sincronizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carteira_credor_data
  ON public.carteira_snapshot (credor_id, data_inclusao);
CREATE INDEX IF NOT EXISTS idx_carteira_credor_status
  ON public.carteira_snapshot (credor_id, status);
CREATE INDEX IF NOT EXISTS idx_carteira_credor_tipo
  ON public.carteira_snapshot (credor_id, tipo);
CREATE INDEX IF NOT EXISTS idx_carteira_repasse
  ON public.carteira_snapshot (credor_id, data_repasse);
CREATE INDEX IF NOT EXISTS idx_carteira_sistema
  ON public.carteira_snapshot (credor_id, sistema_origem);

CREATE TABLE IF NOT EXISTS public.metricas_cache (
  id BIGSERIAL PRIMARY KEY,
  credor_id UUID NOT NULL REFERENCES public.credores (id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  sistema_origem TEXT NOT NULL DEFAULT 'TODOS',
  bordero_total NUMERIC(15, 2) DEFAULT 0,
  bordero_qtd INTEGER DEFAULT 0,
  recebido_abe NUMERIC(15, 2) DEFAULT 0,
  pagamento_direto NUMERIC(15, 2) DEFAULT 0,
  devolvido_nao_processado NUMERIC(15, 2) DEFAULT 0,
  devolvido_nao_estabelecido NUMERIC(15, 2) DEFAULT 0,
  devolvido_incobavel NUMERIC(15, 2) DEFAULT 0,
  ativo_saldo_devedor NUMERIC(15, 2) DEFAULT 0,
  acordo_com_pagamento NUMERIC(15, 2) DEFAULT 0,
  acordo_a_receber NUMERIC(15, 2) DEFAULT 0,
  em_cobranca NUMERIC(15, 2) DEFAULT 0,
  quebra_de_acordo NUMERIC(15, 2) DEFAULT 0,
  calculado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT metricas_cache_unique UNIQUE (credor_id, periodo_inicio, periodo_fim, sistema_origem)
);

ALTER TABLE public.carteira_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY carteira_snapshot_super_admin_all ON public.carteira_snapshot
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY carteira_snapshot_tenant_read ON public.carteira_snapshot
  FOR SELECT
  USING (
    credor_id IN (
      SELECT c.id
      FROM public.credores c
      WHERE c.tenant_id = public.current_tenant_id()
    )
  );

CREATE POLICY metricas_cache_super_admin_all ON public.metricas_cache
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY metricas_cache_tenant_read ON public.metricas_cache
  FOR SELECT
  USING (
    credor_id IN (
      SELECT c.id
      FROM public.credores c
      WHERE c.tenant_id = public.current_tenant_id()
    )
  );

GRANT SELECT ON public.carteira_snapshot TO authenticated;
GRANT SELECT ON public.metricas_cache TO authenticated;
