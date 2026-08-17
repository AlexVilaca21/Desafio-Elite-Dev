import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  AttractionSummaryDto,
  AttractionsSearchResponseDto,
} from './dto/attraction.dto';
import { SearchAttractionsQueryDto } from './dto/search-attractions-query.dto';
import { AttractionsService } from './attractions.service';

@Controller('attractions')
export class AttractionsController {
  constructor(private readonly attractionsService: AttractionsService) {}

  @Get()
  searchAttractions(
    @Query() query: SearchAttractionsQueryDto,
  ): Promise<AttractionsSearchResponseDto> {
    return this.attractionsService.searchAttractions(query);
  }

  @Get(':id')
  getAttractionById(@Param('id') id: string): Promise<AttractionSummaryDto> {
    return this.attractionsService.getAttractionById(id);
  }
}
