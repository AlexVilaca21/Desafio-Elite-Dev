export type EventFiltersValue = {
  keyword: string;
  city: string;
  stateCode: string;
  startDate: string;
  endDate: string;
  sort: string;
  classificationName: string;
};

const EMPTY_FILTERS: EventFiltersValue = {
  keyword: '',
  city: '',
  stateCode: '',
  startDate: '',
  endDate: '',
  sort: 'date,asc',
  classificationName: '',
};

export function emptyEventFilters(
  overrides: Partial<EventFiltersValue> = {},
): EventFiltersValue {
  return { ...EMPTY_FILTERS, ...overrides };
}
