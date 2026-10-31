import type { AskAnswer, AskContext, AskDocument } from "./core";
import { MODEL_CACHE, VECTOR_DB } from "./semantic-core";

export class LocalMeaningSearch {
  private worker?: Worker;
  private serial = 0;

  dispose() { this.worker?.terminate(); this.worker = undefined; }

  request(payload: { mode: "prepare" | "search"; query?: string; documents?: AskDocument[]; context?: AskContext; now?: string; pruneLibrary?: boolean }, signal: AbortSignal, progress: (text: string) => void): Promise<{ answer?: AskAnswer; ready?: boolean }> {
    if (!this.worker) this.worker = new Worker(new URL("./semantic.worker.ts", import.meta.url), { type: "module" });
    const worker = this.worker, id = ++this.serial;
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>;
      const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); worker.onmessage = null; worker.onerror = null; };
      const abort = () => { cleanup(); this.dispose(); reject(new DOMException("Cancelled", "AbortError")); };
      const timeout = () => { cleanup(); this.dispose(); reject(new Error("Local AI took too long. You can retry or use exact search.")); };
      const renew = () => { clearTimeout(timer); timer = setTimeout(timeout, 180_000); };
      worker.onmessage = event => {
        if (event.data.id !== id) return;
        if (event.data.progress) { renew(); progress(event.data.progress); return; }
        cleanup();
        if (event.data.error) { this.dispose(); reject(new Error(event.data.error)); }
        else resolve(event.data);
      };
      worker.onerror = () => { cleanup(); this.dispose(); reject(new Error("This device could not start local AI. Exact search still works.")); };
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) { abort(); return; }
      renew(); worker.postMessage({ ...payload, id });
    });
  }

  async erase() {
    this.dispose();
    if (globalThis.caches) await caches.delete(MODEL_CACHE);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(VECTOR_DB);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Could not remove the local meaning index."));
      request.onblocked = () => reject(new Error("Close other aérea tabs, then remove local AI again."));
    });
  }
}
