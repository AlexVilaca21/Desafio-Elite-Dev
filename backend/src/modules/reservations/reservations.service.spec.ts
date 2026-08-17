import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'modules/prisma/prisma.service';
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

  beforeEach(async () => {
    publishedEvent.findUnique.mockReset();
    seat.findMany.mockReset();
    seat.updateMany.mockReset();
    reservation.create.mockReset();
    transaction.mockReset();

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
      ],
    }).compile();

    service = module.get(ReservationsService);
  });

  it('should refuse payment without selling seats', async () => {
    publishedEvent.findUnique.mockResolvedValue(event);
    seat.findMany.mockResolvedValue(seats);
    reservation.create.mockResolvedValue({ id: 'res-refused' });

    const result = await service.create({
      eventId: 'event-1',
      seatIds: seats.map((item) => item.id),
      paymentOutcome: PaymentOutcome.DECLINE,
    });

    expect(result.status).toBe('REFUSED');
    expect(transaction).not.toHaveBeenCalled();
    expect(result.message).toContain('recusado');
  });

  it('should confirm payment and lock seats', async () => {
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

    const result = await service.create({
      eventId: 'event-1',
      seatIds: seats.map((item) => item.id),
      paymentOutcome: PaymentOutcome.APPROVE,
    });

    expect(result.status).toBe('PAID');
    expect(result.total).toBe(160);
    expect(result.seats).toHaveLength(2);
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
      service.create({
        eventId: 'event-1',
        seatIds: seats.map((item) => item.id),
        paymentOutcome: PaymentOutcome.APPROVE,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw when event has no seating yet', async () => {
    publishedEvent.findUnique.mockResolvedValue(null);

    await expect(
      service.create({
        eventId: 'missing',
        seatIds: [seats[0].id],
        paymentOutcome: PaymentOutcome.APPROVE,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
