"use client";

import { useLayoutEffect, useRef, type HTMLAttributes } from "react";

/** Keep the real grid in place; only inert, short-lived visual snapshots move. */
export function CalendarMonthGrid({ month, children, ...props }: HTMLAttributes<HTMLDivElement> & { month: number }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const previous = useRef<{ month: number; grid: HTMLElement; height: number } | null>(null);
  const stopMotion = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const bounds = grid.getBoundingClientRect();
    const snapshot = grid.cloneNode(true) as HTMLElement;
    snapshot.removeAttribute("data-month-moving");
    const last = previous.current;
    previous.current = { month, grid: snapshot, height: bounds.height };
    if (!last || last.month === month) return;
    stopMotion.current?.();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !grid.animate) return;

    const parent = grid.parentElement;
    if (!parent) return;
    const parentBounds = parent.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const layer = document.createElement("div");
    layer.className = "calendar-month-motion";
    layer.setAttribute("aria-hidden", "true");
    layer.inert = true;
    Object.assign(layer.style, {
      left: `${bounds.left - parentBounds.left - parent.clientLeft + parent.scrollLeft}px`,
      top: `${bounds.top - parentBounds.top - parent.clientTop + parent.scrollTop}px`,
      width: `${bounds.width}px`, height: `${bounds.height}px`,
      borderRadius: getComputedStyle(grid).borderRadius,
    });
    last.grid.style.setProperty("--month-snapshot-height", `${last.height}px`);
    snapshot.style.setProperty("--month-snapshot-height", `${bounds.height}px`);
    for (const copy of [last.grid, snapshot]) {
      copy.removeAttribute("id");
      copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      layer.appendChild(copy);
    }
    parent.appendChild(layer);
    grid.setAttribute("data-month-moving", "true");
    const direction = month > last.month ? 1 : -1;
    const timing = { duration: 340, easing: "cubic-bezier(.22,.8,.26,1)", fill: "both" as const };
    const outgoing = last.grid.animate([
      { translate: "0 0" }, { translate: `${-direction * 100}% 0` },
    ], timing);
    const incoming = snapshot.animate([
      { translate: `${direction * 100}% 0` }, { translate: "0 0" },
    ], timing);
    const finish = () => {
      outgoing.cancel(); incoming.cancel(); layer.remove();
      grid.removeAttribute("data-month-moving");
      if (stopMotion.current === finish) stopMotion.current = null;
    };
    stopMotion.current = finish;
    void incoming.finished.then(finish, () => {});
  });

  useLayoutEffect(() => () => { stopMotion.current?.(); }, []);

  return <div {...props} ref={gridRef} data-calendar-month-grid={month}>{children}</div>;
}
