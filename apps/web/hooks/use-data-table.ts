'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  defaultSortDirection,
  paginateItems,
  sortItems,
  TABLE_PAGE_SIZE,
  type SortDirection,
  type SortKind,
} from '@/lib/data-table';

export function useDataTable<T, K extends string>(
  items: T[],
  getValue: (item: T, key: K) => string | number | null | undefined,
  pageSize = TABLE_PAGE_SIZE,
) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<K | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [sortKind, setSortKind] = useState<SortKind>('text');

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  function toggleSort(key: K, kind: SortKind) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortKind(kind);
      setSortDir(defaultSortDirection(kind));
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    return sortItems(items, (item) => getValue(item, sortKey), sortKind, sortDir);
  }, [items, sortKey, sortDir, sortKind, getValue]);

  const pagination = useMemo(
    () => paginateItems(sorted, page, pageSize),
    [sorted, page, pageSize],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  return {
    rows: pagination.items,
    page: pagination.page,
    totalPages: pagination.totalPages,
    total: pagination.total,
    from: pagination.from,
    to: pagination.to,
    setPage,
    sortKey,
    sortDir,
    toggleSort,
  };
}
