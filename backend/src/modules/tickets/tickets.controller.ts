import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { AuthUser } from 'modules/auth/types/auth-user';
import { TicketResponseDto, ValidateTicketResponseDto } from './dto/ticket.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Get('me')
  listMine(@CurrentUser() user: AuthUser): Promise<TicketResponseDto[]> {
    return this.ticketsService.listMine(user.id);
  }

  @Get('shared/:token')
  findByShareToken(@Param('token') token: string): Promise<TicketResponseDto> {
    return this.ticketsService.findByShareToken(token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GATE)
  @Post('validate')
  validate(@Body() dto: ValidateTicketDto): Promise<ValidateTicketResponseDto> {
    return this.ticketsService.validate(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Post(':id/share')
  share(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ shareToken: string }> {
    return this.ticketsService.share(id, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.cancel(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.findOne(id, user);
  }
}
