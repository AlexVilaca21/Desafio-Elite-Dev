import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import {
  EventDetailDto,
  EventsSearchResponseDto,
} from 'modules/events/dto/event.dto';
import { SearchEventsQueryDto } from 'modules/events/dto/search-events-query.dto';
import { bannerMulterOptions } from './banner-storage';
import { CreateCustomEventDto } from './dto/create-custom-event.dto';
import { OrganizerEventDto } from './dto/organizer-event.dto';
import { PublishEventDto } from './dto/publish-event.dto';
import { UpdatePublishedEventDto } from './dto/update-event.dto';
import { OrganizerService } from './organizer.service';

@Controller('organizer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORGANIZER)
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Get('catalog')
  searchCatalog(
    @Query() query: SearchEventsQueryDto,
  ): Promise<EventsSearchResponseDto> {
    return this.organizerService.searchCatalog(query);
  }

  @Get('catalog/:id')
  getCatalogEvent(@Param('id') id: string): Promise<EventDetailDto> {
    return this.organizerService.getCatalogEvent(id);
  }

  @Get('events')
  listEvents(): Promise<OrganizerEventDto[]> {
    return this.organizerService.listEvents();
  }

  @Get('events/:id')
  getPublishedEvent(@Param('id') id: string): Promise<OrganizerEventDto> {
    return this.organizerService.getPublishedEvent(id);
  }

  @Post('events/custom')
  @UseInterceptors(FileInterceptor('banner', bannerMulterOptions))
  createCustom(
    @Body() dto: CreateCustomEventDto,
    @UploadedFile() banner?: Express.Multer.File,
  ): Promise<OrganizerEventDto> {
    return this.organizerService.createCustom(dto, banner);
  }

  @Post('events')
  publish(@Body() dto: PublishEventDto): Promise<OrganizerEventDto> {
    return this.organizerService.publish(dto);
  }

  @Patch('events/:id')
  @UseInterceptors(FileInterceptor('banner', bannerMulterOptions))
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePublishedEventDto,
    @UploadedFile() banner?: Express.Multer.File,
  ): Promise<OrganizerEventDto> {
    return this.organizerService.update(id, dto, banner);
  }

  @Delete('events/:id')
  @HttpCode(204)
  unpublish(@Param('id') id: string): Promise<void> {
    return this.organizerService.unpublish(id);
  }
}
