import { Module } from '@nestjs/common';
import { EventsModule } from 'modules/events/events.module';
import { QrCodeService } from './qr-code.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [EventsModule],
  controllers: [TicketsController],
  providers: [TicketsService, QrCodeService],
  exports: [TicketsService, QrCodeService],
})
export class TicketsModule {}
