import { Module } from '@nestjs/common';
import { TicketmasterModule } from 'modules/service/ticketmaster/ticketmaster.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { SeatingLiveService } from './seating-live.service';

@Module({
  imports: [TicketmasterModule],
  controllers: [EventsController],
  providers: [EventsService, SeatingLiveService],
  exports: [EventsService, SeatingLiveService],
})
export class EventsModule {}
