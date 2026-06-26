'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  FormActions,
  FormField,
  FormInput,
  FormSection,
  FormSelect,
  type SaveFeedbackState,
} from '@/components/admin/form-field';
import { CredorCodigosNavigator } from '@/components/admin/credor-codigos-navigator';
import { ResponsavelSection, type ResponsavelValues } from '@/components/admin/responsavel-section';
import { SetoresSelect } from '@/components/admin/setores-select';
import { PAGINAS_ACESSO, UFS_BR } from '@/lib/admin-constants';
import {
  maskCepInput,
  maskCnpjInput,
  maskPhoneInput,
  stripCnpj,
  stripDigits,
} from '@/lib/admin-labels';
import { generateClientPassword } from '@/lib/generate-password-client';
import type { CreateCredorPayload } from '@/lib/admin-api';

export interface CredorFormValues {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  telefone: string;
  emailComercial: string;
  setores: string[];
  cep: string;
  cidade: string;
  estado: string;
  bairro: string;
  endereco: string;
  numero: string;
  complemento: string;
  paginasAcesso: string[];
  responsavel: ResponsavelValues;
}

interface CredorFormProps {
  mode: 'create' | 'edit';
  credorId?: string;
  hasResponsavel?: boolean;
  initial?: Partial<CredorFormValues>;
  submitLabel: string;
  onSubmit: (
    payload: CreateCredorPayload | Partial<Omit<CreateCredorPayload, 'responsavel'>>,
  ) => Promise<void>;
  onCreateResponsavel?: (data: {
    nome: string;
    email: string;
    confirmarEmail: string;
    telefone?: string;
    senha?: string;
    fotoUrl?: string | null;
  }) => Promise<{ credenciais: { email: string; senha: string } }>;
  onUpdateResponsavel?: (data: {
    nome: string;
    email: string;
    confirmarEmail: string;
    telefone?: string;
    fotoUrl?: string | null;
  }) => Promise<void>;
  onCredenciaisGeradas?: (credenciais: { email: string; senha: string }) => void;
  onCancel: () => void;
}

function emptyForm(): CredorFormValues {
  return {
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    telefone: '',
    emailComercial: '',
    setores: [],
    cep: '',
    cidade: '',
    estado: '',
    bairro: '',
    endereco: '',
    numero: '',
    complemento: '',
    paginasAcesso: ['dashboard'],
    responsavel: {
      nome: '',
      email: '',
      confirmarEmail: '',
      telefone: '',
      senha: generateClientPassword(),
      fotoUrl: null,
    },
  };
}

