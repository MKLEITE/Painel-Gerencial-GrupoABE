-- Vínculos explícitos com códigos matriz nos legados ABE WEB e ABE Delphi.
-- cod_cliente_principal / abe_cliente_id = idClientePrincipal (WEB).
-- abe_delphi_cliente_id = CodPrincipal (Delphi).

ALTER TABLE public.credores
  ADD COLUMN IF NOT EXISTS abe_delphi_cliente_id TEXT;

CREATE INDEX IF NOT EXISTS credores_abe_delphi_cliente_id_idx
  ON public.credores (abe_delphi_cliente_id);

CREATE UNIQUE INDEX IF NOT EXISTS credores_cnpj_unique_idx
  ON public.credores (cnpj)
  WHERE cnpj IS NOT NULL AND cnpj <> '';
