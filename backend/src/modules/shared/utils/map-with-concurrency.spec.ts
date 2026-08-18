import { mapWithConcurrency } from './map-with-concurrency';

describe('mapWithConcurrency', () => {
  it('should keep result order with a limited pool', async () => {
    const seen: number[] = [];

    const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (item) => {
      seen.push(item);
      await Promise.resolve();
      return item * 10;
    });

    expect(result).toEqual([10, 20, 30, 40]);
    expect(seen).toHaveLength(4);
  });

  it('should return an empty list', async () => {
    await expect(
      mapWithConcurrency([], 3, async (item: number) => item),
    ).resolves.toEqual([]);
  });
});