export function CredorForm({
  mode,
  credorId,
  hasResponsavel = mode === 'create',
  initial,
  submitLabel,
  onSubmit,
  onCreateResponsavel,
  onUpdateResponsavel,
  onCredenciaisGeradas,
  onCancel,
}: CredorFormProps) {
  const defaults = useMemo(() => ({ ...emptyForm(), ...initial }), [initial]);
  const [form, setForm] = useState<CredorFormValues>(defaults);
  const [feedbackConfig, setFeedbackConfig] = useState<SaveFeedbackState>(null);
  const [feedbackResponsavel, setFeedbackResponsavel] = useState<SaveFeedbackState>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  function setResponsavelFeedback(variant: 'success' | 'error', message: string) {
    setFeedbackResponsavel({ variant, message });
    setFeedbackConfig(null);
  }

  function setConfigFeedback(variant: 'success' | 'error', message: string) {
    setFeedbackConfig({ variant, message });
    setFeedbackResponsavel(null);
  }

  function togglePagina(id: string) {
    setForm((prev) => ({
      ...prev,
      paginasAcesso: prev.paginasAcesso.includes(id)
        ? prev.paginasAcesso.filter((p) => p !== id)
        : [...prev.paginasAcesso, id],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedbackResponsavel(null);
    setFeedbackConfig(null);

    if (mode === 'edit') {
      await handleSalvarResponsavel();
      return;
    }

    if (stripCnpj(form.cnpj).length !== 14) {
      setResponsavelFeedback('error', 'CNPJ deve conter 14 dígitos.');
      return;
    }

    if (form.setores.length === 0) {
      setResponsavelFeedback('error', 'Selecione ao menos um setor de atuação.');
      return;
    }
    if (form.paginasAcesso.length === 0) {
      setResponsavelFeedback('error', 'Selecione ao menos uma página de acesso.');
      return;
    }

    if (form.responsavel.email.toLowerCase() !== form.responsavel.confirmarEmail.toLowerCase()) {
      setResponsavelFeedback('error', 'Os e-mails do responsável não conferem.');
      return;
    }
    if (form.responsavel.senha.length < 8) {
      setResponsavelFeedback('error', 'Senha deve ter no mínimo 8 caracteres.');
      return;
    }

    const base = {
      razaoSocial: form.razaoSocial.trim(),
      nomeFantasia: form.nomeFantasia.trim() || undefined,
      cnpj: stripCnpj(form.cnpj),
      telefone: stripDigits(form.telefone),
      emailComercial: form.emailComercial.trim(),
      setores: form.setores,
      cep: stripDigits(form.cep),
      cidade: form.cidade.trim(),
      estado: form.estado,
      bairro: form.bairro.trim(),
      endereco: form.endereco.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim() || undefined,
      paginasAcesso: form.paginasAcesso,
    };

    setSalvando(true);
    try {
      await onSubmit({
        ...base,
        responsavel: {
          nome: form.responsavel.nome.trim(),
          email: form.responsavel.email.trim(),
          confirmarEmail: form.responsavel.confirmarEmail.trim(),
          telefone: stripDigits(form.responsavel.telefone) || undefined,
          senha: form.responsavel.senha,
          fotoUrl: form.responsavel.fotoUrl,
        },
      });
    } catch (err) {
      setResponsavelFeedback(
        'error',
        err instanceof Error ? err.message : 'Erro ao salvar credor.',
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarConfiguracoes() {
    setFeedbackConfig(null);
    setFeedbackResponsavel(null);

    if (form.paginasAcesso.length === 0) {
      setConfigFeedback('error', 'Selecione ao menos uma página de acesso.');
      return;
    }

    setSalvandoConfig(true);
    try {
      await onSubmit({ paginasAcesso: form.paginasAcesso });
      setConfigFeedback('success', 'Configurações salvas com sucesso!');
    } catch (err) {
      setConfigFeedback(
        'error',
        err instanceof Error ? err.message : 'Erro ao salvar configurações.',
      );
    } finally {
      setSalvandoConfig(false);
    }
  }

  async function handleSalvarResponsavel() {
    const configurandoLogin =
      !hasResponsavel &&
      (form.responsavel.nome.trim() ||
        form.responsavel.email.trim() ||
        form.responsavel.confirmarEmail.trim());

    if (configurandoLogin) {
      if (!form.responsavel.nome.trim()) {
        setResponsavelFeedback('error', 'Informe o nome do responsável para criar o login.');
        return;
      }
      if (!form.responsavel.email.trim()) {
        setResponsavelFeedback('error', 'Informe o e-mail de login do responsável.');
        return;
      }
      if (form.responsavel.email.toLowerCase() !== form.responsavel.confirmarEmail.toLowerCase()) {
        setResponsavelFeedback('error', 'Os e-mails do responsável não conferem.');
        return;
      }
      if (form.responsavel.senha.length < 8) {
        setResponsavelFeedback('error', 'Senha inicial deve ter no mínimo 8 caracteres.');
        return;
      }
    } else if (hasResponsavel) {
      if (form.responsavel.email.toLowerCase() !== form.responsavel.confirmarEmail.toLowerCase()) {
        setResponsavelFeedback('error', 'Os e-mails do responsável não conferem.');
        return;
      }
    } else {
      setResponsavelFeedback('error', 'Preencha os dados do responsável para criar o login.');
      return;
    }

    setFeedbackResponsavel(null);
    setFeedbackConfig(null);

    setSalvando(true);
    try {
      let credenciaisEmitidas = false;

      if (configurandoLogin && onCreateResponsavel) {
        const result = await onCreateResponsavel({
          nome: form.responsavel.nome.trim(),
          email: form.responsavel.email.trim(),
          confirmarEmail: form.responsavel.confirmarEmail.trim(),
          telefone: stripDigits(form.responsavel.telefone) || undefined,
          senha: form.responsavel.senha,
          fotoUrl: form.responsavel.fotoUrl,
        });
        onCredenciaisGeradas?.(result.credenciais);
        credenciaisEmitidas = true;
      } else if (hasResponsavel && onUpdateResponsavel) {
        await onUpdateResponsavel({
          nome: form.responsavel.nome.trim(),
          email: form.responsavel.email.trim(),
          confirmarEmail: form.responsavel.confirmarEmail.trim(),
          telefone: stripDigits(form.responsavel.telefone) || undefined,
          fotoUrl: form.responsavel.fotoUrl,
        });
        setResponsavelFeedback('success', 'Dados do responsável salvos!');
      }

      if (!credenciaisEmitidas && !hasResponsavel && configurandoLogin) {
        setResponsavelFeedback('success', 'Login do responsável criado!');
      }
    } catch (err) {
      setResponsavelFeedback(
        'error',
        err instanceof Error ? err.message : 'Erro ao salvar responsável.',
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {mode === 'edit' && credorId ? (
        <FormSection
          title="Grupo de códigos"
          description="Unidades WEB e Delphi do credor — matriz, filiais e cadastro por código."
        >
          <CredorCodigosNavigator
            credorId={credorId}
            setores={form.setores}
            onSetoresChange={(setores) => setForm({ ...form, setores })}
          />
        </FormSection>
      ) : (
        <>
          <FormSection
            title="Dados da empresa"
            description="Informações cadastrais e de contato do credor."
          >
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <FormField label="CNPJ" required className="sm:col-span-2 lg:col-span-1">
                <FormInput
                  value={form.cnpj}
                  onChange={(v) => setForm({ ...form, cnpj: maskCnpjInput(v) })}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  required
                />
              </FormField>

              <FormField label="Razão social" required className="sm:col-span-2 lg:col-span-1">
                <FormInput
                  value={form.razaoSocial}
                  onChange={(v) => setForm({ ...form, razaoSocial: v })}
                  placeholder="Razão social completa"
                  required
                />
              </FormField>

              <FormField label="Nome fantasia" className="sm:col-span-2 lg:col-span-1">
                <FormInput
                  value={form.nomeFantasia}
                  onChange={(v) => setForm({ ...form, nomeFantasia: v })}
                  placeholder="Nome comercial"
                />
              </FormField>

              <FormField label="Telefone" required className="sm:col-span-2 lg:col-span-1">
                <FormInput
                  value={form.telefone}
                  onChange={(v) => setForm({ ...form, telefone: maskPhoneInput(v) })}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  required
                />
              </FormField>

              <FormField label="E-mail comercial" required className="sm:col-span-2">
                <FormInput
                  type="email"
                  value={form.emailComercial}
                  onChange={(v) => setForm({ ...form, emailComercial: v })}
                  placeholder="contato@empresa.com.br"
                  required
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Endereço" description="Localização da sede ou unidade principal.">
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="CEP" required>
                <FormInput
                  value={form.cep}
                  onChange={(v) => setForm({ ...form, cep: maskCepInput(v) })}
                  placeholder="00000-000"
                  inputMode="numeric"
                  required
                />
              </FormField>

              <FormField label="Cidade" required className="lg:col-span-2">
                <FormInput
                  value={form.cidade}
                  onChange={(v) => setForm({ ...form, cidade: v })}
                  required
                />
              </FormField>

              <FormField label="Estado" required>
                <FormSelect
                  value={form.estado}
                  onChange={(v) => setForm({ ...form, estado: v })}
                  required
                >
                  <option value="">UF</option>
                  {UFS_BR.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </FormSelect>
              </FormField>

              <FormField label="Bairro" required className="sm:col-span-2">
                <FormInput
                  value={form.bairro}
                  onChange={(v) => setForm({ ...form, bairro: v })}
                  required
                />
              </FormField>

              <FormField label="Endereço" required className="sm:col-span-2">
                <FormInput
                  value={form.endereco}
                  onChange={(v) => setForm({ ...form, endereco: v })}
                  required
                />
              </FormField>

              <FormField label="Número" required>
                <FormInput
                  value={form.numero}
                  onChange={(v) => setForm({ ...form, numero: v })}
                  required
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
          </FormSection>
        </>
      )}

      <FormSection
        title={mode === 'edit' ? 'Configurações do portal' : 'Setor e acesso'}
        description={
          mode === 'edit'
            ? 'Páginas visíveis no painel para este credor.'
            : 'Setores de atuação e páginas que o credor poderá acessar no painel.'
        }
        footer={
          mode === 'edit' ? (
            <FormActions
              submitLabel="Salvar configurações"
              salvando={salvandoConfig}
              onSave={handleSalvarConfiguracoes}
              hideCancel
              feedback={feedbackConfig}
              onFeedbackDismiss={() => setFeedbackConfig(null)}
            />
          ) : undefined
        }
      >
        {mode === 'create' && (
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <FormField
              label="Setor"
              required
              className="sm:col-span-2"
              hint="Abra a lista e marque os setores."
            >
              <SetoresSelect
                value={form.setores}
                onChange={(setores) => setForm({ ...form, setores })}
              />
            </FormField>
          </div>
        )}

        <div className={mode === 'create' ? 'mt-6' : ''}>
          <p className="mb-3 text-sm font-medium text-foreground">Páginas de acesso</p>
          <div className="flex flex-wrap gap-3">
            {PAGINAS_ACESSO.map((pagina) => {
              const ativo = form.paginasAcesso.includes(pagina.id);
              return (
                <label
                  key={pagina.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    ativo
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={() => togglePagina(pagina.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                  {pagina.label}
                </label>
              );
            })}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Responsável pela Conta"
        description={
          mode === 'edit'
            ? hasResponsavel
              ? 'Dados de login do painel. O botão abaixo salva apenas esta seção.'
              : 'Preencha para criar o primeiro login. O botão abaixo salva apenas esta seção.'
            : hasResponsavel
              ? 'Dados de login do painel. A senha é redefinida na seção abaixo, separada do botão Salvar.'
              : 'Opcional: preencha para criar o primeiro login ao salvar. Deixe em branco para salvar só os dados da empresa.'
        }
        footer={
          <FormActions
            onCancel={onCancel}
            submitLabel={mode === 'edit' ? 'Salvar responsável' : submitLabel}
            salvando={salvando}
            feedback={feedbackResponsavel}
            onFeedbackDismiss={() => setFeedbackResponsavel(null)}
          />
        }
      >
        <ResponsavelSection
          mode={mode}
          credorId={credorId}
          hasResponsavel={hasResponsavel}
          values={form.responsavel}
          onChange={(patch) => setForm({ ...form, responsavel: { ...form.responsavel, ...patch } })}
          onCredenciaisGeradas={onCredenciaisGeradas}
        />
      </FormSection>
    </form>
  );
}
