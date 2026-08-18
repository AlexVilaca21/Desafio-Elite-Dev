import type { Ticket } from '@/modules/tickets/types/ticket.types';

export type GateEvent = {
  id: string;
  name: string;
  startDate?: string;
  startTime?: string;
  venueName?: string;
  venueCity?: string;
  venueStateCode?: string;
  validCount: number;
  usedCount: number;
};

export type GateResultKind =
  | 'VALID'
  | 'INVALID'
  | 'ALREADY_USED'
  | 'WRONG_EVENT';

export type GateValidation = {
  result: GateResultKind;
  message: string;
  usedAt?: string;
  ticket?: Ticket;
};
