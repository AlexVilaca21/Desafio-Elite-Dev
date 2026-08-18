import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { ValidateTicketResponseDto } from 'modules/tickets/dto/ticket.dto';
import { ValidateTicketDto } from 'modules/tickets/dto/validate-ticket.dto';
import { GateEventDto } from './dto/gate-event.dto';
import { GateService } from './gate.service';

@Controller('gate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GATE)
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Get('events')
  listEvents(): Promise<GateEventDto[]> {
    return this.gateService.listEvents();
  }

  @Post('validate')
  validate(@Body() dto: ValidateTicketDto): Promise<ValidateTicketResponseDto> {
    return this.gateService.validate(dto);
  }
}
