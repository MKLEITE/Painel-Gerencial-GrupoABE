import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Clock,
  Fingerprint,
  Layers,
  LineChart,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';

const RECURSOS = [
  {
    icon: Search,
    titulo: 'Busca unificada',
    texto:
      'Pesquise um CPF/CNPJ uma vez e veja a linha do tempo do devedor nas 4 fontes, em menos de 2 segundos.',
  },
  {
    icon: BarChart3,
    titulo: 'Cockpit de KPIs',
    texto:
      'Total em cobrança, recuperado no mês e roll rate por empresa — atualizados e prontos para decisão.',
  },
  {
    icon: Workflow,
    titulo: 'Ações administrativas',
    texto:
      'Transfira títulos e pause cobranças com idempotência e rastreabilidade total. Sem cobrança duplicada.',
  },
  {
    icon: Layers,
    titulo: 'Régua consolidada',
    texto:
      'Do preventivo à baixa: visualize todo o funil de cobrança em um modelo de dados único e padronizado.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Isolamento por tenant',
    texto:
      'Cada credor enxerga apenas o seu. Isolamento garantido na aplicação e no banco (Row-Level Security).',
  },
  {
    icon: Clock,
    titulo: 'Dados sempre frescos',
    texto:
      'Sincronização contínua com carimbo de "atualizado há X min" por fonte. Transparência em tempo real.',
  },
];

const FONTES = [
  { nome: 'Avantpay', fase: 'Preventivo', logo: '/sources/ponteiro-mouse/Avantpay.svg' },
  { nome: 'ABE Interno', fase: 'Cobrança ativa', logo: '/sources/ponteiro-mouse/ABE.svg' },
  { nome: 'ABEWeb', fase: 'Cobrança ativa', logo: '/sources/ponteiro-mouse/ABE.svg' },
  { nome: 'Acordo Seguro', fase: 'Acordos', logo: '/sources/ponteiro-mouse/Acordoseguro.svg' },
] as { nome: string; fase: string; logo: string | null }[];

const METRICAS = [
  { valor: '4', rotulo: 'sistemas em uma só visão' },
  { valor: '< 2s', rotulo: 'para buscar um devedor' },
  { valor: '360º', rotulo: 'da régua de cobrança' },
  { valor: '99,9%', rotulo: 'meta de disponibilidade' },
];

