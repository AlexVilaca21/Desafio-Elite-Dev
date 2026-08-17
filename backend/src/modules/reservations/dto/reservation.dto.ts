export class ReservedSeatDto {
  id: string;
  row: string;
  number: number;
}

export class ReservationResponseDto {
  id: string;
  status: 'PAID' | 'REFUSED';
  eventId: string;
  eventName: string;
  total: number;
  currency: string;
  seats: ReservedSeatDto[];
  message: string;
}
