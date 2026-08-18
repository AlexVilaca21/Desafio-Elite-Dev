export const SEATS_PER_ROW = 12;
export const MIN_CAPACITY = 12;
export const MAX_CAPACITY = 144;
export const DEFAULT_CAPACITY = 96;

export function clampCapacity(capacity: number): number {
  return Math.min(MAX_CAPACITY, Math.max(MIN_CAPACITY, Math.floor(capacity)));
}

export function buildSeatLayout(
  capacity = DEFAULT_CAPACITY,
): Array<{ row: string; number: number }> {
  const size = clampCapacity(capacity);
  const seats: Array<{ row: string; number: number }> = [];
  let remaining = size;
  let rowIndex = 0;

  while (remaining > 0) {
    const row = String.fromCharCode(65 + rowIndex);
    const count = Math.min(SEATS_PER_ROW, remaining);

    for (let number = 1; number <= count; number += 1) {
      seats.push({ row, number });
    }

    remaining -= count;
    rowIndex += 1;
  }

  return seats;
}
