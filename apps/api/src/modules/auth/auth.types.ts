import { PapelUsuario } from '@abe/canonical-model';

export type TokenType = 'access' | 'refresh';

/** Payload assinado nos tokens JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  papel: PapelUsuario;
  type: TokenType;
  jti?: string;
}

/** Usuário autenticado injetado no request após validação do token. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  papel: PapelUsuario;
}
