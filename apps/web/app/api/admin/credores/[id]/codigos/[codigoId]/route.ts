import { NextResponse } from 'next/server';
import { adminDb, jsonError, requireSuperAdmin } from '@/lib/server/admin-auth';
import { updateCredorCodigo } from '@/lib/server/admin-credor-codigos';
import { AdminError } from '@/lib/server/admin-errors';
import { parseRequestJson } from '@/lib/server/admin-validators';

type Params = { params: Promise<{ id: string; codigoId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id, codigoId } = await params;

  try {
    const body = await parseRequestJson(request);
    const codigo = await updateCredorCodigo(
      adminDb(),
      id,
      codigoId,
      body as Parameters<typeof updateCredorCodigo>[3],
    );
    return NextResponse.json(codigo);
  } catch (err) {
    if (err instanceof AdminError) return jsonError(err.message, err.status);
    console.error('[admin/credores/:id/codigos/:codigoId PATCH]', err);
    return jsonError('Erro ao salvar cadastro do código.', 500);
  }
}
