import type { Ticket } from '@/modules/tickets/types/ticket.types';

export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    code: '5B9B631B47B7',
    status: 'VALID',
    qrPayload: '5B9B631B47B7.sig',
    qrImage: 'data:image/png;base64,qr',
    shareToken: 'share-token',
    createdAt: '2026-08-18T12:00:00.000Z',
    event: {
      id: 'event-1',
      name: 'Rock in Rio 2026',
      startDate: '2026-09-13',
      startTime: '12:00:00',
      venueName: 'Cidade do Rock',
      venueCity: 'Rio de Janeiro',
      venueStateCode: 'RJ',
    },
    seat: {
      id: 'seat-1',
      row: 'F',
      number: 9,
    },
    ...overrides,
  };
}
