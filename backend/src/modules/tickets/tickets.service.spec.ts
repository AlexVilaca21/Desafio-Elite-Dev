import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, SeatStatus, TicketStatus } from '@prisma/client';
import { SeatingLiveService } from 'modules/events/seating-live.service';
import { PrismaService } from 'modules/prisma/prisma.service';
import { QrCodeService } from './qr-code.service';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;

  const ticket = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  };

  const seat = {
    update: jest.fn(),
  };

  const $transaction = jest.fn(
    async (callback: (tx: { ticket: typeof ticket; seat: typeof seat }) => Promise<unknown>) =>
      callback({ ticket, seat }),
  );

  const seatingLive = { notify: jest.fn() };

  const qrCodeService = {
    generateCode: jest.fn().mockReturnValue('CODE12'),
    generateShareToken: jest.fn().mockReturnValue('share-token'),
    sign: jest.fn().mockReturnValue('CODE12.signature'),
    verify: jest.fn(),
    toDataUrl: jest.fn().mockResolvedValue('data:image/png;base64,qr'),
  };

  const event = {
    ticketmasterId: 'event-1',
    name: 'Rock Show',
    imageUrl: null,
    startDate: '2026-09-01',
    startTime: '20:00:00',
    venueName: 'Arena',
    venueCity: 'São Paulo',
    venueStateCode: 'SP',
  };

  const storedTicket = {
    id: 'ticket-1',
    code: 'CODE12',
    shareToken: 'share-token',
    status: TicketStatus.VALID,
    usedAt: null,
    cancelledAt: null,
    userId: 'user-1',
    seatId: 'seat-1',
    seatRow: 'A',
    seatNumber: 1,
    createdAt: new Date('2026-08-17T12:00:00.000Z'),
    seat: { id: 'seat-1', row: 'A', number: 1 },
    reservation: { event },
  };

  beforeEach(async () => {
    ticket.findMany.mockReset();
    ticket.findUnique.mockReset();
    ticket.findUniqueOrThrow.mockReset();
    ticket.updateMany.mockReset();
    ticket.create.mockReset();
    seat.update.mockReset();
    $transaction.mockClear();
    seatingLive.notify.mockReset();
    qrCodeService.verify.mockReset();
    qrCodeService.sign.mockClear();
    qrCodeService.toDataUrl.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: { ticket, seat, $transaction } },
        { provide: QrCodeService, useValue: qrCodeService },
        { provide: SeatingLiveService, useValue: seatingLive },
      ],
    }).compile();

    service = module.get(TicketsService);
  });

  it('should list tickets of the authenticated client', async () => {
    ticket.findMany.mockResolvedValue([storedTicket]);

    const result = await service.listMine('user-1');

    expect(ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(result[0].code).toBe('CODE12');
    expect(result[0].qrImage).toContain('data:image/png');
  });

  it('should block another client from viewing a ticket', async () => {
    ticket.findUnique.mockResolvedValue(storedTicket);

    await expect(
      service.findOne('ticket-1', {
        id: 'user-2',
        name: 'Bruno',
        email: 'bruno@elite.dev',
        role: Role.CLIENT,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should validate a signed qr payload once', async () => {
    qrCodeService.verify.mockReturnValue('CODE12');
    ticket.findUnique
      .mockResolvedValueOnce(storedTicket)
      .mockResolvedValueOnce({
        ...storedTicket,
        status: TicketStatus.USED,
        usedAt: new Date('2026-08-17T20:00:00.000Z'),
      });
    ticket.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.validate({ qrPayload: 'CODE12.signature' });

    expect(result.result).toBe('VALID');
    expect(ticket.updateMany).toHaveBeenCalled();
  });

  it('should reject a used ticket', async () => {
    qrCodeService.verify.mockReturnValue('CODE12');
    ticket.findUnique.mockResolvedValue({
      ...storedTicket,
      status: TicketStatus.USED,
      usedAt: new Date(),
    });

    const result = await service.validate({ qrPayload: 'CODE12.signature' });

    expect(result.result).toBe('ALREADY_USED');
  });

  it('should reject a ticket from another event', async () => {
    ticket.findUnique.mockResolvedValue(storedTicket);

    const result = await service.validate({
      code: 'CODE12',
      eventId: 'other-event',
    });

    expect(result.result).toBe('WRONG_EVENT');
  });

  it('should require a payload or a code', async () => {
    await expect(service.validate({})).rejects.toThrow(BadRequestException);
  });

  it('should reject a forged qr payload', async () => {
    qrCodeService.verify.mockReturnValue(null);

    const result = await service.validate({ qrPayload: 'CODE12.forged' });

    expect(result.result).toBe('INVALID');
  });

  it('should verify a signed payload typed as the ticket code', async () => {
    qrCodeService.verify.mockReturnValue('CODE12');
    ticket.findUnique
      .mockResolvedValueOnce(storedTicket)
      .mockResolvedValueOnce({
        ...storedTicket,
        status: TicketStatus.USED,
        usedAt: new Date('2026-08-17T20:00:00.000Z'),
      });
    ticket.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.validate({ code: 'CODE12.signature' });

    expect(qrCodeService.verify).toHaveBeenCalledWith('CODE12.signature');
    expect(result.result).toBe('VALID');
  });

  it('should cancel a valid ticket and return the seat to stock', async () => {
    ticket.findUnique.mockResolvedValue(storedTicket);
    ticket.updateMany.mockResolvedValue({ count: 1 });
    ticket.findUniqueOrThrow.mockResolvedValue({
      ...storedTicket,
      status: TicketStatus.CANCELLED,
      cancelledAt: new Date('2026-08-18T21:00:00.000Z'),
      seatId: null,
      seat: null,
    });

    const result = await service.cancel('ticket-1', 'user-1');

    expect(ticket.updateMany).toHaveBeenCalledWith({
      where: { id: 'ticket-1', status: TicketStatus.VALID },
      data: {
        status: TicketStatus.CANCELLED,
        cancelledAt: expect.any(Date),
        seatId: null,
      },
    });
    expect(seat.update).toHaveBeenCalledWith({
      where: { id: 'seat-1' },
      data: { status: SeatStatus.AVAILABLE, reservationId: null },
    });
    expect(result.status).toBe(TicketStatus.CANCELLED);
    expect(result.qrImage).toBe('');
    expect(result.seat).toEqual({ id: '', row: 'A', number: 1 });
    expect(seatingLive.notify).toHaveBeenCalledWith('event-1');
  });

  it('should not cancel a used ticket', async () => {
    ticket.findUnique.mockResolvedValue({
      ...storedTicket,
      status: TicketStatus.USED,
    });

    await expect(service.cancel('ticket-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(seat.update).not.toHaveBeenCalled();
  });

  it('should treat a cancelled ticket as invalid at the gate', async () => {
    qrCodeService.verify.mockReturnValue('CODE12');
    ticket.findUnique.mockResolvedValue({
      ...storedTicket,
      status: TicketStatus.CANCELLED,
    });

    const result = await service.validate({ qrPayload: 'CODE12.signature' });

    expect(result.result).toBe('INVALID');
    expect(result.message).toMatch(/cancelado/i);
  });

  it('should not cancel a ticket that already was cancelled', async () => {
    ticket.findUnique.mockResolvedValue({
      ...storedTicket,
      status: TicketStatus.CANCELLED,
      seatId: null,
      seat: null,
    });

    await expect(service.cancel('ticket-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(seat.update).not.toHaveBeenCalled();
  });
});
