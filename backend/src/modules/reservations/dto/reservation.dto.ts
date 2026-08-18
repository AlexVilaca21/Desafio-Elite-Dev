export class ReservedSeatDto {
  id: string;
  row: string;
  number: number;
}

export class IssuedTicketDto {
  id: string;
  code: string;
  qrPayload: string;
  qrImage: string;
  shareToken: string;
  seat: ReservedSeatDto;
}

export class ReservationResponseDto {
  id: string;
  status: 'PAID' | 'REFUSED';
  eventId: string;
  eventName: string;
  total: number;
  currency: string;
  seats: ReservedSeatDto[];
  tickets: IssuedTicketDto[];
  message: string;
}
