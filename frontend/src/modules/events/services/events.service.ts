import { http } from "@/shared/api/http";
import type { EventsSearchResponse } from "../types/event.types";

export type SearchEventsParams = {
	keyword?: string;
	city?: string;
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
