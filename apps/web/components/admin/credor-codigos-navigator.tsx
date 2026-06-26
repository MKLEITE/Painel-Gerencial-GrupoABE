'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Circle,
  Crown,
  GitBranch,
  Layers,
  Loader2,
  MapPin,
  Phone,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  FormField,
  FormInput,
  FormSelect,
  SaveFeedback,
  type SaveFeedbackState,
} from '@/components/admin/form-field';
import { SetoresSelect } from '@/components/admin/setores-select';
import {
  listCredorCodigos,
  updateCredor,
  updateCredorCodigo,
  type CredorCodigoUnidade,
} from '@/lib/admin-api';
import { UFS_BR } from '@/lib/admin-constants';
import {
  formatCnpj,
  maskCepInput,
  maskCnpjInput,
  maskPhoneInput,
  stripCnpj,
  stripDigits,
} from '@/lib/admin-labels';
import { toApiError } from '@/lib/api-client';

interface CredorCodigosNavigatorProps {
  credorId: string;
  setores?: string[];
  onSetoresChange?: (setores: string[]) => void;
}

type FormState = {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  emailComercial: string;
  cep: string;
  cidade: string;
  estado: string;
  bairro: string;
  endereco: string;
  numero: string;
  complemento: string;
  comercialPrincipal: string;
  preposto: string;
};

type AbaId = 'cadastro' | 'contato' | 'endereco' | 'comercial';
type TabStatus = 'empty' | 'partial' | 'complete';

const ABAS: { id: AbaId; label: string; icon: typeof Building2 }[] = [
  { id: 'cadastro', label: 'Cadastro', icon: Building2 },
  { id: 'contato', label: 'Contato', icon: Phone },
  { id: 'endereco', label: 'Endereço', icon: MapPin },
  { id: 'comercial', label: 'Comercial', icon: Briefcase },
];

function toForm(u: CredorCodigoUnidade): FormState {
  return {
    razaoSocial: u.razaoSocial ?? '',
    nomeFantasia: u.nomeFantasia ?? '',
    cnpj: formatCnpj(u.cnpj),
    telefone: u.telefone ? maskPhoneInput(u.telefone) : '',
    emailComercial: u.emailComercial ?? '',
    cep: u.cep ? maskCepInput(u.cep) : '',
    cidade: u.cidade ?? '',
    estado: u.estado ?? '',
    bairro: u.bairro ?? '',
    endereco: u.endereco ?? '',
    numero: u.numero ?? '',
    complemento: u.complemento ?? '',
    comercialPrincipal: u.comercialPrincipal ?? '',
    preposto: u.preposto ?? '',
  };
}

function tabStatus(form: FormState, tab: AbaId): TabStatus {
  switch (tab) {
    case 'cadastro': {
      if (!form.razaoSocial.trim()) return 'empty';
      return stripCnpj(form.cnpj).length === 14 ? 'complete' : 'partial';
    }
    case 'contato': {
      const tel = stripDigits(form.telefone);
      const mail = form.emailComercial.trim();
      if (!tel && !mail) return 'empty';
      return tel && mail ? 'complete' : 'partial';
    }
    case 'endereco': {
      const keys = [form.cep, form.cidade, form.estado, form.endereco, form.bairro];
      const filled = keys.filter((v) => v.trim()).length;
      if (filled === 0) return 'empty';
      return filled >= 4 ? 'complete' : 'partial';
    }
    case 'comercial': {
      const com = form.comercialPrincipal.trim();
      const prep = form.preposto.trim();
      if (!com && !prep) return 'empty';
      return com && prep ? 'complete' : 'partial';
    }
  }
}

function overallProgress(form: FormState): number {
  const statuses = ABAS.map((a) => tabStatus(form, a.id));
  const score = statuses.reduce(
    (acc, s) => acc + (s === 'complete' ? 1 : s === 'partial' ? 0.5 : 0),
    0,
  );
  return Math.round((score / ABAS.length) * 100);
}

