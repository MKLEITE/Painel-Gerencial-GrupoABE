import { NextResponse } from 'next/server';
import { adminDb, jsonError, requireSuperAdmin } from '@/lib/server/admin-auth';
import { AdminError } from '@/lib/server/admin-errors';
import { getPlatformUser, updatePlatformUser } from '@/lib/server/admin-usuarios';
import { parseRequestJson } from '@/lib/server/admin-validators';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const usuario = await getPlatformUser(adminDb(), id);
    if (!usuario) return jsonError('Usuário não encontrado.', 404);
    return NextResponse.json(usuario);
  } catch (err) {
    console.error('[admin/usuarios/:id GET]', err);
    return jsonError('Erro ao buscar usuário.', 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await parseRequestJson(request);
    const usuario = await updatePlatformUser(
      adminDb(),
      id,
      body as Parameters<typeof updatePlatformUser>[2],
    );
    return NextResponse.json(usuario);
  } catch (err) {
    if (err instanceof AdminError) {
      return jsonError(err.message, err.status);
    }
    console.error('[admin/usuarios/:id PATCH]', err);
    return jsonError('Erro ao atualizar usuário.', 500);
  }
}
