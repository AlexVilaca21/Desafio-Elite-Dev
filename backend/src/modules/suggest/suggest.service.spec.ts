import { Test, TestingModule } from '@nestjs/testing';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { SuggestService } from './suggest.service';

describe('SuggestService', () => {
  let service: SuggestService;
  const suggest = jest.fn();

  beforeEach(async () => {
    suggest.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestService,
        {
          provide: TicketmasterService,
          useValue: { suggest },
        },
      ],
    }).compile();

    service = module.get(SuggestService);
  });

  it('should return mapped suggestions', async () => {
    suggest.mockResolvedValue({
      _embedded: {
        events: [{ id: 'event-1', name: 'Rock Show' }],
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
    });

    const result = await service.suggest({ keyword: 'rock' });

    expect(suggest).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'rock',
        countryCode: 'BR',
      }),
    );
    expect(result.events[0].name).toBe('Rock Show');
    expect(result.venues[0].stateCode).toBe('SP');
    expect(result.attractions[0].name).toBe('Band X');
  });
});
