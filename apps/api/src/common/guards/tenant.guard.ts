import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser } from '../../modules/auth/auth.types.js';

/**
 * Guard de isolamento de tenant.
 *
 * REGRA INVIOLÁVEL: o tenantId é extraído SEMPRE do token autenticado (via JwtAuthGuard),
 * NUNCA do corpo/query enviados pelo cliente.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      tenantId?: string;
    }>();

    const tenantId = request.user?.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Contexto de tenant ausente.');
    }

    request.tenantId = tenantId;
    return true;
  }
}
