'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  total: number;
  from: number;
  to: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemLabelSingular: string;
  itemLabelPlural: string;
}

export function TablePagination({
  total,
  from,
  to,
  page,
  totalPages,
  onPageChange,
  itemLabelSingular,
  itemLabelPlural,
}: TablePaginationProps) {
  const label = total === 1 ? itemLabelSingular : itemLabelPlural;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {total === 0 ? (
          <>Nenhum {itemLabelSingular} cadastrado</>
        ) : (
          <>
            <span className="tabular-nums">{total.toLocaleString('pt-BR')}</span> {label} cadastrados
            {totalPages > 1 && (
              <>
                {' '}
                · exibindo{' '}
                <span className="tabular-nums">
                  {from}–{to}
                </span>
              </>
            )}
          </>
        )}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </button>
          <span className="min-w-[5.5rem] text-center text-xs tabular-nums text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
