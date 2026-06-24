'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { UsuarioForm } from '@/components/admin/usuario-form';
import { getUsuario, updateUsuario } from '@/lib/admin-api';
import { toApiError } from '@/lib/api-client';

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [carregando, setCarregando] = useState(true);
  const [initial, setInitial] = useState<{
    nome: string;
    email: string;
    senha: string;
    papel: string;
    ativo: boolean;
  } | null>(null);

  useEffect(() => {
    getUsuario(params.id)
      .then((u) => {
        setInitial({
          nome: u.nome,
          email: u.email,
          senha: '',
          papel: u.papel,
          ativo: u.ativo,
        });
      })
      .catch(() => router.replace('/admin/usuarios'))
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
    <UsuarioForm
      initial={initial}
      senhaObrigatoria={false}
      submitLabel="Salvar alterações"
      onCancel={() => router.push('/admin/usuarios')}
      onSubmit={async (values) => {
        try {
          await updateUsuario(params.id, {
            nome: values.nome.trim(),
            papel: values.papel,
            ativo: values.ativo,
            ...(values.senha ? { senha: values.senha } : {}),
          });
          router.push('/admin/usuarios');
        } catch (err) {
          throw new Error(toApiError(err).title);
        }
      }}
    />
  );
}
