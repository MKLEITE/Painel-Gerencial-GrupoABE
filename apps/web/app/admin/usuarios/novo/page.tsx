'use client';

import { useRouter } from 'next/navigation';
import { UsuarioForm } from '@/components/admin/usuario-form';
import { createUsuario } from '@/lib/admin-api';
import { toApiError } from '@/lib/api-client';

export default function NovoUsuarioPage() {
  const router = useRouter();

  return (
    <UsuarioForm
      submitLabel="Cadastrar administrador"
      onCancel={() => router.push('/admin/usuarios')}
      onSubmit={async (values) => {
        try {
          await createUsuario({
            nome: values.nome.trim(),
            email: values.email.trim(),
            senha: values.senha,
            papel: values.papel,
          });
          router.push('/admin/usuarios');
        } catch (err) {
          throw new Error(toApiError(err).title);
        }
      }}
    />
  );
}
