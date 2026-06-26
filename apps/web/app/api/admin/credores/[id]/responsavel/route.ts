import { NextResponse } from 'next/server';
import { adminDb, jsonError, requireSuperAdmin } from '@/lib/server/admin-auth';
import {
  AdminError,
  createResponsavelCredor,
  updateResponsavelCredor,
} from '@/lib/server/admin-credores';
import { parseRequestJson } from '@/lib/server/admin-validators';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await parseRequestJson(request);
    const result = await createResponsavelCredor(
      adminDb(),
      id,
      body as Parameters<typeof createResponsavelCredor>[2],
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof AdminError) {
      return jsonError(err.message, err.status);
    }
    console.error('[admin/credores/:id/responsavel POST]', err);
    return jsonError('Erro ao criar login do responsável.', 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await parseRequestJson(request);
    const result = await updateResponsavelCredor(
      adminDb(),
      id,
      body as Parameters<typeof updateResponsavelCredor>[2],
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AdminError) {
      return jsonError(err.message, err.status);
    }
    console.error('[admin/credores/:id/responsavel PATCH]', err);
    return jsonError('Erro ao atualizar responsável.', 500);
  }
}
