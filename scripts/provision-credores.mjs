/**
 * Provisiona credores a partir de ABE WEB + ABE Delphi (merge por CNPJ).
 * Não cria usuário responsável — vinculação manual depois.
 *
 * Uso:
 *   pnpm provision:credores              # aplica no Supabase
 *   pnpm provision:credores --dry-run    # só simula
 *   pnpm provision:credores --limit=10   # limita quantidade
 */

import { createClient } from '@supabase/supabase-js';
import {
  connectAbeDelphi,
  connectAbeWeb,
  fetchAbeDelphiMatrizes,
  fetchAbeWebMatrizes,
  mergeLegadoClientes,
  normalizeCnpj,
  pickFirst,
} from './lib/legado-cliente.mjs';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0) || null;
const ONLY_WEB = process.argv.includes('--only=web');
const ONLY_DELPHI = process.argv.includes('--only=delphi');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CREDOR_SELECT_BASE = `
  id, tenant_id, cnpj, cod_cliente_principal, abe_cliente_id,
  razao_social, nome_fantasia, telefone, email_comercial,
  cep, cidade, estado, bairro, endereco, numero, complemento
`;

async function ensureSchema() {
  if (DRY_RUN) return;

  const { error } = await db.from('credores').select('abe_delphi_cliente_id').limit(1);
  if (error?.code === '42703') {
    console.error('\n✗ Coluna credores.abe_delphi_cliente_id não existe no Supabase.');
    console.error('  Aplique a migration: supabase/migrations/009_credores_legado_ids.sql');
    console.error('  (SQL Editor do Supabase → colar e executar)\n');
    process.exit(1);
  }
  if (error) throw error;
}

async function loadExistingCredores() {
  let data;
  let error;

  ({ data, error } = await db
    .from('credores')
    .select(`${CREDOR_SELECT_BASE}, abe_delphi_cliente_id`));

  if (error?.code === '42703') {
    ({ data, error } = await db.from('credores').select(CREDOR_SELECT_BASE));
  }

  if (error) throw error;

  const byCnpj = new Map();
  const byWeb = new Map();
  const byDelphi = new Map();

  for (const row of data ?? []) {
    const cnpj = normalizeCnpj(row.cnpj);
    if (cnpj) byCnpj.set(cnpj, row);
    const webId = row.cod_cliente_principal ?? row.abe_cliente_id;
    if (webId) byWeb.set(String(webId), row);
    if (row.abe_delphi_cliente_id) byDelphi.set(String(row.abe_delphi_cliente_id), row);
  }

  return { rows: data ?? [], byCnpj, byWeb, byDelphi };
}

function findExisting(existing, merged) {
  if (existing.byCnpj.has(merged.cnpj)) return existing.byCnpj.get(merged.cnpj);
  if (merged.cod_cliente_principal && existing.byWeb.has(merged.cod_cliente_principal)) {
    return existing.byWeb.get(merged.cod_cliente_principal);
  }
  if (merged.abe_delphi_cliente_id && existing.byDelphi.has(merged.abe_delphi_cliente_id)) {
    return existing.byDelphi.get(merged.abe_delphi_cliente_id);
  }
  return null;
}

function buildCredorPatch(existing, merged) {
  const patch = {
    razao_social: merged.razao_social,
    nome_fantasia: merged.nome_fantasia,
    cnpj: merged.cnpj,
    telefone: pickFirst(merged.telefone, existing?.telefone),
    email_comercial: pickFirst(merged.email_comercial, existing?.email_comercial),
    cep: pickFirst(merged.cep, existing?.cep),
    cidade: pickFirst(merged.cidade, existing?.cidade),
    estado: pickFirst(merged.estado, existing?.estado),
    bairro: pickFirst(merged.bairro, existing?.bairro),
    endereco: pickFirst(merged.endereco, existing?.endereco),
    numero: pickFirst(merged.numero, existing?.numero),
    complemento: pickFirst(merged.complemento, existing?.complemento),
    setores: [],
    paginas_acesso: ['dashboard'],
  };

  if (merged.cod_cliente_principal) {
    patch.cod_cliente_principal = merged.cod_cliente_principal;
    patch.abe_cliente_id = merged.abe_cliente_id;
  } else if (existing?.cod_cliente_principal) {
    patch.cod_cliente_principal = existing.cod_cliente_principal;
    patch.abe_cliente_id = existing.abe_cliente_id ?? existing.cod_cliente_principal;
  }

  if (merged.abe_delphi_cliente_id) {
    patch.abe_delphi_cliente_id = merged.abe_delphi_cliente_id;
  } else if (existing?.abe_delphi_cliente_id) {
    patch.abe_delphi_cliente_id = existing.abe_delphi_cliente_id;
  }

  return patch;
}

