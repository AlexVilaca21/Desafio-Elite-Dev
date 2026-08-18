import { catalogUnitPrice } from './catalog-price';

describe('catalogUnitPrice', () => {
  it('should return a stable BRL price for the same event', () => {
    const first = catalogUnitPrice('ZFIMVHtnMZ17A6x7');
    const second = catalogUnitPrice('ZFIMVHtnMZ17A6x7');

    expect(first).toEqual(second);
    expect(first.currency).toBe('BRL');
    expect([90, 120, 150, 180, 220, 280]).toContain(first.unitPrice);
  });
});