function sistemaTheme(sistema: 'WEB' | 'Delphi') {
  if (sistema === 'WEB') {
    return {
      badge: 'bg-primary/15 text-primary border-primary/25',
      hero: 'from-primary/20 via-primary/5 to-transparent',
      ring: 'ring-primary/30',
      accent: 'text-primary',
      dot: 'bg-primary',
      line: 'border-primary/25',
    };
  }
  return {
    badge: 'bg-warning/15 text-warning border-warning/30',
    hero: 'from-warning/25 via-warning/5 to-transparent',
    ring: 'ring-warning/35',
    accent: 'text-warning',
    dot: 'bg-warning',
    line: 'border-warning/30',
  };
}

export function CredorCodigosNavigator({
  credorId,
  setores,
  onSetoresChange,
}: CredorCodigosNavigatorProps) {
  const [codigos, setCodigos] = useState<CredorCodigoUnidade[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aba, setAba] = useState<AbaId>('cadastro');
  const [form, setForm] = useState<FormState | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<SaveFeedbackState>(null);
  const [busca, setBusca] = useState('');

  const selected = useMemo(
    () => codigos.find((c) => c.id === selectedId) ?? null,
    [codigos, selectedId],
  );

  const stats = useMemo(() => {
    const web = codigos.filter((c) => c.sistema === 'WEB');
    const delphi = codigos.filter((c) => c.sistema === 'Delphi');
    const filiais = codigos.filter((c) => c.papel === 'filial').length;
    return { total: codigos.length, web: web.length, delphi: delphi.length, filiais };
  }, [codigos]);

  const grupos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const match = (c: CredorCodigoUnidade) => {
      if (!q) return true;
      return (
        c.codCliente.includes(q) ||
        (c.razaoSocial?.toLowerCase().includes(q) ?? false) ||
        (c.cnpj?.includes(q.replace(/\D/g, '')) ?? false)
      );
    };
    return {
      web: codigos.filter((c) => c.sistema === 'WEB' && match(c)),
      delphi: codigos.filter((c) => c.sistema === 'Delphi' && match(c)),
    };
  }, [codigos, busca]);

  const progress = form ? overallProgress(form) : 0;
  const theme = selected ? sistemaTheme(selected.sistema) : sistemaTheme('WEB');

  const carregar = useCallback(async () => {
    setFeedback(null);
    try {
      const data = await listCredorCodigos(credorId);
      setCodigos(data);
      setSelectedId((prev) => {
        if (prev && data.some((c) => c.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch (err) {
      setFeedback({ variant: 'error', message: toApiError(err).title });
    } finally {
      setCarregando(false);
    }
  }, [credorId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (selected) {
      setForm(toForm(selected));
      setAba('cadastro');
      setFeedback(null);
    } else {
      setForm(null);
    }
  }, [selected]);

  async function salvar() {
    if (!selected || !form) return;
    setFeedback(null);

    if (aba === 'cadastro' && onSetoresChange !== undefined) {
      if (!setores?.length) {
        setFeedback({ variant: 'error', message: 'Selecione ao menos um setor de atuação.' });
        return;
      }
    }

    setSalvando(true);
    try {
      const updated = await updateCredorCodigo(credorId, selected.id, {
        razaoSocial: form.razaoSocial.trim(),
        nomeFantasia: form.nomeFantasia.trim(),
        cnpj: stripCnpj(form.cnpj),
        telefone: stripDigits(form.telefone),
        emailComercial: form.emailComercial.trim(),
        cep: stripDigits(form.cep),
        cidade: form.cidade.trim(),
        estado: form.estado,
        bairro: form.bairro.trim(),
        endereco: form.endereco.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        comercialPrincipal: form.comercialPrincipal.trim(),
        preposto: form.preposto.trim(),
      });
      if (aba === 'cadastro' && onSetoresChange !== undefined && setores) {
        await updateCredor(credorId, { setores });
      }
      setCodigos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setFeedback({ variant: 'success', message: 'Código salvo com sucesso!' });
    } catch (err) {
      setFeedback({
        variant: 'error',
        message: toApiError(err).title,
      });
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <NavigatorSkeleton />;
  }

  if (!codigos.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
        <Layers className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium text-foreground">Nenhum código vinculado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Provisione pelo legado ou cadastre códigos manualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* Stats strip */}
      <div className="relative border-b border-border bg-gradient-to-r from-primary-deep/90 via-primary to-primary-deep/80 px-5 py-4 text-primary-foreground sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-[0.07]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold tracking-tight">Mapa do grupo</p>
              <p className="text-xs text-primary-foreground/75">
                {stats.total} unidade{stats.total !== 1 ? 's' : ''} · {stats.filiais} filial
                {stats.filiais !== 1 ? 'is' : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatChip label="WEB" value={stats.web} tone="light" />
            <StatChip label="Delphi" value={stats.delphi} tone="gold" />
            <StatChip label="Total" value={stats.total} tone="ghost" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="border-b border-border bg-muted/15 lg:border-b-0 lg:border-r">
          {codigos.length > 4 && (
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar código, CNPJ…"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-[520px] space-y-5 overflow-y-auto p-3">
            <GrupoNav
              sistema="WEB"
              itens={grupos.web}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <GrupoNav
              sistema="Delphi"
              itens={grupos.delphi}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            {busca && !grupos.web.length && !grupos.delphi.length && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                Nenhum código encontrado.
              </p>
            )}
          </div>
        </aside>

        {/* Detail panel */}
        <div className="flex min-h-[480px] flex-col">
          {selected && form ? (
            <>
              {/* Hero */}
              <div
                className={`relative overflow-hidden border-b border-border bg-gradient-to-br px-5 py-5 sm:px-6 ${theme.hero}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}
                      >
                        {selected.sistema}
                      </span>
                      {selected.papel === 'matriz' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                          <Crown className="h-3 w-3 text-accent" />
                          Principal
                        </span>
                      )}
                      {selected.papel === 'filial' && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          Filial
                        </span>
                      )}
                    </div>

                    <p className="mt-3 font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                      {selected.codCliente}
                    </p>

                    <p className="mt-1 truncate text-sm font-medium text-foreground/90">
                      {form.razaoSocial || 'Sem razão social'}
                    </p>

                    {form.cnpj && (
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        {form.cnpj}
                      </p>
                    )}
                  </div>

                  <ProgressRing value={progress} className={theme.accent} />
                </div>
              </div>

              {/* Pill tabs */}
              <div className="border-b border-border bg-muted/20 px-4 py-3 sm:px-5">
                <div className="inline-flex w-full max-w-xl flex-wrap rounded-xl bg-muted/60 p-1">
                  {ABAS.map(({ id, label, icon: Icon }) => {
                    const active = aba === id;
                    const status = tabStatus(form, id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setAba(id)}
                        className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:text-sm ${
                          active
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{label}</span>
                        <TabStatusDot status={status} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form body */}
              <div
                key={`${selected.id}-${aba}`}
                className="flex-1 animate-fade-in px-4 py-5 sm:px-6"
              >
                {aba === 'cadastro' && (
                  <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                    <FormField label="Razão social" required className="sm:col-span-2">
                      <FormInput
                        value={form.razaoSocial}
                        onChange={(v) => setForm({ ...form, razaoSocial: v })}
                      />
                    </FormField>
                    <FormField label="Nome fantasia" className="sm:col-span-2">
                      <FormInput
                        value={form.nomeFantasia}
                        onChange={(v) => setForm({ ...form, nomeFantasia: v })}
                      />
                    </FormField>
                    <FormField label="CNPJ deste código" required className="sm:col-span-2">
                      <FormInput
                        value={form.cnpj}
                        onChange={(v) => setForm({ ...form, cnpj: maskCnpjInput(v) })}
                        inputMode="numeric"
                      />
                    </FormField>
                    {onSetoresChange && (
                      <FormField
                        label="Setor de atuação"
                        required
                        className="sm:col-span-2"
                        hint="Setor do credor no portal — vale para todo o grupo."
                      >
                        <SetoresSelect value={setores ?? []} onChange={onSetoresChange} />
                      </FormField>
                    )}
                  </div>
                )}

                {aba === 'contato' && (
                  <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                    <FormField label="Telefone">
                      <FormInput
                        value={form.telefone}
                        onChange={(v) => setForm({ ...form, telefone: maskPhoneInput(v) })}
                        inputMode="numeric"
                        placeholder="(00) 00000-0000"
                      />
                    </FormField>
                    <FormField label="E-mail comercial">
                      <FormInput
                        type="email"
                        value={form.emailComercial}
                        onChange={(v) => setForm({ ...form, emailComercial: v })}
                        placeholder="contato@empresa.com.br"
                      />
                    </FormField>
                  </div>
                )}

                {aba === 'endereco' && (
                  <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
                    <FormField label="CEP">
                      <FormInput
                        value={form.cep}
                        onChange={(v) => setForm({ ...form, cep: maskCepInput(v) })}
                        inputMode="numeric"
                        placeholder="00000-000"
                      />
                    </FormField>
                    <FormField label="Cidade" className="lg:col-span-2">
                      <FormInput
                        value={form.cidade}
                        onChange={(v) => setForm({ ...form, cidade: v })}
                      />
                    </FormField>
                    <FormField label="UF">
                      <FormSelect
                        value={form.estado}
                        onChange={(v) => setForm({ ...form, estado: v })}
                      >
                        <option value="">UF</option>
                        {UFS_BR.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </FormSelect>
                    </FormField>
                    <FormField label="Bairro" className="sm:col-span-2">
                      <FormInput
                        value={form.bairro}
                        onChange={(v) => setForm({ ...form, bairro: v })}
                      />
                    </FormField>
                    <FormField label="Endereço" className="sm:col-span-2">
                      <FormInput
                        value={form.endereco}
                        onChange={(v) => setForm({ ...form, endereco: v })}
                      />
                    </FormField>
                    <FormField label="Número">
                      <FormInput
                        value={form.numero}
                        onChange={(v) => setForm({ ...form, numero: v })}
                      />
                    </FormField>
                    <FormField label="Complemento" className="sm:col-span-2 lg:col-span-3">
                      <FormInput
                        value={form.complemento}
                        onChange={(v) => setForm({ ...form, complemento: v })}
                        placeholder="Sala, andar, bloco…"
                      />
                    </FormField>
                  </div>
                )}

                {aba === 'comercial' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Dados comerciais deste código no{' '}
                      <span className="font-medium text-foreground">{selected.sistema}</span>.
                      {selected.papel === 'matriz' && (
                        <span>
                          {' '}
                          Ao salvar a matriz, os prepostos do credor são atualizados
                          automaticamente.
                        </span>
                      )}
                    </p>
                    <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                      <FormField
                        label="Comercial responsável"
                        hint="Usuário comercial vinculado a este código no legado."
                        className="sm:col-span-2"
                      >
                        <FormInput
                          value={form.comercialPrincipal}
                          onChange={(v) => setForm({ ...form, comercialPrincipal: v })}
                          placeholder="Nome do comercial ABE"
                        />
                      </FormField>
                      <FormField
                        label="Preposto"
                        hint={`Preposto cadastrado no ABE ${selected.sistema}.`}
                        className="sm:col-span-2"
                      >
                        <FormInput
                          value={form.preposto}
                          onChange={(v) => setForm({ ...form, preposto: v })}
                          placeholder="Nome do preposto"
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto border-t border-border bg-muted/10 px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {feedback ? (
                      <SaveFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
                    ) : (
                      <p className="hidden text-xs text-muted-foreground sm:block">
                        <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
                        Alterações valem só para este código
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={salvar}
                    disabled={salvando}
                    className="inline-flex h-10 shrink-0 items-center gap-2 self-end rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 sm:self-auto"
                  >
                    {salvando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar este código
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Layers className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Selecione um código</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Escolha uma unidade na árvore à esquerda para editar cadastro, contato e endereço.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'light' | 'gold' | 'ghost';
}) {
  const cls =
    tone === 'gold'
      ? 'bg-accent/25 text-primary-foreground border-white/20'
      : tone === 'ghost'
        ? 'bg-white/10 text-primary-foreground border-white/15'
        : 'bg-white/20 text-primary-foreground border-white/25';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${cls}`}
    >
      <span className="opacity-80">{label}</span>
      <span className="font-display text-base font-bold tabular-nums">{value}</span>
    </span>
  );
}

function ProgressRing({ value, className }: { value: number; className?: string }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="72" height="72" viewBox="0 0 72 72" aria-hidden>
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-border/60"
        />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={`transition-all duration-500 ease-spring ${className ?? 'text-primary'}`}
        />
      </svg>
      <span className={`absolute text-sm font-bold tabular-nums ${className ?? 'text-primary'}`}>
        {value}%
      </span>
    </div>
  );
}

function TabStatusDot({ status }: { status: TabStatus }) {
  if (status === 'complete') {
    return <CheckCircle2 className="h-3 w-3 shrink-0 text-success" aria-label="Completo" />;
  }
  if (status === 'partial') {
    return (
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-warning"
        aria-label="Parcialmente preenchido"
      />
    );
  }
  return <Circle className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" aria-label="Vazio" />;
}

function GrupoNav({
  sistema,
  itens,
  selectedId,
  onSelect,
}: {
  sistema: 'WEB' | 'Delphi';
  itens: CredorCodigoUnidade[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const theme = sistemaTheme(sistema);
  const matriz = itens.find((i) => i.papel === 'matriz');
  const filiais = itens.filter((i) => i.papel === 'filial');

  if (!itens.length) {
    return (
      <div>
        <SistemaHeader sistema={sistema} count={0} theme={theme} />
        <p className="px-2 py-2 text-xs text-muted-foreground">Sem vínculo</p>
      </div>
    );
  }

  return (
    <div>
      <SistemaHeader sistema={sistema} count={itens.length} theme={theme} />

      <ul className="mt-2 space-y-0.5">
        {matriz && (
          <CodigoTreeItem
            item={matriz}
            active={matriz.id === selectedId}
            isMatriz
            onSelect={onSelect}
            theme={theme}
          />
        )}

        {filiais.map((item) => (
          <CodigoTreeItem
            key={item.id}
            item={item}
            active={item.id === selectedId}
            isFilial
            onSelect={onSelect}
            theme={theme}
          />
        ))}

        {!matriz &&
          itens.map((item) => (
            <CodigoTreeItem
              key={item.id}
              item={item}
              active={item.id === selectedId}
              onSelect={onSelect}
              theme={theme}
            />
          ))}
      </ul>
    </div>
  );
}

function SistemaHeader({
  sistema,
  count,
  theme,
}: {
  sistema: string;
  count: number;
  theme: ReturnType<typeof sistemaTheme>;
}) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.accent}`}>
        ABE {sistema}
      </span>
      {count > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${theme.badge}`}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function CodigoTreeItem({
  item,
  active,
  isMatriz,
  isFilial,
  onSelect,
  theme,
}: {
  item: CredorCodigoUnidade;
  active: boolean;
  isMatriz?: boolean;
  isFilial?: boolean;
  isLast?: boolean;
  onSelect: (id: string) => void;
  theme: ReturnType<typeof sistemaTheme>;
}) {
  return (
    <li className={isFilial ? `ml-2 border-l-2 pl-1.5 ${theme.line}` : ''}>
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className={`mb-1.5 flex w-full flex-col rounded-lg border px-3 py-2 text-left transition-all ${
          active
            ? `${theme.ring} border-current/20 bg-card shadow-sm ring-1`
            : 'border-border/60 bg-background/50 hover:border-border hover:bg-card/80'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            {isMatriz && (
              <Crown
                className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-accent' : 'text-accent/60'}`}
              />
            )}
            <span
              className={`truncate font-mono text-[13px] tabular-nums leading-none ${
                active
                  ? 'font-bold text-foreground'
                  : 'font-medium text-muted-foreground group-hover:text-foreground'
              }`}
            >
              {item.codCliente}
            </span>
          </span>
          {isMatriz && (
            <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
              ★
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

function NavigatorSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="h-[76px] animate-pulse bg-primary/20" />
      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-3 border-r border-border p-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="space-y-4 p-6">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