async function upsertCodigos(credorId, codigos) {
  if (!codigos.length) return 0;

  const { error } = await db.from('codigos_cliente').upsert(
    codigos.map((c) => ({
      credor_id: credorId,
      cod_cliente: c.cod_cliente,
      rotulo: c.rotulo,
    })),
    { onConflict: 'credor_id,cod_cliente', ignoreDuplicates: false },
  );

  if (error) throw error;
  return codigos.length;
}

async function createCredorSemResponsavel(merged) {
  const tenantNome = merged.nome_fantasia ?? merged.razao_social;

  const { data: tenant, error: tenantError } = await db
    .from('tenants')
    .insert({ nome: tenantNome, status: 'ATIVO' })
    .select('id')
    .single();

  if (tenantError) throw tenantError;

  const patch = buildCredorPatch(null, merged);

  const { data: credor, error: credorError } = await db
    .from('credores')
    .insert({ tenant_id: tenant.id, ...patch })
    .select('id')
    .single();

  if (credorError) {
    await db.from('tenants').delete().eq('id', tenant.id);
    throw credorError;
  }

  await upsertCodigos(credor.id, merged.codigos_cliente);
  return credor.id;
}

async function updateCredorExistente(existing, merged) {
  const patch = buildCredorPatch(existing, merged);

  const { error } = await db.from('credores').update(patch).eq('id', existing.id);
  if (error) throw error;

  const tenantNome = patch.nome_fantasia ?? patch.razao_social;
  await db.from('tenants').update({ nome: tenantNome }).eq('id', existing.tenant_id);

  await upsertCodigos(existing.id, merged.codigos_cliente);
  return existing.id;
}

async function main() {
  console.log(`Provision credores — modo ${DRY_RUN ? 'DRY-RUN' : 'APLICAR'}`);
  await ensureSchema();

  let webPool = null;
  let delphiPool = null;
  let webRows = [];
  let delphiRows = [];

  try {
    if (!ONLY_DELPHI && process.env.ABEWEB_DB_HOST) {
      webPool = await connectAbeWeb();
      webRows = await fetchAbeWebMatrizes(webPool);
      console.log(`ABE WEB: ${webRows.length} matrizes ativas com CNPJ`);
    } else if (!ONLY_DELPHI) {
      console.warn('ABEWEB_DB_HOST não configurado — pulando WEB');
    }

    if (!ONLY_WEB && process.env.ABEDELPHI_DB_HOST) {
      delphiPool = await connectAbeDelphi();
      delphiRows = await fetchAbeDelphiMatrizes(delphiPool);
      console.log(`ABE Delphi: ${delphiRows.length} matrizes ativas com CNPJ`);
    } else if (!ONLY_WEB) {
      console.warn('ABEDELPHI_DB_HOST não configurado — pulando Delphi');
    }
  } finally {
    if (webPool) await webPool.close();
    if (delphiPool) await delphiPool.close();
  }

  if (!webRows.length && !delphiRows.length) {
    console.error('Nenhum dado legado encontrado.');
    process.exit(1);
  }

  let merged = mergeLegadoClientes(webRows, delphiRows);
  const totalMerged = merged.length;

  const both = merged.filter((m) => m.fontes.length === 2).length;
  const onlyWeb = merged.filter((m) => m.fontes.length === 1 && m.fontes[0] === 'ABE_WEB').length;
  const onlyDelphi = merged.filter((m) => m.fontes.length === 1 && m.fontes[0] === 'ABE_DELPHI').length;

  console.log(`Merge por CNPJ: ${totalMerged} credores (${both} nos dois BDs, ${onlyWeb} só WEB, ${onlyDelphi} só Delphi)`);

  if (LIMIT) {
    merged = merged.slice(0, LIMIT);
    console.log(`Limitando a ${LIMIT} registros`);
  }

  const existing = await loadExistingCredores();
  console.log(`Supabase: ${existing.rows.length} credores já cadastrados`);

  let criados = 0;
  let atualizados = 0;
  let ignorados = 0;

  for (const item of merged) {
    const found = findExisting(existing, item);

    if (DRY_RUN) {
      const acao = found ? 'ATUALIZAR' : 'CRIAR';
      console.log(
        `  [${acao}] ${item.razao_social} · CNPJ ${item.cnpj} · WEB ${item.cod_cliente_principal ?? '—'} · Delphi ${item.abe_delphi_cliente_id ?? '—'} · ${item.codigos_cliente.length} códigos extras`,
      );
      if (found) atualizados++;
      else criados++;
      continue;
    }

    try {
      if (found) {
        await updateCredorExistente(found, item);
        atualizados++;
      } else {
        await createCredorSemResponsavel(item);
        criados++;
      }
    } catch (err) {
      ignorados++;
      console.error(`  ✗ ${item.razao_social} (${item.cnpj}): ${err.message}`);
    }
  }

  console.log('\nResumo:');
  console.log(`  Criados:     ${criados}`);
  console.log(`  Atualizados: ${atualizados}`);
  if (ignorados) console.log(`  Erros:       ${ignorados}`);
  console.log('  Responsável: não alterado (preencher manualmente no admin)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
