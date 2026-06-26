/**
 * Sincroniza dados do ABE WEB → Supabase (tabela dashboard_carteira).
 *
 * Uso:
 *   pnpm sync:abeweb              # sync completo (forçado)
 *   pnpm sync:abeweb:check        # só verifica alterações (~2s/credor)
 *   pnpm sync:abeweb:incremental  # sync só se houve mudança
 *   pnpm sync:abeweb:watch        # check a cada 10 min (configurável)
 *   pnpm sync:abeweb --demo       # payload demo
 *
 * Variáveis úteis no .env:
 *   ABEWEB_PAGE_SIZE=2000         # registros por página (default 2000)
 *   ABEWEB_SYNC_INTERVAL_MS=600000  # intervalo do watch (10 min)
 */

import { createClient } from '@supabase/supabase-js';
import {
  attachOpcoesFiltro,
  buildOpcoesLote,
  buildOpcoesUf,
  closePool,
  fetchAllAbeWebRows,
  fetchAllAbeWebRowsAtivos,
  filterBorderoByUf,
  filterCarteiraByUf,
  getAbeWebPool,
  getSyncDateRange,
  mapRowsToPayload,
} from './lib/abeweb.mjs';
import {
  refreshMetricasCache,
  upsertCarteiraSnapshot,
} from './lib/carteira-snapshot.mjs';
import { checkAbeWebChanges } from './lib/sync-check.mjs';
import {
  getSyncState,
  markSyncCheck,
  markSyncError,
  markSyncStart,
  markSyncSuccess,
} from './lib/sync-state.mjs';

const DEMO = process.argv.includes('--demo');
const CHECK_ONLY = process.argv.includes('--check');
const INCREMENTAL = process.argv.includes('--incremental');
const FORCE = process.argv.includes('--force');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function demoPayload() {
  return {
    kpiBordero: [
      { rotulo: 'Valor total enviado', valor: 'R$ 18,4M', detalhe: 'Borderô consolidado' },
      { rotulo: 'Processos enviados', valor: '12.847', detalhe: 'Quantidade de títulos' },
      { rotulo: 'Média de idade no envio', valor: '142 dias', detalhe: 'Idade média dos títulos' },
      { rotulo: 'Lotes no período', valor: '3', detalhe: 'Borderôs recebidos' },
    ],
    kpiFinanceiro: [
      { rotulo: 'Recebido pela ABE', valor: 'R$ 4,92M', detalhe: 'Cobrança ativa' },
      { rotulo: 'Pagamento direto', valor: 'R$ 1,18M', detalhe: 'Devedor → credor' },
      { rotulo: 'Efetividade geral', valor: '33,2%', detalhe: 'Sucesso sobre enviado' },
      { rotulo: 'Total recuperado', valor: 'R$ 6,10M', detalhe: 'ABE + pagamento direto' },
    ],
    kpiCarteiraAtiva: [
      { rotulo: 'Valor em negociação', valor: 'R$ 7,28M', detalhe: 'Carteira ativa' },
      { rotulo: 'Processos ativos', valor: '5.214', detalhe: 'Em tratativa' },
      { rotulo: '% sobre enviado', valor: '39,6%', detalhe: 'Participação da carteira' },
      { rotulo: 'Ticket médio', valor: 'R$ 1.396', detalhe: 'Por processo ativo' },
    ],
    tabelaAcordos: [],
    tabelaBaixas: [],
    carteiraRosca: [],
    enviadoRecebidoMensal: [],
    efetividadePorIdade: [],
    faixaIdadeComparativo: [],
    metricasUf: [],
    composicaoAtores: [],
  };
}

async function upsertSnapshot(tenantId, codCliente, periodo, loteEnvio, uf, payload, label) {
  const json = JSON.stringify(payload);
  const mb = (json.length / (1024 * 1024)).toFixed(2);
  console.log(`    gravando snapshot ${label ?? codCliente} (${mb} MB)…`);
  const t0 = performance.now();
  const { error } = await db.from('dashboard_carteira').upsert(
    {
      tenant_id: tenantId,
      cod_cliente: codCliente,
      periodo,
      lote_envio: loteEnvio,
      uf,
      payload,
      sincronizado_em: new Date().toISOString(),
    },
    { onConflict: 'tenant_id,cod_cliente,periodo,lote_envio,uf' },
  );
  if (error) throw error;
  console.log(`    snapshot ${label ?? codCliente} ✓ (${((performance.now() - t0) / 1000).toFixed(1)}s)`);
}

