import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SeatingLiveService } from 'modules/events/seating-live.service';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketsService } from 'modules/tickets/tickets.service';
import { PaymentOutcome } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const event = {
    id: 'published-1',
    ticketmasterId: 'event-1',
    name: 'Rock Show',
    unitPrice: 80,
    currency: 'BRL',
  };

  const seats = [
    { id: '11111111-1111-4111-8111-111111111111', row: 'A', number: 1 },
    { id: '22222222-2222-4222-8222-222222222222', row: 'A', number: 2 },
  ];

  const publishedEvent = { findUnique: jest.fn() };
  const seat = { findMany: jest.fn(), updateMany: jest.fn() };
  const reservation = { create: jest.fn() };
  const transaction = jest.fn();
  const ticketsService = {
    createForSeats: jest.fn(),
    toDto: jest.fn(),
  };
  const seatingLive = { notify: jest.fn() };

  beforeEach(async () => {
    publishedEvent.findUnique.mockReset();
    seat.findMany.mockReset();
    seat.updateMany.mockReset();
    reservation.create.mockReset();
    transaction.mockReset();
    ticketsService.createForSeats.mockReset();
    ticketsService.toDto.mockReset();
    seatingLive.notify.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: PrismaService,
          useValue: {
            publishedEvent,
            seat,
            reservation,
            $transaction: transaction,
          },
        },
        { provide: TicketsService, useValue: ticketsService },
        { provide: SeatingLiveService, useValue: seatingLive },
      ],
    }).compile();

    service = module.get(ReservationsService);
  });

  it('should refuse payment without selling seats', async () => {
    publishedEvent.findUnique.mockResolvedValue(event);
    seat.findMany.mockResolvedValue(seats);
    reservation.create.mockResolvedValue({ id: 'res-refused' });

    const result = await service.create('user-1', {
      eventId: 'event-1',
      seatIds: seats.map((item) => item.id),
      paymentOutcome: PaymentOutcome.DECLINE,
    });

    expect(result.status).toBe('REFUSED');
    expect(result.tickets).toEqual([]);
    expect(transaction).not.toHaveBeenCalled();
    expect(result.message).toContain('recusado');
    expect(seatingLive.notify).not.toHaveBeenCalled();
  });

  it('should confirm payment, lock seats and issue tickets', async () => {
    publishedEvent.findUnique.mockResolvedValue(event);
    seat.findMany.mockResolvedValue(seats);
    transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback({
        reservation: {
          create: jest.fn().mockResolvedValue({ id: 'res-paid' }),
        },
        seat: {
          updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      }),
    );
    ticketsService.createForSeats.mockResolvedValue([
      { id: 'ticket-1', code: 'AAA111', seatId: seats[0].id, shareToken: 's1' },
      { id: 'ticket-2', code: 'BBB222', seatId: seats[1].id, shareToken: 's2' },
    ]);
    ticketsService.toDto
      .mockResolvedValueOnce({
        id: 'ticket-1',
        code: 'AAA111',
        qrPayload: 'AAA111.sig',
        qrImage: 'data:image/png;base64,a',
        shareToken: 's1',
        seat: seats[0],
      })
      .mockResolvedValueOnce({
        id: 'ticket-2',
        code: 'BBB222',
        qrPayload: 'BBB222.sig',
        qrImage: 'data:image/png;base64,b',
        shareToken: 's2',
        seat: seats[1],
      });

    const result = await service.create('user-1', {
      eventId: 'event-1',
      seatIds: seats.map((item) => item.id),
      paymentOutcome: PaymentOutcome.APPROVE,
    });

    expect(result.status).toBe('PAID');
    expect(result.total).toBe(160);
    expect(result.tickets).toHaveLength(2);
    expect(ticketsService.createForSeats).toHaveBeenCalled();
    expect(seatingLive.notify).toHaveBeenCalledWith('event-1');
  });

  it('should reject double booking', async () => {
    publishedEvent.findUnique.mockResolvedValue(event);
    seat.findMany.mockResolvedValue(seats);
    transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback({
        reservation: {
          create: jest.fn().mockResolvedValue({ id: 'res-paid' }),
        },
        seat: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      }),
    );

    await expect(
      service.create('user-1', {
        eventId: 'event-1',
        seatIds: seats.map((item) => item.id),
        paymentOutcome: PaymentOutcome.APPROVE,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw when event has no seating yet', async () => {
    publishedEvent.findUnique.mockResolvedValue(null);

    await expect(
      service.create('user-1', {
        eventId: 'missing',
        seatIds: [seats[0].id],
        paymentOutcome: PaymentOutcome.APPROVE,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
