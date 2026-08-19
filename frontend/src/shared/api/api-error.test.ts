import { describe, expect, it } from 'vitest';
import { ApiError, getErrorMessage, isAbortError } from './api-error';

describe('getErrorMessage', () => {
  it('turns Failed to fetch into a connection hint', () => {
    expect(getErrorMessage(new TypeError('Failed to fetch'), 'fallback')).toBe(
      'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
    );
  });

  it('keeps a Portuguese API message', () => {
    expect(
      getErrorMessage(new ApiError('Ingresso já foi cancelado', 400), 'fallback'),
    ).toBe('Ingresso já foi cancelado');
  });

  it('uses the fallback on abort', () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    expect(getErrorMessage(error, 'Ainda carregando')).toBe('Ainda carregando');
  });

  it('uses the fallback on a technical HTTP string', () => {
    expect(getErrorMessage(new Error('HTTP 500'), 'Algo deu errado')).toBe(
      'Algo deu errado',
    );
  });
});

describe('isAbortError', () => {
  it('detects abort errors', () => {
    const error = new DOMException('Aborted', 'AbortError');
    expect(isAbortError(error)).toBe(true);
    expect(isAbortError(new Error('nope'))).toBe(false);
  });
});
