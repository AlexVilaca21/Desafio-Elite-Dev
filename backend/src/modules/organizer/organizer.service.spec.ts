import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SeatStatus } from '@prisma/client';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { OrganizerService } from './organizer.service';

describe('OrganizerService', () => {
  let service: OrganizerService;

  const publishedEvent = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const seat = {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  };

  const getEventById = jest.fn();
  const searchEvents = jest.fn();

  const stored = {
    id: 'pub-1',
    ticketmasterId: 'event-1',
    name: 'Rock Show',
    imageUrl: 'https://example.com/image.jpg',
    description: null,
    startDate: '2026-09-18',
    startTime: '21:00:00',
    venueName: 'Arena',
    venueCity: 'São Paulo',
    venueStateCode: 'SP',
    currency: 'BRL',
    unitPrice: 150,
    seats: Array.from({ length: 96 }, () => ({ status: SeatStatus.AVAILABLE })),
  };

  beforeEach(async () => {
    publishedEvent.findUnique.mockReset();
    publishedEvent.findMany.mockReset();
    publishedEvent.create.mockReset();
    publishedEvent.update.mockReset();
    publishedEvent.delete.mockReset();
    seat.deleteMany.mockReset();
    seat.createMany.mockReset();
    getEventById.mockReset();
    searchEvents.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizerService,
        {
          provide: PrismaService,
          useValue: { publishedEvent, seat },
        },
        {
          provide: TicketmasterService,
          useValue: { getEventById, searchEvents },
        },
      ],
    }).compile();

    service = module.get(OrganizerService);
  });

  it('should publish a catalog event with date, venue, capacity and price', async () => {
    publishedEvent.findUnique.mockResolvedValue(null);
    getEventById.mockResolvedValue({
      id: 'event-1',
      name: 'Rock Show',
      images: [{ url: 'https://example.com/image.jpg', ratio: '16_9' }],
      _embedded: {
        venues: [{ id: 'v1', name: 'Arena' }],
      },
    });
    publishedEvent.create.mockResolvedValue(stored);

    const result = await service.publish({
      ticketmasterId: 'event-1',
      startDate: '2026-09-18',
      startTime: '21:00',
      venueName: 'Arena Elite',
      venueCity: 'São Paulo',
      venueStateCode: 'SP',
      unitPrice: 150,
      capacity: 96,
    });

    expect(publishedEvent.create).toHaveBeenCalled();
    expect(result.capacity).toBe(96);
    expect(result.unitPrice).toBe(150);
    expect(result.availableCount).toBe(96);
  });

  it('should reject publishing the same catalog event twice', async () => {
    publishedEvent.findUnique.mockResolvedValue(stored);

    await expect(
      service.publish({
        ticketmasterId: 'event-1',
        startDate: '2026-09-18',
        venueName: 'Arena',
        unitPrice: 150,
        capacity: 96,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should not unpublish when seats were sold', async () => {
    publishedEvent.findUnique.mockResolvedValue({
      ...stored,
      seats: [{ status: SeatStatus.SOLD }, { status: SeatStatus.AVAILABLE }],
    });

    await expect(service.unpublish('event-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should list published events with occupancy', async () => {
    publishedEvent.findMany.mockResolvedValue([
      {
        ...stored,
        seats: [{ status: SeatStatus.SOLD }, { status: SeatStatus.AVAILABLE }],
      },
    ]);

    const result = await service.listEvents();

    expect(result[0].soldCount).toBe(1);
    expect(result[0].availableCount).toBe(1);
    expect(result[0].capacity).toBe(2);
  });

  it('should create a custom event with banner and without Ticketmaster', async () => {
    publishedEvent.create.mockResolvedValue({
      ...stored,
      ticketmasterId: 'custom-1',
      name: 'Samba na Praça',
      description: 'Roda de samba ao ar livre',
      imageUrl: '/uploads/banners/banner.jpg',
    });

    const result = await service.createCustom(
      {
        name: 'Samba na Praça',
        description: 'Roda de samba ao ar livre',
        startDate: '2026-10-02',
        venueName: 'Praça da Sé',
        venueCity: 'São Paulo',
        venueStateCode: 'SP',
        unitPrice: 80,
        capacity: 48,
      },
      { filename: 'banner.jpg' } as Express.Multer.File,
    );

    expect(getEventById).not.toHaveBeenCalled();
    expect(publishedEvent.create).toHaveBeenCalled();
    expect(result.name).toBe('Samba na Praça');
    expect(result.imageUrl).toBe('/uploads/banners/banner.jpg');
  });

  it('should require a banner for a custom event', async () => {
    await expect(
      service.createCustom({
        name: 'Samba na Praça',
        startDate: '2026-10-02',
        venueName: 'Praça da Sé',
        unitPrice: 80,
        capacity: 48,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when updating a missing event', async () => {
    publishedEvent.findUnique.mockResolvedValue(null);

    await expect(service.update('missing', { unitPrice: 200 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return every catalog event from all Ticketmaster pages', async () => {
    searchEvents
      .mockResolvedValueOnce({
        _embedded: {
          events: [{ id: 'tm-1', name: 'Show A', images: [], dates: {} }],
        },
        page: { size: 200, number: 0, totalElements: 2, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        _embedded: {
          events: [{ id: 'tm-2', name: 'Show B', images: [], dates: {} }],
        },
        page: { size: 200, number: 1, totalElements: 2, totalPages: 2 },
      });
    publishedEvent.findMany.mockResolvedValue([]);

    const result = await service.searchCatalog({ keyword: 'show' });

    expect(searchEvents).toHaveBeenCalledTimes(2);
    expect(result.events.map((event) => event.id)).toEqual(['tm-1', 'tm-2']);
    expect(result.page.size).toBe(2);
    expect(result.page.totalElements).toBe(2);
  });
});
