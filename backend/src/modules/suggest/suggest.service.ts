import { Injectable } from '@nestjs/common';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { compactParams } from 'modules/shared/utils/compact-params';
import {
  mapAttractionSummary,
  mapEventSummary,
  mapVenue,
} from 'modules/shared/utils/ticketmaster.mapper';
import { VenueSummaryDto } from 'modules/venues/dto/venue.dto';
import { SuggestQueryDto } from './dto/suggest-query.dto';
import { SuggestResponseDto } from './dto/suggest-response.dto';

@Injectable()
export class SuggestService {
  constructor(private readonly ticketmasterService: TicketmasterService) {}

  async suggest(query: SuggestQueryDto): Promise<SuggestResponseDto> {
    const response = await this.ticketmasterService.suggest(
      compactParams({
        size: query.size ?? 5,
        keyword: query.keyword,
        countryCode: query.countryCode ?? 'BR',
      }),
    );

    const venues = (response._embedded?.venues ?? [])
      .map((venue) => mapVenue(venue))
      .filter((venue): venue is VenueSummaryDto => Boolean(venue));

    return {
      events: (response._embedded?.events ?? []).map(mapEventSummary),
      venues,
      attractions: (response._embedded?.attractions ?? []).map(
        mapAttractionSummary,
      ),
    };
  }
}
