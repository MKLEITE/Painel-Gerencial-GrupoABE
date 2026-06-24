import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Converte qualquer exceção em um corpo padronizado (RFC 7807 / problem+json).
 * Importante: NUNCA vaza stack trace, SQL ou detalhe interno para o cliente.
 * Cada erro recebe um traceId para correlacionar com os logs.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = randomUUID();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extrai mensagens úteis (ex.: erros de validação) e monta um título amigável.
    const { title, errors } = this.buildMessage(exception, status, isHttp);

    if (!isHttp || status >= 500) {
      this.logger.error(`[${traceId}] ${request.method} ${request.url}`, exception as Error);
    }

    response.status(status).json({
      type: 'about:blank',
      title,
      status,
      errors,
      traceId,
    });
  }

  /** Converte a exceção em uma mensagem clara para o usuário, sem vazar detalhes internos. */
  private buildMessage(
    exception: unknown,
    status: number,
    isHttp: boolean,
  ): { title: string; errors?: string[] } {
    if (!isHttp) {
      return { title: 'Não foi possível concluir. Tente novamente em instantes.' };
    }

    const res = (exception as HttpException).getResponse();
    const rawMessage =
      typeof res === 'object' && res !== null
        ? (res as { message?: unknown }).message
        : res;

    // class-validator devolve um array de mensagens (uma por regra violada).
    if (Array.isArray(rawMessage) && rawMessage.length > 0) {
      const errors = rawMessage.map(String);
      return { title: errors[0], errors };
    }

    if (typeof rawMessage === 'string' && rawMessage && rawMessage !== 'Bad Request Exception') {
      return { title: rawMessage };
    }

    // Fallback por código de status (evita textos genéricos como "Bad Request Exception").
    return { title: this.defaultTitle(status) };
  }

  private defaultTitle(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Dados inválidos. Verifique as informações e tente novamente.',
      [HttpStatus.UNAUTHORIZED]: 'Sessão expirada ou credenciais inválidas.',
      [HttpStatus.FORBIDDEN]: 'Você não tem permissão para esta ação.',
      [HttpStatus.NOT_FOUND]: 'Recurso não encontrado.',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Muitas tentativas. Aguarde um momento e tente novamente.',
    };
    return map[status] ?? 'Não foi possível concluir a solicitação.';
  }
}
