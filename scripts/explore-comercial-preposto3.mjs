import sql from 'mssql';
import { connectAbeDelphi, connectAbeWeb } from './lib/legado-cliente.mjs';

async function usuarioCols(pool, table = 'Usuario') {
  const c = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='${table}' ORDER BY ORDINAL_POSITION
  `);
  return c.recordset.map((r) => r.COLUMN_NAME);
}

async function resolveWeb(pool, idCliente) {
  const ucols = await usuarioCols(pool);
  const nameCol = ucols.find((c) => /^nome$/i.test(c)) ?? ucols.find((c) => /nome/i.test(c)) ?? 'idUsuario';
  const r = await pool.request().input('id', sql.Int, idCliente).query(`
    SELECT c.idCliente, c.preposto, c.idUsuarioPrincipal, u.${nameCol} AS comercialPrincipal
    FROM Cliente c WITH (NOLOCK)
    LEFT JOIN Usuario u ON u.idUsuario = c.idUsuarioPrincipal
    WHERE c.idCliente = @id
  `);
  console.log('WEB Usuario cols sample:', ucols.slice(0, 15).join(', '));
  console.log('WEB', idCliente, JSON.stringify(r.recordset[0], null, 2));
}

async function resolveDelphi(pool, cod) {
  const ucols = await usuarioCols(pool);
  const nameCol = ucols.find((c) => /^Nome$/i.test(c)) ?? ucols.find((c) => /nome/i.test(c)) ?? 'CodUsuario';
  const r = await pool.request().input('cod', sql.Int, cod).query(`
    SELECT c.CodCliente, c.Preposto, c.CodUsuario, u.${nameCol} AS comercialPrincipal
    FROM Cliente c WITH (NOLOCK)
    LEFT JOIN Usuario u ON u.CodUsuario = c.CodUsuario
    WHERE c.CodCliente = @cod
  `);
  console.log('Delphi Usuario cols sample:', ucols.slice(0, 15).join(', '));
  console.log('Delphi', cod, JSON.stringify(r.recordset[0], null, 2));
}

async function main() {
  const wp = await connectAbeWeb();
  await resolveWeb(wp, 40032);
  await wp.close();
  const dp = await connectAbeDelphi();
  await resolveDelphi(dp, 18476);
  await dp.close();
}

main().catch(console.error);
