export const PAPEL_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_CREDOR: 'Admin do Credor',
  OPERADOR: 'Operador',
  VIEWER: 'Visualizador',
};

export const PAPEIS = [
  { value: 'ADMIN_CREDOR', label: 'Admin do credor' },
  { value: 'OPERADOR', label: 'Operador' },
  { value: 'VIEWER', label: 'Visualizador' },
  { value: 'SUPER_ADMIN', label: 'Super Admin (plataforma)' },
] as const;

export function formatCnpj(value: string | null | undefined): string {
  if (!value) return '—';
  const d = value.replace(/\D/g, '');
  if (d.length !== 14) return value;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function stripCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCnpjInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function maskCepInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function maskPhoneInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function stripDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '—';
  const d = value.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return value;
}
