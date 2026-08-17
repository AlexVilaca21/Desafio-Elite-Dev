export function compactParams(
  params: Record<string, string | number | undefined>,
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  ) as Record<string, string | number>;
}
