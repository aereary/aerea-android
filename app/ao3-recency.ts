// Use the cloud insertion date, never AO3's publication date or a device's
// first sighting. Refreshing, reinstalling or using another device must not
// restart the 48-hour window.
export const AO3_NEW_WINDOW_MS = 48 * 60 * 60 * 1000;

type DatedWork = { work_id: number; created_at?: string | null };

export function ao3NewUntil(createdAt?: string | null): number | null {
  if (!createdAt) return null;
  const addedAt = Date.parse(createdAt);
  return Number.isFinite(addedAt) ? addedAt + AO3_NEW_WINDOW_MS : null;
}

export function isNewAo3Work(createdAt: string | null | undefined, now: number) {
  const until = ao3NewUntil(createdAt);
  return until !== null && now >= until - AO3_NEW_WINDOW_MS && now < until;
}

export function newAo3WorkIds(works: readonly DatedWork[], now: number) {
  return new Set(works.filter((work) => isNewAo3Work(work.created_at, now))
    .map((work) => work.work_id));
}

export function nextAo3BadgeExpiry(works: readonly DatedWork[], now: number) {
  let next: number | null = null;
  for (const work of works) {
    if (!isNewAo3Work(work.created_at, now)) continue;
    const until = ao3NewUntil(work.created_at)!;
    if (next === null || until < next) next = until;
  }
  return next;
}
