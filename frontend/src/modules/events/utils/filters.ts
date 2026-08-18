import type { EventFiltersValue } from '../types/event-filters';
import type { SearchEventsParams } from '../services/events.service';

export function filtersToSearchParams(
  filters: EventFiltersValue,
  extras: Partial<SearchEventsParams> = {},
): SearchEventsParams {
  return {
    keyword: filters.keyword.trim() || undefined,
    city: filters.city.trim() || undefined,
    stateCode: filters.stateCode || undefined,
    classificationName: filters.classificationName || undefined,
    startDateTime: filters.startDate
      ? `${filters.startDate}T00:00:00`
      : undefined,
    endDateTime: filters.endDate ? `${filters.endDate}T23:59:59` : undefined,
    sort: filters.sort || undefined,
    countryCode: 'BR',
    ...extras,
  };
}
