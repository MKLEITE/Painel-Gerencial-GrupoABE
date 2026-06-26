import { formatBRL } from '@/lib/format-currency';
import { normalizeEstadoUf } from '@/lib/estado-uf';
import type { DashboardPayload } from '@/lib/dashboard-types';

export interface MetricasCredorRpc {
  bordero_total?: number | string;
  bordero_qtd?: number | string;
  recebido_abe?: number | string;
  pagamento_direto?: number | string;
  devolvido_nao_processado?: number | string;
  devolvido_nao_estabelecido?: number | string;
  devolvido_incobavel?: number | string;
  acordo_com_pagamento?: number | string;
  acordo_a_receber?: number | string;
  em_cobranca?: number | string;
  quebra_de_acordo?: number | string;
  ativo_saldo_devedor?: number | string;
}

function num(value: number | string | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat('pt-BR').format(n);
}

function fmtPct(n: number): string {
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

const BAIXA_DEFINICOES: Record<string, string> = {
  Incobrável: 'ABE esgotou todas as etapas extrajudiciais sem êxito',
  'Não Estabelecido': 'Devedor não encontrado no endereço — constatado em visita',
  'Não processado': 'Histórico negativo + título com mais de 18 meses',
};

/** Sobrescreve KPIs de borderô/financeiro com métricas calculadas no Supabase (carteira_snapshot). */
export function applyMetricasRpc(
  payload: DashboardPayload,
  metricas: MetricasCredorRpc,
  datas: { dataInicio: string; dataFinal: string; uf?: string | null },
): DashboardPayload {
  const totalEnviado = num(metricas.bordero_total);
  const processos = num(metricas.bordero_qtd);
  const recebidoAbe = num(metricas.recebido_abe);
  const pagamentoDireto = num(metricas.pagamento_direto);
  const totalRecuperado = recebidoAbe + pagamentoDireto;
  const efetividade = totalEnviado > 0 ? (totalRecuperado / totalEnviado) * 100 : 0;
  const saldoAtivo = num(metricas.ativo_saldo_devedor);
  const pctAtivo = totalEnviado > 0 ? (saldoAtivo / totalEnviado) * 100 : 0;
  const ufLabel = datas.uf && datas.uf !== 'todos' ? normalizeEstadoUf(datas.uf) : null;
  const sufixoUf = ufLabel ? ` · UF ${ufLabel}` : '';

  const tabelaBaixas = [
    { motivo: 'Não processado', valor: num(metricas.devolvido_nao_processado) },
    { motivo: 'Não Estabelecido', valor: num(metricas.devolvido_nao_estabelecido) },
    { motivo: 'Incobrável', valor: num(metricas.devolvido_incobavel) },
  ]
    .filter((b) => b.valor > 0)
    .map((b) => ({
      motivo: b.motivo,
      definicao: BAIXA_DEFINICOES[b.motivo] ?? '',
      quantidade: 0,
      valor: formatBRL(b.valor),
    }));

  const tabelaAcordos = [
    { metrica: 'Acordo com pagamento', valor: num(metricas.acordo_com_pagamento) },
    { metrica: 'Acordo a receber', valor: num(metricas.acordo_a_receber) },
    { metrica: 'Em cobrança', valor: num(metricas.em_cobranca) },
    { metrica: 'Quebra de Acordo', valor: num(metricas.quebra_de_acordo) },
  ]
    .filter((a) => a.valor > 0)
    .map((a) => ({
      metrica: a.metrica,
      quantidade: 0,
      valor: formatBRL(a.valor),
    }));

  return {
    ...payload,
    kpiBordero: [
      {
        rotulo: 'Valor total enviado',
        valor: formatBRL(totalEnviado),
        detalhe: `Soma Valor Original Título · Data Inclusão ${datas.dataInicio} → ${datas.dataFinal}`,
      },
      {
        rotulo: 'Processos enviados',
        valor: fmtNumber(processos),
        detalhe: 'Processos distintos com Data Inclusão no intervalo',
      },
      payload.kpiBordero[2] ?? {
        rotulo: 'Média de idade no envio',
        valor: '—',
        detalhe: 'Idade Título Cadastramento',
      },
      payload.kpiBordero[3] ?? {
        rotulo: 'Lotes no período',
        valor: '—',
        detalhe: 'Meses com Data Inclusão',
      },
    ],
    kpiFinanceiro: [
      {
        rotulo: 'Recebido pela ABE',
        valor: formatBRL(recebidoAbe),
        detalhe: `Data Repasse no intervalo${sufixoUf} · Pagamento Final/Parcial`,
      },
      {
        rotulo: 'Pagamento direto',
        valor: formatBRL(pagamentoDireto),
        detalhe: `Data Repasse no intervalo${sufixoUf} · Pagamento Direto ou Pagto. Direto`,
      },
      {
        rotulo: 'Efetividade geral',
        valor: fmtPct(efetividade),
        detalhe: '(ABE + direto) / borderô do intervalo',
      },
      {
        rotulo: 'Total recuperado',
        valor: formatBRL(totalRecuperado),
        detalhe: 'Recebido ABE + pagamento direto',
      },
    ],
    kpiCarteiraAtiva: payload.kpiCarteiraAtiva.map((kpi, i) => {
      if (i === 0) return { ...kpi, valor: formatBRL(saldoAtivo) };
      if (i === 2) return { ...kpi, valor: fmtPct(pctAtivo) };
      return kpi;
    }),
    tabelaBaixas: tabelaBaixas.length > 0 ? tabelaBaixas : payload.tabelaBaixas,
    tabelaAcordos: tabelaAcordos.length > 0 ? tabelaAcordos : payload.tabelaAcordos,
    composicaoAtores: payload.composicaoAtores.map((a, i) =>
      i === 0 ? { ...a, valor: formatBRL(totalEnviado) } : a,
    ),
  };
}
