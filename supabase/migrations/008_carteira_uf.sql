-- UF do devedor (consulta 749) para filtros por estado no dashboard.

ALTER TABLE public.carteira_snapshot
  ADD COLUMN IF NOT EXISTS uf TEXT;

CREATE INDEX IF NOT EXISTS idx_carteira_credor_uf
  ON public.carteira_snapshot (credor_id, uf);
