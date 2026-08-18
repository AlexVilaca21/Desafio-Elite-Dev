import { http } from '@/shared/api/http';
import type { Ticket } from '../types/ticket.types';

export function listMyTickets(): Promise<Ticket[]> {
  return http<Ticket[]>('/tickets/me');
}

export function getSharedTicket(token: string): Promise<Ticket> {
  return http<Ticket>(`/tickets/shared/${encodeURIComponent(token)}`);
}

export function shareTicket(id: string): Promise<{ shareToken: string }> {
  return http<{ shareToken: string }>(`/tickets/${encodeURIComponent(id)}/share`, {
    method: 'POST',
  });
}

export function cancelTicket(id: string): Promise<Ticket> {
  return http<Ticket>(`/tickets/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  });
}
