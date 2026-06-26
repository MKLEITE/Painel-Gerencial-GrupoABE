/**
 * Seed inicial do Supabase — usuários de desenvolvimento.
 *
 * Uso (na raiz do monorepo, com .env preenchido):
 *   pnpm db:seed
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const PLATFORM_TENANT_ID = '00000000-0000-4000-8000-000000000000';
const DEV_TENANT_ID = '00000000-0000-4000-8000-000000000001';
const DEV_USER_ID = '00000000-0000-4000-8000-000000000002';
const MEYKSON_USER_ID = '00000000-0000-4000-8000-000000000003';

const SEED_DEV_EMAIL = 'admin@grupoabe.com.br';
const SEED_DEV_SENHA = 'Admin@123';
const SEED_MEYKSON_EMAIL = 'meykson@abe.com.br';
const SEED_MEYKSON_SENHA = '12qw!@QW142536';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsertAuthUser(id, email, password, nome) {
  const { data: existing } = await db.auth.admin.getUserById(id).catch(() => ({ data: null }));

  if (existing?.user) {
    const { error } = await db.auth.admin.updateUserById(id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });
    if (error) throw error;
    return;
  }

  const { error } = await db.auth.admin.createUser({
    id,
    email,
    password,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error) throw error;
}

async function main() {
  await db.from('tenants').upsert({
    id: PLATFORM_TENANT_ID,
    nome: 'Plataforma ABE — Administração',
    status: 'ATIVO',
  });

  await db.from('tenants').upsert({
    id: DEV_TENANT_ID,
    nome: 'Grupo ABE — Dev',
    status: 'ATIVO',
  });

  await db.from('credores').upsert(
    {
      tenant_id: DEV_TENANT_ID,
      razao_social: 'Credor Demonstração Ltda.',
      nome_fantasia: 'Grupo ABE Dev',
      cnpj: '00000000000191',
      telefone: '11999999999',
      email_comercial: 'contato@grupoabe.com.br',
      setores: ['Serviços'],
      cep: '01310100',
      cidade: 'São Paulo',
      estado: 'SP',
      bairro: 'Bela Vista',
      endereco: 'Av. Paulista',
      numero: '1000',
      paginas_acesso: ['dashboard'],
      cod_cliente_principal: '40032',
    },
    { onConflict: 'tenant_id' },
  );

  await upsertAuthUser(DEV_USER_ID, SEED_DEV_EMAIL, SEED_DEV_SENHA, 'Administrador Dev');
  await upsertAuthUser(MEYKSON_USER_ID, SEED_MEYKSON_EMAIL, SEED_MEYKSON_SENHA, 'Meykson Leite');

  await db.from('usuarios').upsert({
    id: DEV_USER_ID,
    tenant_id: DEV_TENANT_ID,
    email: SEED_DEV_EMAIL,
    nome: 'Administrador Dev',
    papel: 'ADMIN_CREDOR',
    ativo: true,
  });

  await db.from('usuarios').upsert({
    id: MEYKSON_USER_ID,
    tenant_id: PLATFORM_TENANT_ID,
    email: SEED_MEYKSON_EMAIL,
    nome: 'Meykson Leite',
    papel: 'SUPER_ADMIN',
    ativo: true,
  });

  console.log('Seed OK');
  console.log(`  Admin plataforma: ${SEED_MEYKSON_EMAIL} / ${SEED_MEYKSON_SENHA} → /admin`);
  console.log(`  Credor dev:       ${SEED_DEV_EMAIL} / ${SEED_DEV_SENHA} → /dashboard`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
