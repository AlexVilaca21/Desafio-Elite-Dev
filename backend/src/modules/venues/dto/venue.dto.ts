export class VenueSummaryDto {
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
}

export class VenuesSearchResponseDto {
  venues: VenueSummaryDto[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}
