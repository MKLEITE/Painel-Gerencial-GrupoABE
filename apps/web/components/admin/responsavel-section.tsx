'use client';

import { Copy, KeyRound, Loader2, ShieldCheck, User, UserPlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { FormField } from '@/components/admin/form-field';
import { updateResponsavelCredor } from '@/lib/admin-api';
import { maskPhoneInput } from '@/lib/admin-labels';
import { toApiError } from '@/lib/api-client';
import { generateClientPassword } from '@/lib/generate-password-client';

const MAX_FOTO_BYTES = 1024 * 1024;

export interface ResponsavelValues {
  nome: string;
  email: string;
  confirmarEmail: string;
  telefone: string;
  senha: string;
  fotoUrl: string | null;
}

interface ResponsavelSectionProps {
  mode: 'create' | 'edit';
  credorId?: string;
  hasResponsavel?: boolean;
  values: ResponsavelValues;
  onChange: (patch: Partial<ResponsavelValues>) => void;
  onCredenciaisGeradas?: (credenciais: { email: string; senha: string }) => void;
}

export function ResponsavelSection({
  mode,
  credorId,
  hasResponsavel = mode === 'create',
  values,
  onChange,
  onCredenciaisGeradas,
}: ResponsavelSectionProps) {
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const [copiado, setCopiado] = useState(false);
  const [aplicandoSenha, setAplicandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [senhaManual, setSenhaManual] = useState('');
  const [confirmarSenhaManual, setConfirmarSenhaManual] = useState('');
  const [modoSenhaManual, setModoSenhaManual] = useState(false);

  const isNovoLogin = mode === 'create' || (mode === 'edit' && !hasResponsavel);

  function gerarSenhaInicial() {
    onChange({ senha: generateClientPassword() });
    setErroSenha(null);
  }

  async function copiarTexto(texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function aplicarNovaSenha(senha: string) {
    if (!credorId) return;
    if (senha.length < 8) {
      setErroSenha('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setErroSenha(null);
    setAplicandoSenha(true);
    try {
      const result = await updateResponsavelCredor(credorId, { senha });
      const email = values.email.trim();
      onCredenciaisGeradas?.({ email, senha: result.senha ?? senha });
      setSenhaManual('');
      setConfirmarSenhaManual('');
      setModoSenhaManual(false);
    } catch (err) {
      setErroSenha(toApiError(err).title);
    } finally {
      setAplicandoSenha(false);
    }
  }

  async function gerarEaplicarSenha() {
    await aplicarNovaSenha(generateClientPassword());
  }

  async function aplicarSenhaManual() {
    if (senhaManual !== confirmarSenhaManual) {
      setErroSenha('As senhas não conferem.');
      return;
    }
    await aplicarNovaSenha(senhaManual);
  }

  function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    setErroFoto(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErroFoto('Selecione um arquivo de imagem (JPG, PNG, etc.).');
      return;
    }
    if (file.size > MAX_FOTO_BYTES) {
      setErroFoto('A imagem deve ter no máximo 1 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange({ fotoUrl: reader.result as string });
    reader.onerror = () => setErroFoto('Não foi possível ler a imagem.');
    reader.readAsDataURL(file);
  }

  return (
    <section className="space-y-6">
      {isNovoLogin ? (
        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          <UserPlus className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium">
              {mode === 'create' ? 'Criar login do responsável' : 'Configurar primeiro acesso'}
            </p>
            <p className="mt-1 text-muted-foreground">
              {mode === 'create'
                ? 'Após cadastrar, copie e-mail e senha e repasse ao responsável.'
                : 'Este credor ainda não tem login. Preencha os dados abaixo e salve para criar o acesso.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-medium">Login ativo</p>
            <p className="mt-1 text-muted-foreground">
              E-mail de acesso: <span className="font-medium text-foreground">{values.email}</span>
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted/40">
            {values.fotoUrl ? (
              <>
                <img
                  src={values.fotoUrl}
                  alt="Foto do responsável"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onChange({ fotoUrl: null })}
                  className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground"
                  title="Remover foto"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <User className="h-14 w-14 text-muted-foreground/60" strokeWidth={1.25} />
            )}
          </div>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={selecionarFoto}
          />
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Selecionar foto de perfil
          </button>
          {erroFoto && <p className="text-center text-[11px] text-danger">{erroFoto}</p>}
        </div>

        <div className="space-y-5">
          <UnderlineField label="Nome completo" required>
            <input
              type="text"
              value={values.nome}
              onChange={(e) => onChange({ nome: e.target.value })}
              required={isNovoLogin}
              className={underlineInputClass}
              placeholder="Nome do responsável"
            />
          </UnderlineField>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <UnderlineField label="E-mail de login" required>
          <input
            type="email"
            value={values.email}
            onChange={(e) => onChange({ email: e.target.value })}
            required
            className={underlineInputClass}
            placeholder="login@empresa.com.br"
          />
        </UnderlineField>

        <UnderlineField label="Confirmar e-mail" required>
          <input
            type="email"
            value={values.confirmarEmail}
            onChange={(e) => onChange({ confirmarEmail: e.target.value })}
            required
            className={underlineInputClass}
            placeholder="Confirme o e-mail"
          />
        </UnderlineField>

        <UnderlineField label="Telefone">
          <input
            type="text"
            value={values.telefone}
            onChange={(e) => onChange({ telefone: maskPhoneInput(e.target.value) })}
            className={underlineInputClass}
            placeholder="(00) 00000-0000"
          />
        </UnderlineField>
      </div>

      {isNovoLogin ? (
        <SenhaInicialCard
          senha={values.senha}
          onGerar={gerarSenhaInicial}
          onCopiar={() =>
            copiarTexto(`Login: ${values.email || '(e-mail acima)'}\nSenha: ${values.senha}`)
          }
          copiado={copiado}
          descricao={
            mode === 'create'
              ? 'Esta senha será criada junto com o credor. Guarde-a — você poderá copiá-la na tela seguinte.'
              : 'Esta senha será usada no primeiro acesso. Ao salvar, copie e repasse ao responsável.'
          }
        />
      ) : (
        <RedefinirSenhaCard
          aplicando={aplicandoSenha}
          erro={erroSenha}
          modoManual={modoSenhaManual}
          senhaManual={senhaManual}
          confirmarSenhaManual={confirmarSenhaManual}
          onToggleManual={() => {
            setModoSenhaManual((v) => !v);
            setErroSenha(null);
          }}
          onSenhaManualChange={setSenhaManual}
          onConfirmarSenhaManualChange={setConfirmarSenhaManual}
          onGerarEaplicar={gerarEaplicarSenha}
          onAplicarManual={aplicarSenhaManual}
        />
      )}
    </section>
  );
}

function SenhaInicialCard({
  senha,
  onGerar,
  onCopiar,
  copiado,
  descricao,
}: {
  senha: string;
  onGerar: () => void;
  onCopiar: () => void;
  copiado: boolean;
  descricao: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Senha inicial</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{descricao}</p>

      <div className="rounded-lg border border-border bg-background px-4 py-3 font-mono text-base font-semibold tracking-wide text-foreground">
        {senha || '—'}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onGerar}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          Gerar outra senha
        </button>
        <button
          type="button"
          onClick={onCopiar}
          disabled={!senha}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40"
        >
          <Copy className="h-4 w-4" />
          {copiado ? 'Copiado!' : 'Copiar login e senha'}
        </button>
      </div>
    </div>
  );
}

function RedefinirSenhaCard({
  aplicando,
  erro,
  modoManual,
  senhaManual,
  confirmarSenhaManual,
  onToggleManual,
  onSenhaManualChange,
  onConfirmarSenhaManualChange,
  onGerarEaplicar,
  onAplicarManual,
}: {
  aplicando: boolean;
  erro: string | null;
  modoManual: boolean;
  senhaManual: string;
  confirmarSenhaManual: string;
  onToggleManual: () => void;
  onSenhaManualChange: (v: string) => void;
  onConfirmarSenhaManualChange: (v: string) => void;
  onGerarEaplicar: () => void;
  onAplicarManual: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-5">
      <div className="mb-2 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Redefinir senha</h3>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Por segurança, a senha atual não pode ser exibida. Gere uma nova senha e aplique
        imediatamente — ela será mostrada para você copiar.
      </p>

      <button
        type="button"
        onClick={onGerarEaplicar}
        disabled={aplicando}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-70 sm:w-auto"
      >
        {aplicando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        Gerar e aplicar nova senha
      </button>

      <div className="mt-4 border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={onToggleManual}
          className="text-sm font-medium text-primary hover:underline"
        >
          {modoManual ? 'Ocultar senha manual' : 'Prefiro definir a senha manualmente'}
        </button>

        {modoManual && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Nova senha" hint="Mínimo 8 caracteres">
              <input
                type="text"
                value={senhaManual}
                onChange={(e) => onSenhaManualChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                placeholder="Digite a nova senha"
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Confirmar senha">
              <input
                type="text"
                value={confirmarSenhaManual}
                onChange={(e) => onConfirmarSenhaManualChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </FormField>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={onAplicarManual}
                disabled={aplicando || !senhaManual}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium hover:bg-muted disabled:opacity-40"
              >
                {aplicando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aplicar senha manual
              </button>
            </div>
          </div>
        )}
      </div>

      {erro && <p className="mt-3 text-xs text-danger">{erro}</p>}
    </div>
  );
}

const underlineInputClass =
  'w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary';

function UnderlineField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
    </div>
  );
}
