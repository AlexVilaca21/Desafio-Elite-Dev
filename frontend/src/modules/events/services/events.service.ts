import { http } from "@/shared/api/http";
import type {
	EventDetail,
	EventSeating,
	EventsSearchResponse,
	Reservation,
} from "../types/event.types";

export type SearchEventsParams = {
	keyword?: string;
	city?: string;
	stateCode?: string;
	countryCode?: string;
	venueId?: string;
	size?: number;
	page?: number;
};

function toQuery(params: SearchEventsParams): string {
	const search = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== "") {
			search.set(key, String(value));
		}
	});

	const query = search.toString();
	return query ? `?${query}` : "";
}

export function searchEvents(
	params: SearchEventsParams = {},
): Promise<EventsSearchResponse> {
	return http<EventsSearchResponse>(`/events${toQuery(params)}`);
}

export function getEventById(id: string): Promise<EventDetail> {
	return http<EventDetail>(`/events/${encodeURIComponent(id)}`);
}

export function getEventSeating(id: string): Promise<EventSeating> {
	return http<EventSeating>(`/events/${encodeURIComponent(id)}/seating`);
}

export function createReservation(payload: {
	eventId: string;
	seatIds: string[];
	paymentOutcome: "approve" | "decline";
}): Promise<Reservation> {
	return http<Reservation>("/reservations", {
		method: "POST",
		body: payload,
	});
}
