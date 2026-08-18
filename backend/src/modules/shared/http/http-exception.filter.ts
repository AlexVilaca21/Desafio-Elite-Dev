import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const STATUS_FALLBACK: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]:
    'Confira os dados enviados. Alguns valores estão inválidos.',
  [HttpStatus.UNAUTHORIZED]: 'Sessão expirada ou não autenticada. Entre novamente.',
  [HttpStatus.FORBIDDEN]: 'Você não tem permissão para esta ação.',
  [HttpStatus.NOT_FOUND]: 'Não encontramos o que você procurou.',
  [HttpStatus.CONFLICT]: 'Não foi possível concluir porque há um conflito.',
  [HttpStatus.TOO_MANY_REQUESTS]:
    'Muitas tentativas agora. Aguarde um instante e tente de novo.',
  [HttpStatus.INTERNAL_SERVER_ERROR]:
    'Algo deu errado no servidor. Tente novamente em instantes.',
  [HttpStatus.BAD_GATEWAY]:
    'O catálogo externo falhou. Tente novamente em instantes.',
  [HttpStatus.SERVICE_UNAVAILABLE]:
    'O serviço está temporariamente indisponível. Tente novamente.',
};

function statusCodeName(status: number): string {
  const names: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };

  return names[status] ?? 'ERROR';
}

function asMessage(value: unknown, status: number): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value) && value.length) {
    return value.filter((item) => typeof item === 'string').join(' ');
  }

  return STATUS_FALLBACK[status] ?? STATUS_FALLBACK[HttpStatus.INTERNAL_SERVER_ERROR];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      const message =
        typeof payload === 'string'
          ? asMessage(payload, status)
          : asMessage(
              (payload as { message?: unknown }).message ?? payload,
              status,
            );

      response.status(status).json({
        statusCode: status,
        code: statusCodeName(status),
        message,
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unhandled error',
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: STATUS_FALLBACK[HttpStatus.INTERNAL_SERVER_ERROR],
    });
  }
}
