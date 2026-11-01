/** Old post-its stay opaque; corrupt or imported values cannot hide the paper. */
export function paperOpacity(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(.25, Math.min(1, value)) : 1;
}
/** Restore the exact payload without duplicating an item already restored elsewhere. */
export function restoreUnique<T extends { id: string | number }>(items: T[], item: T): T[] {
  return items.some((existing) => existing.id === item.id) ? items : [...items, item];
}

/** Choose readable ink for paper composited over the current theme's base. */
export function paperInk(hex: string, opacity: number | undefined, dark: boolean): string {
  const alpha = paperOpacity(opacity);
  const base = dark ? 23 : 255;
  const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) * alpha + base * (1 - alpha));
  const luminance = (channels: number[]) => channels.reduce((sum, channel, index) => {
    const scaled = channel / 255;
    return sum + [0.2126, 0.7152, 0.0722][index] * (scaled <= .04045 ? scaled / 12.92 : ((scaled + .055) / 1.055) ** 2.4);
  }, 0);
  const paper = luminance(rgb);
  const darkInk = luminance([40, 35, 55]);
  const lightInk = luminance([245, 238, 245]);
  const contrast = (ink: number) => (Math.max(paper, ink) + .05) / (Math.min(paper, ink) + .05);
  return contrast(lightInk) > contrast(darkInk) ? "#f5eef5" : "#282337";
}
