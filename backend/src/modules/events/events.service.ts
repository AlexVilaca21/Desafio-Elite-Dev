import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { mapEventSummary } from 'modules/shared/utils/ticketmaster.mapper';
import { isCustomEventId } from 'modules/shared/utils/event-id';
import {
  EventDetailDto,
  EventImagesDto,
  EventsSearchResponseDto,
} from './dto/event.dto';
import { SearchEventsQueryDto } from './dto/search-events-query.dto';
import { EventSeatingDto } from './dto/seating.dto';
import { mapPublishedToSummary } from './published-event.mapper';

@Injectable()
export class EventsService {
  constructor(
    private readonly ticketmasterService: TicketmasterService,
    private readonly prisma: PrismaService,
  ) {}

  async searchEvents(
    query: SearchEventsQueryDto,
  ): Promise<EventsSearchResponseDto> {
    const size = query.size ?? 20;
    const page = query.page ?? 0;
    const where = this.buildPublishedWhere(query);
    const [totalElements, events] = await Promise.all([
      this.prisma.publishedEvent.count({ where }),
      this.prisma.publishedEvent.findMany({
        where,
        skip: page * size,
        take: size,
        orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      events: events.map((event) => mapPublishedToSummary(event)),
      page: {
        size,
        number: page,
        totalElements,
        totalPages: Math.max(1, Math.ceil(totalElements / size)),
      },
    };
  }

  async getEventById(id: string): Promise<EventDetailDto> {
    const published = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: id },
    });

    if (!published) {
      throw new NotFoundException('Este evento ainda não está no cartaz');
    }

    const summary = {
      ...mapPublishedToSummary(published),
      description: published.description ?? undefined,
    };

    if (isCustomEventId(id)) {
      return summary;
    }

    try {
      const remote = await this.ticketmasterService.getEventById(id);
      const mapped = mapEventSummary(remote);

      return {
        ...summary,
        url: mapped.url,
        description: published.description ?? remote.description,
        info: remote.info,
        pleaseNote: remote.pleaseNote,
        seatmapUrl: remote.seatmap?.staticUrl,
        dateTBA: remote.dates?.start?.dateTBA,
        dateTBD: remote.dates?.start?.dateTBD,
        classification: mapped.classification,
        attractions: mapped.attractions,
      };
    } catch {
      return summary;
    }
  }

  async getEventSeating(id: string): Promise<EventSeatingDto> {
    const published = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: id },
    });

    if (!published) {
      throw new NotFoundException('Este evento ainda não está no cartaz');
    }

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

  private buildPublishedWhere(
    query: SearchEventsQueryDto,
  ): Prisma.PublishedEventWhereInput {
    const filters: Prisma.PublishedEventWhereInput[] = [];

    if (query.keyword) {
      filters.push({
        OR: [
          { name: { contains: query.keyword, mode: 'insensitive' } },
          { venueName: { contains: query.keyword, mode: 'insensitive' } },
        ],
      });
    }

    if (query.city) {
      filters.push({
        venueCity: { contains: query.city, mode: 'insensitive' },
      });
    }

    if (query.stateCode) {
      filters.push({ venueStateCode: query.stateCode });
    }

    if (!filters.length) {
      return {};
    }

    return { AND: filters };
  }
}
