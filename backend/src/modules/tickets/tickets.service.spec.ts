import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, TicketStatus } from '@prisma/client';
import { PrismaService } from 'modules/prisma/prisma.service';
import { QrCodeService } from './qr-code.service';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;

  const ticket = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  };

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
    userId: 'user-1',
    createdAt: new Date('2026-08-17T12:00:00.000Z'),
    seat: { id: 'seat-1', row: 'A', number: 1 },
    reservation: { event },
  };

  beforeEach(async () => {
    ticket.findMany.mockReset();
    ticket.findUnique.mockReset();
    ticket.updateMany.mockReset();
    ticket.create.mockReset();
    qrCodeService.verify.mockReset();
    qrCodeService.sign.mockClear();
    qrCodeService.toDataUrl.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: { ticket } },
        { provide: QrCodeService, useValue: qrCodeService },
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
});
