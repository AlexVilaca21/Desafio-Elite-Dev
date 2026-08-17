import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { TicketmasterEvent } from 'modules/service/ticketmaster/interfaces/ticketmaster.interface';
import { compactParams } from 'modules/shared/utils/compact-params';
import {
  mapEventSummary,
  mapPage,
} from 'modules/shared/utils/ticketmaster.mapper';
import {
  EventDetailDto,
  EventImagesDto,
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
      events: events.map((event) => mapEventSummary(event)),
      page: mapPage(response.page, {
        size: query.size ?? 20,
        number: query.page ?? 0,
        totalElements: events.length,
      }),
    };
  }

  async getEventById(id: string): Promise<EventDetailDto> {
    const response = await this.ticketmasterService.getEventById(id);
    return this.mapToDetail(response);
  }

  async getEventImages(id: string): Promise<EventImagesDto> {
    const response = await this.ticketmasterService.getEventImages(id);
    const images = response.images ?? [];

    if (!images.length) {
      throw new NotFoundException('Event images not found');
    }

    return {
      images: images.map((image) => ({
        url: image.url,
        ratio: image.ratio,
        width: image.width,
        height: image.height,
      })),
    };
  }

  private buildSearchParams(
    query: SearchEventsQueryDto,
  ): Record<string, string | number> {
    const scopedByEntity = Boolean(query.venueId || query.attractionId);

    return compactParams({
      size: query.size ?? 20,
      page: query.page ?? 0,
      sort: query.sort ?? 'relevance,desc',
      countryCode: scopedByEntity
        ? query.countryCode
        : (query.countryCode ?? 'BR'),
      keyword: query.keyword,
      city: query.city,
      stateCode: query.stateCode,
      venueId: query.venueId,
      attractionId: query.attractionId,
      classificationName: query.classificationName,
      startDateTime: query.startDateTime,
      endDateTime: query.endDateTime,
    });
  }

  private mapToDetail(event: TicketmasterEvent): EventDetailDto {
    return {
      ...mapEventSummary(event),
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
}
