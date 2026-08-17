import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'modules/prisma/prisma.service';
import {
  CreateReservationDto,
  PaymentOutcome,
} from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReservationDto): Promise<ReservationResponseDto> {
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
        message: 'Pagamento recusado. Os lugares continuam disponíveis.',
      };
    }

    const reservation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.reservation.create({
        data: {
          eventId: event.id,
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

      return created;
    });

    return {
      id: reservation.id,
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
      message: 'Pagamento confirmado. Seus lugares estão reservados.',
    };
  }
}
