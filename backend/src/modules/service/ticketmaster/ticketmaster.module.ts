import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TicketmasterService } from './ticketmaster.service';

@Module({
  imports: [HttpModule],
  providers: [TicketmasterService],
  exports: [TicketmasterService],
})
export class TicketmasterModule {}
