import {
  TicketmasterAttraction,
  TicketmasterEvent,
  TicketmasterImage,
  TicketmasterPage,
  TicketmasterVenue,
} from 'modules/service/ticketmaster/interfaces/ticketmaster.interface';

export type PageMeta = {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
};

export function mapPage(
  page: TicketmasterPage | undefined,
  fallback: { size: number; number: number; totalElements: number },
): PageMeta {
  return {
    size: page?.size ?? fallback.size,
    totalElements: page?.totalElements ?? fallback.totalElements,
    totalPages: page?.totalPages ?? 1,
    number: page?.number ?? fallback.number,
  };
}

export function selectBestImage(
  images?: TicketmasterImage[],
): string | undefined {
  if (!images?.length) {
    return undefined;
  }

  const preferred = images.find(
    (image) => image.ratio === '16_9' && !image.fallback,
  );

  return preferred?.url ?? images[0]?.url;
}

export type MappedVenue = {
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
  latitude?: string;
  longitude?: string;
};

export function mapVenue(venue?: TicketmasterVenue): MappedVenue | undefined {
  if (!venue) {
    return undefined;
  }

  return {
    id: venue.id,
    name: venue.name,
    url: venue.url,
    imageUrl: selectBestImage(venue.images),
    city: venue.city?.name,
    state: venue.state?.name,
    stateCode: venue.state?.stateCode,
    country: venue.country?.name,
    countryCode: venue.country?.countryCode,
    address: venue.address?.line1,
    postalCode: venue.postalCode,
    timezone: venue.timezone,
    latitude: venue.location?.latitude,
    longitude: venue.location?.longitude,
  };
}

export function mapEventSummary(event: TicketmasterEvent) {
  const primaryClassification = event.classifications?.find(
    (item) => item.primary,
  );

  return {
    id: event.id,
    name: event.name,
    url: event.url,
    imageUrl: selectBestImage(event.images),
    startDate: event.dates?.start?.localDate,
    startTime: event.dates?.start?.localTime,
    timezone: event.dates?.timezone,
    status: event.dates?.status?.code,
    venue: mapVenue(event._embedded?.venues?.[0]),
    classification: primaryClassification
      ? {
          segment: primaryClassification.segment?.name,
          genre: primaryClassification.genre?.name,
          subGenre: primaryClassification.subGenre?.name,
        }
      : undefined,
    attractions:
      event._embedded?.attractions?.map((attraction) => attraction.name) ?? [],
  };
}

export function mapAttractionSummary(attraction: TicketmasterAttraction) {
  const primaryClassification = attraction.classifications?.find(
    (item) => item.primary,
  );

  return {
    id: attraction.id,
    name: attraction.name,
    url: attraction.url,
    imageUrl: selectBestImage(attraction.images),
    classification: primaryClassification
      ? {
          segment: primaryClassification.segment?.name,
          genre: primaryClassification.genre?.name,
          subGenre: primaryClassification.subGenre?.name,
        }
      : undefined,
    upcomingEvents: attraction.upcomingEvents?._total,
  };
}
