export class GateEventDto {
  id: string;
  name: string;
  startDate?: string;
  startTime?: string;
  venueName?: string;
  venueCity?: string;
  venueStateCode?: string;
  validCount: number;
  usedCount: number;
}
