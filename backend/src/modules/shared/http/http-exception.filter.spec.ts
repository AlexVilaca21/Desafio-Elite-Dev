import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function hostWithResponse() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as ArgumentsHost;

    return { host, json, status };
  }

  it('should expose a friendly Portuguese body for HttpException', () => {
    const { host, json, status } = hostWithResponse();

    filter.catch(
      new HttpException('Evento não está no cartaz', HttpStatus.NOT_FOUND),
      host,
    );

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Evento não está no cartaz',
    });
  });

  it('should hide unknown errors behind a generic message', () => {
    const { host, json, status } = hostWithResponse();

    filter.catch(new Error('ECONNRESET'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Algo deu errado no servidor. Tente novamente em instantes.',
    });
  });
});
