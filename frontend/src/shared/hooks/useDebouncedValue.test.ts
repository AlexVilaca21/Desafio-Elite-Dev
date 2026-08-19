import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the first value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('rio', 400));
    expect(result.current).toBe('rio');
  });

  it('waits before applying the next value', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: 'rio' } },
    );

    rerender({ value: 'sp' });
    expect(result.current).toBe('rio');

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('sp');
  });
});
