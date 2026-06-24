'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { SortableTableHead } from '@/components/admin/sortable-table-head';
import { TablePagination } from '@/components/admin/table-pagination';
import { useDataTable } from '@/hooks/use-data-table';
import type { AdminUsuario } from '@/lib/admin-api';
import { PAPEL_LABEL } from '@/lib/admin-labels';

type UsuarioSortKey = 'nome' | 'email' | 'papel' | 'status';

function getUsuarioSortValue(u: AdminUsuario, key: UsuarioSortKey): string | number {
  switch (key) {
    case 'nome':
      return u.nome;
    case 'email':
      return u.email;
    case 'papel':
      return u.papel;
    case 'status':
      return u.ativo ? 1 : 0;
  }
}

interface UsuariosTableProps {
  usuarios: AdminUsuario[];
  onToggleAtivo: (u: AdminUsuario) => void;
}

export function UsuariosTable({ usuarios, onToggleAtivo }: UsuariosTableProps) {
  const { rows, page, totalPages, total, from, to, setPage, sortKey, sortDir, toggleSort } =
    useDataTable(usuarios, getUsuarioSortValue);

  if (usuarios.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
        <p className="text-sm font-medium text-foreground">Nenhum administrador cadastrado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Usuários de credor são criados no cadastro do credor.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <SortableTableHead
                label="Nome"
                active={sortKey === 'nome'}
                direction={sortKey === 'nome' ? sortDir : null}
                onSort={() => toggleSort('nome', 'text')}
              />
              <SortableTableHead
                label="E-mail"
                active={sortKey === 'email'}
                direction={sortKey === 'email' ? sortDir : null}
                onSort={() => toggleSort('email', 'text')}
              />
              <SortableTableHead
                label="Permissão"
                active={sortKey === 'papel'}
                direction={sortKey === 'papel' ? sortDir : null}
                onSort={() => toggleSort('papel', 'text')}
              />
              <SortableTableHead
                label="Status"
                active={sortKey === 'status'}
                direction={sortKey === 'status' ? sortDir : null}
                onSort={() => toggleSort('status', 'number')}
              />
              <th className="px-5 py-3.5 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-5 py-4 font-medium text-foreground">{u.nome}</td>
                <td className="px-5 py-4 text-muted-foreground">{u.email}</td>
                <td className="px-5 py-4">
                  <PapelBadge papel={u.papel} />
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onToggleAtivo(u)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      u.ativo
                        ? 'bg-success/10 text-success hover:bg-success/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/admin/usuarios/${u.id}/editar`}
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
        itemLabelSingular="usuário"
        itemLabelPlural="usuários"
      />
    </div>
  );
}

function PapelBadge({ papel }: { papel: string }) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: 'bg-primary/10 text-primary',
    OPERADOR: 'bg-warning/10 text-warning',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colors[papel] ?? 'bg-muted text-muted-foreground'}`}
    >
      {PAPEL_LABEL[papel] ?? papel}
    </span>
  );
}
