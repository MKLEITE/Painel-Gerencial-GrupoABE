/**
 * Explora tabela Cliente no ABE Delphi (schema + amostra).
 * Uso: node --env-file=.env scripts/explore-abedelphi-cliente.mjs
 */

import sql from 'mssql';

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Variável ${name} não definida no .env`);
  return v;
}

function delphiConfig() {
  const trustCert = process.env.ABEDELPHI_DB_TRUST_CERT !== '0';
  const encrypt = process.env.ABEDELPHI_DB_ENCRYPT === '1';

  return {
    server: requireEnv('ABEDELPHI_DB_HOST'),
    port: Number(process.env.ABEDELPHI_DB_PORT ?? 1433),
    database: requireEnv('ABEDELPHI_DB_NAME'),
    user: requireEnv('ABEDELPHI_DB_USER'),
    password: requireEnv('ABEDELPHI_DB_PASSWORD'),
    options: {
      encrypt,
      trustServerCertificate: trustCert,
      enableArithAbort: true,
    },
    connectionTimeout: Number(process.env.ABEDELPHI_CONNECTION_TIMEOUT_MS ?? 15_000),
    requestTimeout: Number(process.env.ABEDELPHI_REQUEST_TIMEOUT_MS ?? 120_000),
  };
}

async function main() {
  const cfg = delphiConfig();
  console.log(`Conectando ABE Delphi: ${cfg.server}:${cfg.port} / ${cfg.database}`);

  const pool = await sql.connect(cfg);

  const tables = await pool.request().query(`
    SELECT TABLE_SCHEMA, TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME LIKE '%Cliente%'
    ORDER BY TABLE_NAME
  `);

  console.log('\n=== Tabelas com "Cliente" no nome ===');
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
    ORDER BY CodCliente
  `);
  console.log('\n=== Amostra (2 linhas — todas as colunas) ===');
  for (const row of sample.recordset) {
    console.log(JSON.stringify(row, null, 2));
    console.log('---');
  }

  const colsPresent = sample.recordset[0] ? Object.keys(sample.recordset[0]) : [];
  const pickCols = [
    'CodCliente',
    'CodPrincipal',
    'Nome',
    'NomeFantasia',
    'CGC',
    'CNPJ',
    'CPF',
    'Sigla',
    'Email',
    'Telefone',
    'Cidade',
    'UF',
    'Estado',
    'CEP',
    'Endereco',
    'Bairro',
    'Ativo',
    'Status',
    'DataCadastro',
    'DataAtivacao',
  ].filter((c) => colsPresent.includes(c));

  if (pickCols.length) {
    const matrizes = await pool.request().query(`
      SELECT TOP 5 ${pickCols.join(', ')}
      FROM Cliente WITH (NOLOCK)
      WHERE CodCliente = CodPrincipal
      ORDER BY CodCliente DESC
    `);
    console.log('\n=== Matrizes (CodCliente = CodPrincipal) — TOP 5 ===');
    console.log(JSON.stringify(matrizes.recordset, null, 2));
  }

  const grupo = await pool.request().query(`
    SELECT TOP 1
      CodPrincipal,
      COUNT(*) AS qtd_codigos,
      MIN(CodCliente) AS menor_cod,
      MAX(CodCliente) AS maior_cod
    FROM Cliente WITH (NOLOCK)
    GROUP BY CodPrincipal
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);
  console.log('\n=== Exemplo grupo com filiais ===');
  console.log(JSON.stringify(grupo.recordset[0], null, 2));

  // Cliente 40032 no WEB = 18476 no Delphi (seed do projeto)
  for (const cod of [18476, 40032]) {
    try {
      const byCod = await pool.request().input('cod', sql.Int, cod).query(`
        SELECT TOP 1
          CodCliente, CodPrincipal, Nome,
          ${colsPresent.includes('CGC') ? 'CGC' : 'NULL AS CGC'},
          ${colsPresent.includes('Sigla') ? 'Sigla' : 'NULL AS Sigla'},
          ${colsPresent.includes('Cidade') ? 'Cidade' : 'NULL AS Cidade'},
          ${colsPresent.includes('UF') ? 'UF' : colsPresent.includes('Estado') ? 'Estado' : 'NULL AS UF'}
        FROM Cliente WITH (NOLOCK)
        WHERE CodCliente = @cod OR CodPrincipal = @cod
      `);
      if (byCod.recordset[0]) {
        console.log(`\n=== Cliente cod ${cod} ===`);
        console.log(JSON.stringify(byCod.recordset[0], null, 2));
      }
    } catch {
      /* optional */
    }
  }

  // Endereco ou campos inline
  const endTables = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND (TABLE_NAME LIKE '%Endereco%' OR TABLE_NAME LIKE '%Endere%')
    ORDER BY TABLE_NAME
  `);
  if (endTables.recordset.length) {
    console.log('\n=== Tabelas de endereço ===');
    for (const t of endTables.recordset) {
      console.log(`  ${t.TABLE_NAME}`);
    }
  }

  const richCols = [
    'CodCliente',
    'CodPrincipal',
    'Nome',
    colsPresent.includes('NomeFantasia') ? 'NomeFantasia' : null,
    colsPresent.includes('CGC') ? 'CGC' : null,
    colsPresent.includes('Sigla') ? 'Sigla' : null,
    colsPresent.includes('Cidade') ? 'Cidade' : null,
    colsPresent.includes('UF') ? 'UF' : colsPresent.includes('Estado') ? 'Estado' : null,
    colsPresent.includes('CEP') ? 'CEP' : null,
    colsPresent.includes('Endereco') ? 'Endereco' : null,
    colsPresent.includes('Bairro') ? 'Bairro' : null,
    colsPresent.includes('Ativo') ? 'Ativo' : null,
    colsPresent.includes('Status') ? 'Status' : null,
  ].filter(Boolean);

  if (richCols.length >= 3) {
    const rich = await pool.request().query(`
      SELECT TOP 3 ${richCols.join(', ')}
      FROM Cliente WITH (NOLOCK)
      WHERE CodCliente = CodPrincipal
      ORDER BY CodCliente DESC
    `);
    console.log('\n=== Matriz — TOP 3 (campos principais) ===');
    console.log(JSON.stringify(rich.recordset, null, 2));
  }

  const stats = await pool.request().query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN CodCliente = CodPrincipal THEN 1 ELSE 0 END) AS matrizes,
      SUM(CASE WHEN Status = 'A' THEN 1 ELSE 0 END) AS ativos,
      SUM(CASE WHEN Status = 'I' THEN 1 ELSE 0 END) AS inativos
    FROM Cliente WITH (NOLOCK)
  `);
  console.log('\n=== Resumo ===');
  console.log(JSON.stringify(stats.recordset[0], null, 2));

  const grupo18476 = await pool.request().query(`
    SELECT CodCliente, CodPrincipal, Nome, CGC, Sigla, Cidade, Status, DataCadastramento
    FROM Cliente WITH (NOLOCK)
    WHERE CodPrincipal = 18476 OR CodCliente = 18476
    ORDER BY CodCliente
  `);
  console.log('\n=== Grupo CodPrincipal 18476 (seed portal) ===');
  console.log(JSON.stringify(grupo18476.recordset, null, 2));

  await pool.close();
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
