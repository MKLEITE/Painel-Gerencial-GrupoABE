import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assertIsoDate } from '@/lib/server/admin-validators';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let dataInicio: string;
  let dataFim: string;

  try {
    const rawInicio = searchParams.get('data_inicio') ?? searchParams.get('dataInicio');
    const rawFim = searchParams.get('data_fim') ?? searchParams.get('dataFinal');
    if (!rawInicio || !rawFim) {
      return NextResponse.json(
        { error: 'data_inicio e data_fim são obrigatórios (YYYY-MM-DD)' },
        { status: 400 },
      );
    }
    dataInicio = assertIsoDate(rawInicio, 'data_inicio');
    dataFim = assertIsoDate(rawFim, 'data_fim');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parâmetros de data inválidos.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const sistema = searchParams.get('sistema')?.trim() || null;
  if (sistema && !['WEB', 'Delphi', 'TODOS'].includes(sistema)) {
    return NextResponse.json({ error: 'sistema inválido' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('usuarios')
    .select('tenant_id, ativo')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.ativo) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 403 });
  }

  const { data: credor, error: credorError } = await supabase
    .from('credores')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle();

  if (credorError || !credor) {
    return NextResponse.json({ error: 'Credor não encontrado para este tenant' }, { status: 404 });
  }

  const { data: metricas, error: rpcError } = await supabase.rpc('calcular_metricas_credor', {
    p_credor_id: credor.id,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_sistema: sistema,
  });

  if (rpcError) {
    console.error('[metricas GET]', rpcError);
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  const { data: cacheRow } = await supabase
    .from('metricas_cache')
    .select('calculado_em')
    .eq('credor_id', credor.id)
    .eq('periodo_inicio', dataInicio)
    .eq('periodo_fim', dataFim)
    .eq('sistema_origem', sistema ?? 'TODOS')
    .maybeSingle();

  return NextResponse.json({
    metricas,
    credor_id: credor.id,
    sincronizado_em: cacheRow?.calculado_em ?? null,
  });
}
