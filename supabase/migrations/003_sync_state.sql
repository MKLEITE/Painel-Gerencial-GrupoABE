-- Controle de sincronização ABE WEB (watermark por credor/código cliente)
CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fonte TEXT NOT NULL DEFAULT 'abeweb',
  cod_cliente TEXT NOT NULL,
  ultima_exec TIMESTAMPTZ,
  ultima_sucesso TIMESTAMPTZ,
  ultimo_bordero_ts TIMESTAMPTZ,
  ultimo_check TIMESTAMPTZ,
  linhas_bordero INTEGER DEFAULT 0,
  linhas_carteira INTEGER DEFAULT 0,
  duracao_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'idle',
  mensagem TEXT,
  CONSTRAINT sync_state_unique UNIQUE (tenant_id, fonte, cod_cliente)
);

CREATE INDEX IF NOT EXISTS idx_sync_state_tenant ON sync_state(tenant_id);

ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_state_super_admin ON sync_state
  FOR ALL USING (is_super_admin());
