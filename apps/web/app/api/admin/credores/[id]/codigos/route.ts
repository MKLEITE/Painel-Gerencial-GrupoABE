import { NextResponse } from 'next/server';
import { adminDb, jsonError, requireSuperAdmin } from '@/lib/server/admin-auth';
import { listCredorCodigos } from '@/lib/server/admin-credor-codigos';
import { AdminError } from '@/lib/server/admin-credores';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const codigos = await listCredorCodigos(adminDb(), id);
    return NextResponse.json(codigos);
  } catch (err) {
    if (err instanceof AdminError) return jsonError(err.message, err.status);
    console.error('[admin/credores/:id/codigos GET]', err);
    return jsonError('Erro ao listar códigos do credor.', 500);
  }
}
