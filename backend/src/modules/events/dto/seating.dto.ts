export class SeatDto {
  id: string;
  row: string;
  number: number;
  status: 'AVAILABLE' | 'SOLD';
}

export class SeatRowDto {
  row: string;
  seats: SeatDto[];
}

export class SeatingEventDto {
  id: string;
  name: string;
  imageUrl?: string;
  startDate?: string;
  startTime?: string;
  venueName?: string;
  venueCity?: string;
  venueStateCode?: string;
  currency: string;
  unitPrice: number;
}

export class EventSeatingDto {
  event: SeatingEventDto;
  rows: SeatRowDto[];
  availableCount: number;
}
