import { Test, TestingModule } from '@nestjs/testing';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { ClassificationsService } from './classifications.service';

describe('ClassificationsService', () => {
  let service: ClassificationsService;
  let ticketmasterService: jest.Mocked<TicketmasterService>;

  const mockClassification = {
    segment: {
      id: 'seg-1',
      name: 'Music',
      _embedded: {
        genres: [
          {
            id: 'gen-1',
            name: 'Rock',
            _embedded: {
              subgenres: [{ id: 'sub-1', name: 'Alternative Rock' }],
            },
          },
        ],
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassificationsService,
        {
          provide: TicketmasterService,
          useValue: {
            searchClassifications: jest.fn(),
            getClassificationById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ClassificationsService);
    ticketmasterService = module.get(TicketmasterService);
  });

  it('should search classifications', async () => {
    ticketmasterService.searchClassifications.mockResolvedValue({
      _embedded: { classifications: [mockClassification] },
      page: { size: 20, totalElements: 1, totalPages: 1, number: 0 },
    });

    const result = await service.searchClassifications({ size: 20, page: 0 });

    expect(result.classifications[0]).toEqual({
      id: 'seg-1',
      name: 'Music',
      genres: [
        {
          id: 'gen-1',
          name: 'Rock',
          subGenres: [{ id: 'sub-1', name: 'Alternative Rock' }],
        },
      ],
    });
  });

  it('should get classification by id', async () => {
    ticketmasterService.getClassificationById.mockResolvedValue(
      mockClassification,
    );

    const result = await service.getClassificationById('seg-1');

    expect(result.name).toBe('Music');
  });
});
