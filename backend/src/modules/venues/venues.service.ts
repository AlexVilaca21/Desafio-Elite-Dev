import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { compactParams } from 'modules/shared/utils/compact-params';
import { mapPage, mapVenue } from 'modules/shared/utils/ticketmaster.mapper';
import { SearchVenuesQueryDto } from './dto/search-venues-query.dto';
import { VenueSummaryDto, VenuesSearchResponseDto } from './dto/venue.dto';

@Injectable()
export class VenuesService {
  constructor(private readonly ticketmasterService: TicketmasterService) {}

  async searchVenues(
    query: SearchVenuesQueryDto,
  ): Promise<VenuesSearchResponseDto> {
    const response = await this.ticketmasterService.searchVenues(
      compactParams({
        size: query.size ?? 20,
        page: query.page ?? 0,
        sort: query.sort ?? 'relevance,desc',
        countryCode: query.countryCode ?? 'BR',
        keyword: query.keyword,
        stateCode: query.stateCode,
      }),
    );

    const venues = (response._embedded?.venues ?? [])
      .map((venue) => mapVenue(venue))
      .filter((venue): venue is VenueSummaryDto => Boolean(venue));

    return {
      venues,
      page: mapPage(response.page, {
        size: query.size ?? 20,
        number: query.page ?? 0,
        totalElements: venues.length,
      }),
    };
  }

  async getVenueById(id: string): Promise<VenueSummaryDto> {
    const venue = mapVenue(await this.ticketmasterService.getVenueById(id));

    if (!venue) {
      throw new NotFoundException('Casa de show não encontrada');
    }

    return venue;
  }
}
