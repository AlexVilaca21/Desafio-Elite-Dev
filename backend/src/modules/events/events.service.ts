import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { TicketmasterEvent } from 'modules/service/ticketmaster/interfaces/ticketmaster.interface';
import { compactParams } from 'modules/shared/utils/compact-params';
import { catalogUnitPrice } from 'modules/shared/utils/catalog-price';
import { buildSeatLayout } from 'modules/shared/utils/seat-layout';
import {
  mapEventSummary,
  mapPage,
} from 'modules/shared/utils/ticketmaster.mapper';
import {
  EventDetailDto,
  EventImagesDto,
  EventPriceRangeDto,
  EventSummaryDto,
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
    const published = await this.prisma.publishedEvent.findMany({
      where: { ticketmasterId: { in: events.map((event) => event.id) } },
      select: { ticketmasterId: true, unitPrice: true, currency: true },
    });
    const publishedById = new Map(
      published.map((item) => [item.ticketmasterId, item]),
    );

    return {
      events: events.map((event) =>
        this.withCatalogPrice(event, publishedById.get(event.id)),
      ),
      page: mapPage(response.page, {
        size: query.size ?? 20,
        number: query.page ?? 0,
        totalElements: events.length,
      }),
    };
  }

  async getEventById(id: string): Promise<EventDetailDto> {
    const response = await this.ticketmasterService.getEventById(id);
    const published = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: id },
      select: { unitPrice: true, currency: true },
    });

    return {
      ...this.withCatalogPrice(response, published ?? undefined),
      description: response.description,
      info: response.info,
      pleaseNote: response.pleaseNote,
      seatmapUrl: response.seatmap?.staticUrl,
      dateTBA: response.dates?.start?.dateTBA,
      dateTBD: response.dates?.start?.dateTBD,
    };
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
    const fromApi = event.priceRanges?.[0];
    const fallback = catalogUnitPrice(event.id);

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
        currency: fromApi?.currency ?? fallback.currency,
        unitPrice: fromApi?.min ?? fallback.unitPrice,
        seats: {
          create: buildSeatLayout(),
        },
      },
    });
  }

  private withCatalogPrice(
    event: TicketmasterEvent,
    published?: {
      unitPrice: { toString(): string } | number;
      currency: string;
    },
  ): EventSummaryDto {
    const summary = mapEventSummary(event);

    if (summary.priceRanges.length) {
      return summary;
    }

    const fallback = published
      ? {
          currency: published.currency,
          unitPrice: Number(published.unitPrice),
        }
      : catalogUnitPrice(event.id);

    const price: EventPriceRangeDto = {
      type: 'standard',
      currency: fallback.currency,
      min: fallback.unitPrice,
      max: fallback.unitPrice,
    };

    return {
      ...summary,
      priceRanges: [price],
    };
  }
}
