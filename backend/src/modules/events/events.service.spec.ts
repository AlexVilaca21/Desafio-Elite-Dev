import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { SearchEventsQueryDto } from './dto/search-events-query.dto';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;

  const published = {
    id: 'pub-1',
    ticketmasterId: 'event-1',
    name: 'Rock Show',
    imageUrl: 'https://example.com/image.jpg',
    description: null,
    startDate: '2026-09-01',
    startTime: '20:00:00',
    venueName: 'Arena',
    venueCity: 'São Paulo',
    venueStateCode: 'SP',
    currency: 'BRL',
    unitPrice: 150,
  };

  const publishedEvent = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };

  const seat = {
    findMany: jest.fn(),
  };

  const getEventById = jest.fn();
  const getEventImages = jest.fn();

  beforeEach(async () => {
    publishedEvent.findUnique.mockReset();
    publishedEvent.findMany.mockReset();
    publishedEvent.count.mockReset();
    seat.findMany.mockReset();
    getEventById.mockReset();
    getEventImages.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: TicketmasterService,
          useValue: {
            getEventById,
            getEventImages,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            publishedEvent,
            seat,
          },
        },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  describe('searchEvents', () => {
    it('should return published events from the local cartaz', async () => {
      publishedEvent.count.mockResolvedValue(1);
      publishedEvent.findMany.mockResolvedValue([published]);

      const query: SearchEventsQueryDto = {
        keyword: 'rock',
        page: 0,
        size: 20,
      };
      const result = await service.searchEvents(query);

      expect(publishedEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { name: { contains: 'rock', mode: 'insensitive' } },
                  { venueName: { contains: 'rock', mode: 'insensitive' } },
                ],
              },
            ],
          },
        }),
      );
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        id: 'event-1',
        name: 'Rock Show',
        startDate: '2026-09-01',
      });
      expect(result.events[0].priceRanges).toEqual([
        { type: 'standard', currency: 'BRL', min: 150, max: 150 },
      ]);
      expect(result.page.totalElements).toBe(1);
    });

    it('should filter published events by state', async () => {
      publishedEvent.count.mockResolvedValue(0);
      publishedEvent.findMany.mockResolvedValue([]);

      await service.searchEvents({
        stateCode: 'SP',
        page: 0,
        size: 20,
      });

      expect(publishedEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [{ venueStateCode: 'SP' }],
          },
        }),
      );
    });
  });

  describe('getEventById', () => {
    it('should return a published event even if Ticketmaster is unavailable', async () => {
      publishedEvent.findUnique.mockResolvedValue(published);
      getEventById.mockRejectedValue(new Error('network'));

      const result = await service.getEventById('event-1');

      expect(result.name).toBe('Rock Show');
      expect(result.priceRanges[0].min).toBe(150);
    });

    it('should hide unpublished catalog events from clients', async () => {
      publishedEvent.findUnique.mockResolvedValue(null);

      await expect(service.getEventById('event-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEventSeating', () => {
    it('should load seats only for published events', async () => {
      publishedEvent.findUnique.mockResolvedValue(published);
      seat.findMany.mockResolvedValue([
        { id: 's1', row: 'A', number: 1, status: 'AVAILABLE' },
      ]);

      const result = await service.getEventSeating('event-1');

      expect(result.availableCount).toBe(1);
      expect(result.event.unitPrice).toBe(150);
    });
  });

  describe('getEventImages', () => {
    it('should return event images', async () => {
      getEventImages.mockResolvedValue({
        images: [{ url: 'https://example.com/image.jpg', ratio: '16_9' }],
      });

      const result = await service.getEventImages('event-1');

      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toBe('https://example.com/image.jpg');
    });
  });
});
