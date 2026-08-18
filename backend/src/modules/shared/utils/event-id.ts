export function isCustomEventId(id: string): boolean {
  return id.startsWith('custom-');
}
