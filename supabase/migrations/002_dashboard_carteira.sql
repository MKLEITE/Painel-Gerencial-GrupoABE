-- Snapshot do dashboard por tenant (sync ABE WEB → Supabase)

CREATE TABLE public.dashboard_carteira (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  cod_cliente TEXT NOT NULL DEFAULT 'todos',
  periodo TEXT NOT NULL DEFAULT 'mes_atual',
  lote_envio TEXT NOT NULL DEFAULT 'todos',
  uf TEXT NOT NULL DEFAULT 'todos',
  payload JSONB NOT NULL,
  sincronizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_carteira_unique_key UNIQUE (tenant_id, cod_cliente, periodo, lote_envio, uf)
);

CREATE INDEX dashboard_carteira_tenant_id_idx ON public.dashboard_carteira (tenant_id);
CREATE INDEX dashboard_carteira_sincronizado_em_idx ON public.dashboard_carteira (sincronizado_em DESC);

ALTER TABLE public.dashboard_carteira ENABLE ROW LEVEL SECURITY;

CREATE POLICY dashboard_carteira_super_admin_all ON public.dashboard_carteira
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY dashboard_carteira_tenant_read ON public.dashboard_carteira
  FOR SELECT
  USING (tenant_id = public.current_tenant_id());

GRANT SELECT ON public.dashboard_carteira TO authenticated;
