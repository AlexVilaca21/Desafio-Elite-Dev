import {
  buildSeatLayout,
  DEFAULT_CAPACITY,
  SEATS_PER_ROW,
} from './seat-layout';

describe('buildSeatLayout', () => {
  it('should keep 96 seats by default', () => {
    const seats = buildSeatLayout();

    expect(seats).toHaveLength(DEFAULT_CAPACITY);
    expect(seats[0]).toEqual({ row: 'A', number: 1 });
    expect(seats[SEATS_PER_ROW - 1]).toEqual({ row: 'A', number: 12 });
  });

  it('should fill a partial last row', () => {
    const seats = buildSeatLayout(20);

    expect(seats).toHaveLength(20);
    expect(seats.filter((seat) => seat.row === 'A')).toHaveLength(12);
    expect(seats.filter((seat) => seat.row === 'B')).toHaveLength(8);
  });
});
