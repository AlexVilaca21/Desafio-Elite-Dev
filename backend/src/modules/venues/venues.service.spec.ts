import { Test, TestingModule } from '@nestjs/testing';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { VenuesService } from './venues.service';

describe('VenuesService', () => {
  let service: VenuesService;

  const mockVenue = {
    id: 'venue-1',
    name: 'Arena',
    city: { name: 'São Paulo' },
    state: { name: 'São Paulo', stateCode: 'SP' },
    country: { name: 'Brazil', countryCode: 'BR' },
  };

  const searchVenues = jest.fn();
  const getVenueById = jest.fn();

  beforeEach(async () => {
    searchVenues.mockReset();
    getVenueById.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenuesService,
        {
          provide: TicketmasterService,
          useValue: {
            searchVenues,
            getVenueById,
          },
        },
      ],
    }).compile();

    service = module.get(VenuesService);
  });

  it('should search venues by state', async () => {
    searchVenues.mockResolvedValue({
      _embedded: { venues: [mockVenue] },
      page: { size: 20, totalElements: 1, totalPages: 1, number: 0 },
    });

    const result = await service.searchVenues({
      stateCode: 'SP',
      countryCode: 'BR',
      size: 20,
      page: 0,
    });

    expect(searchVenues).toHaveBeenCalledWith(
      expect.objectContaining({
        stateCode: 'SP',
        countryCode: 'BR',
      }),
    );
    expect(result.venues).toHaveLength(1);
    expect(result.venues[0]).toMatchObject({
      id: 'venue-1',
      name: 'Arena',
      city: 'São Paulo',
      stateCode: 'SP',
    });
  });

  it('should get venue by id', async () => {
    getVenueById.mockResolvedValue(mockVenue);

    const result = await service.getVenueById('venue-1');

    expect(result.name).toBe('Arena');
  });
});
