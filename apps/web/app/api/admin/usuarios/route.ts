import { NextResponse } from 'next/server';
import { adminDb, jsonError, requireSuperAdmin } from '@/lib/server/admin-auth';
import { AdminError } from '@/lib/server/admin-errors';
import { createPlatformUser, listPlatformUsers } from '@/lib/server/admin-usuarios';
import { parseRequestJson } from '@/lib/server/admin-validators';

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const usuarios = await listPlatformUsers(adminDb());
    return NextResponse.json(usuarios);
  } catch (err) {
    if (err instanceof AdminError) {
      return jsonError(err.message, err.status);
    }
    console.error('[admin/usuarios GET]', err);
    return jsonError('Erro ao listar usuários.', 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await parseRequestJson(request);
    const usuario = await createPlatformUser(
      adminDb(),
      body as Parameters<typeof createPlatformUser>[1],
    );
    return NextResponse.json(usuario, { status: 201 });
  } catch (err) {
    if (err instanceof AdminError) {
      return jsonError(err.message, err.status);
    }
    console.error('[admin/usuarios POST]', err);
    return jsonError('Erro ao criar usuário.', 500);
  }
}
