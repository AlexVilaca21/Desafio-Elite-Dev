import { http } from '@/shared/api/http';
import type { GateEvent, GateValidation } from '../types/gate.types';

export function listGateEvents(): Promise<GateEvent[]> {
  return http<GateEvent[]>('/gate/events');
}

export function validateTicket(payload: {
  qrPayload?: string;
  code?: string;
  eventId?: string;
}): Promise<GateValidation> {
  return http<GateValidation>('/gate/validate', {
    method: 'POST',
    body: payload,
  });
}
