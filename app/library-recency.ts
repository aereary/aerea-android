// Prefer the catalog insertion time; legacy caches can use their source date.
export function libraryAddedAt(createdAt?: string | null, fallback?: string | null): number {
  for (const value of [createdAt, fallback]) {
    const parsed = value ? Date.parse(value) : NaN;
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

// Shared by cards rendered by AO3 and the independent generic-book portal.
export function libraryCardOrder(addedAt: number): number {
  return -Math.min(2147483647, Math.max(0, Math.floor(addedAt / 1000)));
}
