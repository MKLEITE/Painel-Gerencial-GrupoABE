/**
 * Descobre códigos do grupo na tabela Cliente (WEB/Delphi) e preenche
 * codigos_cliente com cadastro completo de cada código.
 *
 * Uso:
 *   pnpm backfill:codigos              # aplica
 *   pnpm backfill:codigos --dry-run    # simula
 *   pnpm backfill:codigos --limit=20   # limita credores
 *   pnpm backfill:codigos --credor=<uuid>
 */

import sql from 'mssql';
import { createClient } from '@supabase/supabase-js';
import {
  connectAbeDelphi,
  connectAbeWeb,
  fetchAbeDelphiClientePorCodigo,
  fetchAbeWebClientePorCodigo,
} from './lib/legado-cliente.mjs';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0) || null;
const CREDOR_ID = process.argv.find((a) => a.startsWith('--credor='))?.split('=')[1]?.trim() || null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureSchema() {
  const { error } = await db.from('codigos_cliente').select('comercial_principal, preposto').limit(1);
  if (error?.code === '42703') {
    console.error('\n✗ Colunas comercial/preposto não existem.');
    console.error('  Aplique: supabase/migrations/011_comercial_preposto.sql\n');
    process.exit(1);
  }
  if (error) throw error;
}

async function fetchCodigosGrupoWeb(pool, principal) {
  const id = Number(principal);
  if (!Number.isFinite(id)) return [];

  const result = await pool.request().input('p', sql.Int, id).query(`
    SELECT idCliente
    FROM Cliente WITH (NOLOCK)
    WHERE statusCliente = 'A'
      AND (idClientePrincipal = @p OR idCliente = @p)
  `);

  return [...new Set(result.recordset.map((r) => String(r.idCliente)))].sort(
    (a, b) => Number(a) - Number(b),
  );
}

async function fetchCodigosGrupoDelphi(pool, principal) {
  const id = Number(principal);
  if (!Number.isFinite(id)) return [];

  const result = await pool.request().input('p', sql.Int, id).query(`
    SELECT CodCliente
    FROM Cliente WITH (NOLOCK)
    WHERE Status = 'A'
      AND CodPrincipal = @p
  `);

  const codes = result.recordset.map((r) => String(r.CodCliente));
  if (!codes.includes(String(principal))) codes.unshift(String(principal));
  return [...new Set(codes)].sort((a, b) => Number(a) - Number(b));
}

function cadastroPatchFromLegado(legado) {
  if (!legado) return null;
  return {
    rotulo: legado.rotulo,
    papel: legado.papel,
    razao_social: legado.razao_social,
    nome_fantasia: legado.nome_fantasia,
    cnpj: legado.cnpj,
    telefone: legado.telefone,
    email_comercial: legado.email_comercial,
    cep: legado.cep,
    cidade: legado.cidade,
    estado: legado.estado,
    bairro: legado.bairro,
    endereco: legado.endereco,
    numero: legado.numero,
    complemento: legado.complemento,
    comercial_principal: legado.comercial_principal,
    preposto: legado.preposto,
    legado_sync_em: new Date().toISOString(),
  };
}

function credorPatchFromWebMatriz(legado) {
  if (!legado) return null;
  return {
    razao_social: legado.razao_social,
    nome_fantasia: legado.nome_fantasia,
    cnpj: legado.cnpj,
    telefone: legado.telefone,
    email_comercial: legado.email_comercial,
    cep: legado.cep,
    cidade: legado.cidade,
    estado: legado.estado,
    bairro: legado.bairro,
    endereco: legado.endereco,
    numero: legado.numero,
    complemento: legado.complemento,
    comercial_principal: legado.comercial_principal,
    preposto_web: legado.preposto,
  };
}

async function loadCredores() {
  let query = db
    .from('credores')
    .select('id, razao_social, cod_cliente_principal, abe_delphi_cliente_id')
    .order('razao_social');

  if (CREDOR_ID) query = query.eq('id', CREDOR_ID);

  const { data, error } = await query;
  if (error) throw error;

  let rows = data ?? [];
  if (LIMIT) rows = rows.slice(0, LIMIT);
  return rows;
}

