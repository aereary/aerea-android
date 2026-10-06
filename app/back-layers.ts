export type BackEvent = Pick<Event, "preventDefault" | "stopImmediatePropagation">;

/** Local dialogs consume Back before the page's tab-history handler. */
export function createBackLayerStack() {
  const layers = new Map<symbol, { close: () => void; priority: number }>();
  return {
    get size() { return layers.size; },
    register(close: () => void, priority = 0) {
      const id = Symbol("back-layer");
      layers.set(id, { close, priority });
      return () => { layers.delete(id); };
    },
    consume(event: BackEvent) {
      let top: { close: () => void; priority: number } | undefined;
      for (const layer of layers.values()) {
        if (!top || layer.priority >= top.priority) top = layer;
      }
      if (!top) return false;
      event.preventDefault();
      event.stopImmediatePropagation();
      top.close();
      return true;
    },
  };
}
