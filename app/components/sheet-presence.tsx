"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useBackLayer } from "../use-back-layer";

/** Keep the last rendered sheet until its exit finishes, including nullable data.
 * Callers still close/save immediately; this snapshot never writes to storage. */
export function SheetPresence({ children }: { children: ReactNode }) {
  const open = Boolean(children);
  const [snapshot, setSnapshot] = useState<ReactNode>(children);
  if (open && children !== snapshot) setSnapshot(children);
  const closing = !open && Boolean(snapshot);

  // A second Back during the exit must not close the screen underneath.
  useBackLayer(closing, () => undefined, 1000);
  useEffect(() => {
    if (open) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setSnapshot(null), reduced ? 0 : 300);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open && !snapshot) return null;
  return (
    <div
      className="sheet-presence"
      data-sheet-state={closing ? "closing" : "open"}
      inert={closing || undefined}
      aria-hidden={closing || undefined}
      onAnimationEnd={(event) => {
        if (closing && event.animationName === "one-sheet-scrim-out") {
          setSnapshot(null);
        }
      }}
    >
      {open ? children : snapshot}
    </div>
  );
}
