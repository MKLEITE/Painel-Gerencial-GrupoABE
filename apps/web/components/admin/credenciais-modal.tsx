'use client';

import { Copy, X } from 'lucide-react';
import { useState } from 'react';

interface CredenciaisModalProps {
  email: string;
  senha: string;
  title?: string;
  description?: string;
  onClose: () => void;
}

export function CredenciaisModal({
  email,
  senha,
  title = 'Credenciais de acesso',
  description = 'Copie e repasse ao responsável. Por segurança, a senha não será exibida novamente nesta tela.',
  onClose,
}: CredenciaisModalProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(
      `Painel Grupo ABE — credenciais de acesso\n\nLogin (e-mail): ${email}\nSenha: ${senha}`,
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Login (e-mail)
            </dt>
            <dd className="mt-1 break-all font-medium text-foreground">{email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Senha
            </dt>
            <dd className="mt-1 font-mono text-base font-semibold tracking-wide text-foreground">
              {senha}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-muted-foreground">
          O responsável usa o e-mail acima em{' '}
          <span className="font-medium text-foreground">/login</span> para entrar no painel.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={copiar}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Copy className="h-4 w-4" />
            {copiado ? 'Copiado!' : 'Copiar credenciais'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
