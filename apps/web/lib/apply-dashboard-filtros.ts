import {
  buildLoteRankMapFromIndice,
  defaultDataInicioIso,
  isDateInIsoRange,
  matchLoteEnvio,
  normalizeIsoRange,
  todayIso,
} from '@/lib/bordero-lote';
import { normalizeEstadoUf } from '@/lib/estado-uf';
import { formatBRL } from '@/lib/format-currency';
import type { BorderoIndiceItem, DashboardPayload, FiltrosDashboard } from '@/lib/dashboard-types';

function resolveEffectiveDateRange(filtros: Pick<FiltrosDashboard, 'dataInicio' | 'dataFinal'>): {
  dataInicio: string;
  dataFinal: string;
} {
  const dataInicio = filtros.dataInicio || defaultDataInicioIso();
  const dataFinal = filtros.dataFinal || todayIso();
  return normalizeIsoRange(dataInicio, dataFinal);
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('pt-BR').format(n);
}

function normText(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function devolvidoLabel(status: string): string | null {
  const s = normText(status);
  if (s === 'incobrável' || s === 'incobravel') return 'Incobrável';
  if (s === 'não processado' || s === 'nao processado') return 'Não processado';
  if (s === 'não estabelecido' || s === 'nao estabelecido') return 'Não Estabelecido';
  return null;
}

function acordoLabel(visao: string): string | null {
  const v = normText(visao);
  if (v.includes('acordo com pagamento')) return 'Acordo com pagamento';
  if (v.includes('acordo a receber')) return 'Acordo a receber';
  if (v.includes('em cobrança') || v.includes('em cobranca')) return 'Em cobrança';
  if (v.includes('quebra de acordo')) return 'Quebra de Acordo';
  return null;
}

function filterIndice(
  indice: BorderoIndiceItem[],
  filtros: Pick<FiltrosDashboard, 'dataInicio' | 'dataFinal' | 'loteEnvio' | 'uf'>,
  rankMap: Record<string, number>,
  datas: { dataInicio: string; dataFinal: string },
): BorderoIndiceItem[] {
  const ufAlvo = filtros.uf && filtros.uf !== 'todos' ? normalizeEstadoUf(filtros.uf) : null;
  const filtrarPorData = Boolean(datas.dataInicio && datas.dataFinal);

  return indice.filter((row) => {
    if (ufAlvo && normalizeEstadoUf(row.uf) !== ufAlvo) return false;
    if (filtrarPorData && !isDateInIsoRange(row.d, datas.dataInicio, datas.dataFinal)) return false;
    if (!matchLoteEnvio(row.d, filtros.loteEnvio, rankMap)) return false;
    return true;
  });
}

export { filterIndice };

function reaggregateBordero(filtrado: BorderoIndiceItem[]) {
  const processos = new Set<string>();
  let totalEnviado = 0;
  let idadeSoma = 0;
  let idadeCount = 0;
  const mesesUnicos = new Set<string>();

  const baixas = new Map<string, { quantidade: number; valor: number }>();
  const acordos = new Map<string, { quantidade: number; valor: number }>();

  for (const row of filtrado) {
    processos.add(row.p);
    totalEnviado += row.v;
    if (row.i > 0) {
      idadeSoma += row.i;
      idadeCount += 1;
    }

    const dParts = row.d.split('/');
    if (dParts.length === 3) {
      mesesUnicos.add(`${dParts[2]}-${dParts[1]}`);
    }

    const dev = devolvidoLabel(row.s);
    if (dev) {
      const cur = baixas.get(dev) ?? { quantidade: 0, valor: 0 };
      cur.quantidade += 1;
      cur.valor += row.v;
      baixas.set(dev, cur);
    }

    const ac = acordoLabel(row.vis);
    if (ac) {
      const cur = acordos.get(ac) ?? { quantidade: 0, valor: 0 };
      cur.quantidade += 1;
      cur.valor += row.v;
      acordos.set(ac, cur);
    }
  }

  const idadeMedia = idadeCount > 0 ? idadeSoma / idadeCount : 0;

  return {
    totalEnviado,
    processos: processos.size,
    idadeMedia,
    mesesUnicos: mesesUnicos.size,
    baixas,
    acordos,
  };
}

const BAIXA_DEFINICOES: Record<string, string> = {
  Incobrável: 'ABE esgotou todas as etapas extrajudiciais sem êxito',
  'Não Estabelecido': 'Devedor não encontrado no endereço — constatado em visita',
  'Não processado': 'Histórico negativo + título com mais de 18 meses',
};

/** Reaplica filtros de data/lote/UF sobre o índice do borderô. */
export function applyDashboardFiltros(
  payload: DashboardPayload,
  filtros: Pick<FiltrosDashboard, 'dataInicio' | 'dataFinal' | 'loteEnvio' | 'uf'>,
  options?: { skipKpis?: boolean },
): DashboardPayload {
  const ufAlvo = filtros.uf && filtros.uf !== 'todos' ? normalizeEstadoUf(filtros.uf) : null;

  const metricasUfFiltradas =
    ufAlvo && payload.metricasUf?.length
      ? payload.metricasUf.filter((m) => normalizeEstadoUf(m.uf) === ufAlvo)
      : payload.metricasUf;

  if (!payload.borderoIndice?.length) {
    return { ...payload, metricasUf: metricasUfFiltradas ?? payload.metricasUf };
  }

  if (options?.skipKpis) {
    return { ...payload, metricasUf: metricasUfFiltradas ?? payload.metricasUf };
  }

  const datas = resolveEffectiveDateRange(filtros);
  const rankMap =
    payload.meta?.loteRankMap && Object.keys(payload.meta.loteRankMap).length > 0
      ? payload.meta.loteRankMap
      : buildLoteRankMapFromIndice(payload.borderoIndice);

  const filtrado = filterIndice(payload.borderoIndice, filtros, rankMap, datas);
  const agg = reaggregateBordero(filtrado);

  const saldoAtivo = parseBrFromKpi(payload.kpiCarteiraAtiva[0]?.valor);
  const pctAtivo = agg.totalEnviado > 0 ? (saldoAtivo / agg.totalEnviado) * 100 : 0;

  return {
    ...payload,
    metricasUf: metricasUfFiltradas ?? payload.metricasUf,
    kpiBordero: [
      {
        rotulo: 'Valor total enviado',
        valor: formatBRL(agg.totalEnviado),
        detalhe: 'Soma Valor Original Título (Data Inclusão no período)',
      },
      {
        rotulo: 'Processos enviados',
        valor: fmtNumber(agg.processos),
        detalhe: 'Processos distintos enviados à cobrança',
      },
      {
        rotulo: 'Média de idade no envio',
        valor: `${Math.round(agg.idadeMedia)} dias`,
        detalhe: 'Idade Título Cadastramento',
      },
      {
        rotulo: 'Lotes no período',
        valor: fmtNumber(agg.mesesUnicos),
        detalhe: 'Meses com Data Inclusão',
      },
    ],
    tabelaBaixas: [...agg.baixas.entries()].map(([motivo, v]) => ({
      motivo,
      definicao: BAIXA_DEFINICOES[motivo] ?? '',
      quantidade: v.quantidade,
      valor: formatBRL(v.valor),
    })),
    tabelaAcordos: [...agg.acordos.entries()].map(([metrica, v]) => ({
      metrica,
      quantidade: v.quantidade,
      valor: formatBRL(v.valor),
    })),
    kpiCarteiraAtiva: payload.kpiCarteiraAtiva.map((kpi, i) =>
      i === 2
        ? {
            ...kpi,
            valor: `${pctAtivo.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
          }
        : kpi,
    ),
    composicaoAtores: payload.composicaoAtores.map((a, i) =>
      i === 0 ? { ...a, valor: formatBRL(agg.totalEnviado) } : a,
    ),
  };
}

/** Extrai número aproximado de KPI formatado (só para % sobre enviado). */
function parseBrFromKpi(valor: string | undefined): number {
  if (!valor) return 0;
  const n = Number.parseFloat(
    valor
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.'),
  );
  return Number.isFinite(n) ? n : 0;
}
