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
  city?: { name: string };
  state?: { name: string; stateCode: string };
  country?: { name: string; countryCode: string };
  address?: { line1?: string };
  location?: { latitude: string; longitude: string };
}

export interface TicketmasterAttraction {
  id: string;
  name: string;
  url?: string;
  classifications?: TicketmasterClassification[];
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

export interface TicketmasterEventsSearchResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface TicketmasterEventDetailResponse extends TicketmasterEvent {
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
}
