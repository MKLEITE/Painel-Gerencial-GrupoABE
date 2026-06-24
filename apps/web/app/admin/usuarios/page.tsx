'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { UsuariosTable } from '@/components/admin/usuarios-table';
import { KpiSection } from '@/components/dashboard/kpi-section';
import { listUsuarios, updateUsuario, type AdminUsuario } from '@/lib/admin-api';
import { toApiError } from '@/lib/api-client';
import type { KpiItem } from '@/lib/dashboard-mock';

function buildKpis(usuarios: AdminUsuario[]): KpiItem[] {
  const ativos = usuarios.filter((u) => u.ativo).length;
  const inativos = usuarios.length - ativos;
  const superAdmins = usuarios.filter((u) => u.papel === 'SUPER_ADMIN').length;

  return [
    { rotulo: 'Administradores', valor: String(usuarios.length), detalhe: 'Equipe interna da plataforma' },
    { rotulo: 'Ativos', valor: String(ativos), detalhe: 'Com acesso liberado' },
    { rotulo: 'Inativos', valor: String(inativos), detalhe: 'Acesso bloqueado' },
    { rotulo: 'Super Admins', valor: String(superAdmins), detalhe: 'Acesso total ao /admin' },
  ];
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const data = await listUsuarios();
      setUsuarios(data);
    } catch (err) {
      setErro(toApiError(err).title);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function toggleAtivo(u: AdminUsuario) {
    setErro(null);
    try {
      await updateUsuario(u.id, { ativo: !u.ativo });
      await carregar();
    } catch (err) {
      setErro(toApiError(err).title);
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <KpiSection hideHeader kpis={buildKpis(usuarios)} />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Sobre esta lista</h3>
        <p className="text-sm text-muted-foreground">
          Exibe apenas administradores internos da plataforma ABE. Usuários de credores (login no
          dashboard) são criados automaticamente ao cadastrar um credor, na seção
          &quot;Responsável pela Conta&quot;.
        </p>
      </section>

      {erro && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {erro}
        </p>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Administradores da plataforma</h2>
            <p className="text-xs text-muted-foreground">
              Equipe interna ABE — não inclui logins de credores.
            </p>
          </div>
          <Link
            href="/admin/usuarios/novo"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Novo administrador
          </Link>
        </div>

        <UsuariosTable usuarios={usuarios} onToggleAtivo={toggleAtivo} />
      </section>
    </>
  );
}
