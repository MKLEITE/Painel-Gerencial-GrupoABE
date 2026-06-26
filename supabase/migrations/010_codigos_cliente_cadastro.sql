-- Cadastro por código (matriz + filiais) — edição separada no admin.

ALTER TABLE public.codigos_cliente
  ADD COLUMN IF NOT EXISTS papel TEXT NOT NULL DEFAULT 'filial'
    CHECK (papel IN ('matriz', 'filial')),
  ADD COLUMN IF NOT EXISTS razao_social TEXT,
  ADD COLUMN IF NOT EXISTS nome_fantasia TEXT,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS email_comercial TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS legado_sync_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS codigos_cliente_credor_papel_idx
  ON public.codigos_cliente (credor_id, papel);
