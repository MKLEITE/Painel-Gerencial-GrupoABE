import { createClient } from './supabase/client';
import type { ApiError } from './api-client';

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  nome: string;
  papel: string;
  ativo?: boolean;
  fotoUrl?: string | null;
}

export function isSuperAdmin(user: AuthUser): boolean {
  return user.papel === 'SUPER_ADMIN';
}

export function adminHomePath(user: AuthUser): '/admin/credores' | '/dashboard' {
  return isSuperAdmin(user) ? '/admin/credores' : '/dashboard';
}

function mapAuthError(message: string): ApiError {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return { title: 'E-mail ou senha incorretos.', status: 401 };
  }
  if (lower.includes('email not confirmed')) {
    return { title: 'Confirme seu e-mail antes de entrar.', status: 401 };
  }
  return { title: 'Não foi possível entrar. Tente novamente.', status: 401 };
}

async function fetchProfile(userId: string): Promise<AuthUser> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, tenant_id, email, nome, papel, ativo, foto_url')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    await supabase.auth.signOut();
    throw { title: 'Perfil de usuário não encontrado.', status: 403 } satisfies ApiError;
  }

  if (!data.ativo) {
    await supabase.auth.signOut();
    throw {
      title: 'Conta desativada. Entre em contato com o administrador.',
      status: 403,
    } satisfies ApiError;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    email: data.email,
    nome: data.nome,
    papel: data.papel,
    ativo: data.ativo,
    fotoUrl: data.foto_url,
  };
}

export async function login(email: string, senha: string): Promise<AuthUser> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });

  if (error) {
    throw mapAuthError(error.message);
  }

  if (!data.user) {
    throw mapAuthError('invalid login');
  }

  return fetchProfile(data.user.id);
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function me(): Promise<AuthUser> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw { title: 'Sessão expirada ou credenciais inválidas.', status: 401 } satisfies ApiError;
  }

  return fetchProfile(user.id);
}
