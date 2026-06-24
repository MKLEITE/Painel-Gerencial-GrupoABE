import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export interface DbUsuario {
  id: string;
  tenant_id: string;
  email: string;
  nome: string;
  telefone: string | null;
  foto_url: string | null;
  papel: string;
  ativo: boolean;
}

export async function requireSuperAdmin(): Promise<
  { userId: string; profile: DbUsuario } | NextResponse
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { title: 'Sessão expirada ou credenciais inválidas.' },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('usuarios')
    .select('id, tenant_id, email, nome, telefone, foto_url, papel, ativo')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ title: 'Perfil de usuário não encontrado.' }, { status: 403 });
  }

  if (profile.papel !== 'SUPER_ADMIN' || !profile.ativo) {
    return NextResponse.json({ title: 'Você não tem permissão para esta ação.' }, { status: 403 });
  }

  return { userId: user.id, profile: profile as DbUsuario };
}

export function adminDb() {
  return createAdminClient();
}

export function jsonError(title: string, status: number, errors?: string[]) {
  return NextResponse.json({ title, errors }, { status });
}
