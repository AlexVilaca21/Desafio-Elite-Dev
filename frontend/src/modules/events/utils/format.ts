const STATUS_LABELS: Record<string, string> = {
  onsale: 'À venda',
  offsale: 'Fora de venda',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  postponed: 'Adiado',
  rescheduled: 'Remarcado',
};

export function formatEventDate(date?: string, time?: string): string {
  if (!date) {
    return 'Data a definir';
  }

  const [year, month, day] = date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  return time ? `${formattedDate} · ${time.slice(0, 5)}` : formattedDate;
}

export function formatEventStatus(status?: string): string | undefined {
  if (!status) {
    return undefined;
  }

  return STATUS_LABELS[status] ?? status;
}

export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatPriceRange(
  min: number,
  max: number,
  currency: string,
): string {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  });

  if (min === max) {
    return formatter.format(min);
  }

  return `${formatter.format(min)} – ${formatter.format(max)}`;
}

export function formatStartingPrice(
  ranges?: Array<{ min: number; max: number; currency: string }>,
): string | undefined {
  const range = ranges?.find(
    (item) => Number.isFinite(item.min) && item.currency,
  );

  if (!range) {
    return undefined;
  }

  return `A partir de ${formatMoney(range.min, range.currency)}`;
}

export function formatVenue(venue?: {
  name: string;
  city?: string;
  stateCode?: string;
}): string {
  if (!venue) {
    return 'Local a definir';
  }

  return [venue.name, venue.city, venue.stateCode].filter(Boolean).join(' · ');
}
