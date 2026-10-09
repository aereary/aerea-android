"use client";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { SheetPresence } from "../components/sheet-presence";
import { useBackLayer } from "../use-back-layer";
import { readLibraryCatalog } from "./library-connector";
import { answerQuery, dateKey, shiftDay, mergeEpubHit, type AskAnswer, type AskContext, type AskDocument, type AskEventDraft, type AskSource } from "./core";
import type { TextChapter } from "./epub-text";
import "../styles/ask-aerea.css";

type FileRef = { id: string; name: string; size: number; updatedAt: string };
type Props = {
  open: boolean; ready: boolean; onClose: () => void; onCapture: () => void;
  snapshot: (start: string, end: string, sources: AskSource[]) => AskDocument[];
  epubFiles: FileRef[]; readEpubFile: (id: string, signal: AbortSignal) => Promise<Blob>;
  onOpen: (document: AskDocument) => Promise<void> | void;
  onEventDraft: (draft: AskEventDraft) => void;
};
type Message = { id: number; request: string; answer: AskAnswer; status: string[] };
const SOURCES: { id: AskSource; label: string }[] = [
  { id: "library", label: "Library & synced Drive" }, { id: "calendar", label: "Calendar & Schedule" },
  { id: "notes", label: "Notes, tasks & Inbox" }, { id: "journal", label: "Quick journal (private)" },
  { id: "recordings", label: "Recording names & notes" },
];
function workerRequest<T>(worker: Worker, payload: unknown, signal: AbortSignal, transfer: Transferable[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    const finish = () => { worker.terminate(); signal.removeEventListener("abort", abort); window.clearTimeout(timer); };
    const abort = () => { finish(); reject(new DOMException("Cancelled", "AbortError")); };
    const timer = window.setTimeout(() => { finish(); reject(new Error("This operation took too long. Try fewer files or a shorter search.")); }, 30000);
    worker.onmessage = event => { finish(); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data); };
    worker.onerror = () => { finish(); reject(new Error("Search could not start on this device. Other app sections still work.")); };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { abort(); return; }
    worker.postMessage(payload, transfer);
  });
}
function timeLabel(time?: string) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
class AskBoundary extends Component<{ children: ReactNode; open: boolean; close: () => void; capture: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.open && <AskFailure close={this.props.close} capture={this.props.capture} /> : this.props.children; }
}
function AskFailure({ close, capture }: { close: () => void; capture: () => void }) {
  useBackLayer(true, close, 100);
  return <div className="ask-backdrop"><section className="ask-panel" role="dialog" aria-modal="true" aria-label="Ask aérea unavailable"><h2>Ask aérea is unavailable</h2><p>The rest of your app is ready to use.</p><button onClick={() => { close(); capture(); }}>Quick Capture</button><button onClick={close}>Close</button></section></div>;
}
export default function AskPanel(props: Props) {
  return <AskBoundary open={props.open} close={props.onClose} capture={props.onCapture}><AskConversation {...props} /></AskBoundary>;
}
function AskConversation({ open, ready, onClose, onCapture, snapshot, epubFiles, readEpubFile, onOpen, onEventDraft }: Props) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [enabled, setEnabled] = useState<AskSource[]>(["library", "calendar", "notes"]);
  const [fullText, setFullText] = useState(false);
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const context = useRef<AskContext>({ hits: [] });
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0), serial = useRef(0);
  const catalog = useRef<AskDocument[] | null>(null);
  const textCache = useRef(new Map<string, { chapters: TextChapter[]; bytes: number }>());
  const transcript = useRef<HTMLDivElement>(null), input = useRef<HTMLTextAreaElement>(null);
  const cancel = () => { generation.current++; controller.current?.abort(); controller.current = null; setBusy(false); setProgress(""); };
  const close = () => { cancel(); onClose(); };
  useBackLayer(open, close, 100);
  useEffect(() => {
    // This is an operation holder, not a DOM ref: cleanup deliberately cancels
    // the latest operation, including one started after this effect mounted.
    const operations = controller;
    if (!open) operations.current?.abort();
    return () => { operations.current?.abort(); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => { setBusy(false); setProgress(""); input.current?.focus(); });
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const panel = input.current?.closest(".ask-panel");
      const controls = Array.from(panel?.querySelectorAll<HTMLElement>("button:not(:disabled),a[href],textarea:not(:disabled),input:not(:disabled),summary,[tabindex='0']") ?? []).filter(element => element.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", trap); if (document.activeElement?.closest(".ask-panel")) previous?.focus(); };
  }, [open]);
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: "auto" }); }, [messages, progress]);
  const clear = () => { cancel(); setMessages([]); context.current = { hits: [] }; catalog.current = null; textCache.current.clear(); setError(""); };
  const openResult = async (document: AskDocument) => {
    if (!enabled.includes(document.source)) { setError("Enable this source before opening its results."); return; }
    setError("");
    try { await onOpen(document); close(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "This result could not be opened."); }
  };
  const run = async (request = query, refresh = false) => {
    if (busy || !ready || !request.trim() || !enabled.length) return;
    cancel();
    const runId = generation.current, operation = new AbortController();
    controller.current = operation;
    setBusy(true); setError(""); setQuery(""); setProgress("Searching your selected sources…");
    const statuses: string[] = [], signal = operation.signal;
    try {
      const probe = answerQuery(request, [], context.current);
      if (probe.operation !== "search") {
        setMessages(previous => [...previous.slice(-11), { id: ++serial.current, request, answer: probe, status: [] }]);
        context.current = probe.context;
        if (probe.open) await openResult(probe.open);
        return;
      }
      const today = dateKey();
      const documents = snapshot(shiftDay(today, -1), shiftDay(today, 90), enabled);
      if (enabled.includes("library")) {
        try {
          if (!catalog.current || refresh) {
            const result = await readLibraryCatalog(signal, refresh);
            catalog.current = result.documents; statuses.push(result.status);
          } else statuses.push("Library snapshot from this conversation. Refresh to check for changes.");
          documents.push(...catalog.current);
        } catch (reason) {
          signal.throwIfAborted();
          statuses.push(reason instanceof Error ? reason.message : "The library is unavailable; other selected sources were searched.");
        }
      }
      const search = (data: AskDocument[]) => workerRequest<{ answer: AskAnswer }>(new Worker(new URL("./search.worker.ts", import.meta.url), { type: "module" }), { query: request, documents: data, context: context.current, now: new Date().toISOString() }, signal);
      const result = await search(documents);
      if (fullText && enabled.includes("library")) {
        let failed = 0, searched = 0;
        const contentWorks = new Set<number>();
        for (const file of epubFiles) {
          signal.throwIfAborted();
          setProgress(`Reading EPUB ${searched + failed + 1} of ${epubFiles.length} · ${file.name}`);
          try {
            const key = `${file.id}:${file.updatedAt}:${file.size}`;
            let cached = textCache.current.get(key);
            if (!cached) {
              if (file.size > 40 * 1024 * 1024) throw new Error("EPUB larger than 40 MB.");
              const blob = await readEpubFile(file.id, signal);
              signal.throwIfAborted();
              if (blob.size > 40 * 1024 * 1024) throw new Error("EPUB larger than 40 MB.");
              const buffer = await blob.arrayBuffer(); signal.throwIfAborted();
              const result = await workerRequest<{ chapters: TextChapter[] }>(new Worker(new URL("./epub.worker.ts", import.meta.url), { type: "module" }), buffer, signal, [buffer]);
              cached = { chapters: result.chapters, bytes: result.chapters.reduce((size, chapter) => size + chapter.text.length * 2, 0) };
              // Conversation-only LRU, 12 MB. No duplicate catalog or persistent text index.
              for (const old of textCache.current.keys()) if (old.startsWith(`${file.id}:`)) textCache.current.delete(old);
              while ([...textCache.current.values()].reduce((sum, item) => sum + item.bytes, 0) + cached.bytes > 12 * 1024 * 1024 && textCache.current.size) textCache.current.delete(textCache.current.keys().next().value!);
              if (cached.bytes <= 12 * 1024 * 1024) textCache.current.set(key, cached);
            }
            const metadata = (catalog.current ?? []).filter(document => document.fileNames?.includes(file.name));
            const book = metadata.length === 1 ? metadata[0] : undefined;
            const content = await search(cached.chapters.map(chapter => ({ ...book, id: `epub:${file.id}:${chapter.id}`, source: "library" as const, kind: "EPUB chapter", title: book?.title ?? file.name, text: chapter.text, reference: `${file.name} · ${chapter.title}`, fileId: file.id, chapter: chapter.title })));
            // One best chapter per physical file. Keep only references/excerpts across files.
            if (content.answer.hits[0]) {
            const workId = book?.workId;
            const alreadyCounted = workId !== undefined && (contentWorks.has(workId) || answerQuery(request, [book!], context.current).total > 0);
            result.answer.total += mergeEpubHit(result.answer.hits, content.answer.hits[0], alreadyCounted);
            if (workId !== undefined) contentWorks.add(workId);
            }
            searched++;
          } catch (reason) { signal.throwIfAborted(); failed++; statuses.push(`${file.name}: ${reason instanceof Error ? reason.message : "Could not read this file."}`); }
        }
        statuses.push(`EPUB content coverage: ${searched} readable files; ${failed} unavailable. Remote AO3 EPUBs not downloaded on this device were not searched. Opening preserves your current reader position.`);
        result.answer.text = result.answer.total ? `${result.answer.total} matching catalog, local or EPUB results. EPUB results include one matching chapter per file. Semantic AI is not enabled.` : "No matches in the selected metadata, local data or readable EPUB files. Remote EPUBs and unreadable files are outside this search's coverage.";
        result.answer.context.hits = result.answer.hits;
      }
      signal.throwIfAborted();
      if (generation.current !== runId) return;
      context.current = result.answer.context;
      setMessages(previous => [...previous.slice(-11), { id: ++serial.current, request, answer: result.answer, status: statuses }]);
      if (result.answer.open) await openResult(result.answer.open);
    } catch (reason) {
      if (!signal.aborted && generation.current === runId) { setError(reason instanceof Error ? reason.message : "Search failed. Please try again."); setQuery(request); }
    } finally { if (generation.current === runId) { setBusy(false); setProgress(""); controller.current = null; } }
  };
  return <SheetPresence>{open && <div className="ask-backdrop" onClick={close}>
    <section className="ask-panel" role="dialog" aria-modal="true" aria-labelledby="ask-title" onClick={event => event.stopPropagation()}>
      <div className="ask-handle" aria-hidden="true" />
      <header className="ask-header"><div><small>YOUR LITTLE ASSISTANT</small><h2 id="ask-title">Ask aérea <span aria-hidden="true">✧</span></h2></div><button className="ask-close" type="button" aria-label="Close Ask aérea" onClick={close}>×</button></header>
      <div className="ask-toolbar"><button type="button" onClick={() => { close(); onCapture(); }}>＋ Quick Capture</button><button type="button" onClick={clear}>Clear conversation</button></div>
      <details className="ask-permissions"><summary>Sources & privacy · local search preview</summary><p>Queries and fragments stay in this app. No AI provider is connected. Conversation and extracted text are kept only in memory until you clear them or restart the app.</p>
        <fieldset disabled={busy}><legend>Allow Ask to read</legend>{SOURCES.map(source => <label key={source.id}><input type="checkbox" checked={enabled.includes(source.id)} onChange={() => { clear(); setEnabled(current => current.includes(source.id) ? current.filter(id => id !== source.id) : [...current, source.id]); }} />{source.label}</label>)}
          <label><input type="checkbox" checked={fullText} disabled={!enabled.includes("library")} onChange={event => { clear(); setFullText(event.target.checked); }} />Search EPUB text available on this device</label></fieldset>
        <p>Drive: synced catalog names only. Repeating events: yesterday through the next 90 days. Recording audio is not transcribed. General AI, remote EPUB text, full Drive search, and automatic writes are pending.</p>
      </details>
      <div className="ask-transcript" ref={transcript} tabIndex={0} aria-label="Conversation">
        {!messages.length && <div className="ask-empty"><h3>Find something in your little day.</h3><p>Search your real books, events and notes. Try a name, a tag, or a date.</p><div className="ask-suggestions">{["Find my Oscar Piastri and Lando Norris fanfics", "Show my events tomorrow", "Find all related to Thermodynamics"].map(example => <button key={example} disabled={busy || !ready} type="button" onClick={() => { setQuery(example); input.current?.focus(); }}>{example}</button>)}</div></div>}
        {messages.map(message => <article className="ask-exchange" key={message.id}>
          <p className="ask-request">{message.request}</p><p className="ask-answer">{message.answer.text}</p>
          {message.answer.hits.map((hit, index) => <section className="ask-result" key={hit.document.id}>
            <small>{index + 1} · {hit.document.kind} · {hit.match === "exact" ? "Matching terms" : "Related wording"}{hit.document.archived ? " · Archived" : ""}</small>
            <h3>{hit.document.title}</h3>{hit.document.author && <p>{hit.document.author}</p>}
            {hit.document.relationships?.length ? <p>{hit.document.relationships.join(" · ")}</p> : null}
            {hit.document.fandoms?.length ? <p>{hit.document.fandoms.join(" · ")}</p> : null}
            {hit.document.series?.length ? <p>Series: {hit.document.series.join(" · ")}</p> : null}
            <p className="ask-reference">{hit.document.reference}{hit.document.date ? ` · ${hit.document.date}` : ""}{hit.document.time ? ` · ${timeLabel(hit.document.time)}` : ""}</p>
            {hit.excerpt && <blockquote>{hit.excerpt}</blockquote>}
            <details><summary>Why this matches</summary><ul>{hit.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>{hit.document.versionCount !== undefined && <p>{hit.document.versionCount} registered EPUB versions. No versions were merged or changed.</p>}</details>
            <div className="ask-result-actions"><button type="button" onClick={() => void openResult(hit.document)}>{hit.document.kind === "Recording" ? "Open class recordings" : hit.document.workId && !hit.document.fileId ? "Open My AO3 Library" : "Open"}</button>
              {hit.document.driveId && /^[A-Za-z0-9_-]+$/.test(hit.document.driveId) && <a href={`https://drive.google.com/file/d/${encodeURIComponent(hit.document.driveId)}/view`} target="_blank" rel="noopener noreferrer">Open original in Drive ↗</a>}</div>
          </section>)}
          {message.answer.total > message.answer.hits.length && <p>Showing the first {message.answer.hits.length} of {message.answer.total}. Add filters to narrow your search.</p>}
          {message.answer.draft && <div className="ask-event-draft"><strong>{message.answer.draft.title}</strong><p>{message.answer.draft.date} · {message.answer.draft.allDay ? "All day" : timeLabel(message.answer.draft.time)} · America/Panama</p><button onClick={() => { onEventDraft(message.answer.draft!); close(); }}>Review in Calendar</button></div>}
          {message.status.length > 0 && <details className="ask-coverage"><summary>Search coverage</summary>{message.status.map((status, i) => <p key={i}>{status}</p>)}</details>}
        </article>)}
      </div>
      <div className="ask-live" role="status" aria-live="polite">{busy ? progress : !ready ? "Waiting for your saved data…" : ""}</div>
      {error && <p className="ask-error" role="alert">{error}</p>}
      <form className="ask-compose" onSubmit={event => { event.preventDefault(); void run(); }}><label className="sr-only" htmlFor="ask-query">Ask about your books, events or notes</label><textarea ref={input} id="ask-query" value={query} onChange={event => setQuery(event.target.value)} maxLength={2000} rows={2} placeholder="Find a book, an event, a note…" disabled={busy || !ready} /><button type={busy ? "button" : "submit"} onClick={busy ? cancel : undefined} disabled={!busy && (!query.trim() || !ready || !enabled.length)}>{busy ? "Stop" : "Search"}</button></form>
      {messages.length > 0 && <button className="ask-refresh" type="button" disabled={busy} onClick={() => void run(messages.at(-1)!.request, true)}>Refresh last search</button>}
    </section>
  </div>}</SheetPresence>;
}
