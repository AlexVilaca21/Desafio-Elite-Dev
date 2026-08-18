export class TicketEventDto {
  id: string;
  name: string;
  imageUrl?: string;
  startDate?: string;
  startTime?: string;
  venueName?: string;
  venueCity?: string;
  venueStateCode?: string;
}

export class TicketSeatDto {
  id: string;
  row: string;
  number: number;
}

export class TicketResponseDto {
  id: string;
  code: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  qrPayload: string;
  qrImage: string;
  shareToken: string;
  usedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  event: TicketEventDto;
  seat: TicketSeatDto;
}

export class ValidateTicketResponseDto {
  result: 'VALID' | 'INVALID' | 'ALREADY_USED' | 'WRONG_EVENT';
  message: string;
  usedAt?: string;
  ticket?: TicketResponseDto;
}
