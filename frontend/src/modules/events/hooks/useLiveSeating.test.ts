import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLiveSeating } from './useLiveSeating';

vi.mock('../services/events.service', () => ({
  getEventSeating: vi.fn(),
}));

import { getEventSeating } from '../services/events.service';

type Handler = ((event: { data: string }) => void) | null;

class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: Handler = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }
}

const seating = {
  event: {
    id: 'event-1',
    name: 'Rock Show',
    currency: 'BRL',
    unitPrice: 150,
  },
  rows: [
    {
      row: 'A',
      seats: [{ id: 'a1', row: 'A', number: 1, status: 'AVAILABLE' as const }],
    },
  ],
  availableCount: 1,
};

describe('useLiveSeating', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    vi.mocked(getEventSeating).mockReset();
    vi.mocked(getEventSeating).mockResolvedValue(seating);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the map and then applies a live update', async () => {
    const { result } = renderHook(() => useLiveSeating('event-1'));

    await waitFor(() => {
      expect(result.current.seating?.availableCount).toBe(1);
    });

    const source = MockEventSource.instances[0];
    expect(source.url).toContain('/events/event-1/seating/stream');
    source.onopen?.();
    source.onmessage?.({
      data: JSON.stringify({ ...seating, availableCount: 0 }),
    });

    await waitFor(() => {
      expect(result.current.live).toBe(true);
      expect(result.current.seating?.availableCount).toBe(0);
    });
  });
});
