import { Module } from '@nestjs/common';
import { TicketmasterModule } from 'modules/service/ticketmaster/ticketmaster.module';
import { AttractionsController } from './attractions.controller';
import { AttractionsService } from './attractions.service';

@Module({
  imports: [TicketmasterModule],
  controllers: [AttractionsController],
  providers: [AttractionsService],
  exports: [AttractionsService],
})
export class AttractionsModule {}
