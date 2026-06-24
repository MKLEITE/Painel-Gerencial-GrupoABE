import { NextResponse } from 'next/server';
import { adminDb, jsonError, requireSuperAdmin } from '@/lib/server/admin-auth';
import { AdminError, createCredor, listCredores } from '@/lib/server/admin-credores';

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const credores = await listCredores(adminDb());
    return NextResponse.json(credores);
  } catch (err) {
    console.error('[admin/credores GET]', err);
    return jsonError('Erro ao listar credores.', 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const result = await createCredor(adminDb(), body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof AdminError) {
      return jsonError(err.message, err.status);
    }
    console.error('[admin/credores POST]', err);
    return jsonError('Erro ao criar credor.', 500);
  }
}
