import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

if (!('EventSource' in globalThis)) {
  class EventSourceStub {
    url: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror: (() => void) | null = null;

    constructor(url: string) {
      this.url = url;
    }

    close() {
      // no-op in tests that only load the map via HTTP
    }
  }

  Object.defineProperty(globalThis, 'EventSource', {
    configurable: true,
    writable: true,
    value: EventSourceStub,
  });
}