const SEGURANCA = [
  { icon: Lock, titulo: 'Criptografia ponta a ponta', texto: 'Em trânsito e em repouso.' },
  {
    icon: Fingerprint,
    titulo: 'MFA para administradores',
    texto: 'Camada extra em ações sensíveis.',
  },
  { icon: ShieldCheck, titulo: 'Trilha de auditoria', texto: 'Quem, o quê, quando e de onde.' },
  { icon: Building2, titulo: 'Conformidade LGPD', texto: 'Minimização e mascaramento de dados.' },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* ===================== HERO ===================== */}
        <section id="visao" className="relative overflow-hidden">
          {/* Camadas de fundo (grade + brilho). {/* BG-SLOT: troque por imagem se desejar */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-light [background-size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade" />
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="container py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-soft backdrop-blur">
                <Sparkles className="h-4 w-4 text-primary" />A régua de cobrança inteira, em um só
                lugar
              </span>

              <h1 className="mt-6 animate-fade-in-up font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Toda a cobrança do <span className="text-gradient">Grupo ABE</span>,
                <br className="hidden sm:block" /> consolidada e segura.
              </h1>

              <p className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-lg leading-relaxed text-muted-foreground [animation-delay:80ms]">
                Um portal único e multiempresa que reúne Avantpay, ABE Interno, ABEWeb e Acordo
                Seguro. Busque qualquer devedor, acompanhe o financeiro e aja com total
                rastreabilidade — sem trocar de sistema.
              </p>

              <div className="mt-9 flex animate-fade-in-up flex-col items-center justify-center gap-3 [animation-delay:160ms] sm:flex-row">
                <Link
                  href="/login"
                  className="sheen group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
                >
                  Acessar o painel
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <a
                  href="#recursos"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 px-7 py-3.5 text-base font-semibold text-foreground shadow-soft backdrop-blur transition-all duration-300 hover:border-primary/40 hover:bg-card sm:w-auto"
                >
                  Conhecer os recursos
                </a>
              </div>
            </div>

            {/* Mockup/visual do produto */}
            <div className="mx-auto mt-16 max-w-5xl animate-fade-in-up [animation-delay:240ms]">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* ===================== MÉTRICAS ===================== */}
        <section className="border-y border-border/60 bg-surface/40">
          <div className="container grid grid-cols-2 gap-8 py-12 lg:grid-cols-4">
            {METRICAS.map((m) => (
              <div key={m.rotulo} className="text-center">
                <div className="font-display text-4xl font-bold text-gradient sm:text-5xl">
                  {m.valor}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{m.rotulo}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== RECURSOS ===================== */}
        <section id="recursos" className="container py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag icon={Zap}>Recursos</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Tudo que a operação precisa, em uma experiência só
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Pensado para o dia a dia do credor: menos cliques, mais clareza e decisões mais
              rápidas.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map((r) => (
              <article
                key={r.titulo}
                className="ring-gradient lift group relative rounded-3xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <r.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                  {r.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.texto}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ===================== FONTES ===================== */}
        <section id="fontes" className="border-y border-border/60 bg-surface/40">
          <div className="container py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <SectionTag icon={Layers}>Fontes conectadas</SectionTag>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Quatro sistemas, uma única verdade
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                O portal traduz cada fonte para um modelo canônico. Você vê o todo, sem se preocupar
                de onde o dado veio.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FONTES.map((f) => (
                <div
                  key={f.nome}
                  className="lift group flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-soft transition-colors hover:border-primary/40"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-white shadow-soft transition-transform duration-300 group-hover:scale-105">
                    {f.logo ? (
                      <img src={f.logo} alt={f.nome} className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="font-display text-2xl font-bold text-gradient">
                        {f.nome.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">{f.nome}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {f.fase}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== SEGURANÇA ===================== */}
        <section id="seguranca" className="container py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionTag icon={ShieldCheck}>Segurança & LGPD</SectionTag>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Confiança não é recurso. É a fundação.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Dados sensíveis exigem o mais alto padrão. Cada acesso é autenticado, autorizado por
                papel e registrado — com isolamento total entre credores.
              </p>

              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                {SEGURANCA.map((s) => (
                  <div
                    key={s.titulo}
                    className="group flex items-start gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-card"
                  >
                    <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <dt className="font-semibold text-foreground">{s.titulo}</dt>
                      <dd className="text-sm text-muted-foreground">{s.texto}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/15 to-accent/15 blur-2xl" />
              <div className="glass overflow-hidden rounded-[2rem] p-8 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="bg-brand flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground shadow-soft ring-1 ring-accent/30">
                    <LineChart className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">
                      Painel de auditoria
                    </p>
                    <p className="text-sm text-muted-foreground">Rastreabilidade de cada ação</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { t: 'Login autenticado', d: 'admin@grupoabe.com.br', ok: true },
                    { t: 'Busca por CPF (mascarado)', d: '***.***.***-12', ok: true },
                    { t: 'Transferência de título', d: 'Avantpay → ABEWeb', ok: true },
                  ].map((row) => (
                    <div
                      key={row.t}
                      className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 text-sm transition-colors hover:border-primary/30"
                    >
                      <div>
                        <p className="font-medium text-foreground">{row.t}</p>
                        <p className="text-xs text-muted-foreground">{row.d}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        registrado
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== CTA ===================== */}
        <section className="container pb-24">
          <div className="bg-brand relative overflow-hidden rounded-[2.5rem] border border-primary-deep/40 px-8 py-16 text-center shadow-card sm:px-16">
            <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-20 [background-size:36px_36px]" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Pronto para enxergar a cobrança por inteiro?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/85">
                Entre no painel e tenha a visão 360º da sua carteira agora mesmo.
              </p>
              <Link
                href="/login"
                className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-background px-7 py-3.5 text-base font-semibold text-foreground shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
              >
                Acessar o painel
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionTag({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-soft">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {children}
    </span>
  );
}

/** Prévia estilizada do produto (mock visual, sem dados reais). */
function HeroPreview() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-x-8 -bottom-8 -top-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 blur-2xl" />
      <div className="glass overflow-hidden rounded-[1.75rem] p-2 shadow-card">
        <div className="rounded-[1.4rem] border border-border bg-card">
          {/* topo "janela" */}
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <span className="h-3 w-3 rounded-full bg-danger/60" />
            <span className="h-3 w-3 rounded-full bg-warning/60" />
            <span className="h-3 w-3 rounded-full bg-success/60" />
            <div className="ml-3 h-6 flex-1 rounded-lg bg-muted/60" />
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {[
              { rotulo: 'Em cobrança', valor: 'R$ 4,82M', delta: '+3,1%', icon: Layers },
              { rotulo: 'Recuperado (mês)', valor: 'R$ 1,29M', delta: '+12,4%', icon: LineChart },
              { rotulo: 'Acordos ativos', valor: '1.847', delta: '+86', icon: Workflow },
            ].map((c) => (
              <div
                key={c.rotulo}
                className="rounded-2xl border border-border bg-surface/60 p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{c.rotulo}</span>
                  <c.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 font-display text-xl font-bold text-foreground">{c.valor}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success">
                  ▲ {c.delta}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-2xl border border-border bg-surface/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Funil da régua</span>
                <span className="text-xs text-muted-foreground">atualizado há 2 min</span>
              </div>
              <div className="flex items-end gap-2">
                {[68, 52, 80, 44, 92, 60, 74, 50, 88, 64].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary/30 to-primary transition-all duration-300 hover:to-accent"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
