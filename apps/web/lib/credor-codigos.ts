import type { Credor } from '@/lib/admin-api';
import type { OpcaoFiltro } from '@/lib/dashboard-types';

export type CodigoLegadoRotulo = 'ABE_WEB' | 'ABE_DELPHI' | string | null;

export interface CodigoLegadoItem {
  codigo: string;
  rotulo: CodigoLegadoRotulo;
  papel: 'matriz' | 'filial';
  sistema: 'WEB' | 'Delphi';
}

export interface GrupoCodigosCredor {
  web: { matriz: string | null; filiais: string[] };
  delphi: { matriz: string | null; filiais: string[] };
  todos: CodigoLegadoItem[];
  totalCodigos: number;
}

type CredorCodigos = Pick<
  Credor,
  'codClientePrincipal' | 'abeDelphiClienteId' | 'codigosCliente' | 'razaoSocial'
>;

export function buildGrupoCodigos(credor: CredorCodigos): GrupoCodigosCredor {
  const webMatriz = credor.codClientePrincipal?.trim() || null;
  const delphiMatriz = credor.abeDelphiClienteId?.trim() || null;

  const webFiliais: string[] = [];
  const delphiFiliais: string[] = [];
  const todos: CodigoLegadoItem[] = [];

  if (webMatriz) {
    todos.push({ codigo: webMatriz, rotulo: 'ABE_WEB', papel: 'matriz', sistema: 'WEB' });
  }
  if (delphiMatriz) {
    todos.push({ codigo: delphiMatriz, rotulo: 'ABE_DELPHI', papel: 'matriz', sistema: 'Delphi' });
  }

  for (const item of credor.codigosCliente) {
    const codigo = item.codCliente?.trim();
    if (!codigo) continue;
    if (codigo === webMatriz || codigo === delphiMatriz) continue;

    const sistema = item.rotulo === 'ABE_DELPHI' ? 'Delphi' : 'WEB';
    const entry: CodigoLegadoItem = {
      codigo,
      rotulo: item.rotulo,
      papel: 'filial',
      sistema,
    };
    todos.push(entry);
    if (sistema === 'Delphi') delphiFiliais.push(codigo);
    else webFiliais.push(codigo);
  }

  webFiliais.sort((a, b) => Number(a) - Number(b));
  delphiFiliais.sort((a, b) => Number(a) - Number(b));

  return {
    web: { matriz: webMatriz, filiais: webFiliais },
    delphi: { matriz: delphiMatriz, filiais: delphiFiliais },
    todos,
    totalCodigos: todos.length,
  };
}

/** Códigos usados no sync / filtro do dashboard (matriz + filiais, sem duplicar). */
export function listCodigosSync(credor: CredorCodigos): string[] {
  const grupo = buildGrupoCodigos(credor);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of grupo.todos) {
    if (seen.has(item.codigo)) continue;
    seen.add(item.codigo);
    out.push(item.codigo);
  }
  return out.sort((a, b) => Number(a) - Number(b));
}

export function buildOpcoesCodClienteDashboard(credor: CredorCodigos): OpcaoFiltro[] {
  const grupo = buildGrupoCodigos(credor);
  const opcoes: OpcaoFiltro[] = [{ value: 'todos', label: 'Todos os códigos (consolidado)' }];

  for (const item of grupo.todos) {
    const tag = item.papel === 'matriz' ? `${item.sistema} · matriz` : `${item.sistema} · filial`;
    opcoes.push({
      value: item.codigo,
      label: `${item.codigo} — ${tag}`,
    });
  }

  return opcoes;
}

export function credorTemMultiplosCodigos(credor: CredorCodigos): boolean {
  return buildGrupoCodigos(credor).totalCodigos > 1;
}
