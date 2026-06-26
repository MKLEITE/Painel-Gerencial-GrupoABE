import type { MetricasCredorRpc } from '@/lib/apply-metricas-rpc';
import { matchEstadoUf, normalizeEstadoUf } from '@/lib/estado-uf';

export interface CarteiraSnapshotRow {
  processo: string | null;
  data_inclusao: string | null;
  data_repasse: string | null;
  valor_original_titulo: number | string | null;
  valor_pago: number | string | null;
  valor_saldo_devedor?: number | string | null;
  tipo: string | null;
  status: string | null;
  visao_geral_carteira: string | null;
  uf?: string | null;
}

export interface MetricasCarteiraOpts {
  uf?: string | null;
  /** Restringe borderô/devolvidos/acordos a estes processos (ex.: lote de envio). */
  processosBordero?: Set<string> | null;
}

function num(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function inIsoRange(dateIso: string | null, inicio: string, fim: string): boolean {
  if (!dateIso) return false;
  return dateIso >= inicio && dateIso <= fim;
}

function isPagamentoAbe(tipo: string | null): boolean {
  const t = (tipo ?? '').trim();
  return t === 'Pagamento Final' || t === 'Pagamento Parcial';
}

function isPagamentoDireto(tipo: string | null, status: string | null): boolean {
  const t = (tipo ?? '').trim();
  if (t === 'Pagamento Direto Final' || t === 'Pagamento Direto Parcial') return true;
  return t === '' && (status ?? '').trim().toLowerCase() === 'pagto. direto';
}

function normVisao(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Borderô / devolvidos / acordos: somente Data Inclusão no intervalo (consulta 749).
 * Recebimentos: Data Repasse no intervalo (carteira inteira — USERELATIONSHIP Power BI).
 */
export function calcularMetricasCarteira(
  rows: CarteiraSnapshotRow[],
  dataInicio: string,
  dataFim: string,
  opts: MetricasCarteiraOpts = {},
): MetricasCredorRpc {
  const ufAlvo = opts.uf && opts.uf !== 'todos' ? normalizeEstadoUf(opts.uf) : null;
  const processosLote = opts.processosBordero?.size ? opts.processosBordero : null;

  const rowsUf = ufAlvo ? rows.filter((row) => matchEstadoUf(row.uf, ufAlvo)) : rows;

  let borderoLinhas = rowsUf.filter((row) => inIsoRange(row.data_inclusao, dataInicio, dataFim));
  if (processosLote) {
    borderoLinhas = borderoLinhas.filter((row) => row.processo && processosLote.has(row.processo));
  }

  const pagamentos = rowsUf.filter((row) => inIsoRange(row.data_repasse, dataInicio, dataFim));

  let bordero_total = 0;
  const borderoProcessos = new Set<string>();
  for (const row of borderoLinhas) {
    bordero_total += num(row.valor_original_titulo);
    if (row.processo) borderoProcessos.add(row.processo);
  }

  let recebido_abe = 0;
  let pagamento_direto = 0;
  for (const row of pagamentos) {
    const pago = num(row.valor_pago);
    if (pago <= 0) continue;
    if (isPagamentoAbe(row.tipo)) recebido_abe += pago;
    else if (isPagamentoDireto(row.tipo, row.status)) pagamento_direto += pago;
  }

  let devolvido_nao_processado = 0;
  let devolvido_nao_estabelecido = 0;
  let devolvido_incobavel = 0;
  let acordo_com_pagamento = 0;
  let acordo_a_receber = 0;
  let em_cobranca = 0;
  let quebra_de_acordo = 0;
  let ativo_saldo_devedor = 0;

  for (const row of borderoLinhas) {
    const vo = num(row.valor_original_titulo);
    const st = (row.status ?? '').trim().toLowerCase();
    const vis = normVisao(row.visao_geral_carteira);

    if (st === 'não processado' || st === 'nao processado') devolvido_nao_processado += vo;
    else if (st === 'não estabelecido' || st === 'nao estabelecido')
      devolvido_nao_estabelecido += vo;
    else if (st === 'incobrável' || st === 'incobravel') devolvido_incobavel += vo;

    if (vis.includes('acordo com pagamento')) acordo_com_pagamento += vo;
    else if (vis.includes('acordo a receber')) acordo_a_receber += vo;
    else if (vis.includes('em cobrança') || vis.includes('em cobranca')) em_cobranca += vo;
    else if (vis.includes('quebra de acordo')) quebra_de_acordo += vo;
  }

  for (const row of rowsUf) {
    if ((row.status ?? '').trim().toLowerCase() === 'ativo') {
      ativo_saldo_devedor += num(row.valor_saldo_devedor);
    }
  }

  return {
    bordero_total,
    bordero_qtd: borderoProcessos.size,
    recebido_abe,
    pagamento_direto,
    devolvido_nao_processado,
    devolvido_nao_estabelecido,
    devolvido_incobavel,
    acordo_com_pagamento,
    acordo_a_receber,
    em_cobranca,
    quebra_de_acordo,
    ativo_saldo_devedor,
  };
}
