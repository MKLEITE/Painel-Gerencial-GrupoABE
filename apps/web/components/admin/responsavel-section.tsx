'use client';

import { Copy, Loader2, RefreshCw, User, X } from 'lucide-react';
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
  values: ResponsavelValues;
  onChange: (patch: Partial<ResponsavelValues>) => void;
}

export function ResponsavelSection({ mode, credorId, values, onChange }: ResponsavelSectionProps) {
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const [copiado, setCopiado] = useState(false);
  const [redefinindo, setRedefinindo] = useState(false);
  const [msgSenha, setMsgSenha] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);

  function regenerarSenha() {
    onChange({ senha: generateClientPassword() });
    setMsgSenha(null);
  }

  async function copiarSenha(texto?: string) {
    await navigator.clipboard.writeText(texto ?? values.senha);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function redefinirSenhaNoServidor() {
    if (!credorId) return;
    setErroSenha(null);
    setMsgSenha(null);
    setRedefinindo(true);
    const novaSenha = generateClientPassword();
    try {
      const result = await updateResponsavelCredor(credorId, { senha: novaSenha });
      onChange({ senha: result.senha ?? novaSenha });
      setMsgSenha('Senha redefinida com sucesso. Copie e repasse ao responsável.');
    } catch (err) {
      setErroSenha(toApiError(err).title);
    } finally {
      setRedefinindo(false);
    }
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
    reader.onload = () => {
      onChange({ fotoUrl: reader.result as string });
    };
    reader.onerror = () => setErroFoto('Não foi possível ler a imagem.');
    reader.readAsDataURL(file);
  }

  function removerFoto() {
    setErroFoto(null);
    onChange({ fotoUrl: null });
  }

  const senhaExibida = mode === 'edit' && !values.senha ? '••••••••••••' : values.senha;

  return (
    <section className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted/40">
            {values.fotoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={values.fotoUrl} alt="Foto do responsável" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={removerFoto}
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
          <p className="text-center text-[11px] text-muted-foreground">(máx. 1 MB, formato imagem)</p>
          {erroFoto && <p className="text-center text-[11px] text-danger">{erroFoto}</p>}
        </div>

        <div className="space-y-5">
          <UnderlineField label="Nome completo" required>
            <input
              type="text"
              value={values.nome}
              onChange={(e) => onChange({ nome: e.target.value })}
              required={mode === 'create'}
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

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
        {mode === 'create'
          ? 'Este e-mail será usado para login no painel do credor. Envio automático de senha será habilitado futuramente — por ora, copie a senha gerada abaixo.'
          : 'Altere o e-mail de login se o responsável mudou. A confirmação evita erros de digitação. Redefina a senha abaixo quando necessário.'}
      </div>

      <div className="max-w-xl">
        <FormField
          label={mode === 'create' ? 'Senha de acesso (gerada)' : 'Senha de acesso'}
          hint={
            mode === 'create'
              ? 'Clique em regenerar se quiser outra senha antes de cadastrar.'
              : 'Gere uma nova senha e clique em "Redefinir senha" para aplicar no login.'
          }
        >
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              readOnly
              value={senhaExibida}
              className="h-11 min-w-[200px] flex-1 rounded-xl border border-input bg-muted/40 px-3 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={regenerarSenha}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Gerar nova senha"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => copiarSenha()}
              disabled={mode === 'edit' && !values.senha}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              title="Copiar senha"
            >
              <Copy className="h-4 w-4" />
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={redefinirSenhaNoServidor}
                disabled={redefinindo}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-70"
              >
                {redefinindo && <Loader2 className="h-4 w-4 animate-spin" />}
                Redefinir senha
              </button>
            )}
          </div>
        </FormField>
        {copiado && <p className="mt-1 text-xs text-success">Senha copiada!</p>}
        {msgSenha && <p className="mt-1 text-xs text-success">{msgSenha}</p>}
        {erroSenha && <p className="mt-1 text-xs text-danger">{erroSenha}</p>}
      </div>
    </section>
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
