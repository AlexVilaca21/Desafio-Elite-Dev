import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'modules/prisma/prisma.service';
import { TicketsService } from 'modules/tickets/tickets.service';
import {
  CreateReservationDto,
  PaymentOutcome,
} from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
  ) {}

  async create(
    userId: string,
    dto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    const event = await this.prisma.publishedEvent.findUnique({
      where: { ticketmasterId: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException(
        'Evento ainda não tem mapa de assentos. Abra a página de compra primeiro.',
      );
    }

    const uniqueSeatIds = [...new Set(dto.seatIds)];
    const seats = await this.prisma.seat.findMany({
      where: {
        id: { in: uniqueSeatIds },
        eventId: event.id,
      },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });

    if (seats.length !== uniqueSeatIds.length) {
      throw new NotFoundException(
        'Um ou mais lugares não pertencem a este evento',
      );
    }

    const total = Number(event.unitPrice) * seats.length;

    if (dto.paymentOutcome === PaymentOutcome.DECLINE) {
      const reservation = await this.prisma.reservation.create({
        data: {
          eventId: event.id,
          userId,
          status: 'REFUSED',
          total,
          currency: event.currency,
        },
      });

      return {
        id: reservation.id,
        status: 'REFUSED',
        eventId: event.ticketmasterId,
        eventName: event.name,
        total,
        currency: event.currency,
        seats: seats.map((seat) => ({
          id: seat.id,
          row: seat.row,
          number: seat.number,
        })),
        tickets: [],
        message: 'Pagamento recusado. Os lugares continuam disponíveis.',
      };
    }

    const reservation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.reservation.create({
        data: {
          eventId: event.id,
          userId,
          status: 'PAID',
          total,
          currency: event.currency,
        },
      });

      const updated = await tx.seat.updateMany({
        where: {
          id: { in: uniqueSeatIds },
          eventId: event.id,
          status: 'AVAILABLE',
        },
        data: {
          status: 'SOLD',
          reservationId: created.id,
        },
      });

      if (updated.count !== uniqueSeatIds.length) {
        throw new ConflictException(
          'Um ou mais lugares já foram vendidos. Escolha outros assentos.',
        );
      }

      const tickets = await this.ticketsService.createForSeats(tx, {
        userId,
        reservationId: created.id,
        seats,
      });

      return { created, tickets };
    });

    const ticketDtos = await Promise.all(
      reservation.tickets.map((ticket) => {
        const seat = seats.find((item) => item.id === ticket.seatId);

        if (!seat) {
          throw new NotFoundException('Assento do ingresso não encontrado');
        }

        return this.ticketsService.toDto({
          ...ticket,
          seat,
          reservation: { event },
        });
      }),
    );

    return {
      id: reservation.created.id,
      status: 'PAID',
      eventId: event.ticketmasterId,
      eventName: event.name,
      total,
      currency: event.currency,
      seats: seats.map((seat) => ({
        id: seat.id,
        row: seat.row,
        number: seat.number,
      })),
      tickets: ticketDtos.map((ticket) => ({
        id: ticket.id,
        code: ticket.code,
        qrPayload: ticket.qrPayload,
        qrImage: ticket.qrImage,
        shareToken: ticket.shareToken,
        seat: ticket.seat,
      })),
      message: 'Pagamento confirmado. Seus ingressos foram gerados.',
    };
  }
}
