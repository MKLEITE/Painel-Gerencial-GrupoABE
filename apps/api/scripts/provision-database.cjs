/**
 * Cria o database dedicado painel_abe no RDS (conecta como postgres).
 * Uso: pnpm --filter @abe/api db:provision
 */
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const pg = require('pg');

const DB_NAME = 'painel_abe';

function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  return { envPath, content: readFileSync(envPath, 'utf8') };
}

function parseDatabaseUrl(raw) {
  let url = raw.replace(/([?&])sslmode=[^&]*&?/g, '$1').replace(/\?&/, '?').replace(/[?&]$/, '');
  const parsed = new URL(url.replace(/^postgresql:\/\//, 'http://'));
  return { url, parsed };
}

function buildPgClient(url) {
  return new pg.Client({
    connectionString: url,
    connectionTimeoutMillis: 15000,
    ssl: { rejectUnauthorized: false },
  });
}

function updateEnvDatabase(envPath, content, newDbName) {
  const updated = content.replace(
    /(DATABASE_URL=postgresql:\/\/[^/]+\/)([^?]+)/,
    `$1${newDbName}`,
  );
  if (updated === content) {
    console.warn('Não foi possível atualizar DATABASE_URL automaticamente — ajuste manualmente para /painel_abe');
    return;
  }
  writeFileSync(envPath, updated, 'utf8');
  console.log(`DATABASE_URL atualizada para database "${newDbName}" em apps/api/.env`);
}

async function main() {
  const { envPath, content } = loadEnv();
  const line = content.split('\n').find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL não encontrada');

  const rawUrl = line.slice('DATABASE_URL='.length).trim();
  const { url } = parseDatabaseUrl(rawUrl);

  const client = buildPgClient(url);
  await client.connect();

  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`Database "${DB_NAME}" criado com sucesso.`);
    } else {
      console.log(`Database "${DB_NAME}" já existe.`);
    }
  } finally {
    await client.end();
  }

  updateEnvDatabase(envPath, content, DB_NAME);
}

main().catch((err) => {
  console.error('Falha ao provisionar:', err.message);
  process.exit(1);
});