function buildOpcoesCodCliente(codigos, razaoSocial) {
  const opcoes = [{ value: 'todos', label: 'Todos os códigos' }];
  for (const cod of codigos) {
    opcoes.push({ value: cod, label: `${cod} — ${credorLabel(cod, razaoSocial)}` });
  }
  return opcoes;
}

function credorLabel(cod, razaoSocial) {
  return razaoSocial || `Cliente ${cod}`;
}

async function syncDashboardVariants(
  tenantId,
  codCliente,
  borderoRows,
  carteiraRows,
  dateRange,
  razaoSocial,
  opcoesCodCliente,
) {
  const opcoesUf = buildOpcoesUf(borderoRows);
  const opcoesLote = buildOpcoesLote(borderoRows);
  const opcoes = { opcoesCodCliente, opcoesUf, opcoesLote };

  const buildPayload = (bordero, carteira, storeIndice) =>
    attachOpcoesFiltro(
      mapRowsToPayload(bordero, codCliente, razaoSocial, dateRange, carteira, { storeIndice }),
      opcoes,
    );

  await upsertSnapshot(
    tenantId,
    codCliente,
    'ano_atual',
    'todos',
    'todos',
    buildPayload(borderoRows, carteiraRows, true),
    `${codCliente}/base`,
  );

  for (const { value: uf } of opcoesUf) {
    if (uf === 'todos') continue;
    await upsertSnapshot(
      tenantId,
      codCliente,
      'ano_atual',
      'todos',
      uf,
      buildPayload(filterBorderoByUf(borderoRows, uf), filterCarteiraByUf(carteiraRows, uf), false),
      `${codCliente}/UF-${uf}`,
    );
  }

  console.log(`    snapshots: 1 base + ${opcoesUf.length - 1} UF`);
}

async function syncDemoVariants(tenantId, codCliente, payload, opcoesCodCliente) {
  payload.opcoesCodCliente = opcoesCodCliente;
  payload.opcoesUf = payload.opcoesUf ?? [
    { value: 'todos', label: 'Todos os estados' },
    { value: 'SP', label: 'SP' },
  ];
  payload.opcoesLote = payload.opcoesLote ?? [
    { value: 'todos', label: 'Todos os lotes' },
    { value: 'mes:LOTE01-JAN/26', label: 'LOTE01-JAN/26', grupo: 'mes' },
  ];
  await upsertSnapshot(tenantId, codCliente, 'ano_atual', 'todos', 'todos', payload);
}

async function runCheck(pool, tenantId, cod) {
  const state = await getSyncState(db, tenantId, cod);
  const since = state?.ultimo_bordero_ts ?? state?.ultima_sucesso ?? null;
  const result = await checkAbeWebChanges(pool, cod, since);
  await markSyncCheck(db, tenantId, cod, result);
  return result;
}

async function syncOneCliente(credor, cod, dateRange, opcoesCodCliente) {
  const t0 = performance.now();
  await markSyncStart(db, credor.tenant_id, cod);

  try {
    console.log(`  Cliente ${cod} — borderô (Data Inclusão):`);
    const borderoRows = await fetchAllAbeWebRows(cod, dateRange);
    console.log(`  Cliente ${cod} — carteira completa (pagamentos + ativos):`);
    const carteiraRows = await fetchAllAbeWebRowsAtivos(cod, dateRange);

    await syncDashboardVariants(
      credor.tenant_id,
      cod,
      borderoRows,
      carteiraRows,
      dateRange,
      credor.razao_social,
      opcoesCodCliente,
    );

    const duracaoMs = Math.round(performance.now() - t0);
    await markSyncSuccess(db, credor.tenant_id, cod, {
      linhasBordero: borderoRows.length,
      linhasCarteira: carteiraRows.length,
      duracaoMs,
    });

    return { borderoRows, carteiraRows };
  } catch (err) {
    await markSyncError(db, credor.tenant_id, cod, err);
    throw err;
  }
}

