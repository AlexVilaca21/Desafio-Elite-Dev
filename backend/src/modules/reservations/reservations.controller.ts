import { Body, Controller, Post } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto): Promise<ReservationResponseDto> {
    return this.reservationsService.create(dto);
  }
}
