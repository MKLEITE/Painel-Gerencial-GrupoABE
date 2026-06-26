'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CredenciaisModal } from '@/components/admin/credenciais-modal';
import { CredorForm, type CredorFormValues } from '@/components/admin/credor-form';
import {
  createResponsavelCredor,
  getCredor,
  updateCredor,
  updateResponsavelCredor,
} from '@/lib/admin-api';
import { maskPhoneInput } from '@/lib/admin-labels';
import { toApiError } from '@/lib/api-client';
import { generateClientPassword } from '@/lib/generate-password-client';

export default function EditarCredorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [carregando, setCarregando] = useState(true);
  const [initial, setInitial] = useState<Partial<CredorFormValues> | null>(null);
  const [hasResponsavel, setHasResponsavel] = useState(false);
  const [credenciais, setCredenciais] = useState<{ email: string; senha: string } | null>(null);
  const [credenciaisTipo, setCredenciaisTipo] = useState<'criar' | 'redefinir'>('criar');

  const carregarCredor = useCallback(async () => {
    const c = await getCredor(params.id);
    const comResponsavel = Boolean(c.responsavel);
    setHasResponsavel(comResponsavel);
    setInitial({
      setores: c.setores,
      paginasAcesso: c.paginasAcesso.length ? c.paginasAcesso : ['dashboard'],
      responsavel: {
        nome: c.responsavel?.nome ?? '',
        email: c.responsavel?.email ?? '',
        confirmarEmail: c.responsavel?.email ?? '',
        telefone: c.responsavel?.telefone ? maskPhoneInput(c.responsavel.telefone) : '',
        senha: comResponsavel ? '' : generateClientPassword(),
        fotoUrl: c.responsavel?.fotoUrl ?? null,
      },
    });
  }, [params.id]);

  useEffect(() => {
    carregarCredor()
      .catch(() => router.replace('/admin/credores'))
      .finally(() => setCarregando(false));
  }, [carregarCredor, router]);

  if (carregando || !initial) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <CredorForm
        mode="edit"
        credorId={params.id}
        hasResponsavel={hasResponsavel}
        initial={initial}
        submitLabel="Salvar responsável"
        onCancel={() => router.push('/admin/credores')}
        onCredenciaisGeradas={(c) => {
          setCredenciaisTipo(hasResponsavel ? 'redefinir' : 'criar');
          setCredenciais(c);
          setHasResponsavel(true);
        }}
        onCreateResponsavel={async (data) => createResponsavelCredor(params.id, data)}
        onUpdateResponsavel={async (data) => {
          await updateResponsavelCredor(params.id, data);
        }}
        onSubmit={async (payload) => {
          try {
            await updateCredor(params.id, payload);
          } catch (err) {
            throw new Error(toApiError(err).title);
          }
        }}
      />

      {credenciais && (
        <CredenciaisModal
          title={credenciaisTipo === 'criar' ? 'Login criado com sucesso' : 'Senha redefinida'}
          description="Copie e repasse ao responsável. Esta senha não será exibida novamente nesta tela."
          email={credenciais.email}
          senha={credenciais.senha}
          onClose={() => {
            setCredenciais(null);
            router.push('/admin/credores');
          }}
        />
      )}
    </>
  );
}
