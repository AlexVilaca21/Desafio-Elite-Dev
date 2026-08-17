import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { TicketmasterEvent } from 'modules/service/ticketmaster/interfaces/ticketmaster.interface';
import { compactParams } from 'modules/shared/utils/compact-params';
import { buildSeatLayout } from 'modules/shared/utils/seat-layout';
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
import { EventSeatingDto } from './dto/seating.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly ticketmasterService: TicketmasterService,
    private readonly prisma: PrismaService,
  ) {}

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

  async getEventSeating(id: string): Promise<EventSeatingDto> {
    const ticketmasterEvent = await this.ticketmasterService.getEventById(id);
    const published = await this.ensurePublishedEvent(ticketmasterEvent);
    const seats = await this.prisma.seat.findMany({
      where: { eventId: published.id },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });

    const rows = [...new Set(seats.map((seat) => seat.row))].map((row) => ({
      row,
      seats: seats
        .filter((seat) => seat.row === row)
        .map((seat) => ({
          id: seat.id,
          row: seat.row,
          number: seat.number,
          status: seat.status,
        })),
    }));

    return {
      event: {
        id: published.ticketmasterId,
        name: published.name,
        imageUrl: published.imageUrl ?? undefined,
        startDate: published.startDate ?? undefined,
        startTime: published.startTime ?? undefined,
        venueName: published.venueName ?? undefined,
        venueCity: published.venueCity ?? undefined,
        venueStateCode: published.venueStateCode ?? undefined,
        currency: published.currency,
        unitPrice: Number(published.unitPrice),
      },
      rows,
      availableCount: seats.filter((seat) => seat.status === 'AVAILABLE')
        .length,
    };
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

  private async ensurePublishedEvent(event: TicketmasterEvent) {
    const existing = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: event.id },
    });

    if (existing) {
      return existing;
    }

    const venue = event._embedded?.venues?.[0];
    const price = event.priceRanges?.[0];

    return this.prisma.publishedEvent.create({
      data: {
        ticketmasterId: event.id,
        name: event.name,
        imageUrl: mapEventSummary(event).imageUrl,
        startDate: event.dates?.start?.localDate,
        startTime: event.dates?.start?.localTime,
        venueName: venue?.name,
        venueCity: venue?.city?.name,
        venueStateCode: venue?.state?.stateCode,
        currency: price?.currency ?? 'BRL',
        unitPrice: price?.min ?? 80,
        seats: {
          create: buildSeatLayout(),
        },
      },
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
