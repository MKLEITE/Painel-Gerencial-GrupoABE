import type { LucideIcon } from 'lucide-react';
import type { KpiItem } from '@/lib/dashboard-mock';

interface KpiSectionProps {
  titulo?: string;
  subtitulo?: string;
  icon?: LucideIcon;
  kpis: KpiItem[];
  hideHeader?: boolean;
}

export function KpiSection({ titulo, subtitulo, icon: Icon, kpis, hideHeader }: KpiSectionProps) {
  const showHeader = !hideHeader && (titulo || subtitulo || Icon);

  return (
    <section>
      {showHeader && (
        <div className="mb-3 flex items-center gap-2">
          {Icon && (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
          )}
          {(titulo || subtitulo) && (
            <div>
              {titulo && (
                <h2 className="font-display text-base font-semibold text-foreground">{titulo}</h2>
              )}
              {subtitulo && <p className="text-xs text-muted-foreground">{subtitulo}</p>}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article
            key={kpi.rotulo}
            className="ring-gradient lift rounded-2xl border border-border bg-card p-4 shadow-soft"
          >
            <p className="text-xs font-medium text-muted-foreground">{kpi.rotulo}</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground sm:text-2xl">
              {kpi.valor}
            </p>
            {kpi.detalhe && (
              <p className="mt-1 text-[11px] text-muted-foreground">{kpi.detalhe}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
