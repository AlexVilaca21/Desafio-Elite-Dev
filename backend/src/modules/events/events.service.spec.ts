import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { SearchEventsQueryDto } from './dto/search-events-query.dto';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;

  const mockSearchResponse = {
    _embedded: {
      events: [
        {
          id: 'event-1',
          name: 'Rock Show',
          url: 'https://ticketmaster.com/event-1',
          images: [
            {
              url: 'https://example.com/image.jpg',
              ratio: '16_9',
              fallback: false,
            },
          ],
          dates: {
            start: { localDate: '2026-09-01', localTime: '20:00:00' },
            timezone: 'America/Sao_Paulo',
            status: { code: 'onsale' },
          },
          classifications: [
            {
              primary: true,
              segment: { id: '1', name: 'Music' },
              genre: { id: '2', name: 'Rock' },
            },
          ],
          _embedded: {
            venues: [
              {
                id: 'venue-1',
                name: 'Arena',
                city: { name: 'São Paulo' },
                state: { name: 'São Paulo', stateCode: 'SP' },
                country: { name: 'Brazil', countryCode: 'BR' },
              },
            ],
            attractions: [{ id: 'attr-1', name: 'Band X' }],
          },
        },
      ],
    },
    page: {
      size: 20,
      totalElements: 1,
      totalPages: 1,
      number: 0,
    },
  };

  const searchEvents = jest.fn();
  const getEventById = jest.fn();
  const getEventImages = jest.fn();

  beforeEach(async () => {
    searchEvents.mockReset();
    getEventById.mockReset();
    getEventImages.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: TicketmasterService,
          useValue: {
            searchEvents,
            getEventById,
            getEventImages,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            publishedEvent: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            seat: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  describe('searchEvents', () => {
    it('should return mapped events from Ticketmaster', async () => {
      searchEvents.mockResolvedValue(mockSearchResponse);

      const query: SearchEventsQueryDto = {
        keyword: 'rock',
        page: 0,
        size: 20,
      };
      const result = await service.searchEvents(query);

      expect(searchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'rock',
          countryCode: 'BR',
          size: 20,
          page: 0,
        }),
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toMatchObject({
        id: 'event-1',
        name: 'Rock Show',
        imageUrl: 'https://example.com/image.jpg',
        startDate: '2026-09-01',
        attractions: ['Band X'],
      });
      expect(result.events[0].venue).toMatchObject({
        name: 'Arena',
        city: 'São Paulo',
      });
      expect(result.page.totalElements).toBe(1);
    });

    it('should search events by state', async () => {
      searchEvents.mockResolvedValue(mockSearchResponse);

      await service.searchEvents({
        stateCode: 'SP',
        countryCode: 'BR',
        page: 0,
        size: 20,
      });

      expect(searchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          stateCode: 'SP',
          countryCode: 'BR',
        }),
      );
    });

    it('should skip default country when searching by venue', async () => {
      searchEvents.mockResolvedValue(mockSearchResponse);

      await service.searchEvents({
        venueId: 'venue-1',
        page: 0,
        size: 20,
      });

      expect(searchEvents).toHaveBeenCalledWith(
        expect.not.objectContaining({
          countryCode: 'BR',
        }),
      );
      expect(searchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          venueId: 'venue-1',
        }),
      );
    });
  });

  describe('getEventById', () => {
    it('should return event details', async () => {
      const eventDetail = {
        ...mockSearchResponse._embedded.events[0],
        description: 'A great show',
        priceRanges: [
          { type: 'standard', currency: 'BRL', min: 100, max: 300 },
        ],
      };

      getEventById.mockResolvedValue(eventDetail);

      const result = await service.getEventById('event-1');

      expect(getEventById).toHaveBeenCalledWith('event-1');
      expect(result.description).toBe('A great show');
      expect(result.priceRanges).toEqual([
        { type: 'standard', currency: 'BRL', min: 100, max: 300 },
      ]);
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
