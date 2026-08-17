export class AttractionClassificationDto {
  segment?: string;
  genre?: string;
  subGenre?: string;
}

export class AttractionSummaryDto {
  id: string;
  name: string;
  url?: string;
  imageUrl?: string;
  classification?: AttractionClassificationDto;
  upcomingEvents?: number;
}

export class AttractionsSearchResponseDto {
  attractions: AttractionSummaryDto[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}
