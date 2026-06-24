-- Row-Level Security (isolamento multi-tenant)
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_self ON "tenants";
CREATE POLICY tenant_self ON "tenants"
  FOR ALL
  USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS usuario_tenant ON "usuarios";
CREATE POLICY usuario_tenant ON "usuarios"
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
