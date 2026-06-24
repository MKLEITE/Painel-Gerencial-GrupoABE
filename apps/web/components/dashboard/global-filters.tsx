'use client';

import type { LucideIcon } from 'lucide-react';
import { Calendar, Filter, MapPin, Package, User } from 'lucide-react';
import type { FiltrosDashboard } from '@/lib/dashboard-mock';
import {
  OPCOES_COD_CLIENTE,
  OPCOES_LOTE,
  OPCOES_UF,
} from '@/lib/dashboard-mock';

interface GlobalFiltersProps {
  filtros: FiltrosDashboard;
  onChange: (patch: Partial<FiltrosDashboard>) => void;
}

export function GlobalFilters({ filtros, onChange }: GlobalFiltersProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Filtros globais</h2>
        <span className="text-xs text-muted-foreground">
          Todos os painéis respondem a estes filtros
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterField label="CodCliente" icon={User}>
          <select
            value={filtros.codCliente}
            onChange={(e) => onChange({ codCliente: e.target.value })}
            className={selectClass}
          >
            {OPCOES_COD_CLIENTE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Lote de envio" icon={Package}>
          <select
            value={filtros.loteEnvio}
            onChange={(e) => onChange({ loteEnvio: e.target.value })}
            className={selectClass}
          >
            {OPCOES_LOTE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Data abertura" icon={Calendar}>
          <input
            type="date"
            value={filtros.dataAbertura}
            onChange={(e) => onChange({ dataAbertura: e.target.value })}
            className={inputClass}
          />
        </FilterField>

        <FilterField label="Período" icon={Calendar}>
          <select
            value={filtros.periodo}
            onChange={(e) =>
              onChange({ periodo: e.target.value as FiltrosDashboard['periodo'] })
            }
            className={selectClass}
          >
            <option value="mes_atual">Mês atual</option>
            <option value="mes_anterior">Mês anterior</option>
            <option value="ano_atual">Ano atual</option>
            <option value="custom">Intervalo personalizado</option>
          </select>
        </FilterField>

        <FilterField label="CNPJ devedor" icon={User}>
          <input
            type="search"
            placeholder="00.000.000/0000-00"
            value={filtros.cnpjDevedor}
            onChange={(e) => onChange({ cnpjDevedor: e.target.value })}
            className={inputClass}
          />
        </FilterField>

        <FilterField label="Estado (UF)" icon={MapPin}>
          <select
            value={filtros.uf}
            onChange={(e) => onChange({ uf: e.target.value })}
            className={selectClass}
          >
            {OPCOES_UF.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FilterField>
      </div>
    </section>
  );
}

function FilterField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/15';

const selectClass =
  'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/15';
