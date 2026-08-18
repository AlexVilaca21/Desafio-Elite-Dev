export type OrganizerEvent = {
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
};

export type PublishEventPayload = {
  ticketmasterId: string;
  startDate: string;
  startTime?: string;
  venueName: string;
  venueCity?: string;
  venueStateCode?: string;
  unitPrice: number;
  currency?: string;
  capacity: number;
};

export type CustomEventPayload = {
  name: string;
  description?: string;
  startDate: string;
  startTime?: string;
  venueName: string;
  venueCity?: string;
  venueStateCode?: string;
  unitPrice: number;
  currency?: string;
  capacity: number;
};

export type UpdateEventPayload = {
  name?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  venueName?: string;
  venueCity?: string;
  venueStateCode?: string;
  unitPrice?: number;
  capacity?: number;
};
