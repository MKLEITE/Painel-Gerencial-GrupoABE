/** Mapa idEstado ABE WEB → sigla UF. */
const ID_ESTADO_PARA_UF = {
  1: 'AC', 2: 'AL', 3: 'AP', 4: 'AM', 5: 'BA', 6: 'CE', 7: 'DF', 8: 'ES', 9: 'GO',
  10: 'MA', 11: 'MT', 12: 'MS', 13: 'MG', 14: 'PA', 15: 'PB', 16: 'PR', 17: 'PE',
  18: 'PI', 19: 'RJ', 20: 'RN', 21: 'RS', 22: 'RO', 23: 'RR', 24: 'SC', 25: 'SP',
  26: 'SE', 27: 'TO',
};

const UFS = new Set(Object.values(ID_ESTADO_PARA_UF));

export function normalizeEstadoUf(value) {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw || raw === '—') return '';

  const upper = raw.toUpperCase();
  if (upper.length === 2 && UFS.has(upper)) return upper;

  const id = Number.parseInt(raw, 10);
  if (Number.isFinite(id) && ID_ESTADO_PARA_UF[id]) return ID_ESTADO_PARA_UF[id];

  return upper.slice(0, 2);
}
