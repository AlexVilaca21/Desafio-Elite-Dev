import { Test, TestingModule } from '@nestjs/testing';
import { EventSortOrder } from './dto/search-events-query.dto';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;

  const mockSearchResult = {
    events: [
      {
        id: 'event-1',
        name: 'Rock Show',
        attractions: ['Band X'],
      },
    ],
    page: {
      size: 20,
      totalElements: 1,
      totalPages: 1,
      number: 0,
    },
  };

  const mockEventDetail = {
    id: 'event-1',
    name: 'Rock Show',
    description: 'Details',
    attractions: ['Band X'],
  };

  const searchEvents = jest.fn().mockResolvedValue(mockSearchResult);
  const getEventById = jest.fn().mockResolvedValue(mockEventDetail);
  const getEventImages = jest.fn().mockResolvedValue({ images: [] });

  beforeEach(async () => {
    searchEvents.mockClear();
    getEventById.mockClear();
    getEventImages.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: {
            searchEvents,
            getEventById,
            getEventImages,
          },
        },
      ],
    }).compile();

    controller = module.get(EventsController);
  });

  describe('searchEvents', () => {
    it('should delegate search to EventsService', async () => {
      const query = {
        keyword: 'rock',
        city: 'São Paulo',
        stateCode: 'SP',
        sort: EventSortOrder.DATE_ASC,
      };

      const result = await controller.searchEvents(query);

      expect(searchEvents).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockSearchResult);
    });
  });

  describe('getEventById', () => {
    it('should delegate get by id to EventsService', async () => {
      const result = await controller.getEventById('event-1');

      expect(getEventById).toHaveBeenCalledWith('event-1');
      expect(result).toEqual(mockEventDetail);
    });
  });

  describe('getEventImages', () => {
    it('should delegate images to EventsService', async () => {
      await controller.getEventImages('event-1');
      expect(getEventImages).toHaveBeenCalledWith('event-1');
    });
  });
});
