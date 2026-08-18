import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { AuthUser } from 'modules/auth/types/auth-user';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    return this.reservationsService.create(user.id, dto);
  }
}
