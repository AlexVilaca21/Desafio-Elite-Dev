import { describe, expect, it } from 'vitest';
import { emptyEventFilters } from '../types/event-filters';
import { filtersToSearchParams } from './filters';

describe('filtersToSearchParams', () => {
  it('sends Brazil as country and drops empty text filters', () => {
    expect(filtersToSearchParams(emptyEventFilters())).toEqual({
      keyword: undefined,
      city: undefined,
      stateCode: undefined,
      classificationName: undefined,
      startDateTime: undefined,
      endDateTime: undefined,
      sort: 'date,asc',
      countryCode: 'BR',
    });
  });

  it('trims text and expands dates to the full day', () => {
    const params = filtersToSearchParams(
      emptyEventFilters({
        keyword: '  rock  ',
        city: ' Rio ',
        stateCode: 'RJ',
        startDate: '2026-09-13',
        endDate: '2026-09-14',
        classificationName: 'Music',
      }),
    );

    expect(params.keyword).toBe('rock');
    expect(params.city).toBe('Rio');
    expect(params.startDateTime).toBe('2026-09-13T00:00:00');
    expect(params.endDateTime).toBe('2026-09-14T23:59:59');
  });
});
