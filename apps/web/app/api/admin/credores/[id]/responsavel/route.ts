import { NextResponse } from 'next/server';
import { adminDb, jsonError, requireSuperAdmin } from '@/lib/server/admin-auth';
import { AdminError, updateResponsavelCredor } from '@/lib/server/admin-credores';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const result = await updateResponsavelCredor(adminDb(), id, body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AdminError) {
      return jsonError(err.message, err.status);
    }
    console.error('[admin/credores/:id/responsavel PATCH]', err);
    return jsonError('Erro ao atualizar responsável.', 500);
  }
}
