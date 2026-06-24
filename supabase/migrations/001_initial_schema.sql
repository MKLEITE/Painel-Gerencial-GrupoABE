-- Painel Gerencial Grupo ABE — schema inicial (Supabase)
-- Auth: Supabase Auth (auth.users). Perfil em public.usuarios (id = auth.users.id).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "TenantStatus" AS ENUM ('ATIVO', 'SUSPENSO', 'INATIVO');
CREATE TYPE "PapelUsuario" AS ENUM ('SUPER_ADMIN', 'ADMIN_CREDOR', 'OPERADOR', 'VIEWER');

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  status "TenantStatus" NOT NULL DEFAULT 'ATIVO',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  foto_url TEXT,
  papel "PapelUsuario" NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  mfa_habilitado BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_tenant_id_email_key UNIQUE (tenant_id, email)
);

CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios (lower(email));
CREATE INDEX usuarios_tenant_id_idx ON public.usuarios (tenant_id);

CREATE TABLE public.credores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants (id) ON DELETE CASCADE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  telefone TEXT,
  email_comercial TEXT,
  setores TEXT[] NOT NULL DEFAULT '{}',
  cep TEXT,
  cidade TEXT,
  estado VARCHAR(2),
  bairro TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  paginas_acesso TEXT[] NOT NULL DEFAULT ARRAY['dashboard'],
  cod_cliente_principal TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX credores_cnpj_idx ON public.credores (cnpj);
CREATE INDEX credores_cod_cliente_principal_idx ON public.credores (cod_cliente_principal);
CREATE INDEX credores_email_comercial_idx ON public.credores (email_comercial);

CREATE TABLE public.codigos_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credor_id UUID NOT NULL REFERENCES public.credores (id) ON DELETE CASCADE,
  cod_cliente TEXT NOT NULL,
  rotulo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT codigos_cliente_credor_id_cod_cliente_key UNIQUE (credor_id, cod_cliente)
);

CREATE OR REPLACE FUNCTION public.set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_atualizado_em
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TRIGGER usuarios_atualizado_em
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TRIGGER credores_atualizado_em
  BEFORE UPDATE ON public.credores
  FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

-- ---- Row Level Security ----

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.papel = 'SUPER_ADMIN'
      AND u.ativo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.tenant_id
  FROM public.usuarios u
  WHERE u.id = auth.uid()
    AND u.ativo = true;
$$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigos_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_super_admin_all ON public.tenants
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY tenants_self_read ON public.tenants
  FOR SELECT
  USING (id = public.current_tenant_id());

CREATE POLICY usuarios_super_admin_all ON public.usuarios
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY usuarios_tenant_read ON public.usuarios
  FOR SELECT
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY usuarios_self_read ON public.usuarios
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY credores_super_admin_all ON public.credores
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY credores_tenant_read ON public.credores
  FOR SELECT
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY codigos_super_admin_all ON public.codigos_cliente
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY codigos_tenant_read ON public.codigos_cliente
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.credores c
      WHERE c.id = codigos_cliente.credor_id
        AND c.tenant_id = public.current_tenant_id()
    )
  );

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
