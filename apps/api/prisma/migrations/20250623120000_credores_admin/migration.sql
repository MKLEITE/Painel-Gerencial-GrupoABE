-- Credores e códigos de cliente (chaveamento futuro CodCliente / CNPJ)

CREATE TABLE "credores" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT,
    "cod_cliente_principal" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "codigos_cliente" (
    "id" UUID NOT NULL,
    "credor_id" UUID NOT NULL,
    "cod_cliente" TEXT NOT NULL,
    "rotulo" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_cliente_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credores_tenant_id_key" ON "credores"("tenant_id");
CREATE INDEX "credores_cnpj_idx" ON "credores"("cnpj");
CREATE INDEX "credores_cod_cliente_principal_idx" ON "credores"("cod_cliente_principal");
CREATE UNIQUE INDEX "codigos_cliente_credor_id_cod_cliente_key" ON "codigos_cliente"("credor_id", "cod_cliente");

ALTER TABLE "credores" ADD CONSTRAINT "credores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "codigos_cliente" ADD CONSTRAINT "codigos_cliente_credor_id_fkey" FOREIGN KEY ("credor_id") REFERENCES "credores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
