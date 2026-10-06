"use client";

import { useLayoutEffect, useRef } from "react";
import { createBackLayerStack } from "./back-layers";

const layers = createBackLayerStack();
// Android dispatches directly on window: capture cannot outrank a previously
// registered target listener. The page must consult local layers explicitly.
export const consumeBackLayer = (event: Event) => layers.consume(event);
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") layers.consume(event);
};

export function useBackLayer(active: boolean, close: () => void, priority = 0) {
  const currentClose = useRef(close);
  useLayoutEffect(() => { currentClose.current = close; }, [close]);
  useLayoutEffect(() => {
    if (!active) return;
    const first = layers.size === 0;
    const release = layers.register(() => currentClose.current(), priority);
    if (first) {
      window.addEventListener("keydown", onKeyDown, true);
    }
    return () => {
      release();
      if (layers.size === 0) {
        window.removeEventListener("keydown", onKeyDown, true);
      }
    };
  }, [active, priority]);
}
