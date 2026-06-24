import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, ACCESS_TOKEN_COOKIE } from '../../modules/auth/auth.service.js';
import { AuthenticatedUser } from '../../modules/auth/auth.types.js';

/**
 * Valida o access token (cookie httpOnly) e injeta o usuário no request.
 * O tenantId vem SEMPRE do token — nunca do corpo/query do cliente.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser; tenantId?: string }>();
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Autenticação necessária.');
    }

    const user = await this.authService.validateAccessToken(token);
    request.user = user;
    request.tenantId = user.tenantId;
    return true;
  }
}
