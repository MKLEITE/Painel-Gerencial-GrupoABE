'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CredorForm, type CredorFormValues } from '@/components/admin/credor-form';
import { getCredor, updateCredor, updateResponsavelCredor } from '@/lib/admin-api';
import { formatCnpj, maskCepInput, maskPhoneInput } from '@/lib/admin-labels';
import { toApiError } from '@/lib/api-client';

export default function EditarCredorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [carregando, setCarregando] = useState(true);
  const [initial, setInitial] = useState<Partial<CredorFormValues> | null>(null);

  useEffect(() => {
    getCredor(params.id)
      .then((c) => {
        setInitial({
          cnpj: formatCnpj(c.cnpj),
          razaoSocial: c.razaoSocial,
          nomeFantasia: c.nomeFantasia ?? '',
          telefone: c.telefone ? maskPhoneInput(c.telefone) : '',
          emailComercial: c.emailComercial ?? '',
          setores: c.setores,
          cep: c.cep ? maskCepInput(c.cep) : '',
          cidade: c.cidade ?? '',
          estado: c.estado ?? '',
          bairro: c.bairro ?? '',
          endereco: c.endereco ?? '',
          numero: c.numero ?? '',
          complemento: c.complemento ?? '',
          paginasAcesso: c.paginasAcesso.length ? c.paginasAcesso : ['dashboard'],
          responsavel: {
            nome: c.responsavel?.nome ?? '',
            email: c.responsavel?.email ?? '',
            confirmarEmail: c.responsavel?.email ?? '',
            telefone: c.responsavel?.telefone ? maskPhoneInput(c.responsavel.telefone) : '',
            senha: '',
            fotoUrl: c.responsavel?.fotoUrl ?? null,
          },
        });
      })
      .catch(() => router.replace('/admin/credores'))
      .finally(() => setCarregando(false));
  }, [params.id, router]);

  if (carregando || !initial) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <CredorForm
      mode="edit"
      credorId={params.id}
      initial={initial}
      submitLabel="Salvar alterações"
      onCancel={() => router.push('/admin/credores')}
      onUpdateResponsavel={async (data) => {
        await updateResponsavelCredor(params.id, data);
      }}
      onSubmit={async (payload) => {
        try {
          await updateCredor(params.id, payload);
          router.push('/admin/credores');
        } catch (err) {
          throw new Error(toApiError(err).title);
        }
      }}
    />
  );
}
