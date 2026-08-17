import { Test, TestingModule } from '@nestjs/testing';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { SearchEventsQueryDto } from './dto/search-events-query.dto';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  let ticketmasterService: jest.Mocked<TicketmasterService>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: TicketmasterService,
          useValue: {
            searchEvents: jest.fn(),
            getEventById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EventsService);
    ticketmasterService = module.get(TicketmasterService);
  });

  describe('searchEvents', () => {
    it('should return mapped events from Ticketmaster', async () => {
      ticketmasterService.searchEvents.mockResolvedValue(mockSearchResponse);

      const query: SearchEventsQueryDto = {
        keyword: 'rock',
        page: 0,
        size: 20,
      };
      const result = await service.searchEvents(query);

      expect(ticketmasterService.searchEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'rock',
          countryCode: 'BR',
          size: 20,
          page: 0,
        }),
      );

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual(
        expect.objectContaining({
          id: 'event-1',
          name: 'Rock Show',
          imageUrl: 'https://example.com/image.jpg',
          startDate: '2026-09-01',
          attractions: ['Band X'],
          venue: expect.objectContaining({ name: 'Arena', city: 'São Paulo' }),
        }),
      );
      expect(result.page.totalElements).toBe(1);
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

      ticketmasterService.getEventById.mockResolvedValue(eventDetail);

      const result = await service.getEventById('event-1');

      expect(ticketmasterService.getEventById).toHaveBeenCalledWith('event-1');
      expect(result.description).toBe('A great show');
      expect(result.priceRanges).toEqual([
        { type: 'standard', currency: 'BRL', min: 100, max: 300 },
      ]);
    });
  });
});
