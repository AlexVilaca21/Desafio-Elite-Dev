import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ClassificationDto,
  ClassificationsSearchResponseDto,
} from './dto/classification.dto';
import { SearchClassificationsQueryDto } from './dto/search-classifications-query.dto';
import { ClassificationsService } from './classifications.service';

@Controller('classifications')
export class ClassificationsController {
  constructor(
    private readonly classificationsService: ClassificationsService,
  ) {}

  @Get()
  searchClassifications(
    @Query() query: SearchClassificationsQueryDto,
  ): Promise<ClassificationsSearchResponseDto> {
    return this.classificationsService.searchClassifications(query);
  }

  @Get(':id')
  getClassificationById(@Param('id') id: string): Promise<ClassificationDto> {
    return this.classificationsService.getClassificationById(id);
  }
}
