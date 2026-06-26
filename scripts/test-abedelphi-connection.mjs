/**
 * Testa conexão com o SQL Server do ABE Delphi (ABEDELPHI_DB_* no .env).
 *
 * Uso: pnpm test:abedelphi
 */

import sql from 'mssql';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável ${name} não definida no .env`);
  return value;
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
    requestTimeout: Number(process.env.ABEDELPHI_REQUEST_TIMEOUT_MS ?? 30_000),
  };
}

async function main() {
  const cfg = delphiConfig();
  console.log('Testando ABE Delphi…');
  console.log(`  host: ${cfg.server}:${cfg.port}`);
  console.log(`  database: ${cfg.database}`);
  console.log(`  user: ${cfg.user}`);
  console.log(`  encrypt: ${cfg.options.encrypt} · trustServerCertificate: ${cfg.options.trustServerCertificate}`);

  let pool;
  try {
    pool = await sql.connect(cfg);

    const info = await pool.request().query(`
      SELECT
        @@VERSION AS versao,
        DB_NAME() AS banco_atual,
        SUSER_SNAME() AS login_sql,
        GETDATE() AS agora_servidor
    `);
    const row = info.recordset[0];
    console.log('\n✓ Conexão OK');
    console.log(`  SQL Server: ${String(row.versao).split('\n')[0]}`);
    console.log(`  Banco: ${row.banco_atual}`);
    console.log(`  Login: ${row.login_sql}`);
    console.log(`  Hora servidor: ${row.agora_servidor}`);

    const tabelas = ['Cliente', 'Processo', 'Titulo', 'FichaFinanceira'];
    console.log('\nTabelas principais:');
    for (const tabela of tabelas) {
      try {
        const r = await pool.request().query(`SELECT COUNT(*) AS n FROM ${tabela} WITH (NOLOCK)`);
        console.log(`  ${tabela}: ${r.recordset[0].n} linhas`);
      } catch (err) {
        console.log(`  ${tabela}: — (${err.message})`);
      }
    }

    try {
      const amostra = await pool.request().query(`
        SELECT TOP 1 idCliente, Nome
        FROM Cliente WITH (NOLOCK)
        ORDER BY idCliente
      `);
      if (amostra.recordset[0]) {
        console.log('\nAmostra Cliente:', amostra.recordset[0]);
      }
    } catch {
      /* opcional */
    }

    console.log('\nPróximo passo: pnpm etl:abe (quando o conector Delphi estiver ativo).');
  } catch (err) {
    console.error('\n✗ Falha na conexão');
    console.error(`  ${err.message}`);
    console.error('\nDicas:');
    console.error('  · VPN/rede: consegue pingar ou telnet 192.168.10.19 1433?');
    console.error('  · SQL Browser / instância nomeada: confira host e porta');
    console.error('  · Legado SQL 2005: tente ABEDELPHI_DB_ENCRYPT=0 e ABEDELPHI_DB_TRUST_CERT=1 no .env');
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

main();
