import type { BorderoIndiceItem, OpcaoFiltro } from './dashboard-types';
import { normalizeEstadoUf } from './estado-uf';

export const OPCOES_FILTRO_PADRAO: {
  codCliente: OpcaoFiltro[];
  lote: OpcaoFiltro[];
  uf: OpcaoFiltro[];
} = {
  codCliente: [{ value: 'todos', label: 'Todos os códigos' }],
  lote: [{ value: 'todos', label: 'Todos os lotes' }],
  uf: [{ value: 'todos', label: 'Todos os estados' }],
};

export function buildOpcoesUfFromIndice(indice?: BorderoIndiceItem[] | null): OpcaoFiltro[] {
  const opcoes: OpcaoFiltro[] = [{ value: 'todos', label: 'Todos os estados' }];
  if (!indice?.length) return opcoes;

  const ufs = new Set<string>();
  for (const row of indice) {
    const uf = normalizeEstadoUf(row.uf);
    if (uf) ufs.add(uf);
  }
  for (const uf of [...ufs].sort()) {
    opcoes.push({ value: uf, label: uf });
  }
  return opcoes;
}

export function mergeOpcoesFiltro(
  payload?: {
    opcoesCodCliente?: OpcaoFiltro[];
    opcoesLote?: OpcaoFiltro[];
    opcoesUf?: OpcaoFiltro[];
    borderoIndice?: BorderoIndiceItem[];
  } | null,
) {
  const ufFromPayload = payload?.opcoesUf?.length ? payload.opcoesUf : null;
  const ufFromIndice = buildOpcoesUfFromIndice(payload?.borderoIndice);
  const uf = ufFromPayload && ufFromPayload.length > 1 ? ufFromPayload : ufFromIndice;

  return {
    codCliente: payload?.opcoesCodCliente?.length
      ? payload.opcoesCodCliente
      : OPCOES_FILTRO_PADRAO.codCliente,
    lote: payload?.opcoesLote?.length ? payload.opcoesLote : OPCOES_FILTRO_PADRAO.lote,
    uf: uf.length > 1 ? uf : OPCOES_FILTRO_PADRAO.uf,
  };
}

/** Garante que o valor selecionado existe nas opções (evita select inválido após sync). */
export function normalizarFiltros(
  filtros: {
    codCliente: string;
    loteEnvio: string;
    uf: string;
    dataInicio: string;
    dataFinal: string;
  },
  opcoes: ReturnType<typeof mergeOpcoesFiltro>,
) {
  const patch: Partial<typeof filtros> = {};
  if (!opcoes.codCliente.some((o) => o.value === filtros.codCliente)) {
    patch.codCliente = 'todos';
  }
  if (!opcoes.lote.some((o) => o.value === filtros.loteEnvio)) {
    patch.loteEnvio = 'todos';
  }
  if (!opcoes.uf.some((o) => o.value === filtros.uf)) {
    patch.uf = 'todos';
  }
  return patch;
}
