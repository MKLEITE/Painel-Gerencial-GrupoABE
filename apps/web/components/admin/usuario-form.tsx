'use client';

import { useState, type FormEvent } from 'react';
import { FormActions, FormField, FormInput, FormSection, FormSelect } from '@/components/admin/form-field';
import { PLATFORM_PAPEIS } from '@/lib/admin-constants';

export interface UsuarioFormValues {
  nome: string;
  email: string;
  senha: string;
  papel: string;
  ativo?: boolean;
}

interface UsuarioFormProps {
  initial?: UsuarioFormValues;
  submitLabel: string;
  senhaObrigatoria?: boolean;
  onSubmit: (values: UsuarioFormValues) => Promise<void>;
  onCancel: () => void;
}

export function UsuarioForm({
  initial,
  submitLabel,
  senhaObrigatoria = true,
  onSubmit,
  onCancel,
}: UsuarioFormProps) {
  const [form, setForm] = useState<UsuarioFormValues>(
    initial ?? {
      nome: '',
      email: '',
      senha: '',
      papel: 'SUPER_ADMIN',
      ativo: true,
    },
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!form.nome.trim() || !form.email.trim()) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }
    if (senhaObrigatoria && form.senha.length < 8) {
      setErro('Senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (!senhaObrigatoria && form.senha && form.senha.length < 8) {
      setErro('Nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setSalvando(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar usuário.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <FormSection
        title="Administrador da plataforma"
        description="Usuários internos do Grupo ABE. Credores acessam o painel via cadastro de credor."
        footer={<FormActions onCancel={onCancel} submitLabel={submitLabel} salvando={salvando} />}
      >
        {erro && (
          <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {erro}
          </p>
        )}

        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <FormField label="Nome completo" required>
            <FormInput
              value={form.nome}
              onChange={(v) => setForm({ ...form, nome: v })}
              placeholder="Nome do administrador"
              required
            />
          </FormField>

          <FormField label="E-mail" required>
            <FormInput
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              placeholder="admin@abe.com.br"
              required
              disabled={!!initial}
            />
          </FormField>

          <FormField
            label={senhaObrigatoria ? 'Senha' : 'Nova senha (opcional)'}
            required={senhaObrigatoria}
            hint={
              senhaObrigatoria
                ? 'Mínimo de 8 caracteres.'
                : 'Preencha apenas se quiser alterar a senha.'
            }
          >
            <FormInput
              type="password"
              value={form.senha}
              onChange={(v) => setForm({ ...form, senha: v })}
              placeholder={senhaObrigatoria ? 'Mínimo 8 caracteres' : 'Deixe em branco para manter'}
              required={senhaObrigatoria}
            />
          </FormField>

          <FormField label="Permissão" required hint="Nível de acesso na administração.">
            <FormSelect value={form.papel} onChange={(v) => setForm({ ...form, papel: v })}>
              {PLATFORM_PAPEIS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {initial && (
            <div className="mt-3 sm:col-span-2">
              <label className="flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <input
                  id="ativo"
                  type="checkbox"
                  checked={form.ativo ?? true}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm font-medium text-foreground">Usuário ativo</span>
              </label>
            </div>
          )}
        </div>
      </FormSection>
    </form>
  );
}
