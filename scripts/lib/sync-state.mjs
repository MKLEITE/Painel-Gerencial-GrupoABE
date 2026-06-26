/** Persistência do estado de sync no Supabase. */

export async function getSyncState(db, tenantId, codCliente, fonte = 'abeweb') {
  const { data, error } = await db
    .from('sync_state')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('fonte', fonte)
    .eq('cod_cliente', codCliente)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertSyncState(db, row) {
  const { error } = await db.from('sync_state').upsert(row, {
    onConflict: 'tenant_id,fonte,cod_cliente',
  });
  if (error) throw error;
}

export async function markSyncStart(db, tenantId, codCliente, fonte = 'abeweb') {
  await upsertSyncState(db, {
    tenant_id: tenantId,
    fonte,
    cod_cliente: codCliente,
    ultima_exec: new Date().toISOString(),
    status: 'running',
    mensagem: 'Sincronizando…',
  });
}

export async function markSyncSuccess(
  db,
  tenantId,
  codCliente,
  { linhasBordero, linhasCarteira, duracaoMs, ultimoBorderoTs, fonte = 'abeweb' },
) {
  const now = new Date().toISOString();
  await upsertSyncState(db, {
    tenant_id: tenantId,
    fonte,
    cod_cliente: codCliente,
    ultima_exec: now,
    ultima_sucesso: now,
    ultimo_check: now,
    ultimo_bordero_ts: ultimoBorderoTs ?? now,
    linhas_bordero: linhasBordero,
    linhas_carteira: linhasCarteira,
    duracao_ms: duracaoMs,
    status: 'ok',
    mensagem: `OK — ${linhasBordero} borderô / ${linhasCarteira} carteira (${Math.round(duracaoMs / 1000)}s)`,
  });
}

export async function markSyncCheck(db, tenantId, codCliente, { precisaSync, motivo, fonte = 'abeweb' }) {
  await upsertSyncState(db, {
    tenant_id: tenantId,
    fonte,
    cod_cliente: codCliente,
    ultimo_check: new Date().toISOString(),
    status: precisaSync ? 'pending' : 'ok',
    mensagem: precisaSync ? `Pendente: ${motivo}` : 'Sem alterações',
  });
}

export async function markSyncError(db, tenantId, codCliente, err, fonte = 'abeweb') {
  await upsertSyncState(db, {
    tenant_id: tenantId,
    fonte,
    cod_cliente: codCliente,
    ultima_exec: new Date().toISOString(),
    status: 'error',
    mensagem: String(err?.message ?? err).slice(0, 500),
  });
}
