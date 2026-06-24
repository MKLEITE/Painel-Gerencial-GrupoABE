import {
  ENVIADO_RECEBIDO_MENSAL,
  EFETIVIDADE_POR_IDADE,
  FAIXA_IDADE_COMPARATIVO,
  METRICAS_UF,
} from '@/lib/dashboard-mock';

function maxValor(items: { enviado?: number; recebido?: number; efetividade?: number }[]) {
  return Math.max(
    ...items.flatMap((i) => [i.enviado ?? 0, i.recebido ?? 0, i.efetividade ?? 0]),
    1,
  );
}

export function EnviadoRecebidoChart() {
  const max = maxValor(ENVIADO_RECEBIDO_MENSAL);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Enviado vs recebido
        </h3>
        <p className="text-sm text-muted-foreground">Por mês · valores em R$ milhões</p>
      </div>

      <div className="flex items-end justify-between gap-2 overflow-x-auto pb-2">
        {ENVIADO_RECEBIDO_MENSAL.map((item) => (
          <div key={item.mes} className="flex min-w-[52px] flex-1 flex-col items-center gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t bg-primary/30 transition-all"
                style={{ height: `${(item.enviado / max) * 100}%` }}
                title={`Enviado: R$ ${item.enviado}M`}
              />
              <div
                className="w-3 rounded-t bg-primary transition-all"
                style={{ height: `${(item.recebido / max) * 100}%` }}
                title={`Recebido: R$ ${item.recebido}M`}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{item.mes}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-primary/30" /> Enviado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-primary" /> Recebido
        </span>
      </div>
    </div>
  );
}

export function EfetividadeIdadeChart() {
  const max = maxValor(EFETIVIDADE_POR_IDADE);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Efetividade por idade do título
        </h3>
        <p className="text-sm text-muted-foreground">Curva de decaimento da recuperação</p>
      </div>

      <div className="space-y-3">
        {EFETIVIDADE_POR_IDADE.map((item) => (
          <div key={item.idade}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-foreground">{item.idade}</span>
              <span className="tabular-nums text-muted-foreground">{item.efetividade}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all"
                style={{ width: `${(item.efetividade / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaixaIdadeChart() {
  const max = Math.max(...FAIXA_IDADE_COMPARATIVO.flatMap((i) => [i.enviado, i.recebido]));

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Enviado vs recebido por faixa de idade
        </h3>
        <p className="text-sm text-muted-foreground">
          0-30 · 31-60 · 61-90 · 91-180 · 180+ dias · R$ milhões
        </p>
      </div>

      <div className="space-y-4">
        {FAIXA_IDADE_COMPARATIVO.map((item) => (
          <div key={item.faixa}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{item.faixa} dias</span>
              <span className="text-xs text-muted-foreground">
                Média recebimento: {item.media}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <BarRow label="Enviado" valor={item.enviado} max={max} variant="muted" />
              <BarRow label="Recebido" valor={item.recebido} max={max} variant="primary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarRow({
  label,
  valor,
  max,
  variant,
}: {
  label: string;
  valor: number;
  max: number;
  variant: 'muted' | 'primary';
}) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span>R$ {valor}M</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${variant === 'primary' ? 'bg-primary' : 'bg-primary/35'}`}
          style={{ width: `${(valor / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function AnaliseGeografica() {
  const maxEfet = Math.max(...METRICAS_UF.map((u) => u.efetividade));
  const maiorRecebimento = [...METRICAS_UF].sort((a, b) => b.recebido - a.recebido)[0];
  const maiorVolume = [...METRICAS_UF].sort((a, b) => b.enviado - a.enviado)[0];
  const maiorDevolucao = [...METRICAS_UF].sort((a, b) => b.devolvido - a.devolvido)[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Análise geográfica por UF
        </h3>
        <p className="text-sm text-muted-foreground">Volume, efetividade e carteira ativa</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GeoHighlight
          rotulo="Maior efetividade"
          valor={`${maiorRecebimento.uf} · ${maiorRecebimento.efetividade}%`}
        />
        <GeoHighlight
          rotulo="Maior volume enviado"
          valor={`${maiorVolume.uf} · R$ ${maiorVolume.enviado}M`}
        />
        <GeoHighlight
          rotulo="Maior devolução"
          valor={`${maiorDevolucao.uf} · R$ ${maiorDevolucao.devolvido}M`}
        />
        <GeoHighlight
          rotulo="Carteira ativa (top UF)"
          valor={`${maiorVolume.uf} · R$ ${maiorVolume.ativo}M`}
        />
      </div>

      <div className="space-y-2">
        {METRICAS_UF.map((uf) => (
          <div
            key={uf.uf}
            className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40"
          >
            <span className="text-sm font-bold text-foreground">{uf.uf}</span>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-deep to-accent"
                style={{ width: `${(uf.efetividade / maxEfet) * 100}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {uf.efetividade}% · R$ {uf.recebido}M rec.
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeoHighlight({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{valor}</p>
    </div>
  );
}
