import { env, pipeline } from "@huggingface/transformers";
import wasmUrl from "../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url";
import moduleUrl from "../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs?url";
import { answerQuery, searchDocuments, type AskContext, type AskDocument, type AskHit } from "./core";
import { SEMANTIC_MODEL, SEMANTIC_REVISION, MODEL_CACHE, VECTOR_DB, MIN_MEANING_SCORE, semanticChunks, meaningCandidates, meaningQuery, cosine, combineMeaningResults } from "./semantic-core";

type VectorRecord = { id: string; signature: string; vectors: number[][] };
type Extractor = (texts: string[], options: { pooling: "mean"; normalize: boolean }) => Promise<{ tolist(): number[][] }>;
type Request = { id: number; mode: "prepare" | "search"; query?: string; documents?: AskDocument[]; context?: AskContext; now?: string; pruneLibrary?: boolean };
let extractor: Extractor | undefined;
let database: IDBDatabase | undefined;

async function model(report: (text: string) => void) {
  if (extractor) return extractor;
  if (!globalThis.caches || !globalThis.indexedDB) throw new Error("Local model storage is unavailable on this device.");
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  env.useCustomCache = true;
  env.customCache = await caches.open(MODEL_CACHE);
  const wasm = env.backends.onnx.wasm;
  if (!wasm) throw new Error("WebAssembly inference is unavailable.");
  wasm.numThreads = 1;
  wasm.proxy = false;
  wasm.wasmPaths = {
    wasm: new URL(wasmUrl, self.location.href).href,
    mjs: new URL(moduleUrl, self.location.href).href,
  };
  report("Loading the free local model… First download may take a few minutes.");
  extractor = await pipeline("feature-extraction", SEMANTIC_MODEL, {
    revision: SEMANTIC_REVISION, dtype: "q8", device: "wasm",
    progress_callback: info => {
      if (info.status === "progress") report(`Downloading local model · ${Math.round(info.progress)}% of current file`);
    },
  }) as unknown as Extractor;
  return extractor;
}

function openIndex(): Promise<IDBDatabase> {
  if (database) return Promise.resolve(database);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VECTOR_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("vectors", { keyPath: "id" });
    request.onsuccess = () => { database = request.result; resolve(request.result); };
    request.onerror = () => reject(new Error("Could not open the local meaning index."));
  });
}
async function readIndex() {
  const db = await openIndex();
  return new Promise<Map<string, VectorRecord>>((resolve, reject) => {
    const request = db.transaction("vectors").objectStore("vectors").getAll();
    request.onsuccess = () => resolve(new Map((request.result as VectorRecord[]).map(record => [record.id, record])));
    request.onerror = () => reject(new Error("Could not read the local meaning index."));
  });
}
async function writeIndex(records: VectorRecord[], obsolete: string[]) {
  const db = await openIndex();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("vectors", "readwrite");
    const store = tx.objectStore("vectors");
    for (const id of obsolete) store.delete(id);
    for (const record of records) store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("Could not save the local meaning index."));
    tx.onabort = () => reject(new Error("The meaning index write was interrupted."));
  });
}
async function signature(chunks: string[]) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${SEMANTIC_REVISION}:${chunks.join("\n")}`));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, mode } = event.data;
  const report = (text: string) => self.postMessage({ id, progress: text });
  try {
    const embed = await model(report);
    if (mode === "prepare") { self.postMessage({ id, ready: true }); return; }
    const { query = "", documents = [], context = { hits: [] } } = event.data;
    const now = new Date(event.data.now ?? Date.now());
    const base = answerQuery(query, documents, context, now);
    if (base.operation !== "search" || !base.context.filter) { self.postMessage({ id, answer: base }); return; }
    const filter = base.context.filter;
    const description = meaningQuery(query, filter, context);
    const [queryVector] = (await embed([description], { pooling: "mean", normalize: true })).tolist();
    const candidates = meaningCandidates(documents, filter, query, now);
    const index = await readIndex();
    // Only derived library vectors persist. Notes, journal and calendar stay in
    // worker memory, and are never written to this auxiliary index.
    const libraryIds = new Set(documents.filter(document => document.source === "library").map(document => document.id));
    const obsolete = event.data.pruneLibrary ? [...index.keys()].filter(key => !libraryIds.has(key)) : [];
    if (obsolete.length) await writeIndex([], obsolete);
    const scored: Array<{ hit: AskHit; score: number }> = [];
    for (let i = 0; i < candidates.length; i++) {
      const document = candidates[i];
      const chunks = semanticChunks(document);
      const fingerprint = await signature(chunks);
      const cached = index.get(document.id);
      let vectors = cached?.signature === fingerprint ? cached.vectors : undefined;
      if (!vectors) {
        report(`Understanding your selected sources · ${i + 1} of ${candidates.length}`);
        vectors = (await embed(chunks, { pooling: "mean", normalize: true })).tolist();
        if (document.source === "library") await writeIndex([{ id: document.id, signature: fingerprint, vectors }], []);
      }
      let best = -1, score = -1;
      vectors.forEach((vector, position) => {
        const similarity = cosine(queryVector, vector);
        if (similarity > score) { score = similarity; best = position; }
      });
      if (score >= MIN_MEANING_SCORE) scored.push({ score, hit: {
        document: { ...document, text: "" }, match: "semantic",
        reasons: ["Similar meaning in the recorded text or metadata. This is a suggestion, not proof of a scene; check the original source."],
        excerpt: chunks[best],
      } });
    }
    scored.sort((a, b) => b.score - a.score || a.hit.document.title.localeCompare(b.hit.document.title));
    const answer = combineMeaningResults(base, searchDocuments(documents, filter, now), scored.map(item => item.hit), description);
    self.postMessage({ id, answer });
  } catch {
    self.postMessage({ id, error: "Local meaning search could not run. Check the connection for the first model download, or free some storage. Exact search remains available." });
  }
};
