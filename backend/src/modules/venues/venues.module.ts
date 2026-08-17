import { Module } from '@nestjs/common';
import { TicketmasterModule } from 'modules/service/ticketmaster/ticketmaster.module';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
  imports: [TicketmasterModule],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
