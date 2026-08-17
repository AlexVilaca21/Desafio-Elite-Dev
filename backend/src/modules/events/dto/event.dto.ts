export class EventVenueDto {
  id: string;
  name: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

export class EventClassificationDto {
  segment?: string;
  genre?: string;
  subGenre?: string;
}

export class EventPriceRangeDto {
  type: string;
  currency: string;
  min: number;
  max: number;
}

export class EventSummaryDto {
  id: string;
  name: string;
  url?: string;
  imageUrl?: string;
  startDate?: string;
  startTime?: string;
  timezone?: string;
  status?: string;
  venue?: EventVenueDto;
  classification?: EventClassificationDto;
  attractions: string[];
}

export class EventDetailDto extends EventSummaryDto {
  description?: string;
  info?: string;
  pleaseNote?: string;
  priceRanges?: EventPriceRangeDto[];
  seatmapUrl?: string;
  dateTBA?: boolean;
  dateTBD?: boolean;
}

export class EventsSearchResponseDto {
  events: EventSummaryDto[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}
