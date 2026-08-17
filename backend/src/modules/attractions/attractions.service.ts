import { Injectable } from '@nestjs/common';
import { TicketmasterService } from 'modules/service/ticketmaster/ticketmaster.service';
import { compactParams } from 'modules/shared/utils/compact-params';
import {
  mapAttractionSummary,
  mapPage,
} from 'modules/shared/utils/ticketmaster.mapper';
import {
  AttractionSummaryDto,
  AttractionsSearchResponseDto,
} from './dto/attraction.dto';
import { SearchAttractionsQueryDto } from './dto/search-attractions-query.dto';

@Injectable()
export class AttractionsService {
  constructor(private readonly ticketmasterService: TicketmasterService) {}

  async searchAttractions(
    query: SearchAttractionsQueryDto,
  ): Promise<AttractionsSearchResponseDto> {
    const response = await this.ticketmasterService.searchAttractions(
      compactParams({
        size: query.size ?? 20,
        page: query.page ?? 0,
        keyword: query.keyword,
        classificationName: query.classificationName,
      }),
    );

    const attractions = response._embedded?.attractions ?? [];

    return {
      attractions: attractions.map((item) => mapAttractionSummary(item)),
      page: mapPage(response.page, {
        size: query.size ?? 20,
        number: query.page ?? 0,
        totalElements: attractions.length,
      }),
    };
  }

  async getAttractionById(id: string): Promise<AttractionSummaryDto> {
    const attraction = await this.ticketmasterService.getAttractionById(id);
    return mapAttractionSummary(attraction);
  }
}
