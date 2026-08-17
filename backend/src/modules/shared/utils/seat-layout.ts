export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
export const SEATS_PER_ROW = 12;

export function buildSeatLayout(): Array<{ row: string; number: number }> {
  return SEAT_ROWS.flatMap((row) =>
    Array.from({ length: SEATS_PER_ROW }, (_, index) => ({
      row,
      number: index + 1,
    })),
  );
}
