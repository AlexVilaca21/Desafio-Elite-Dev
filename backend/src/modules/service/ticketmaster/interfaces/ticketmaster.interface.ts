export interface TicketmasterImage {
  url: string;
  ratio?: string;
  width?: number;
  height?: number;
  fallback?: boolean;
}

export interface TicketmasterClassificationLevel {
  id: string;
  name: string;
}

export interface TicketmasterClassification {
  primary?: boolean;
  segment?: TicketmasterClassificationLevel;
  genre?: TicketmasterClassificationLevel;
  subGenre?: TicketmasterClassificationLevel;
}

export interface TicketmasterVenue {
  id: string;
  name: string;
  url?: string;
  postalCode?: string;
  timezone?: string;
  city?: { name: string };
  state?: { name: string; stateCode: string };
  country?: { name: string; countryCode: string };
  address?: { line1?: string };
  location?: { latitude: string; longitude: string };
  images?: TicketmasterImage[];
}

export interface TicketmasterAttraction {
  id: string;
  name: string;
  url?: string;
  images?: TicketmasterImage[];
  classifications?: TicketmasterClassification[];
  upcomingEvents?: Record<string, number>;
}

export interface TicketmasterEventDates {
  start?: {
    localDate?: string;
    localTime?: string;
    dateTime?: string;
    dateTBD?: boolean;
    dateTBA?: boolean;
    timeTBA?: boolean;
    noSpecificTime?: boolean;
  };
  timezone?: string;
  status?: { code: string };
  spanMultipleDays?: boolean;
}

export interface TicketmasterPriceRange {
  type: string;
  currency: string;
  min: number;
  max: number;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  type?: string;
  url?: string;
  locale?: string;
  description?: string;
  info?: string;
  pleaseNote?: string;
  images?: TicketmasterImage[];
  dates?: TicketmasterEventDates;
  classifications?: TicketmasterClassification[];
  priceRanges?: TicketmasterPriceRange[];
  seatmap?: { staticUrl?: string };
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
}

export interface TicketmasterPage {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface TicketmasterEventsSearchResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: TicketmasterPage;
}

export interface TicketmasterEventDetailResponse extends TicketmasterEvent {
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
}

export interface TicketmasterEventImagesResponse {
  images?: TicketmasterImage[];
}

export interface TicketmasterVenuesSearchResponse {
  _embedded?: {
    venues?: TicketmasterVenue[];
  };
  page?: TicketmasterPage;
}

export interface TicketmasterAttractionsSearchResponse {
  _embedded?: {
    attractions?: TicketmasterAttraction[];
  };
  page?: TicketmasterPage;
}

export interface TicketmasterGenre {
  id: string;
  name: string;
  _embedded?: {
    subgenres?: TicketmasterClassificationLevel[];
  };
}

export interface TicketmasterSegment {
  id: string;
  name: string;
  _embedded?: {
    genres?: TicketmasterGenre[];
  };
}

export interface TicketmasterClassificationItem {
  segment?: TicketmasterSegment;
}

export interface TicketmasterClassificationsSearchResponse {
  _embedded?: {
    classifications?: TicketmasterClassificationItem[];
  };
  page?: TicketmasterPage;
}

export interface TicketmasterSuggestResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
}
