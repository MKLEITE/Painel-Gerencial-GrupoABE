import { apiFetch } from './api-client';

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

export async function login(email: string, senha: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await apiFetch<{ ok: true }>('/v1/auth/logout', { method: 'POST' });
}

export async function me(): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>('/v1/auth/me');
  return data.user;
}
