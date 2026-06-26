'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CredenciaisModal } from '@/components/admin/credenciais-modal';
import { CredorForm } from '@/components/admin/credor-form';
import { createCredor, type CreateCredorPayload } from '@/lib/admin-api';
import { toApiError } from '@/lib/api-client';

export default function NovoCredorPage() {
  const router = useRouter();
  const [credenciais, setCredenciais] = useState<{ email: string; senha: string } | null>(null);

  return (
    <>
      <CredorForm
        mode="create"
        submitLabel="Cadastrar credor"
        onCancel={() => router.push('/admin/credores')}
        onSubmit={async (payload) => {
          try {
            const result = await createCredor(payload as CreateCredorPayload);
            setCredenciais(result.credenciais);
          } catch (err) {
            throw new Error(toApiError(err).title);
          }
        }}
      />

      {credenciais && (
        <CredenciaisModal
          title="Credor cadastrado"
          description="Copie e repasse as credenciais ao responsável."
          email={credenciais.email}
          senha={credenciais.senha}
          onClose={() => router.push('/admin/credores')}
        />
      )}
    </>
  );
}
