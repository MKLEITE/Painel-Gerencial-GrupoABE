'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '@/lib/data-table';

interface SortableTableHeadProps {
  label: string;
  active: boolean;
  direction: SortDirection | null;
  onSort: () => void;
  className?: string;
  align?: 'left' | 'right';
}

export function SortableTableHead({
  label,
  active,
  direction,
  onSort,
  className = '',
  align = 'left',
}: SortableTableHeadProps) {
  return (
    <th className={`px-5 py-3.5 font-semibold ${align === 'right' ? 'text-right' : ''} ${className}`}>
      <button
        type="button"
        onClick={onSort}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
          align === 'right' ? 'ml-auto' : ''
        } ${active ? 'text-foreground' : ''}`}
      >
        {label}
        {!active && <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />}
        {active && direction === 'asc' && <ArrowUp className="h-3 w-3" aria-hidden />}
        {active && direction === 'desc' && <ArrowDown className="h-3 w-3" aria-hidden />}
      </button>
    </th>
  );
}
