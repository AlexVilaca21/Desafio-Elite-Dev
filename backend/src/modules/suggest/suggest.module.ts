import { Module } from '@nestjs/common';
import { TicketmasterModule } from 'modules/service/ticketmaster/ticketmaster.module';
import { SuggestController } from './suggest.controller';
import { SuggestService } from './suggest.service';

@Module({
  imports: [TicketmasterModule],
  controllers: [SuggestController],
  providers: [SuggestService],
})
export class SuggestModule {}
