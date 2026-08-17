import { Test, TestingModule } from '@nestjs/testing';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { AttractionsService } from './attractions.service';

describe('AttractionsService', () => {
  let service: AttractionsService;
  let ticketmasterService: jest.Mocked<TicketmasterService>;

  const mockAttraction = {
    id: 'attr-1',
    name: 'Band X',
    images: [{ url: 'https://example.com/band.jpg', ratio: '16_9' }],
    classifications: [
      {
        primary: true,
        segment: { id: '1', name: 'Music' },
        genre: { id: '2', name: 'Rock' },
      },
    ],
    upcomingEvents: { _total: 4 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttractionsService,
        {
          provide: TicketmasterService,
          useValue: {
            searchAttractions: jest.fn(),
            getAttractionById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AttractionsService);
    ticketmasterService = module.get(TicketmasterService);
  });

  it('should search attractions', async () => {
    ticketmasterService.searchAttractions.mockResolvedValue({
      _embedded: { attractions: [mockAttraction] },
      page: { size: 20, totalElements: 1, totalPages: 1, number: 0 },
    });

    const result = await service.searchAttractions({
      keyword: 'band',
      size: 20,
      page: 0,
    });

    expect(result.attractions[0]).toEqual(
      expect.objectContaining({
        id: 'attr-1',
        name: 'Band X',
        upcomingEvents: 4,
      }),
    );
  });

  it('should get attraction by id', async () => {
    ticketmasterService.getAttractionById.mockResolvedValue(mockAttraction);

    const result = await service.getAttractionById('attr-1');

    expect(result.name).toBe('Band X');
  });
});
