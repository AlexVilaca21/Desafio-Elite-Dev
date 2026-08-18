import { Test, TestingModule } from '@nestjs/testing';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketsService } from 'modules/tickets/tickets.service';
import { GateService } from './gate.service';

describe('GateService', () => {
  let service: GateService;

  const publishedEvent = {
    findMany: jest.fn(),
  };

  const ticketsService = {
    validate: jest.fn(),
  };

  beforeEach(async () => {
    publishedEvent.findMany.mockReset();
    ticketsService.validate.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GateService,
        { provide: PrismaService, useValue: { publishedEvent } },
        { provide: TicketsService, useValue: ticketsService },
      ],
    }).compile();

    service = module.get(GateService);
  });

  it('should list published events with ticket counts', async () => {
    publishedEvent.findMany.mockResolvedValue([
      {
        ticketmasterId: 'event-1',
        name: 'Rock in Rio',
        startDate: '2026-09-18',
        startTime: '20:00:00',
        venueName: 'Cidade do Rock',
        venueCity: 'Rio de Janeiro',
        venueStateCode: 'RJ',
        reservations: [
          {
            tickets: [
              { status: TicketStatus.VALID },
              { status: TicketStatus.USED },
            ],
          },
        ],
      },
    ]);

    const result = await service.listEvents();

    expect(result).toEqual([
      {
        id: 'event-1',
        name: 'Rock in Rio',
        startDate: '2026-09-18',
        startTime: '20:00:00',
        venueName: 'Cidade do Rock',
        venueCity: 'Rio de Janeiro',
        venueStateCode: 'RJ',
        validCount: 1,
        usedCount: 1,
      },
    ]);
  });

  it('should delegate validation to tickets', async () => {
    ticketsService.validate.mockResolvedValue({
      result: 'VALID',
      message: 'Ingresso válido',
    });

    const result = await service.validate({ code: 'ABC123' });

    expect(ticketsService.validate).toHaveBeenCalledWith({ code: 'ABC123' });
    expect(result.result).toBe('VALID');
  });
});
