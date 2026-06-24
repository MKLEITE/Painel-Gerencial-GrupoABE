'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { SortableTableHead } from '@/components/admin/sortable-table-head';
import { TablePagination } from '@/components/admin/table-pagination';
import { useDataTable } from '@/hooks/use-data-table';
import type { Credor } from '@/lib/admin-api';
import { formatCnpj } from '@/lib/admin-labels';

type CredorSortKey =
  | 'razaoSocial'
  | 'cnpj'
  | 'emailComercial'
  | 'responsavel'
  | 'cidade'
  | 'status';

function getCredorSortValue(c: Credor, key: CredorSortKey): string | number {
  switch (key) {
    case 'razaoSocial':
      return c.razaoSocial;
    case 'cnpj':
      return Number(c.cnpj?.replace(/\D/g, '') || 0);
    case 'emailComercial':
      return c.emailComercial ?? '';
    case 'responsavel':
      return c.responsavel?.nome ?? c.responsavel?.email ?? '';
    case 'cidade':
      return c.cidade && c.estado ? `${c.cidade}/${c.estado}` : '';
    case 'status':
      return c.tenantStatus;
  }
}

export function CredoresTable({ credores }: { credores: Credor[] }) {
  const { rows, page, totalPages, total, from, to, setPage, sortKey, sortDir, toggleSort } =
    useDataTable(credores, getCredorSortValue);

  if (credores.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
        <p className="text-sm font-medium text-foreground">Nenhum credor cadastrado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique em &quot;Novo credor&quot; para cadastrar o primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <SortableTableHead
                label="Razão social"
                active={sortKey === 'razaoSocial'}
                direction={sortKey === 'razaoSocial' ? sortDir : null}
                onSort={() => toggleSort('razaoSocial', 'text')}
              />
              <SortableTableHead
                label="CNPJ"
                active={sortKey === 'cnpj'}
                direction={sortKey === 'cnpj' ? sortDir : null}
                onSort={() => toggleSort('cnpj', 'number')}
              />
              <SortableTableHead
                label="E-mail comercial"
                active={sortKey === 'emailComercial'}
                direction={sortKey === 'emailComercial' ? sortDir : null}
                onSort={() => toggleSort('emailComercial', 'text')}
              />
              <SortableTableHead
                label="Responsável (login)"
                active={sortKey === 'responsavel'}
                direction={sortKey === 'responsavel' ? sortDir : null}
                onSort={() => toggleSort('responsavel', 'text')}
              />
              <SortableTableHead
                label="Cidade/UF"
                active={sortKey === 'cidade'}
                direction={sortKey === 'cidade' ? sortDir : null}
                onSort={() => toggleSort('cidade', 'text')}
              />
              <SortableTableHead
                label="Status"
                active={sortKey === 'status'}
                direction={sortKey === 'status' ? sortDir : null}
                onSort={() => toggleSort('status', 'text')}
              />
              <th className="px-5 py-3.5 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">{c.razaoSocial}</p>
                  {c.nomeFantasia && (
                    <p className="text-xs text-muted-foreground">{c.nomeFantasia}</p>
                  )}
                </td>
                <td className="px-5 py-4 tabular-nums text-foreground">{formatCnpj(c.cnpj)}</td>
                <td className="px-5 py-4 text-foreground">{c.emailComercial ?? '—'}</td>
                <td className="px-5 py-4">
                  {c.responsavel ? (
                    <>
                      <p className="font-medium text-foreground">{c.responsavel.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.responsavel.email}</p>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-4 text-foreground">
                  {c.cidade && c.estado ? `${c.cidade}/${c.estado}` : '—'}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={c.tenantStatus} />
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/credores/${c.id}/editar`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        total={total}
        from={from}
        to={to}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        itemLabelSingular="credor"
        itemLabelPlural="credores"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ativo = status === 'ATIVO';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        ativo ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
      }`}
    >
      {ativo ? 'Ativo' : status}
    </span>
  );
}
