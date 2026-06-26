/**
 * Agendador local — verifica alterações a cada N minutos e sincroniza só se necessário.
 *
 *   pnpm sync:abeweb:watch
 *
 * Produção: use GitHub Actions, cron Windows ou serviço no servidor ABE.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INTERVAL_MS = Number(process.env.ABEWEB_SYNC_INTERVAL_MS ?? 10 * 60 * 1000);
const script = join(__dirname, 'sync-abeweb-dashboard.mjs');

function runIncremental() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--env-file=.env', script, '--incremental'], {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`sync exit ${code}`))));
    child.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log(`Watch ABE WEB — intervalo ${INTERVAL_MS / 60000} min`);
console.log('Ctrl+C para parar\n');

for (;;) {
  const inicio = new Date().toLocaleString('pt-BR');
  console.log(`\n─── ${inicio} ───`);
  try {
    await runIncremental();
  } catch (err) {
    console.error('[watch] erro:', err.message);
  }
  console.log(`Próximo check em ${INTERVAL_MS / 60000} min…`);
  await sleep(INTERVAL_MS);
}
