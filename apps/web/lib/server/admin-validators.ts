import { PAGINAS_ACESSO, SETORES_ATUACAO, UFS_BR } from '@/lib/admin-constants';
import { AdminError } from './admin-errors';

const SETORES = new Set<string>(SETORES_ATUACAO);
const PAGINAS = new Set<string>(PAGINAS_ACESSO.map((p) => p.id));
const UFS = new Set<string>(UFS_BR);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function assertSetores(setores: unknown): string[] {
  if (!Array.isArray(setores) || setores.length === 0) {
    throw new AdminError('Selecione ao menos um setor de atuação.', 400);
  }
  const invalid = setores.filter((s) => typeof s !== 'string' || !SETORES.has(s));
  if (invalid.length) {
    throw new AdminError('Setor de atuação inválido.', 400);
  }
  return [...new Set(setores as string[])];
}

export function assertPaginasAcesso(paginas: unknown): string[] {
  if (!Array.isArray(paginas) || paginas.length === 0) {
    throw new AdminError('Selecione ao menos uma página de acesso.', 400);
  }
  const invalid = paginas.filter((p) => typeof p !== 'string' || !PAGINAS.has(p));
  if (invalid.length) {
    throw new AdminError('Página de acesso inválida.', 400);
  }
  return [...new Set(paginas as string[])];
}

export function assertEstado(estado: string): string {
  const uf = estado.toUpperCase().trim().slice(0, 2);
  if (!UFS.has(uf)) {
    throw new AdminError('Estado (UF) inválido.', 400);
  }
  return uf;
}

export function assertCnpjDigits(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) {
    throw new AdminError('CNPJ deve conter 14 dígitos.', 400);
  }
  return digits;
}

export function assertIsoDate(value: string, label: string): string {
  const trimmed = value.trim();
  if (!ISO_DATE.test(trimmed)) {
    throw new AdminError(`${label} deve estar no formato YYYY-MM-DD.`, 400);
  }
  const date = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AdminError(`${label} inválida.`, 400);
  }
  return trimmed;
}

export async function parseRequestJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AdminError('Corpo da requisição inválido (JSON esperado).', 400);
  }
}
