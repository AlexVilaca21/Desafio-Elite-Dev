import { describe, expect, it } from 'vitest';
import {
  formatEventDate,
  formatEventStatus,
  formatMoney,
  formatPriceRange,
  formatStartingPrice,
  formatVenue,
} from './format';

describe('formatEventDate', () => {
  it('returns a placeholder when the date is missing', () => {
    expect(formatEventDate()).toBe('Data a definir');
  });

  it('formats a BR date without time', () => {
    expect(formatEventDate('2026-09-13')).toBe('13/09/2026');
  });

  it('keeps hours and minutes when time is present', () => {
    expect(formatEventDate('2026-09-13', '12:00:00')).toBe('13/09/2026 · 12:00');
  });
});

describe('formatEventStatus', () => {
  it('translates known Ticketmaster statuses', () => {
    expect(formatEventStatus('onsale')).toBe('À venda');
    expect(formatEventStatus('cancelled')).toBe('Cancelado');
  });

  it('returns the original value when it is unknown', () => {
    expect(formatEventStatus('mystery')).toBe('mystery');
  });
});

describe('formatMoney', () => {
  it('formats BRL with the Brazilian locale', () => {
    expect(formatMoney(150, 'BRL')).toMatch(/R\$\s?150,00/);
  });
});

describe('formatPriceRange', () => {
  it('shows a single value when min and max match', () => {
    expect(formatPriceRange(80, 80, 'BRL')).toMatch(/R\$\s?80,00/);
  });

  it('shows a range when min and max differ', () => {
    const label = formatPriceRange(80, 120, 'BRL');
    expect(label).toMatch(/80,00/);
    expect(label).toMatch(/120,00/);
    expect(label).toContain('–');
  });
});

describe('formatStartingPrice', () => {
  it('uses the first finite range', () => {
    expect(
      formatStartingPrice([
        { min: Number.NaN, max: 10, currency: 'BRL' },
        { min: 90, max: 120, currency: 'BRL' },
      ]),
    ).toMatch(/A partir de .*90,00/);
  });

  it('returns undefined without a usable range', () => {
    expect(formatStartingPrice([])).toBeUndefined();
  });
});

describe('formatVenue', () => {
  it('joins name, city and state', () => {
    expect(
      formatVenue({
        name: 'Arena Elite',
        city: 'São Paulo',
        stateCode: 'SP',
      }),
    ).toBe('Arena Elite · São Paulo · SP');
  });

  it('returns a placeholder without a venue', () => {
    expect(formatVenue()).toBe('Local a definir');
  });
});
