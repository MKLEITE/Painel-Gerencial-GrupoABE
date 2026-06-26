/** Interpreta decimal BR (1.234,56) ou US/driver SQL (347320.49). */
export function parseBrDecimal(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const s = String(value).trim();
  if (!s) return 0;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  let normalized: string;
  if (hasComma) {
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (hasDot) {
    const parts = s.split('.');
    const last = parts[parts.length - 1] ?? '';
    if (parts.length === 2 && last.length <= 2) {
      normalized = s;
    } else {
      normalized = s.replace(/\./g, '');
    }
  } else {
    normalized = s;
  }

  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}