async function main() {
  if (!DEMO && !process.env.ABEWEB_DB_HOST) {
    console.error('ABEWEB_DB_* não configurado no .env da raiz. Use --demo ou preencha as credenciais.');
    process.exit(1);
  }

  const dateRange = getSyncDateRange();
  const pageSize = process.env.ABEWEB_PAGE_SIZE ?? 2000;
  console.log(`Modo: ${CHECK_ONLY ? 'check' : INCREMENTAL ? 'incremental' : 'completo'}`);
  console.log(`Período ABE WEB: ${dateRange.dataInicial} → ${dateRange.dataFinal} · pageSize=${pageSize}`);

  const { data: credores, error } = await db
    .from('credores')
    .select(
      `id, tenant_id, cod_cliente_principal, razao_social, codigos_cliente ( cod_cliente, rotulo )`,
    );

  if (error) throw error;
  if (!credores?.length) {
    console.error('Nenhum credor no Supabase. Rode pnpm db:seed primeiro.');
    process.exit(1);
  }

  let pool = null;

  try {
    if (!DEMO) pool = await getAbeWebPool();

    for (const credor of credores) {
      const principal = credor.cod_cliente_principal?.trim();
      if (!principal) {
        console.log(`Ignorando ${credor.razao_social}: sem cod_cliente_principal`);
        continue;
      }

      const codigosExtras = (credor.codigos_cliente ?? []).map((c) => c.cod_cliente).filter(Boolean);
      const codigos = [...new Set([principal, ...codigosExtras])];
      const opcoesCodCliente = buildOpcoesCodCliente(codigos, credor.razao_social);

      console.log(`\n${credor.razao_social} (tenant ${credor.tenant_id}, códigos ${codigos.join(', ')})`);

      if (DEMO) {
        const payload = demoPayload();
        await syncDemoVariants(credor.tenant_id, 'todos', payload, opcoesCodCliente);
        for (const cod of codigos) {
          await syncDemoVariants(credor.tenant_id, cod, payload, opcoesCodCliente);
        }
        continue;
      }

      if (CHECK_ONLY || (INCREMENTAL && !FORCE)) {
        let algumPendente = false;
        for (const cod of codigos) {
          const tCheck = performance.now();
          const chk = await runCheck(pool, credor.tenant_id, cod);
          console.log(
            `  check ${cod}: ${chk.motivo} (${chk.novosProcessos} proc / ${chk.novosRepasses} rep) · ${((performance.now() - tCheck) / 1000).toFixed(1)}s`,
          );
          if (chk.precisaSync) algumPendente = true;
        }
        if (CHECK_ONLY || !algumPendente) {
          if (CHECK_ONLY) console.log('  → fim do check (sem sync completo)');
          else console.log('  → sem alterações, sync ignorado');
          continue;
        }
        console.log('  → alterações detectadas, iniciando sync completo…');
      }

      let allBordero = [];
      let allCarteira = [];

      for (const cod of codigos) {
        const { borderoRows, carteiraRows } = await syncOneCliente(
          credor,
          cod,
          dateRange,
          opcoesCodCliente,
        );
        allBordero = allBordero.concat(borderoRows);
        allCarteira = allCarteira.concat(carteiraRows);
      }

      if (allBordero.length > 0 || allCarteira.length > 0) {
        console.log(`  Snapshot consolidado (todos):`);
        await syncDashboardVariants(
          credor.tenant_id,
          'todos',
          allBordero,
          allCarteira,
          dateRange,
          credor.razao_social,
          opcoesCodCliente,
        );
      }

      if (allCarteira.length > 0) {
        console.log(`  ETL carteira_snapshot (credor ${credor.id}):`);
        await upsertCarteiraSnapshot(db, credor.id, 'ABE_WEB', allCarteira);
        await refreshMetricasCache(db, credor.id, dateRange, 'TODOS');
      }
    }
  } finally {
    if (!DEMO) await closePool();
  }

  console.log(DEMO ? '\nSync demo OK' : '\nSync ABE WEB OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
