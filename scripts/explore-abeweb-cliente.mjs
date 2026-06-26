/**
 * Explora tabela Cliente no ABE WEB (schema + amostra).
 * Uso: node --env-file=.env scripts/explore-abeweb-cliente.mjs
 */

import sql from 'mssql';

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Variável ${name} não definida no .env`);
  return v;
}

async function main() {
  const pool = await sql.connect({
    server: requireEnv('ABEWEB_DB_HOST'),
    port: Number(process.env.ABEWEB_DB_PORT ?? 1433),
    database: requireEnv('ABEWEB_DB_NAME'),
    user: requireEnv('ABEWEB_DB_USER'),
    password: requireEnv('ABEWEB_DB_PASSWORD'),
    options: {
      encrypt: true,
      trustServerCertificate: process.env.ABEWEB_DB_TRUST_CERT !== '0',
    },
    requestTimeout: 120_000,
  });

  const tables = await pool.request().query(`
    SELECT TABLE_SCHEMA, TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME LIKE '%Cliente%'
    ORDER BY TABLE_NAME
  `);

  console.log('=== Tabelas com "Cliente" no nome ===');
  for (const r of tables.recordset) {
    console.log(`  ${r.TABLE_SCHEMA}.${r.TABLE_NAME}`);
  }

  for (const tableName of ['Cliente', 'Clientes']) {
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `);
    if (!cols.recordset.length) continue;

    console.log(`\n=== Colunas: ${tableName} (${cols.recordset.length}) ===`);
    for (const c of cols.recordset) {
      const len =
        c.CHARACTER_MAXIMUM_LENGTH != null ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
      const nullish = c.IS_NULLABLE === 'YES' ? ' NULL' : '';
      console.log(`  ${c.COLUMN_NAME.padEnd(42)} ${c.DATA_TYPE}${len}${nullish}`);
    }
  }

  const count = await pool.request().query('SELECT COUNT(*) AS n FROM Cliente WITH (NOLOCK)');
  console.log(`\n=== Total de linhas em Cliente: ${count.recordset[0].n} ===`);

  const sample = await pool.request().query(`
    SELECT TOP 2 *
    FROM Cliente WITH (NOLOCK)
    ORDER BY idCliente
  `);
  console.log('\n=== Amostra (2 linhas — todas as colunas) ===');
  for (const row of sample.recordset) {
    console.log(JSON.stringify(row, null, 2));
    console.log('---');
  }

  const colsPresent = sample.recordset[0] ? Object.keys(sample.recordset[0]) : [];
  const pickCols = [
    'idCliente',
    'idClientePrincipal',
    'Nome',
    'NomeFantasia',
    'CNPJ',
    'CPF',
    'Email',
    'Telefone',
    'Cidade',
    'idEstado',
    'CEP',
    'Endereco',
    'Bairro',
    'Ativo',
    'Status',
  ].filter((c) => colsPresent.includes(c));

  if (pickCols.length) {
    const matrizes = await pool.request().query(`
      SELECT TOP 5 ${pickCols.join(', ')}
      FROM Cliente WITH (NOLOCK)
      WHERE idCliente = idClientePrincipal
      ORDER BY idCliente DESC
    `);
    console.log('\n=== Matrizes (idCliente = idClientePrincipal) — TOP 5 ===');
    console.log(JSON.stringify(matrizes.recordset, null, 2));
  }

  const grupo = await pool.request().query(`
    SELECT TOP 1
      idClientePrincipal,
      COUNT(*) AS qtd_codigos,
      MIN(idCliente) AS menor_cod,
      MAX(idCliente) AS maior_cod
    FROM Cliente WITH (NOLOCK)
    GROUP BY idClientePrincipal
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);
  console.log('\n=== Exemplo grupo com filiais ===');
  console.log(JSON.stringify(grupo.recordset[0], null, 2));

  const endCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Endereco'
    ORDER BY ORDINAL_POSITION
  `);
  console.log(`\n=== Tabela Endereco (${endCols.recordset.length} colunas) ===`);
  for (const c of endCols.recordset) {
    console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
  }

  const rich = await pool.request().query(`
    SELECT TOP 3
      c.idCliente,
      c.idClientePrincipal,
      c.nome,
      c.nomeFantasia,
      c.cnpjCpf,
      c.statusCliente,
      c.serCliente,
      c.dataCadastramento,
      e.endereco,
      e.numero,
      e.bairro,
      e.cidade,
      e.cep,
      e.idEstado
    FROM Cliente c WITH (NOLOCK)
    LEFT JOIN Endereco e ON e.idEndereco = c.idEndereco
    WHERE c.idCliente = c.idClientePrincipal AND c.statusCliente = 'A'
    ORDER BY c.idCliente DESC
  `);
  console.log('\n=== Matriz ativa + endereço (TOP 3) ===');
  console.log(JSON.stringify(rich.recordset, null, 2));

  await pool.close();
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
