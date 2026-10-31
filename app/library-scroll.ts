export type LibraryScrollState = {
  y: number; direction: number; distance: number; hidden: boolean;
};

export const initialLibraryScroll = (): LibraryScrollState => ({
  y: 0, direction: 0, distance: 0, hidden: false,
});

/** Accumulate deliberate movement, rather than reacting to every tiny reversal.
 * Clamp elastic overscroll so a bottom bounce cannot summon the toolbar. */
export function advanceLibraryScroll(
  previous: LibraryScrollState, scrollTop: number, maximum: number,
): LibraryScrollState {
  const y = Math.max(0, Math.min(scrollTop, Math.max(0, maximum)));
  if (y <= 72) return { y, direction: 0, distance: 0, hidden: false };
  const delta = y - previous.y;
  if (Math.abs(delta) < 1) return { ...previous, y };
  const direction = Math.sign(delta);
  const distance = direction === previous.direction
    ? previous.distance + Math.abs(delta) : Math.abs(delta);
  const threshold = direction > 0 ? 64 : 36;
  if (distance < threshold) return { ...previous, y, direction, distance };
  return { y, direction, distance: 0, hidden: direction > 0 };
}
