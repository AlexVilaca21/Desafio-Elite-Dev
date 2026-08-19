import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PublishedEvent,
  Seat,
  SeatStatus,
  Ticket,
  TicketStatus,
} from '@prisma/client';
import { AuthUser } from 'modules/auth/types/auth-user';
import { SeatingLiveService } from 'modules/events/seating-live.service';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketResponseDto, ValidateTicketResponseDto } from './dto/ticket.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { QrCodeService } from './qr-code.service';

type TicketWithRelations = Ticket & {
  seat: Seat | null;
  reservation: {
    event: PublishedEvent;
  };
};

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrCodeService: QrCodeService,
    private readonly seatingLive: SeatingLiveService,
  ) {}

  async createForSeats(
    tx: Prisma.TransactionClient,
    params: {
      userId: string;
      reservationId: string;
      seats: Seat[];
    },
  ): Promise<Ticket[]> {
    const tickets: Ticket[] = [];

    for (const seat of params.seats) {
      const ticket = await tx.ticket.create({
        data: {
          code: this.qrCodeService.generateCode(),
          shareToken: this.qrCodeService.generateShareToken(),
          userId: params.userId,
          reservationId: params.reservationId,
          seatId: seat.id,
          seatRow: seat.row,
          seatNumber: seat.number,
        },
      });

      tickets.push(ticket);
    }

    return tickets;
  }

  async listMine(userId: string): Promise<TicketResponseDto[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { userId },
      include: {
        seat: true,
        reservation: { include: { event: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(tickets.map((ticket) => this.toDto(ticket)));
  }

  async findOne(id: string, user: AuthUser): Promise<TicketResponseDto> {
    const ticket = await this.findWithRelations(id);
    this.assertCanView(ticket, user);
    return this.toDto(ticket);
  }

  async findByShareToken(token: string): Promise<TicketResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { shareToken: token },
      include: {
        seat: true,
        reservation: { include: { event: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Link de ingresso inválido');
    }

    return this.toDto(ticket);
  }

  async share(id: string, userId: string): Promise<{ shareToken: string }> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      throw new NotFoundException('Ingresso não encontrado');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('Este ingresso não pertence a você');
    }

    if (ticket.status !== TicketStatus.VALID) {
      throw new BadRequestException(
        'Só é possível compartilhar um ingresso válido',
      );
    }

    return { shareToken: ticket.shareToken };
  }

  async cancel(id: string, userId: string): Promise<TicketResponseDto> {
    const ticket = await this.findWithRelations(id);

    if (ticket.userId !== userId) {
      throw new ForbiddenException('Este ingresso não pertence a você');
    }

    if (ticket.status === TicketStatus.USED) {
      throw new BadRequestException(
        'Ingresso já foi usado na portaria e não pode ser cancelado',
      );
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Este ingresso já foi cancelado');
    }

    if (!ticket.seatId) {
      throw new ConflictException(
        'Não foi possível devolver o lugar deste ingresso',
      );
    }

    const seatId = ticket.seatId;

    const cancelled = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.updateMany({
        where: { id: ticket.id, status: TicketStatus.VALID },
        data: {
          status: TicketStatus.CANCELLED,
          cancelledAt: new Date(),
          seatId: null,
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException(
          'Não foi possível cancelar o ingresso. Tente novamente.',
        );
      }

      await tx.seat.update({
        where: { id: seatId },
        data: {
          status: SeatStatus.AVAILABLE,
          reservationId: null,
        },
      });

      return tx.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: {
          seat: true,
          reservation: { include: { event: true } },
        },
      });
    });

    void this.seatingLive.notify(cancelled.reservation.event.ticketmasterId);

    return this.toDto(cancelled);
  }

  async validate(dto: ValidateTicketDto): Promise<ValidateTicketResponseDto> {
    if (!dto.qrPayload && !dto.code) {
      throw new BadRequestException(
        'Informe o QR code ou o código do ingresso',
      );
    }

    const code = this.resolveCode(dto);

    if (!code) {
      return {
        result: 'INVALID',
        message: 'Ingresso inválido',
      };
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        seat: true,
        reservation: { include: { event: true } },
      },
    });

    if (!ticket) {
      return {
        result: 'INVALID',
        message: 'Ingresso inválido',
      };
    }

    if (
      dto.eventId &&
      ticket.reservation.event.ticketmasterId !== dto.eventId
    ) {
      return {
        result: 'WRONG_EVENT',
        message: 'Este ingresso é de outro evento',
      };
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      return {
        result: 'INVALID',
        message: 'Este ingresso foi cancelado',
      };
    }

    if (ticket.status === TicketStatus.USED) {
      return {
        result: 'ALREADY_USED',
        message: 'Ingresso já utilizado',
        usedAt: ticket.usedAt?.toISOString(),
      };
    }

    const updated = await this.prisma.ticket.updateMany({
      where: { id: ticket.id, status: TicketStatus.VALID },
      data: { status: TicketStatus.USED, usedAt: new Date() },
    });

    if (updated.count !== 1) {
      return {
        result: 'ALREADY_USED',
        message: 'Ingresso já utilizado',
      };
    }

    const fresh = await this.findWithRelations(ticket.id);

    return {
      result: 'VALID',
      message: 'Ingresso válido',
      ticket: await this.toDto(fresh),
    };
  }

  async toDto(ticket: TicketWithRelations): Promise<TicketResponseDto> {
    const cancelled = ticket.status === TicketStatus.CANCELLED;
    const qrPayload = cancelled ? '' : this.qrCodeService.sign(ticket.code);
    const qrImage = cancelled
      ? ''
      : await this.qrCodeService.toDataUrl(qrPayload);
    const event = ticket.reservation.event;

    return {
      id: ticket.id,
      code: ticket.code,
      status: ticket.status,
      qrPayload,
      qrImage,
      shareToken: ticket.shareToken,
      usedAt: ticket.usedAt?.toISOString(),
      cancelledAt: ticket.cancelledAt?.toISOString(),
      createdAt: ticket.createdAt.toISOString(),
      event: {
        id: event.ticketmasterId,
        name: event.name,
        imageUrl: event.imageUrl ?? undefined,
        startDate: event.startDate ?? undefined,
        startTime: event.startTime ?? undefined,
        venueName: event.venueName ?? undefined,
        venueCity: event.venueCity ?? undefined,
        venueStateCode: event.venueStateCode ?? undefined,
      },
      seat: {
        id: ticket.seat?.id ?? ticket.seatId ?? '',
        row: ticket.seatRow,
        number: ticket.seatNumber,
      },
    };
  }

  private resolveCode(dto: ValidateTicketDto): string | null {
    const raw = (dto.qrPayload ?? dto.code ?? '').trim();

    if (!raw) {
      return null;
    }

    if (raw.includes('.')) {
      return this.qrCodeService.verify(raw);
    }

    return raw.toUpperCase();
  }

  private async findWithRelations(id: string): Promise<TicketWithRelations> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        seat: true,
        reservation: { include: { event: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ingresso não encontrado');
    }

    return ticket;
  }

  private assertCanView(ticket: Ticket, user: AuthUser): void {
    if (user.role === 'GATE' || user.role === 'ORGANIZER') {
      return;
    }

    if (ticket.userId !== user.id) {
      throw new ForbiddenException('Este ingresso não pertence a você');
    }
  }
}
