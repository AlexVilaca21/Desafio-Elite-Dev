import { Injectable } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from 'modules/prisma/prisma.service';
import { ValidateTicketResponseDto } from 'modules/tickets/dto/ticket.dto';
import { ValidateTicketDto } from 'modules/tickets/dto/validate-ticket.dto';
import { TicketsService } from 'modules/tickets/tickets.service';
import { GateEventDto } from './dto/gate-event.dto';

@Injectable()
export class GateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
  ) {}

  async listEvents(): Promise<GateEventDto[]> {
    const events = await this.prisma.publishedEvent.findMany({
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
      include: {
        reservations: {
          select: {
            tickets: {
              select: { status: true },
            },
          },
        },
      },
    });

    return events.map((event) => {
      const tickets = event.reservations.flatMap(
        (reservation) => reservation.tickets,
      );

      return {
        id: event.ticketmasterId,
        name: event.name,
        startDate: event.startDate ?? undefined,
        startTime: event.startTime ?? undefined,
        venueName: event.venueName ?? undefined,
        venueCity: event.venueCity ?? undefined,
        venueStateCode: event.venueStateCode ?? undefined,
        validCount: tickets.filter(
          (ticket) => ticket.status === TicketStatus.VALID,
        ).length,
        usedCount: tickets.filter(
          (ticket) => ticket.status === TicketStatus.USED,
        ).length,
      };
    });
  }

  validate(dto: ValidateTicketDto): Promise<ValidateTicketResponseDto> {
    return this.ticketsService.validate(dto);
  }
}
