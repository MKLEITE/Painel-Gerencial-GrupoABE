import type { AcordoLinha, BaixaLinha } from '@/lib/dashboard-mock';

export function AcordosTable({ linhas }: { linhas: AcordoLinha[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground">Acordos</h3>
        <p className="text-sm text-muted-foreground">Status consolidado da carteira de acordos</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 pr-4 font-semibold">Métrica</th>
              <th className="pb-3 pr-4 font-semibold text-right">Quantidade</th>
              <th className="pb-3 font-semibold text-right">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr
                key={linha.metrica}
                className="border-b border-border/60 last:border-0 hover:bg-muted/30"
              >
                <td className="py-3 pr-4 font-medium text-foreground">{linha.metrica}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                  {linha.quantidade.toLocaleString('pt-BR')}
                </td>
                <td className="py-3 text-right font-semibold tabular-nums text-foreground">
                  {linha.valor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BaixasTable({ linhas }: { linhas: BaixaLinha[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-5">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Baixas por incobrabilidade
        </h3>
        <p className="text-sm text-muted-foreground">Motivos e definições operacionais</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 pr-4 font-semibold">Motivo</th>
              <th className="pb-3 pr-4 font-semibold">Definição</th>
              <th className="pb-3 pr-4 font-semibold text-right">Qtd</th>
              <th className="pb-3 font-semibold text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr
                key={linha.motivo}
                className="border-b border-border/60 last:border-0 hover:bg-muted/30"
              >
                <td className="py-3 pr-4 font-medium text-foreground">{linha.motivo}</td>
                <td className="max-w-xs py-3 pr-4 text-muted-foreground">{linha.definicao}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                  {linha.quantidade.toLocaleString('pt-BR')}
                </td>
                <td className="py-3 text-right font-semibold tabular-nums text-foreground">
                  {linha.valor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
