export type EventSummary = {
	id: string;
	name: string;
	imageUrl?: string;
	startDate?: string;
	startTime?: string;
	status?: string;
	venue?: {
		name: string;
		city?: string;
		stateCode?: string;
	};
	classification?: {
		segment?: string;
		genre?: string;
	};
	attractions: string[];
};

export type EventsSearchResponse = {
	events: EventSummary[];
	page: {
		size: number;
		totalElements: number;
		totalPages: number;
		number: number;
	};
};
