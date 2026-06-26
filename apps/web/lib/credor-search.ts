import type { Credor } from '@/lib/admin-api';

export type CredorQuickFilter = 'todos' | 'sem-responsavel' | 'com-responsavel';

export function credorCodigos(c: Credor): string[] {
  const codes = new Set<string>();
  if (c.codClientePrincipal) codes.add(c.codClientePrincipal);
  if (c.abeDelphiClienteId) codes.add(c.abeDelphiClienteId);
  for (const extra of c.codigosCliente) {
    if (extra.codCliente) codes.add(extra.codCliente);
  }
  return [...codes];
}

export function matchesCredorSearch(c: Credor, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const digits = q.replace(/\D/g, '');

  const haystack = [
    c.razaoSocial,
    c.nomeFantasia,
    c.cnpj,
    c.emailComercial,
    c.telefone,
    c.cidade,
    c.estado,
    c.responsavel?.nome,
    c.responsavel?.email,
    c.codClientePrincipal,
    c.abeDelphiClienteId,
    ...c.codigosCliente.map((x) => x.codCliente),
    ...c.codigosCliente.map((x) => x.rotulo),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (haystack.includes(q)) return true;

  if (digits.length >= 3) {
    const cnpjDigits = c.cnpj?.replace(/\D/g, '') ?? '';
    if (cnpjDigits.includes(digits)) return true;
    return credorCodigos(c).some((cod) => cod.includes(digits));
  }

  return false;
}

export function matchesCredorQuickFilter(c: Credor, filter: CredorQuickFilter): boolean {
  switch (filter) {
    case 'sem-responsavel':
      return !c.responsavel;
    case 'com-responsavel':
      return Boolean(c.responsavel);
    default:
      return true;
  }
}

export function filterCredores(
  credores: Credor[],
  query: string,
  quickFilter: CredorQuickFilter,
): Credor[] {
  return credores.filter(
    (c) => matchesCredorSearch(c, query) && matchesCredorQuickFilter(c, quickFilter),
  );
}
