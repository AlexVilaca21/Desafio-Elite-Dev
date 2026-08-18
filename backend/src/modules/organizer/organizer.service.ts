import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SeatStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  EventDetailDto,
  EventsSearchResponseDto,
} from 'modules/events/dto/event.dto';
import { SearchEventsQueryDto } from 'modules/events/dto/search-events-query.dto';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketmasterEvent } from 'modules/service/ticketmaster/interfaces/ticketmaster.interface';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { catalogUnitPrice } from 'modules/shared/utils/catalog-price';
import { compactParams } from 'modules/shared/utils/compact-params';
import { mapWithConcurrency } from 'modules/shared/utils/map-with-concurrency';
import { buildSeatLayout } from 'modules/shared/utils/seat-layout';
import { mapEventSummary } from 'modules/shared/utils/ticketmaster.mapper';
import { bannerPublicPath, removeLocalBanner } from './banner-storage';
import { CreateCustomEventDto } from './dto/create-custom-event.dto';
import { OrganizerEventDto } from './dto/organizer-event.dto';
import { PublishEventDto } from './dto/publish-event.dto';
import { UpdatePublishedEventDto } from './dto/update-event.dto';

@Injectable()
export class OrganizerService {
  private readonly catalogPageSize = 200;
  private readonly catalogMaxResults = 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketmasterService: TicketmasterService,
  ) {}

  async searchCatalog(
    query: SearchEventsQueryDto,
  ): Promise<EventsSearchResponseDto> {
    try {
      return await this.fetchCatalog(query);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível buscar os eventos no catálogo. Tente novamente.',
      );
    }
  }

  private async fetchCatalog(
    query: SearchEventsQueryDto,
  ): Promise<EventsSearchResponseDto> {
    const size = this.catalogPageSize;
    const first = await this.ticketmasterService.searchEvents(
      this.buildCatalogParams(query, 0, size),
    );
    const reportedPages = first.page?.totalPages ?? 1;
    const maxPages = Math.min(
      Math.max(reportedPages, 1),
      Math.ceil(this.catalogMaxResults / size),
    );
    const remainingPages = Array.from(
      { length: Math.max(maxPages - 1, 0) },
      (_, index) => index + 1,
    );
    const remaining = await mapWithConcurrency(this.ticketmast    ),
   );
   constbatches = [first, ...remaining];

    const unique = new Map<string, TicketmasterEvent>();

    for (const batch of batches) {
      for (const event of batch._embedded?.events ?? []) {
        unique.set(event.id, event);
      }
    }

    const events = [...unique.values()];
    const published = await this.prisma.publishedEvent.findMany({
      where: { ticketmasterId: { in: events.map((event) => event.id) } },
      select: { ticketmasterId: true },
    });
    const publishedIds = new Set(published.map((item) => item.ticketmasterId));

    return {
      events: events.map((event) => {
        const summary = mapEventSummary(event);
        const fallback = catalogUnitPrice(event.id);

        return {
          ...summary,
          status: publishedIds.has(event.id) ? 'published' : summary.status,
          priceRanges: summary.priceRanges.length
            ? summary.priceRanges
            : [
                {
                  type: 'standard',
                  currency: fallback.currency,
                  min: fallback.unitPrice,
                  max: fallback.unitPrice,
                },
              ],
        };
      }),
      page: {
        size: events.length,
        number: 0,
        totalElements: events.length,
        totalPages: 1,
      },
    };
  }

  private buildCatalogParams(
    query: SearchEventsQueryDto,
    page: number,
    size: number,
  ): Record<string, string | number> {
    const scopedByEntity = Boolean(query.venueId || query.attractionId);

    return compactParams({
      size,
      page,
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

  async getCatalogEvent(id: string): Promise<EventDetailDto> {
    const remote = await this.ticketmasterService.getEventById(id);
    const summary = mapEventSummary(remote);
    const published = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: id },
      select: { ticketmasterId: true, unitPrice: true, currency: true },
    });
    const fallback = published
      ? {
          currency: published.currency,
          unitPrice: Number(published.unitPrice),
        }
      : catalogUnitPrice(id);

    return {
      ...summary,
      status: published ? 'published' : summary.status,
      description: remote.description,
      info: remote.info,
      pleaseNote: remote.pleaseNote,
      seatmapUrl: remote.seatmap?.staticUrl,
      dateTBA: remote.dates?.start?.dateTBA,
      dateTBD: remote.dates?.start?.dateTBD,
      priceRanges: summary.priceRanges.length
        ? summary.priceRanges
        : [
            {
              type: 'standard',
              currency: fallback.currency,
              min: fallback.unitPrice,
              max: fallback.unitPrice,
            },
          ],
    };
  }

  async listEvents(): Promise<OrganizerEventDto[]> {
    const events = await this.prisma.publishedEvent.findMany({
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
      include: {
        seats: {
          select: { status: true },
        },
      },
    });

    return events.map((event) => this.toOrganizerEvent(event));
  }

  async getPublishedEvent(id: string): Promise<OrganizerEventDto> {
    const event = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: id },
      include: {
        seats: {
          select: { status: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não está no cartaz');
    }

    return this.toOrganizerEvent(event);
  }

  async publish(dto: PublishEventDto): Promise<OrganizerEventDto> {
    const existing = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: dto.ticketmasterId },
    });

    if (existing) {
      throw new ConflictException('Este evento já está no cartaz');
    }

    const remote = await this.ticketmasterService.getEventById(
      dto.ticketmasterId,
    );
    const summary = mapEventSummary(remote);

    const created = await this.prisma.publishedEvent.create({
      data: {
        ticketmasterId: dto.ticketmasterId,
        name: summary.name,
        imageUrl: summary.imageUrl,
        startDate: dto.startDate,
        startTime: dto.startTime,
        venueName: dto.venueName,
        venueCity: dto.venueCity,
        venueStateCode: dto.venueStateCode?.toUpperCase(),
        currency: dto.currency ?? 'BRL',
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        seats: {
          create: buildSeatLayout(dto.capacity),
        },
      },
      include: {
        seats: {
          select: { status: true },
        },
      },
    });

    return this.toOrganizerEvent(created);
  }

  async createCustom(
    dto: CreateCustomEventDto,
    banner?: Express.Multer.File,
  ): Promise<OrganizerEventDto> {
    if (!banner) {
      throw new BadRequestException('Envie o banner do evento');
    }

    const created = await this.prisma.publishedEvent.create({
      data: {
        ticketmasterId: `custom-${randomUUID()}`,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        imageUrl: bannerPublicPath(banner.filename),
        startDate: dto.startDate,
        startTime: dto.startTime,
        venueName: dto.venueName.trim(),
        venueCity: dto.venueCity?.trim() || null,
        venueStateCode: dto.venueStateCode?.toUpperCase() || null,
        currency: dto.currency ?? 'BRL',
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        seats: {
          create: buildSeatLayout(dto.capacity),
        },
      },
      include: {
        seats: {
          select: { status: true },
        },
      },
    });

    return this.toOrganizerEvent(created);
  }

  async update(
    id: string,
    dto: UpdatePublishedEventDto,
    banner?: Express.Multer.File,
  ): Promise<OrganizerEventDto> {
    const event = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: id },
      include: {
        seats: {
          select: { status: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não está no cartaz');
    }

    if (dto.capacity !== undefined) {
      const soldCount = event.seats.filter(
        (seat) => seat.status === SeatStatus.SOLD,
      ).length;

      if (soldCount > 0) {
        throw new BadRequestException(
          'Não dá para mudar a capacidade com lugares já vendidos',
        );
      }

      await this.prisma.seat.deleteMany({ where: { eventId: event.id } });
      await this.prisma.seat.createMany({
        data: buildSeatLayout(dto.capacity).map((seat) => ({
          ...seat,
          eventId: event.id,
        })),
      });
    }

    if (banner) {
      removeLocalBanner(event.imageUrl);
    }

    const updated = await this.prisma.publishedEvent.update({
      where: { id: event.id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        imageUrl: banner ? bannerPublicPath(banner.filename) : undefined,
        startDate: dto.startDate,
        startTime: dto.startTime,
        venueName: dto.venueName,
        venueCity: dto.venueCity,
        venueStateCode: dto.venueStateCode?.toUpperCase(),
        unitPrice:
          dto.unitPrice !== undefined
            ? new Prisma.Decimal(dto.unitPrice)
            : undefined,
      },
      include: {
        seats: {
          select: { status: true },
        },
      },
    });

    return this.toOrganizerEvent(updated);
  }

  async unpublish(id: string): Promise<void> {
    const event = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: id },
      include: {
        seats: {
          select: { status: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não está no cartaz');
    }

    const soldCount = event.seats.filter(
      (seat) => seat.status === SeatStatus.SOLD,
    ).length;

    if (soldCount > 0) {
      throw new ConflictException(
        'Há ingressos vendidos. Não é possível tirar do cartaz.',
      );
    }

    removeLocalBanner(event.imageUrl);
    await this.prisma.publishedEvent.delete({ where: { id: event.id } });
  }

  private toOrganizerEvent(event: {
    ticketmasterId: string;
    name: string;
    imageUrl: string | null;
    description: string | null;
    startDate: string | null;
    startTime: string | null;
    venueName: string | null;
    venueCity: string | null;
    venueStateCode: string | null;
    currency: string;
    unitPrice: { toString(): string } | number;
    seats: Array<{ status: SeatStatus }>;
  }): OrganizerEventDto {
    const soldCount = event.seats.filter(
      (seat) => seat.status === SeatStatus.SOLD,
    ).length;

    return {
      id: event.ticketmasterId,
      name: event.name,
      imageUrl: event.imageUrl ?? undefined,
      description: event.description ?? undefined,
      startDate: event.startDate ?? undefined,
      startTime: event.startTime ?? undefined,
      venueName: event.venueName ?? undefined,
      venueCity: event.venueCity ?? undefined,
      venueStateCode: event.venueStateCode ?? undefined,
      currency: event.currency,
      unitPrice: Number(event.unitPrice),
      capacity: event.seats.length,
      availableCount: event.seats.length - soldCount,
      soldCount,
    };
  }
}
