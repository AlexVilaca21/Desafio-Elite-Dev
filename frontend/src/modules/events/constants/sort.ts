export const EVENT_SORT_OPTIONS = [
  { value: 'date,asc', label: 'Data mais próxima' },
  { value: 'date,desc', label: 'Data mais distante' },
  { value: 'name,asc', label: 'Nome A–Z' },
  { value: 'name,desc', label: 'Nome Z–A' },
] as const;

export const CATALOG_SORT_OPTIONS = [
  { value: 'relevance,desc', label: 'Mais relevantes' },
  ...EVENT_SORT_OPTIONS,
] as const;
