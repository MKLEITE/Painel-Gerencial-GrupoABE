/** Dados de demonstração alinhados ao briefing Dashboard Inteligente — Grupo ABE. */

export type PeriodoPreset = 'mes_atual' | 'mes_anterior' | 'ano_atual' | 'custom';

export interface FiltrosDashboard {
  codCliente: string;
  loteEnvio: string;
  dataAbertura: string;
  periodo: PeriodoPreset;
  cnpjDevedor: string;
  uf: string;
}

export const FILTROS_INICIAIS: FiltrosDashboard = {
  codCliente: 'todos',
  loteEnvio: 'todos',
  dataAbertura: '',
  periodo: 'mes_atual',
  cnpjDevedor: '',
  uf: 'todos',
};

export const OPCOES_COD_CLIENTE = [
  { value: 'todos', label: 'Todos os códigos' },
  { value: '1042', label: '1042 — Matriz' },
  { value: '1043', label: '1043 — Filial SP' },
  { value: '1044', label: '1044 — Filial RJ' },
];

export const OPCOES_LOTE = [
  { value: 'todos', label: 'Todos os lotes' },
  { value: '2026-01', label: 'Borderô Jan/2026' },
  { value: '2025-12', label: 'Borderô Dez/2025' },
  { value: '2025-11', label: 'Borderô Nov/2025' },
];

export const OPCOES_UF = [
  { value: 'todos', label: 'Todos os estados' },
  { value: 'SP', label: 'SP' },
  { value: 'RJ', label: 'RJ' },
  { value: 'MG', label: 'MG' },
  { value: 'RS', label: 'RS' },
  { value: 'PR', label: 'PR' },
];

export interface KpiItem {
  rotulo: string;
  valor: string;
  detalhe?: string;
}

export const KPI_BORDERO: KpiItem[] = [
  { rotulo: 'Valor total enviado', valor: 'R$ 18,4M', detalhe: 'Borderô consolidado' },
  { rotulo: 'Processos enviados', valor: '12.847', detalhe: 'Quantidade de títulos' },
  { rotulo: 'Média de idade no envio', valor: '142 dias', detalhe: 'Idade média dos títulos' },
  { rotulo: 'Lotes no período', valor: '3', detalhe: 'Borderôs recebidos' },
];

export const KPI_FINANCEIRO: KpiItem[] = [
  { rotulo: 'Recebido pela ABE', valor: 'R$ 4,92M', detalhe: 'Cobrança ativa' },
  { rotulo: 'Pagamento direto', valor: 'R$ 1,18M', detalhe: 'Devedor → credor' },
  { rotulo: 'Efetividade geral', valor: '33,2%', detalhe: 'Sucesso sobre enviado' },
  { rotulo: 'Total recuperado', valor: 'R$ 6,10M', detalhe: 'ABE + pagamento direto' },
];

export const KPI_CARTEIRA_ATIVA: KpiItem[] = [
  { rotulo: 'Valor em negociação', valor: 'R$ 7,28M', detalhe: 'Carteira ativa' },
  { rotulo: 'Processos ativos', valor: '5.214', detalhe: 'Em tratativa' },
  { rotulo: '% sobre enviado', valor: '39,6%', detalhe: 'Participação da carteira' },
  { rotulo: 'Ticket médio', valor: 'R$ 1.396', detalhe: 'Por processo ativo' },
];

export interface AcordoLinha {
  metrica: string;
  quantidade: number;
  valor: string;
}

export const TABELA_ACORDOS: AcordoLinha[] = [
  { metrica: 'Acordos realizados', quantidade: 1847, valor: 'R$ 3,42M' },
  { metrica: 'Acordos sendo pagos (parcialmente)', quantidade: 612, valor: 'R$ 1,08M' },
  { metrica: 'Acordos quebrados', quantidade: 289, valor: 'R$ 520k' },
  { metrica: 'Acordos firmados sem 1ª parcela paga', quantidade: 94, valor: 'R$ 178k' },
];

export interface BaixaLinha {
  motivo: string;
  definicao: string;
  quantidade: number;
  valor: string;
}

