import { connectAbeDelphi, connectAbeWeb } from './lib/legado-cliente.mjs';
import sql from 'mssql';

async function webClienteUsuario(pool) {
  const cols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ClienteUsuario' ORDER BY ORDINAL_POSITION
  `);
  console.log('ClienteUsuario cols:', cols.recordset.map((r) => r.COLUMN_NAME).join(', '));

  const sample = await pool.request().query(`
    SELECT TOP 5 * FROM ClienteUsuario WITH (NOLOCK) WHERE idCliente = 40032
  `);
  console.log('ClienteUsuario 40032:', JSON.stringify(sample.recordset, null, 2));

  const cu = await pool.request().query(`
    SELECT TOP 3 cu.*, u.nome AS usuarioNome
    FROM ClienteUsuario cu WITH (NOLOCK)
    LEFT JOIN Usuario u ON u.idUsuario = cu.idUsuario
    WHERE cu.idCliente = 40032
  `).catch(async () => {
    return pool.request().query(`SELECT TOP 3 * FROM ClienteUsuario WITH (NOLOCK) WHERE idCliente = 40032`);
  });
  console.log('ClienteUsuario join:', JSON.stringify(cu.recordset, null, 2));
}

async function webClienteComercialCols(pool) {
  const cols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Cliente'
      AND (COLUMN_NAME LIKE '%Usuario%' OR COLUMN_NAME LIKE '%Comer%' OR COLUMN_NAME LIKE '%Vend%'
           OR COLUMN_NAME LIKE '%Rep%' OR COLUMN_NAME LIKE '%Ger%' OR COLUMN_NAME LIKE '%Respons%'
           OR COLUMN_NAME LIKE '%Atend%' OR COLUMN_NAME LIKE '%Consult%')
    ORDER BY COLUMN_NAME
  `);
  console.log('WEB Cliente cols:', cols.recordset.map((r) => r.COLUMN_NAME).join(', ') || '(nenhuma)');

  const row = await pool.request().input('id', sql.Int, 40032).query(`
    SELECT TOP 1 * FROM Cliente WITH (NOLOCK) WHERE idCliente = @id
  `);
  const keys = Object.keys(row.recordset[0] || {}).filter((k) =>
    /usuario|comer|vend|rep|ger|respons|atend|consult|prepost|ser/i.test(k),
  );
  const pick = {};
  for (const k of keys) pick[k] = row.recordset[0][k];
  console.log('WEB 40032 pick:', JSON.stringify(pick, null, 2));
}

async function delphiComercial(pool) {
  const cols = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Cliente'
      AND (COLUMN_NAME LIKE '%Usuario%' OR COLUMN_NAME LIKE '%Comer%' OR COLUMN_NAME LIKE '%Vend%'
           OR COLUMN_NAME LIKE '%Rep%' OR COLUMN_NAME LIKE '%Ger%' OR COLUMN_NAME LIKE '%Respons%'
           OR COLUMN_NAME LIKE '%Consult%')
    ORDER BY COLUMN_NAME
  `);
  console.log('Delphi Cliente cols:', cols.recordset.map((r) => r.COLUMN_NAME).join(', ') || '(nenhuma)');

  const tables = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME LIKE '%Cliente%Comer%' OR TABLE_NAME LIKE '%Comer%Cliente%'
       OR TABLE_NAME LIKE '%ClienteUsuario%' OR TABLE_NAME LIKE '%Cliente%Vend%'
  `);
  console.log('Delphi link tables:', tables.recordset.map((r) => r.TABLE_NAME).join(', ') || '(nenhuma)');
}

async function main() {
  const wp = await connectAbeWeb();
  await webClienteComercialCols(wp);
  await webClienteUsuario(wp);
  await wp.close();

  const dp = await connectAbeDelphi();
  await delphiComercial(dp);
  await dp.close();
}

main().catch(console.error);
