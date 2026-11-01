/** Old post-its stay opaque; corrupt or imported values cannot hide the paper. */
export function paperOpacity(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(.25, Math.min(1, value)) : 1;
}
/** Restore the exact payload without duplicating an item already restored elsewhere. */
export function restoreUnique<T extends { id: string | number }>(items: T[], item: T): T[] {
  return items.some((existing) => existing.id === item.id) ? items : [...items, item];
}
