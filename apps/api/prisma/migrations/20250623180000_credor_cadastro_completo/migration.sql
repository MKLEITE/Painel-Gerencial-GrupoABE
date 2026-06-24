-- Campos completos do credor + telefone do usuário
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "nome_fantasia" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "telefone" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "email_comercial" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "setores" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "cep" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "cidade" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "estado" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "bairro" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "endereco" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "numero" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "complemento" TEXT;
ALTER TABLE "credores" ADD COLUMN IF NOT EXISTS "paginas_acesso" TEXT[] DEFAULT ARRAY['dashboard']::TEXT[];

ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "telefone" TEXT;
