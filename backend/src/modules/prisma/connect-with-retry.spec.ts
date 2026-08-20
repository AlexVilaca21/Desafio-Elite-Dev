import { connectWithRetry } from './connect-with-retry';

describe('connectWithRetry', () => {
  it('returns on the first success', async () => {
    const connect = jest.fn().mockResolvedValue(undefined);

    await expect(
      connectWithRetry(connect, { attempts: 3, delayMs: 0 }),
    ).resolves.toBeUndefined();
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('retries until the database answers', async () => {
    const connect = jest
      .fn()
      .mockRejectedValueOnce(new Error('Neon waking'))
      .mockResolvedValueOnce(undefined);

    await expect(
      connectWithRetry(connect, { attempts: 3, delayMs: 0 }),
    ).resolves.toBeUndefined();
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('throws the last error after the last attempt', async () => {
    const connect = jest.fn().mockRejectedValue(new Error('offline'));

    await expect(
      connectWithRetry(connect, { attempts: 3, delayMs: 0 }),
    ).rejects.toThrow('offline');
    expect(connect).toHaveBeenCalledTimes(3);
  });
});
