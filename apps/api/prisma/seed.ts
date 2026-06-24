import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

/** Tenant da plataforma (administradores internos — sem credor). */
const PLATFORM_TENANT_ID = '00000000-0000-4000-8000-000000000000';
/** Tenant de dev / credor exemplo. */
const DEV_TENANT_ID = '00000000-0000-4000-8000-000000000001';
const DEV_USER_ID = '00000000-0000-4000-8000-000000000002';
const MEYKSON_USER_ID = '00000000-0000-4000-8000-000000000003';

const SEED_DEV_EMAIL = 'admin@grupoabe.com.br';
const SEED_DEV_SENHA = 'Admin@123';
const SEED_MEYKSON_EMAIL = 'meykson@abe.com.br';
const SEED_MEYKSON_SENHA = '12qw!@QW142536';

async function upsertUsuario(
  id: string,
  tenantId: string,
  email: string,
  nome: string,
  senha: string,
  papel: 'SUPER_ADMIN' | 'ADMIN_CREDOR',
): Promise<void> {
  const senhaHash = await hash(senha, ARGON2_OPTS);
  await prisma.usuario.upsert({
    where: { id },
    update: {
      email: email.toLowerCase(),
      nome,
      senhaHash,
      papel,
      ativo: true,
      tenantId,
    },
    create: {
      id,
      tenantId,
      email: email.toLowerCase(),
      nome,
      senhaHash,
      papel,
      ativo: true,
    },
  });
}

async function main(): Promise<void> {
  await prisma.tenant.upsert({
    where: { id: PLATFORM_TENANT_ID },
    update: { nome: 'Plataforma ABE — Administração', status: 'ATIVO' },
    create: {
      id: PLATFORM_TENANT_ID,
      nome: 'Plataforma ABE — Administração',
      status: 'ATIVO',
    },
  });

  const devTenant = await prisma.tenant.upsert({
    where: { id: DEV_TENANT_ID },
    update: { nome: 'Grupo ABE — Dev', status: 'ATIVO' },
    create: {
      id: DEV_TENANT_ID,
      nome: 'Grupo ABE — Dev',
      status: 'ATIVO',
    },
  });

  await prisma.credor.upsert({
    where: { tenantId: devTenant.id },
    update: {
      razaoSocial: 'Credor Demonstração Ltda.',
      nomeFantasia: 'Grupo ABE Dev',
      cnpj: '00000000000191',
      telefone: '11999999999',
      emailComercial: 'contato@grupoabe.com.br',
      setores: ['Serviços'],
      cep: '01310100',
      cidade: 'São Paulo',
      estado: 'SP',
      bairro: 'Bela Vista',
      endereco: 'Av. Paulista',
      numero: '1000',
      paginasAcesso: ['dashboard'],
      codClientePrincipal: 'DEMO-001',
    },
    create: {
      tenantId: devTenant.id,
      razaoSocial: 'Credor Demonstração Ltda.',
      nomeFantasia: 'Grupo ABE Dev',
      cnpj: '00000000000191',
      telefone: '11999999999',
      emailComercial: 'contato@grupoabe.com.br',
      setores: ['Serviços'],
      cep: '01310100',
      cidade: 'São Paulo',
      estado: 'SP',
      bairro: 'Bela Vista',
      endereco: 'Av. Paulista',
      numero: '1000',
      paginasAcesso: ['dashboard'],
      codClientePrincipal: 'DEMO-001',
    },
  });

  await upsertUsuario(
    DEV_USER_ID,
    DEV_TENANT_ID,
    SEED_DEV_EMAIL,
    'Administrador Dev',
    SEED_DEV_SENHA,
    'ADMIN_CREDOR',
  );

  await upsertUsuario(
    MEYKSON_USER_ID,
    PLATFORM_TENANT_ID,
    SEED_MEYKSON_EMAIL,
    'Meykson Leite',
    SEED_MEYKSON_SENHA,
    'SUPER_ADMIN',
  );

  console.log('Seed OK');
  console.log(`  Admin plataforma: ${SEED_MEYKSON_EMAIL} / ${SEED_MEYKSON_SENHA} → /admin`);
  console.log(`  Credor dev:       ${SEED_DEV_EMAIL} / ${SEED_DEV_SENHA} → /dashboard`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
