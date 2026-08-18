import { PublishedEvent } from '@prisma/client';
import { EventSummaryDto } from 'modules/events/dto/event.dto';

export function mapPublishedToSummary(event: PublishedEvent): EventSummaryDto {
  const unitPrice = Number(event.unitPrice);

  return {
    id: event.ticketmasterId,
    name: event.name,
    imageUrl: event.imageUrl ?? undefined,
    startDate: event.startDate ?? undefined,
    startTime: event.startTime ?? undefined,
    status: 'onsale',
    venue: event.venueName
      ? {
          id: event.ticketmasterId,
          name: event.venueName,
          city: event.venueCity ?? undefined,
          stateCode: event.venueStateCode ?? undefined,
        }
      : undefined,
    priceRanges: [
      {
        type: 'standard',
        currency: event.currency,
        min: unitPrice,
        max: unitPrice,
      },
    ],
    attractions: [],
  };
}
