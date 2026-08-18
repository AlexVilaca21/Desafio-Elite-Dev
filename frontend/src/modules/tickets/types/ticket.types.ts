export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';

export type Ticket = {
  id: string;
  code: string;
  status: TicketStatus;
  qrPayload: string;
  qrImage: string;
  shareToken: string;
  usedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  event: {
    id: string;
    name: string;
    imageUrl?: string;
    startDate?: string;
    startTime?: string;
    venueName?: string;
    venueCity?: string;
    venueStateCode?: string;
  };
  seat: {
    id: string;
    row: string;
    number: number;
  };
};
