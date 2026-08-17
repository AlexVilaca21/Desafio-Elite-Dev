import { Controller, Get, Param, Query } from '@nestjs/common';
import { SearchVenuesQueryDto } from './dto/search-venues-query.dto';
import { VenueSummaryDto, VenuesSearchResponseDto } from './dto/venue.dto';
import { VenuesService } from './venues.service';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  searchVenues(
    @Query() query: SearchVenuesQueryDto,
  ): Promise<VenuesSearchResponseDto> {
    return this.venuesService.searchVenues(query);
  }

  @Get(':id')
  getVenueById(@Param('id') id: string): Promise<VenueSummaryDto> {
    return this.venuesService.getVenueById(id);
  }
}
