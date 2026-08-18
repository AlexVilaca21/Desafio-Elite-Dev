import { http, httpForm } from '@/shared/api/http';
import type {
  EventDetail,
  EventsSearchResponse,
} from '@/modules/events/types/event.types';
import type { SearchEventsParams } from '@/modules/events/services/events.service';
import type {
  CustomEventPayload,
  OrganizerEvent,
  PublishEventPayload,
  UpdateEventPayload,
} from '../types/organizer.types';

function toQuery(params: SearchEventsParams): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

function toFormData(
  payload: Record<string, string | number | undefined>,
  banner?: File,
): FormData {
  const form = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      form.append(key, String(value));
    }
  });

  if (banner) {
    form.append('banner', banner);
  }

  return form;
}

export function listOrganizerEvents(): Promise<OrganizerEvent[]> {
  return http<OrganizerEvent[]>('/organizer/events');
}

export function getOrganizerEvent(id: string): Promise<OrganizerEvent> {
  return http<OrganizerEvent>(`/organizer/events/${encodeURIComponent(id)}`);
}

export function searchCatalog(
  params: SearchEventsParams = {},
): Promise<EventsSearchResponse> {
  return http<EventsSearchResponse>(`/organizer/catalog${toQuery(params)}`);
}

export function getCatalogEvent(id: string): Promise<EventDetail> {
  return http<EventDetail>(`/organizer/catalog/${encodeURIComponent(id)}`);
}

export function publishEvent(payload: PublishEventPayload): Promise<OrganizerEvent> {
  return http<OrganizerEvent>('/organizer/events', {
    method: 'POST',
    body: payload,
  });
}

export function createCustomEvent(
  payload: CustomEventPayload,
  banner: File,
): Promise<OrganizerEvent> {
  return httpForm<OrganizerEvent>(
    '/organizer/events/custom',
    toFormData(payload, banner),
  );
}

export function updateEvent(
  id: string,
  payload: UpdateEventPayload,
  banner?: File,
): Promise<OrganizerEvent> {
  return httpForm<OrganizerEvent>(
    `/organizer/events/${encodeURIComponent(id)}`,
    toFormData(payload, banner),
    'PATCH',
  );
}

export function unpublishEvent(id: string): Promise<void> {
  return http<void>(`/organizer/events/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
