export class OrganizerEventDto {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  venueName?: string;
  venueCity?: string;
  venueStateCode?: string;
  currency: string;
  unitPrice: number;
  capacity: number;
  availableCount: number;
  soldCount: number;
}
