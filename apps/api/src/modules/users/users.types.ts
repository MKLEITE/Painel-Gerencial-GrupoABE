import { PapelUsuario } from '@abe/canonical-model';

/** Usuário interno (com hash de senha — nunca exposto na API). */
export interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  nome: string;
  papel: PapelUsuario;
  senhaHash: string;
  ativo: boolean;
  fotoUrl: string | null;
}

/** Dados do usuário retornados pela API (sem senha). */
export interface UserPublic {
  id: string;
  tenantId: string;
  email: string;
  nome: string;
  papel: PapelUsuario;
  ativo: boolean;
  fotoUrl: string | null;
  tenantNome?: string;
}
