import { NextResponse } from 'next/server';
import { adminDb, jsonError, requireSuperAdmin } from '@/lib/server/admin-auth';
import { AdminError, getCredor, updateCredor } from '@/lib/server/admin-credores';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const credor = await getCredor(adminDb(), id);
    if (!credor) return jsonError('Credor não encontrado.', 404);
    return NextResponse.json(credor);
  } catch (err) {
    console.error('[admin/credores/:id GET]', err);
    return jsonError('Erro ao buscar credor.', 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const credor = await updateCredor(adminDb(), id, body);
    return NextResponse.json(credor);
  } catch (err) {
    if (err instanceof AdminError) {
      return jsonError(err.message, err.status);
    }
    console.error('[admin/credores/:id PATCH]', err);
    return jsonError('Erro ao atualizar credor.', 500);
  }
}
