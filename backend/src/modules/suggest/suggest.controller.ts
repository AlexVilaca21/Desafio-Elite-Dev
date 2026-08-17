import { Controller, Get, Query } from '@nestjs/common';
import { SuggestQueryDto } from './dto/suggest-query.dto';
import { SuggestResponseDto } from './dto/suggest-response.dto';
import { SuggestService } from './suggest.service';

@Controller('suggest')
export class SuggestController {
  constructor(private readonly suggestService: SuggestService) {}

  @Get()
  suggest(@Query() query: SuggestQueryDto): Promise<SuggestResponseDto> {
    return this.suggestService.suggest(query);
  }
}
