import { afterEach, describe, expect, it, vi } from 'vitest';
import { http } from './http';

vi.mock('@/modules/auth/session', () => ({
  getToken: vi.fn(),
}));

import { getToken } from '@/modules/auth/session';

describe('http', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(getToken).mockReset();
  });

  it('sends JSON with the bearer token', async () => {
    vi.mocked(getToken).mockReturnValue('token-abc');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(http('/tickets/me')).resolves.toEqual({ id: '1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/tickets/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc',
        }),
      }),
    );
  });

  it('throws the API message in Portuguese', async () => {
    vi.mocked(getToken).mockReturnValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({ message: 'Este ingresso já foi cancelado' }),
      }),
    );

    await expect(http('/tickets/x/cancel', { method: 'POST' })).rejects.toThrow(
      'Este ingresso já foi cancelado',
    );
  });

  it('maps a network failure', async () => {
    vi.mocked(getToken).mockReturnValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expect(http('/events')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });
});