async function main() {
  await ensureSchema();

  const credores = await loadCredores();
  if (!credores.length) {
    console.log('Nenhum credor encontrado.');
    return;
  }

  console.log(`\nBackfill de códigos — ${credores.length} credor(es)${DRY_RUN ? ' [dry-run]' : ''}\n`);

  const webPool = await connectAbeWeb();
  const delphiPool = await connectAbeDelphi();

  let totalDescobertos = 0;
  let totalAtualizados = 0;
  let totalCredoresSync = 0;

  try {
    for (const credor of credores) {
      const webPrincipal = credor.cod_cliente_principal?.trim();
      const delphiPrincipal = credor.abe_delphi_cliente_id?.trim();

      const esperados = [];

      if (webPrincipal) {
        const codes = await fetchCodigosGrupoWeb(webPool, webPrincipal);
        for (const cod of codes) {
          esperados.push({
            cod_cliente: cod,
            rotulo: 'ABE_WEB',
            papel: cod === webPrincipal ? 'matriz' : 'filial',
          });
        }
      }

      if (delphiPrincipal) {
        const codes = await fetchCodigosGrupoDelphi(delphiPool, delphiPrincipal);
        for (const cod of codes) {
          esperados.push({
            cod_cliente: cod,
            rotulo: 'ABE_DELPHI',
            papel: cod === delphiPrincipal ? 'matriz' : 'filial',
          });
        }
      }

      if (!esperados.length) {
        console.log(`  [skip] ${credor.razao_social} — sem código master WEB/Delphi`);
        continue;
      }

      totalDescobertos += esperados.length;
      console.log(`  ${credor.razao_social} — ${esperados.length} código(s) no grupo`);

      for (const exp of esperados) {
        const fetcher =
          exp.rotulo === 'ABE_DELPHI'
            ? () => fetchAbeDelphiClientePorCodigo(delphiPool, exp.cod_cliente)
            : () => fetchAbeWebClientePorCodigo(webPool, exp.cod_cliente);

        const legado = await fetcher();
        const patch = cadastroPatchFromLegado(legado);

        const row = {
          credor_id: credor.id,
          cod_cliente: exp.cod_cliente,
          rotulo: exp.rotulo,
          papel: exp.papel,
          ...(patch ?? {}),
        };

        if (DRY_RUN) {
          console.log(
            `    [dry] ${exp.rotulo} ${exp.cod_cliente} (${exp.papel}) → ${legado?.razao_social ?? '—'}`,
          );
          continue;
        }

        const { error: upsertError } = await db.from('codigos_cliente').upsert(row, {
          onConflict: 'credor_id,cod_cliente',
        });

        if (upsertError) {
          console.error(`    ✗ ${exp.cod_cliente}:`, upsertError.message);
          continue;
        }

        totalAtualizados++;

        if (exp.papel === 'matriz' && exp.rotulo === 'ABE_WEB' && legado) {
          const credorPatch = credorPatchFromWebMatriz(legado);
          if (credorPatch) {
            await db.from('credores').update(credorPatch).eq('id', credor.id);
            totalCredoresSync++;
          }
        }

        if (exp.papel === 'matriz' && exp.rotulo === 'ABE_DELPHI' && legado?.preposto) {
          await db.from('credores').update({ preposto_delphi: legado.preposto }).eq('id', credor.id);
        }
      }
    }
  } finally {
    await webPool.close();
    await delphiPool.close();
  }

  console.log('\n--- Resumo ---');
  console.log(`  Códigos descobertos nos grupos: ${totalDescobertos}`);
  if (!DRY_RUN) {
    console.log(`  Registros atualizados em codigos_cliente: ${totalAtualizados}`);
    console.log(`  Credores sincronizados (matriz WEB): ${totalCredoresSync}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
