/**
 * Testa conexão com o PostgreSQL usando DATABASE_URL do apps/api/.env
 * Uso: pnpm --filter @abe/api test:db
 */
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const pg = require('pg');

function loadDatabaseUrl() {
  const envPath = join(__dirname, '..', '.env');
  const content = readFileSync(envPath, 'utf8');
  const line = content.split('\n').find((l) => l.startsWith('DATABASE_URL='));
  if (!line) {
    throw new Error('DATABASE_URL não encontrada em apps/api/.env');
  }
  let url = line.slice('DATABASE_URL='.length).trim();
  if (url.includes('INSIRA_SUA_SENHA_AQUI')) {
    throw new Error('Substitua INSIRA_SUA_SENHA_AQUI pela senha real em apps/api/.env');
  }
  // Remove sslmode da URL — o SSL é configurado no Client abaixo (compatível com RDS).
  url = url.replace(/([?&])sslmode=[^&]*&?/g, '$1').replace(/[?&]$/, '');
  return url;
}

async function main() {
  const connectionString = loadDatabaseUrl();
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 15000,
    // RDS AWS: em dev aceita o certificado; em produção usaremos o CA bundle oficial.
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query('SELECT version() AS version, current_database() AS database');
    console.log('Conexão OK com o AWS RDS PostgreSQL.');
    console.log('Database:', result.rows[0].database);
    console.log('Versão:', result.rows[0].version);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Falha na conexão:', message);
    console.error('');
    console.error('Dicas:');
    console.error('- Confirme a senha em apps/api/.env');
    console.error('- Senha com @ # % precisa de URL encode na DATABASE_URL');
    console.error('- Seu IP público ainda está liberado no Security Group?');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
