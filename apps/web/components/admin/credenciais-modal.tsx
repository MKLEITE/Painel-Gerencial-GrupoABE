'use client';

import { Copy, X } from 'lucide-react';
import { useState } from 'react';

interface CredenciaisModalProps {
  email: string;
  senha: string;
  onClose: () => void;
}

export function CredenciaisModal({ email, senha, onClose }: CredenciaisModalProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(`E-mail: ${email}\nSenha: ${senha}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Credor cadastrado
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Repasse as credenciais ao responsável. O envio por e-mail será habilitado futuramente.
            </p>
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

        <dl className="space-y-3 rounded-xl bg-muted/40 p-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Login (e-mail)
            </dt>
            <dd className="mt-1 font-medium text-foreground">{email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Senha
            </dt>
            <dd className="mt-1 font-mono font-semibold text-foreground">{senha}</dd>
          </div>
        </dl>

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
