import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventDetailDto, EventsSearchResponseDto } from './dto/event.dto';
import { SearchEventsQueryDto } from './dto/search-events-query.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  searchEvents(
    @Query() query: SearchEventsQueryDto,
  ): Promise<EventsSearchResponseDto> {
    return this.eventsService.searchEvents(query);
  }

  @Get(':id')
  getEventById(@Param('id') id: string): Promise<EventDetailDto> {
    return this.eventsService.getEventById(id);
  }
}
