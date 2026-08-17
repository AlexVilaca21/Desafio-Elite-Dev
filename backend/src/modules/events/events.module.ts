import { Module } from '@nestjs/common';
import { TicketmasterModule } from 'modules/service/ticketmaster/ticketmaster.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [TicketmasterModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
