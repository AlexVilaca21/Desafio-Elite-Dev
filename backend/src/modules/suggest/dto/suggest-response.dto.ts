import { AttractionSummaryDto } from 'modules/attractions/dto/attraction.dto';
import { EventSummaryDto } from 'modules/events/dto/event.dto';
import { VenueSummaryDto } from 'modules/venues/dto/venue.dto';

export class SuggestResponseDto {
  events: EventSummaryDto[];
  venues: VenueSummaryDto[];
  attractions: AttractionSummaryDto[];
}
