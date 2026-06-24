import type { SupabaseClient } from '@supabase/supabase-js';
import { AdminError } from './admin-credores';

export interface AdminUsuario {
  id: string;
  tenantId: string;
  email: string;
  nome: string;
  papel: string;
  ativo: boolean;
}

function toPublic(row: {
  id: string;
  tenant_id: string;
  email: string;
  nome: string;
  papel: string;
  ativo: boolean;
}): AdminUsuario {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    nome: row.nome,
    papel: row.papel,
    ativo: row.ativo,
  };
}

const PLATFORM_TENANT_ID =
  process.env.SUPABASE_PLATFORM_TENANT_ID ?? '00000000-0000-4000-8000-000000000000';

async function getPlatformTenantId(_db: SupabaseClient): Promise<string> {
  return PLATFORM_TENANT_ID;
}

export async function listPlatformUsers(db: SupabaseClient): Promise<AdminUsuario[]> {
  const platformTenantId = await getPlatformTenantId(db);

  const { data, error } = await db
    .from('usuarios')
    .select('id, tenant_id, email, nome, papel, ativo')
    .eq('tenant_id', platformTenantId)
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toPublic);
}

export async function getPlatformUser(
  db: SupabaseClient,
  id: string,
): Promise<AdminUsuario | null> {
  const platformTenantId = await getPlatformTenantId(db);

  const { data, error } = await db
    .from('usuarios')
    .select('id, tenant_id, email, nome, papel, ativo')
    .eq('id', id)
    .eq('tenant_id', platformTenantId)
    .maybeSingle();

  if (error) throw error;
  return data ? toPublic(data) : null;
}

export async function createPlatformUser(
  db: SupabaseClient,
  data: { email: string; nome: string; senha: string; papel: string },
): Promise<AdminUsuario> {
  const platformTenantId = await getPlatformTenantId(db);
  const email = data.email.toLowerCase().trim();

  const { data: existing } = await db
    .from('usuarios')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (existing) throw new AdminError('E-mail já cadastrado.', 409);

  const { data: authUser, error: authError } = await db.auth.admin.createUser({
    email,
    password: data.senha,
    email_confirm: true,
    user_metadata: { nome: data.nome.trim() },
  });

  if (authError) {
    if (authError.message.includes('already') || authError.status === 422) {
      throw new AdminError('E-mail já cadastrado.', 409);
    }
    throw authError;
  }

  const userId = authUser.user.id;

  const { data: row, error: insertError } = await db
    .from('usuarios')
    .insert({
      id: userId,
      tenant_id: platformTenantId,
      email,
      nome: data.nome.trim(),
      papel: data.papel,
      ativo: true,
    })
    .select('id, tenant_id, email, nome, papel, ativo')
    .single();

  if (insertError) {
    await db.auth.admin.deleteUser(userId);
    throw insertError;
  }

  return toPublic(row);
}

export async function updatePlatformUser(
  db: SupabaseClient,
  id: string,
  data: Partial<{ nome: string; papel: string; ativo: boolean; senha: string }>,
): Promise<AdminUsuario> {
  const existing = await getPlatformUser(db, id);
  if (!existing) throw new AdminError('Usuário não encontrado.', 404);

  const patch: Record<string, unknown> = {};
  if (data.nome !== undefined) patch.nome = data.nome.trim();
  if (data.papel !== undefined) patch.papel = data.papel;
  if (data.ativo !== undefined) patch.ativo = data.ativo;

  if (data.senha !== undefined) {
    const { error } = await db.auth.admin.updateUserById(id, { password: data.senha });
    if (error) throw error;
  }

  if (Object.keys(patch).length) {
    const { data: row, error } = await db
      .from('usuarios')
      .update(patch)
      .eq('id', id)
      .select('id, tenant_id, email, nome, papel, ativo')
      .single();
    if (error) throw error;
    return toPublic(row);
  }

  return existing;
}