export const TABELA_BAIXAS: BaixaLinha[] = [
  {
    motivo: 'Incobrável',
    definicao: 'ABE esgotou todas as etapas extrajudiciais sem êxito',
    quantidade: 421,
    valor: 'R$ 890k',
  },
  {
    motivo: 'Não estabelecido',
    definicao: 'Devedor não encontrado no endereço — constatado em visita',
    quantidade: 187,
    valor: 'R$ 312k',
  },
  {
    motivo: 'Não processado',
    definicao: 'Histórico negativo + título com mais de 18 meses',
    quantidade: 256,
    valor: 'R$ 445k',
  },
];

/** Rosca — visão geral da carteira (%). */
export const CARTEIRA_ROSCA = [
  { label: 'Recebido', pct: 33.2, cor: 'hsl(var(--success))' },
  { label: 'Ativo', pct: 39.6, cor: 'hsl(var(--primary))' },
  { label: 'Acordo', pct: 18.6, cor: 'hsl(var(--accent))' },
  { label: 'Incobrável', pct: 5.4, cor: 'hsl(var(--danger))' },
  { label: 'Devolvido', pct: 3.2, cor: 'hsl(var(--muted-foreground))' },
];

export const ENVIADO_RECEBIDO_MENSAL = [
  { mes: 'Out', enviado: 1.2, recebido: 0.38 },
  { mes: 'Nov', enviado: 1.8, recebido: 0.52 },
  { mes: 'Dez', enviado: 2.1, recebido: 0.61 },
  { mes: 'Jan', enviado: 1.9, recebido: 0.58 },
  { mes: 'Fev', enviado: 2.4, recebido: 0.72 },
  { mes: 'Mar', enviado: 2.0, recebido: 0.69 },
];

export const EFETIVIDADE_POR_IDADE = [
  { idade: '0-30d', efetividade: 68 },
  { idade: '31-60d', efetividade: 54 },
  { idade: '61-90d', efetividade: 41 },
  { idade: '91-180d', efetividade: 28 },
  { idade: '180+d', efetividade: 14 },
];

export const FAIXA_IDADE_COMPARATIVO = [
  { faixa: '0-30', enviado: 2.1, recebido: 1.43, media: 68 },
  { faixa: '31-60', enviado: 3.4, recebido: 1.84, media: 54 },
  { faixa: '61-90', enviado: 4.2, recebido: 1.72, media: 41 },
  { faixa: '91-180', enviado: 5.8, recebido: 1.62, media: 28 },
  { faixa: '180+', enviado: 2.9, recebido: 0.41, media: 14 },
];

export interface UfMetrica {
  uf: string;
  enviado: number;
  recebido: number;
  efetividade: number;
  ativo: number;
  devolvido: number;
}

export const METRICAS_UF: UfMetrica[] = [
  { uf: 'SP', enviado: 6.2, recebido: 2.1, efetividade: 33.9, ativo: 2.4, devolvido: 0.4 },
  { uf: 'RJ', enviado: 3.1, recebido: 0.9, efetividade: 29.0, ativo: 1.2, devolvido: 0.3 },
  { uf: 'MG', enviado: 2.8, recebido: 1.0, efetividade: 35.7, ativo: 1.1, devolvido: 0.2 },
  { uf: 'RS', enviado: 1.9, recebido: 0.7, efetividade: 36.8, ativo: 0.8, devolvido: 0.1 },
  { uf: 'PR', enviado: 1.6, recebido: 0.5, efetividade: 31.3, ativo: 0.7, devolvido: 0.2 },
  { uf: 'SC', enviado: 1.2, recebido: 0.4, efetividade: 33.3, ativo: 0.5, devolvido: 0.1 },
];

/** Composição por ator — ABE agrupa Delphi + Web na exibição. */
export const COMPOSICAO_ATORES = [
  {
    id: 'abe',
    nome: 'ABE',
    descricao: 'Delphi + ABE Web',
    valor: 'R$ 13,2M',
    pct: 71.7,
    logo: '/sources/ponteiro-mouse/ABE.svg',
    detalhe: { delphi: 'R$ 7,8M', web: 'R$ 5,4M' },
  },
  {
    id: 'acordo_seguro',
    nome: 'Acordo Seguro',
    descricao: 'Negociação digital',
    valor: 'R$ 3,1M',
    pct: 16.8,
    logo: '/sources/ponteiro-mouse/Acordoseguro.svg',
  },
  {
    id: 'avantpay',
    nome: 'AvantPay',
    descricao: 'Cobrança preventiva',
    valor: 'R$ 2,1M',
    pct: 11.5,
    logo: '/sources/ponteiro-mouse/Avantpay.svg',
  },
];
