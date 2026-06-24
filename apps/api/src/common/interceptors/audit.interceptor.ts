import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor de auditoria.
 *
 * Registra ações sensíveis (quem, o quê, quando, de onde) em uma trilha
 * append-only. NUNCA registra dados sensíveis (CPF/CNPJ, tokens, senhas).
 *
 * TODO (Fase 1): persistir em `audit_log` e marcar quais rotas são auditáveis
 * (via decorator @Audit). Ver docs/06-seguranca-e-lgpd.md (seção Auditoria).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      user?: { id?: string; tenantId?: string };
    }>();

    const meta = {
      ator: request.user?.id ?? 'anonimo',
      tenantId: request.user?.tenantId,
      acao: `${request.method} ${request.url}`,
      data: new Date().toISOString(),
    };

    return next.handle().pipe(
      tap(() => {
        // Placeholder: na Fase 1, gravar `meta` na trilha de auditoria.
        void meta;
      }),
    );
  }
}
