export type EventVenue = {
	id: string;
	name: string;
	url?: string;
	imageUrl?: string;
	city?: string;
	state?: string;
	stateCode?: string;
	country?: string;
	countryCode?: string;
	address?: string;
	postalCode?: string;
	timezone?: string;
};

export type EventClassification = {
	segment?: string;
	genre?: string;
	subGenre?: string;
};

export type EventPriceRange = {
	type: string;
	currency: string;
	min: number;
	max: number;
};

export type EventSummary = {
	id: string;
	name: string;
	url?: string;
	imageUrl?: string;
	startDate?: string;
	startTime?: string;
	timezone?: string;
	status?: string;
	venue?: EventVenue;
	classification?: EventClassification;
	priceRanges: EventPriceRange[];
	attractions: string[];
};

export type EventDetail = EventSummary & {
	description?: string;
	info?: string;
	pleaseNote?: string;
	seatmapUrl?: string;
	dateTBA?: boolean;
	dateTBD?: boolean;
};

export type SeatStatus = 'AVAILABLE' | 'SOLD';

export type Seat = {
	id: string;
	row: string;
	number: number;
	status: SeatStatus;
};

export type SeatRow = {
	row: string;
	seats: Seat[];
};

export type EventSeating = {
	event: {
		id: string;
		name: string;
		imageUrl?: string;
		startDate?: string;
		startTime?: string;
		venueName?: string;
		venueCity?: string;
		venueStateCode?: string;
		currency: string;
		unitPrice: number;
	};
	rows: SeatRow[];
	availableCount: number;
};

export type IssuedTicket = {
	id: string;
	code: string;
	qrPayload: string;
	qrImage: string;
	shareToken: string;
	seat: { id: string; row: string; number: number };
};

export type Reservation = {
	id: string;
	status: 'PAID' | 'REFUSED';
	eventId: string;
	eventName: string;
	total: number;
	currency: string;
	seats: Array<{ id: string; row: string; number: number }>;
	tickets: IssuedTicket[];
	message: string;
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
