import { Module } from '@nestjs/common';
import { TicketsModule } from 'modules/tickets/tickets.module';
import { EventsModule } from 'modules/events/events.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [TicketsModule, EventsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
