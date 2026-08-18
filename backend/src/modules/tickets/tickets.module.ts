import { Module } from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, QrCodeService],
  exports: [TicketsService, QrCodeService],
})
export class TicketsModule {}
