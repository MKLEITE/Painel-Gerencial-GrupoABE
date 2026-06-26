-- Comercial principal e prepostos (credor + por código).

ALTER TABLE public.credores
  ADD COLUMN IF NOT EXISTS comercial_principal TEXT,
  ADD COLUMN IF NOT EXISTS preposto_web TEXT,
  ADD COLUMN IF NOT EXISTS preposto_delphi TEXT;

ALTER TABLE public.codigos_cliente
  ADD COLUMN IF NOT EXISTS comercial_principal TEXT,
  ADD COLUMN IF NOT EXISTS preposto TEXT;

CREATE INDEX IF NOT EXISTS credores_comercial_principal_idx
  ON public.credores (comercial_principal);
