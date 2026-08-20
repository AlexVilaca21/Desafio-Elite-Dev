export async function connectWithRetry(
  connect: () => Promise<unknown>,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<void> {
  const attempts = options.attempts ?? 8;
  const delayMs = options.delayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await connect();
      return;
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, delayMs * attempt);
      });
    }
  }

  throw lastError;
}
