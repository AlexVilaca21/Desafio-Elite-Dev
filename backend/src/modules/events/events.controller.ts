import { Controller, Get, MessageEvent, Param, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  EventDetailDto,
  EventImagesDto,
  EventsSearchResponseDto,
} from './dto/event.dto';
import { SearchEventsQueryDto } from './dto/search-events-query.dto';
import { EventSeatingDto } from './dto/seating.dto';
import { EventsService } from './events.service';
import { SeatingLiveService } from './seating-live.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly seatingLive: SeatingLiveService,
  ) {}

  @Get()
  searchEvents(
    @Query() query: SearchEventsQueryDto,
  ): Promise<EventsSearchResponseDto> {
    return this.eventsService.searchEvents(query);
  }

  @Sse(':id/seating/stream')
  streamSeating(@Param('id') id: string): Observable<MessageEvent> {
    return this.seatingLive.watch(id);
  }

  @Get(':id/seating')
  getEventSeating(@Param('id') id: string): Promise<EventSeatingDto> {
    return this.eventsService.getEventSeating(id);
  }

  @Get(':id/images')
  getEventImages(@Param('id') id: string): Promise<EventImagesDto> {
    return this.eventsService.getEventImages(id);
  }

  @Get(':id')
  getEventById(@Param('id') id: string): Promise<EventDetailDto> {
    return this.eventsService.getEventById(id);
  }
}
