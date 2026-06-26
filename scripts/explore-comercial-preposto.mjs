/**
 * Descobre colunas de comercial/preposto nas tabelas Cliente (WEB + Delphi).
 */
import sql from 'mssql';
import { connectAbeDelphi, connectAbeWeb } from './lib/legado-cliente.mjs';

async function findCols(pool, label) {
  const all = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Cliente'
    ORDER BY ORDINAL_POSITION
  `);
  const names = all.recordset.map((x) => x.COLUMN_NAME);
  const hits = names.filter((n) =>
    /prepost|comerc|repres|vended|gerente|agente|funcionario|idFunc|idRep|idCom|Comercial|Preposto|Representante/i.test(
      n,
    ),
  );
  console.log(`\n=== ${label} — colunas relacionadas (${hits.length}) ===`);
  for (const h of hits) {
    const row = all.recordset.find((x) => x.COLUMN_NAME === h);
    console.log(`  ${h} (${row?.DATA_TYPE})`);
  }

  // Tabelas auxiliares
  const tables = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND (TABLE_NAME LIKE '%Prepost%' OR TABLE_NAME LIKE '%Comerc%' OR TABLE_NAME LIKE '%Represent%'
           OR TABLE_NAME LIKE '%Vended%' OR TABLE_NAME LIKE '%Funcionario%')
    ORDER BY TABLE_NAME
  `);
  if (tables.recordset.length) {
    console.log('  Tabelas auxiliares:');
    for (const t of tables.recordset) console.log(`    ${t.TABLE_NAME}`);
  }
}

async function sampleRow(pool, label, codField, cod) {
  const cols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Cliente'
  `);
  const names = new Set(cols.recordset.map((x) => x.COLUMN_NAME));
  const pick = [...names].filter((n) =>
    /prepost|comerc|repres|vended|gerente|agente|funcionario|idFunc|idRep|idCom|Comercial|Preposto|Representante|CodCliente|idCliente|CodPrincipal|idClientePrincipal/i.test(
      n,
    ),
  );
  if (!pick.includes(codField)) pick.unshift(codField);

  const q = `SELECT TOP 1 ${pick.join(', ')} FROM Cliente WITH (NOLOCK) WHERE ${codField} = @cod`;
  const r = await pool.request().input('cod', sql.Int, cod).query(q);
  console.log(`\n=== ${label} amostra cod ${cod} ===`);
  console.log(JSON.stringify(r.recordset[0], null, 2));
}

async function main() {
  const webPool = await connectAbeWeb();
  await findCols(webPool, 'ABE WEB');
  await sampleRow(webPool, 'WEB', 'idCliente', 40032);

  const wt = await webPool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE='BASE TABLE'
      AND (TABLE_NAME LIKE '%Comerc%' OR TABLE_NAME LIKE '%Func%' OR TABLE_NAME LIKE '%Vend%'
           OR TABLE_NAME LIKE '%Repres%' OR TABLE_NAME LIKE '%Usuario%' OR TABLE_NAME LIKE '%Colab%'
           OR TABLE_NAME LIKE '%Prepost%')
    ORDER BY TABLE_NAME
  `);
  console.log('\nWEB tabelas comerciais:', wt.recordset.map((r) => r.TABLE_NAME).join(', ') || '(nenhuma)');

  const ser = await webPool.request().query(`
    SELECT TOP 5 idCliente, serCliente, preposto FROM Cliente WITH (NOLOCK)
    WHERE serCliente IS NOT NULL AND LTRIM(RTRIM(serCliente)) <> ''
    ORDER BY idCliente DESC
  `);
  console.log('\nWEB serCliente amostra:');
  console.log(JSON.stringify(ser.recordset, null, 2));

  await webPool.close();

  const delphiPool = await connectAbeDelphi();
  await findCols(delphiPool, 'ABE Delphi');
  await sampleRow(delphiPool, 'Delphi', 'CodCliente', 18476);

  const dt = await delphiPool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE='BASE TABLE'
      AND (TABLE_NAME LIKE '%Comerc%' OR TABLE_NAME LIKE '%Func%' OR TABLE_NAME LIKE '%Vend%'
           OR TABLE_NAME LIKE '%Repres%' OR TABLE_NAME LIKE '%Usuario%' OR TABLE_NAME LIKE '%Prepost%')
    ORDER BY TABLE_NAME
  `);
  console.log('\nDelphi tabelas comerciais:', dt.recordset.map((r) => r.TABLE_NAME).join(', ') || '(nenhuma)');

  const dc = await delphiPool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Cliente'
      AND (COLUMN_NAME LIKE '%Comer%' OR COLUMN_NAME LIKE '%Ser%' OR COLUMN_NAME LIKE '%Rep%'
           OR COLUMN_NAME LIKE '%Vend%' OR COLUMN_NAME LIKE '%Func%')
    ORDER BY COLUMN_NAME
  `);
  console.log('\nDelphi Cliente cols extra:', dc.recordset.map((r) => r.COLUMN_NAME).join(', '));

  await delphiPool.close();
}

main().catch(console.error);
