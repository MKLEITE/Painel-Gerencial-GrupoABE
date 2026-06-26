const MESES_LOTE = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
];

function dayTimestamp(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Aceita DD/MM/YYYY, DD/MM/YYYY HH:mm:ss ou ISO YYYY-MM-DD. */
export function parseBrDate(str: string | null | undefined): Date | null {
  if (!str) return null;
  const s = String(str).trim();

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = Number.parseInt(iso[1], 10);
    const m = Number.parseInt(iso[2], 10);
    const d = Number.parseInt(iso[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(y, m - 1, d);
  }

  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    const d = Number.parseInt(br[1], 10);
    const m = Number.parseInt(br[2], 10);
    const y = Number.parseInt(br[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return new Date(y, m - 1, d);
  }

  return null;
}

export function formatBrDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function toIsoDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Data de hoje no fuso local (YYYY-MM-DD) — padrão do filtro Data final. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** 01/01 do ano corrente — padrão do filtro Data início. */
export function defaultDataInicioIso(): string {
  return `${new Date().getFullYear()}-01-01`;
}

export function isoToBr(iso: string): string {
  const d = parseBrDate(iso);
  return d ? formatBrDate(d) : '';
}

/** Garante início ≤ fim (inclusivo nos dois extremos). */
export function normalizeIsoRange(
  inicio: string,
  fim: string,
): { dataInicio: string; dataFinal: string } {
  if (!inicio || !fim) return { dataInicio: inicio, dataFinal: fim };
  const a = parseBrDate(inicio);
  const b = parseBrDate(fim);
  if (!a || !b) return { dataInicio: inicio, dataFinal: fim };
  const ta = dayTimestamp(a);
  const tb = dayTimestamp(b);
  if (ta <= tb) return { dataInicio: toIsoDate(a), dataFinal: toIsoDate(b) };
  return { dataInicio: toIsoDate(b), dataFinal: toIsoDate(a) };
}

function anoMesKey(d: Date): number {
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

/** Mapa AnoMesKey → rank denso (LOTE01, LOTE02…). */
export function buildLoteRankMapFromIndice(indice: { d: string }[]): Record<string, number> {
  const keys = new Set<number>();
  for (const row of indice) {
    const d = parseBrDate(row.d);
    if (d) keys.add(anoMesKey(d));
  }
  const sorted = [...keys].sort((a, b) => a - b);
  const map: Record<string, number> = {};
  sorted.forEach((key, i) => {
    map[String(key)] = i + 1;
  });
  return map;
}

function rankForDate(d: Date, rankMap: Record<string, number>): number | null {
  return rankMap[String(anoMesKey(d))] ?? null;
}

export function loteMesLabel(dataInclusao: string, rankMap: Record<string, number>): string | null {
  const d = parseBrDate(dataInclusao);
  if (!d) return null;
  const rank = rankForDate(d, rankMap);
  if (!rank) return null;
  const yy = String(d.getFullYear()).slice(-2);
  return `LOTE${String(rank).padStart(2, '0')}-${MESES_LOTE[d.getMonth()]}/${yy}`;
}

export function loteDiaLabel(dataInclusao: string, rankMap: Record<string, number>): string | null {
  const d = parseBrDate(dataInclusao);
  if (!d) return null;
  const rank = rankForDate(d, rankMap);
  if (!rank) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  return `LOTE${String(rank).padStart(2, '0')}-${dd}`;
}

export function matchLoteEnvio(
  dataInclusao: string,
  loteEnvio: string,
  rankMap: Record<string, number>,
): boolean {
  if (!loteEnvio || loteEnvio === 'todos') return true;
  if (loteEnvio.startsWith('mes:')) {
    return loteMesLabel(dataInclusao, rankMap) === loteEnvio.slice(4);
  }
  if (loteEnvio.startsWith('dia:')) {
    return loteDiaLabel(dataInclusao, rankMap) === loteEnvio.slice(4);
  }
  const d = parseBrDate(dataInclusao);
  if (!d) return false;
  const legacy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return legacy === loteEnvio;
}

export function isDateInIsoRange(dataInclusao: string, inicioIso: string, fimIso: string): boolean {
  const date = parseBrDate(dataInclusao);
  const start = parseBrDate(inicioIso);
  const end = parseBrDate(fimIso);
  if (!date || !start || !end) return false;

  const t = dayTimestamp(date);
  const t0 = dayTimestamp(start);
  const t1 = dayTimestamp(end);
  const lo = Math.min(t0, t1);
  const hi = Math.max(t0, t1);
  return t >= lo && t <= hi;
}
