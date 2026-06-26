/** Siglas válidas (UF). */
export const UFS_BR = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

const UFS_SET = new Set<string>(UFS_BR);

/** Mapa idEstado ABE WEB → sigla (ordem cadastro tabela Estado). */
const ID_ESTADO_PARA_UF: Record<number, string> = {
  1: 'AC',
  2: 'AL',
  3: 'AP',
  4: 'AM',
  5: 'BA',
  6: 'CE',
  7: 'DF',
  8: 'ES',
  9: 'GO',
  10: 'MA',
  11: 'MT',
  12: 'MS',
  13: 'MG',
  14: 'PA',
  15: 'PB',
  16: 'PR',
  17: 'PE',
  18: 'PI',
  19: 'RJ',
  20: 'RN',
  21: 'RS',
  22: 'RO',
  23: 'RR',
  24: 'SC',
  25: 'SP',
  26: 'SE',
  27: 'TO',
};

/** Normaliza valor de Estado/idEstado da consulta 749 para sigla UF (ex.: 25 → SP). */
export function normalizeEstadoUf(value: string | number | null | undefined): string {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw || raw === '—') return '';

  const upper = raw.toUpperCase();
  if (upper.length === 2 && UFS_SET.has(upper)) return upper;

  const id = Number.parseInt(raw, 10);
  if (Number.isFinite(id) && ID_ESTADO_PARA_UF[id]) return ID_ESTADO_PARA_UF[id];

  return upper.slice(0, 2);
}

export function matchEstadoUf(
  rowUf: string | number | null | undefined,
  filtroUf: string | null | undefined,
): boolean {
  if (!filtroUf || filtroUf === 'todos') return true;
  const alvo = normalizeEstadoUf(filtroUf);
  if (!alvo) return true;
  return normalizeEstadoUf(rowUf) === alvo;
}
