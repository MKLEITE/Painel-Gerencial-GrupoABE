/**
 * Normaliza linhas ABE WEB → carteira_snapshot (Supabase).
 */

import { parseBrDecimal } from './abeweb.mjs';
import { normalizeEstadoUf } from './estado-uf.mjs';

const BATCH_SIZE = 500;

function parseBrDateToIso(str) {
  if (!str || String(str).trim() === '') return null;
  const parts = String(str).split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map((p) => Number.parseInt(p, 10));
  if (!d || !m || !y) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Converte linha bruta da query 749 no formato carteira_snapshot. */
export function normalizarLinhaCarteira(row, credorId, sistemaOrigem) {
  return {
    credor_id: credorId,
    sistema_origem: sistemaOrigem,
    processo: row.Processo != null ? String(row.Processo) : null,
    data_inclusao: parseBrDateToIso(row['Data Inclusão']),
    data_repasse: parseBrDateToIso(row['Data Repasse']),
    valor_original_titulo: parseBrDecimal(row['Valor Original Título']),
    valor_pago: parseBrDecimal(row['Valor Pago']),
    valor_saldo_devedor: parseBrDecimal(row['Valor Saldo Devedor']),
    tipo: String(row.Tipo ?? '').trim(),
    status: String(row.Status ?? '').trim(),
    visao_geral_carteira: String(row['Visão Geral da Carteira'] ?? '').trim() || null,
    uf: normalizeEstadoUf(row.Estado) || null,
    sincronizado_em: new Date().toISOString(),
  };
}

function brToIso(br) {
  const parts = String(br).split('/');
  if (parts.length !== 3) return br;
  const [d, m, y] = parts;
  return `${y}-${m}-${d}`;
}

/** Grava snapshot linha a linha (substitui credor + sistema). */
export async function upsertCarteiraSnapshot(db, credorId, sistemaOrigem, rows) {
  const normalizados = rows.map((row) => normalizarLinhaCarteira(row, credorId, sistemaOrigem));

  const { error: delErr } = await db
    .from('carteira_snapshot')
    .delete()
    .eq('credor_id', credorId)
    .eq('sistema_origem', sistemaOrigem);

  if (delErr) throw delErr;

  if (normalizados.length === 0) {
    console.log(`    carteira_snapshot ${sistemaOrigem}: 0 linhas (limpo)`);
    return 0;
  }

  for (let i = 0; i < normalizados.length; i += BATCH_SIZE) {
    const chunk = normalizados.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('carteira_snapshot').insert(chunk);
    if (error) throw error;
    console.log(
      `    carteira_snapshot ${sistemaOrigem}: lote ${Math.floor(i / BATCH_SIZE) + 1} (+${chunk.length})`,
    );
  }

  console.log(`    carteira_snapshot ${sistemaOrigem}: ${normalizados.length} registros`);
  return normalizados.length;
}

/** Atualiza metricas_cache via RPC calcular_metricas_credor. */
export async function refreshMetricasCache(db, credorId, dateRange, sistemaOrigem = 'TODOS') {
  const sistema =
    sistemaOrigem == null || sistemaOrigem === '' || sistemaOrigem === 'TODOS'
      ? 'TODOS'
      : sistemaOrigem;
  const pInicio = brToIso(dateRange.dataInicial);
  const pFim = brToIso(dateRange.dataFinal);
  const pSistema = sistema === 'TODOS' ? null : sistema;

  const { data, error } = await db.rpc('calcular_metricas_credor', {
    p_credor_id: credorId,
    p_data_inicio: pInicio,
    p_data_fim: pFim,
    p_sistema: pSistema,
  });

  if (error) throw error;

  const m = data ?? {};
  const row = {
    credor_id: credorId,
    periodo_inicio: pInicio,
    periodo_fim: pFim,
    sistema_origem: sistema,
    bordero_total: m.bordero_total ?? 0,
    bordero_qtd: m.bordero_qtd ?? 0,
    recebido_abe: m.recebido_abe ?? 0,
    pagamento_direto: m.pagamento_direto ?? 0,
    devolvido_nao_processado: m.devolvido_nao_processado ?? 0,
    devolvido_nao_estabelecido: m.devolvido_nao_estabelecido ?? 0,
    devolvido_incobavel: m.devolvido_incobavel ?? 0,
    ativo_saldo_devedor: m.ativo_saldo_devedor ?? 0,
    acordo_com_pagamento: m.acordo_com_pagamento ?? 0,
    acordo_a_receber: m.acordo_a_receber ?? 0,
    em_cobranca: m.em_cobranca ?? 0,
    quebra_de_acordo: m.quebra_de_acordo ?? 0,
    calculado_em: new Date().toISOString(),
  };

  const { error: upsertErr } = await db.from('metricas_cache').upsert(row, {
    onConflict: 'credor_id,periodo_inicio,periodo_fim,sistema_origem',
  });

  if (upsertErr) throw upsertErr;
  console.log(`    metricas_cache atualizado (${pInicio} → ${pFim})`);
}
