'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  ChevronRight,
  FileInput,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { logout, me, type AuthUser } from '@/lib/auth';
import type { ApiError } from '@/lib/api-client';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { FormattedDate } from '@/components/ui/formatted-date';
import { UserAvatar } from '@/components/ui/user-avatar';
import { GlobalFilters } from '@/components/dashboard/global-filters';
import { KpiSection } from '@/components/dashboard/kpi-section';
import { CarteiraDonut, ComposicaoAtores } from '@/components/dashboard/charts/carteira-charts';
import {
  AnaliseGeografica,
  EfetividadeIdadeChart,
  EnviadoRecebidoChart,
  FaixaIdadeChart,
} from '@/components/dashboard/charts/periodo-charts';
import { AcordosTable, BaixasTable } from '@/components/dashboard/detail-tables';
import {
  COMPOSICAO_ATORES,
  FILTROS_INICIAIS,
  KPI_BORDERO,
  KPI_CARTEIRA_ATIVA,
  KPI_FINANCEIRO,
  TABELA_ACORDOS,
  TABELA_BAIXAS,
  type FiltrosDashboard,
} from '@/lib/dashboard-mock';

const NAV = [
  { label: 'Visão geral', icon: LayoutDashboard, active: true },
  { label: 'Carteira', icon: Wallet },
  { label: 'Busca de devedor', icon: Search },
  { label: 'Relatórios', icon: BarChart3 },
  { label: 'Usuários', icon: Users },
  { label: 'Configurações', icon: Settings },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosDashboard>(FILTROS_INICIAIS);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => router.replace('/login'))
      .finally(() => setCarregando(false));
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      void (err as ApiError);
    } finally {
      router.replace('/login');
    }
  }

  function atualizarFiltros(patch: Partial<FiltrosDashboard>) {
    setFiltros((prev) => ({ ...prev, ...patch }));
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
            <span className="bg-brand relative flex h-12 w-12 items-center justify-center rounded-full text-primary-foreground">
              <LayoutDashboard className="h-5 w-5" />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Carregando seu painel…</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-300 ease-spring lg:translate-x-0 ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Logo href="/dashboard" />
          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                item.active
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  item.active ? '' : 'group-hover:scale-110'
                }`}
              />
              {item.label}
              {item.active && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
            <UserAvatar nome={user.nome} fotoUrl={user.fotoUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{user.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* CONTEÚDO */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 flex-1 sm:block">
            <h1 className="truncate font-display text-lg font-semibold text-foreground">
              Dashboard Inteligente
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Visão 360º · ABE · AvantPay · Acordo Seguro
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success sm:inline-flex">
              <Radio className="h-3 w-3 animate-pulse" />
              Ao vivo
            </span>
            <ThemeToggle />
          </div>
        </header>

        <main className="space-y-6 p-4 sm:p-6">
          {/* Boas-vindas */}
          <section className="bg-brand relative overflow-hidden rounded-3xl border border-primary-deep/40 p-6 shadow-card sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-20 [background-size:32px_32px]" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-primary-foreground/80">
                  <FormattedDate />
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
                  Olá, {user.nome.split(' ')[0]}
                </h2>
                <p className="mt-1 max-w-xl text-primary-foreground/85">
                  Panorama consolidado da carteira — do borderô recebido à efetividade por UF.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                {papelLabel(user.papel)}
              </span>
            </div>
          </section>

          {/* Filtros globais */}
          <GlobalFilters filtros={filtros} onChange={atualizarFiltros} />

          {/* Borderô */}
          <KpiSection
            titulo="Recebimento do credor (Borderô)"
            subtitulo="Valor enviado, processos e idade média no envio"
            icon={FileInput}
            kpis={KPI_BORDERO}
          />

          {/* Financeiro */}
          <KpiSection
            titulo="Resultado financeiro"
            subtitulo="ABE vs pagamento direto · efetividade geral"
            icon={TrendingUp}
            kpis={KPI_FINANCEIRO}
          />

          {/* Carteira ativa */}
          <KpiSection
            titulo="Carteira ativa em negociação"
            subtitulo="Processos em tratativa e ticket médio"
            icon={Handshake}
            kpis={KPI_CARTEIRA_ATIVA}
          />

          {/* Rosca + Composição por ator */}
          <section className="grid gap-4 lg:grid-cols-2">
            <CarteiraDonut />
            <ComposicaoAtores atores={COMPOSICAO_ATORES} />
          </section>

          {/* Gráficos período */}
          <section className="grid gap-4 lg:grid-cols-2">
            <EnviadoRecebidoChart />
            <EfetividadeIdadeChart />
          </section>

          <FaixaIdadeChart />

          {/* Tabelas acordos + baixas */}
          <section className="grid gap-4 lg:grid-cols-2">
            <AcordosTable linhas={TABELA_ACORDOS} />
            <BaixasTable linhas={TABELA_BAIXAS} />
          </section>

          {/* Geográfico */}
          <AnaliseGeografica />
        </main>
      </div>
    </div>
  );
}

function papelLabel(papel: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_CREDOR: 'Admin do Credor',
    OPERADOR: 'Operador',
    VIEWER: 'Visualizador',
  };
  return map[papel] ?? papel;
}
