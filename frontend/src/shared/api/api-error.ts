export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const NETWORK_HINT =
  'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';

const TECHNICAL_ERROR =
  /failed to fetch|networkerror|load failed|fetch failed|network request failed|err_connection|econnrefused|econnreset|^http \d+/i;

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAbortError(error)) {
    return fallback;
  }

  if (error instanceof TypeError) {
    return NETWORK_HINT;
  }

  if (
    error instanceof ApiError &&
    (error.status === 0 || error.code === 'NETWORK_ERROR')
  ) {
    return NETWORK_HINT;
  }

  const message =
    error instanceof Error && error.message.trim() ? error.message.trim() : '';

  if (!message || TECHNICAL_ERROR.test(message)) {
    return fallback || NETWORK_HINT;
  }

  return message;
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}
