import { Injectable } from '@nestjs/common';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import {
  TicketmasterEvent,
  TicketmasterImage,
} from 'modules/service/ticketmaster/interfaces/ticketmaster.interface';
import {
  EventDetailDto,
  EventSummaryDto,
  EventsSearchResponseDto,
} from './dto/event.dto';
import { SearchEventsQueryDto } from './dto/search-events-query.dto';

@Injectable()
export class EventsService {
  constructor(private readonly ticketmasterService: TicketmasterService) {}

  async searchEvents(
    query: SearchEventsQueryDto,
  ): Promise<EventsSearchResponseDto> {
    const response = await this.ticketmasterService.searchEvents(
      this.buildSearchParams(query),
    );

    const events = response._embedded?.events ?? [];

    return {
      events: events.map((event) => this.mapToSummary(event)),
      page: {
        size: response.page?.size ?? query.size ?? 20,
        totalElements: response.page?.totalElements ?? events.length,
        totalPages: response.page?.totalPages ?? 1,
        number: response.page?.number ?? query.page ?? 0,
      },
    };
  }

  async getEventById(id: string): Promise<EventDetailDto> {
    const response = await this.ticketmasterService.getEventById(id);
    return this.mapToDetail(response);
  }

  private buildSearchParams(
    query: SearchEventsQueryDto,
  ): Record<string, string | number> {
    const params: Record<string, string | number> = {
      size: query.size ?? 20,
      page: query.page ?? 0,
      sort: query.sort ?? 'relevance,desc',
      countryCode: query.countryCode ?? 'BR',
    };

    if (query.keyword) params.keyword = query.keyword;
    if (query.city) params.city = query.city;
    if (query.stateCode) params.stateCode = query.stateCode;
    if (query.classificationName) {
      params.classificationName = query.classificationName;
    }
    if (query.startDateTime) params.startDateTime = query.startDateTime;
    if (query.endDateTime) params.endDateTime = query.endDateTime;

    return params;
  }

  private mapToSummary(event: TicketmasterEvent): EventSummaryDto {
    const primaryClassification = event.classifications?.find(
      (item) => item.primary,
    );

    return {
      id: event.id,
      name: event.name,
      url: event.url,
      imageUrl: this.selectBestImage(event.images),
      startDate: event.dates?.start?.localDate,
      startTime: event.dates?.start?.localTime,
      timezone: event.dates?.timezone,
      status: event.dates?.status?.code,
      venue: this.mapVenue(event),
      classification: primaryClassification
        ? {
            segment: primaryClassification.segment?.name,
            genre: primaryClassification.genre?.name,
            subGenre: primaryClassification.subGenre?.name,
          }
        : undefined,
      attractions:
        event._embedded?.attractions?.map((attraction) => attraction.name) ??
        [],
    };
  }

  private mapToDetail(event: TicketmasterEvent): EventDetailDto {
    return {
      ...this.mapToSummary(event),
      description: event.description,
      info: event.info,
      pleaseNote: event.pleaseNote,
      priceRanges: event.priceRanges?.map((range) => ({
        type: range.type,
        currency: range.currency,
        min: range.min,
        max: range.max,
      })),
      seatmapUrl: event.seatmap?.staticUrl,
      dateTBA: event.dates?.start?.dateTBA,
      dateTBD: event.dates?.start?.dateTBD,
    };
  }

  private mapVenue(event: TicketmasterEvent) {
    const venue = event._embedded?.venues?.[0];

    if (!venue) {
      return undefined;
    }

    return {
      id: venue.id,
      name: venue.name,
      city: venue.city?.name,
      state: venue.state?.name,
      stateCode: venue.state?.stateCode,
      country: venue.country?.name,
      countryCode: venue.country?.countryCode,
      address: venue.address?.line1,
      latitude: venue.location?.latitude,
      longitude: venue.location?.longitude,
    };
  }

  private selectBestImage(images?: TicketmasterImage[]): string | undefined {
    if (!images?.length) {
      return undefined;
    }

    const preferred = images.find(
      (image) => image.ratio === '16_9' && !image.fallback,
    );

    return preferred?.url ?? images[0]?.url;
  }
}
