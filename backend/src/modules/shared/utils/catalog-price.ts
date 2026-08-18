const PRICE_TIERS = [90, 120, 150, 180, 220, 280];

export function catalogUnitPrice(eventId: string): {
  currency: string;
  unitPrice: number;
} {
  let hash = 0;

  for (let index = 0; index < eventId.length; index += 1) {
    hash = (hash + eventId.charCodeAt(index) * (index + 1)) % 997;
  }

  return {
    currency: 'BRL',
    unitPrice: PRICE_TIERS[hash % PRICE_TIERS.length],
  };
}
