export type SortKind = 'text' | 'number';
export type SortDirection = 'asc' | 'desc';

export const TABLE_PAGE_SIZE = 10;

export function defaultSortDirection(kind: SortKind): SortDirection {
  return kind === 'number' ? 'desc' : 'asc';
}

export function sortItems<T>(
  items: T[],
  getValue: (item: T) => string | number | null | undefined,
  kind: SortKind,
  direction: SortDirection,
): T[] {
  const factor = direction === 'asc' ? 1 : -1;

  return [...items].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);

    if (kind === 'number') {
      const na = typeof va === 'number' ? va : Number(va ?? 0);
      const nb = typeof vb === 'number' ? vb : Number(vb ?? 0);
      return (na - nb) * factor;
    }

    const sa = String(va ?? '').toLocaleLowerCase('pt-BR');
    const sb = String(vb ?? '').toLocaleLowerCase('pt-BR');
    return sa.localeCompare(sb, 'pt-BR') * factor;
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}
