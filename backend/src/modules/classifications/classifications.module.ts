import { Module } from '@nestjs/common';
import { TicketmasterModule } from 'modules/service/ticketmaster/ticketmaster.module';
import { ClassificationsController } from './classifications.controller';
import { ClassificationsService } from './classifications.service';

@Module({
  imports: [TicketmasterModule],
  controllers: [ClassificationsController],
  providers: [ClassificationsService],
  exports: [ClassificationsService],
})
export class ClassificationsModule {}
