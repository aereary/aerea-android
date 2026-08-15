"use client";

import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { EpubBook } from "./epub-reader";

export type PdfInkTool = "pen" | "highlighter" | "eraser" | "hand";

export type PdfInkStroke = {
  id: string;
  fileId: string;
  page: number;
  tool: Exclude<PdfInkTool, "eraser" | "hand">;
  color: string;
  size: number;
  points: { x: number; y: number }[];
};

export type EpubReadingState = {
  chapter: number;
  fontSize: number;
  lineHeight: number;
  bookmarks: number[];
  chapterNotes: Record<string, string>;
};

function drawInk(
  canvas: HTMLCanvasElement,
  strokes: PdfInkStroke[],
  draft?: PdfInkStroke | null,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  const scaleX = canvas.width;
  const scaleY = canvas.height;

  [...strokes, ...(draft ? [draft] : [])].forEach((stroke) => {
    if (stroke.points.length < 2) return;
    context.save();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size * (scaleX / 900);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalAlpha = stroke.tool === "highlighter" ? 0.32 : 0.96;
    context.globalCompositeOperation =
      stroke.tool === "highlighter" ? "multiply" : "source-over";
    context.beginPath();
    context.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
    stroke.points.slice(1).forEach((point) => {
      context.lineTo(point.x * scaleX, point.y * scaleY);
    });
    context.stroke();
    context.restore();
  });
}

function strokeNearPoint(stroke: PdfInkStroke, x: number, y: number) {
  const threshold = Math.max(0.012, stroke.size / 680);
  return stroke.points.some(
    (point) => Math.hypot(point.x - x, point.y - y) <= threshold,
  );
}

export function PdfStudyReader({
  fileId,
  fileName,
  source,
  annotations,
  onAnnotationsChange,
  onClose,
}: {
  fileId: string;
  fileName: string;
  source: string;
  annotations: PdfInkStroke[];
  onAnnotationsChange: (strokes: PdfInkStroke[]) => void;
  onClose: () => void;
}) {
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageWrapRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const draftRef = useRef<PdfInkStroke | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<PdfInkTool>("pen");
  const [color, setColor] = useState("#25272b");
  const [size, setSize] = useState(4);
  const [loading, setLoading] = useState("Opening your PDF…");
  const [renderVersion, setRenderVersion] = useState(0);

  const pageStrokes = useMemo(
    () => annotations.filter((stroke) => stroke.page === page),
    [annotations, page],
  );

  useEffect(() => {
    let cancelled = false;
    let task: import("pdfjs-dist").PDFDocumentLoadingTask | null = null;
    async function loadPdf() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const buffer = await fetch(source).then((response) => {
          if (!response.ok) throw new Error("The PDF could not be loaded.");
          return response.arrayBuffer();
        });
        task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
        const document = await task.promise;
        if (cancelled) {
          await document.cleanup();
          return;
        }
        pdfRef.current = document;
        setPages(document.numPages);
        setLoading("");
        setRenderVersion((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          setLoading(error instanceof Error ? error.message : "The PDF could not be opened.");
        }
      }
    }
    void loadPdf();
    return () => {
      cancelled = true;
      if (task) void task.destroy();
      if (pdfRef.current) void pdfRef.current.cleanup();
      pdfRef.current = null;
    };
  }, [source]);

  useEffect(() => {
    const wrap = pageWrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(() => setRenderVersion((value) => value + 1));
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function renderPage() {
      const document = pdfRef.current;
      const pdfCanvas = pdfCanvasRef.current;
      const inkCanvas = inkCanvasRef.current;
      const wrap = pageWrapRef.current;
      if (!document || !pdfCanvas || !inkCanvas || !wrap) return;
      const pdfPage = await document.getPage(page);
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const available = Math.max(320, wrap.clientWidth - 28);
      const fitScale = available / baseViewport.width;
      const viewport = pdfPage.getViewport({ scale: fitScale * zoom });
      const density = Math.min(2, window.devicePixelRatio || 1);
      pdfCanvas.width = Math.floor(viewport.width * density);
      pdfCanvas.height = Math.floor(viewport.height * density);
      pdfCanvas.style.width = `${viewport.width}px`;
      pdfCanvas.style.height = `${viewport.height}px`;
      inkCanvas.width = pdfCanvas.width;
      inkCanvas.height = pdfCanvas.height;
      inkCanvas.style.width = `${viewport.width}px`;
      inkCanvas.style.height = `${viewport.height}px`;
      const context = pdfCanvas.getContext("2d");
      if (!context || cancelled) return;
      await pdfPage.render({
        canvas: pdfCanvas,
        canvasContext: context,
        viewport,
        transform: density === 1 ? undefined : [density, 0, 0, density, 0, 0],
      }).promise;
      if (!cancelled) drawInk(inkCanvas, pageStrokes);
    }
    void renderPage();
    return () => {
      cancelled = true;
    };
  }, [page, pageStrokes, renderVersion, zoom]);

  const pointFor = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };

  const beginInk = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (tool === "hand") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFor(event);
    if (tool === "eraser") {
      onAnnotationsChange(
        annotations.filter(
          (stroke) => stroke.page !== page || !strokeNearPoint(stroke, point.x, point.y),
        ),
      );
      return;
    }
    draftRef.current = {
      id: crypto.randomUUID(),
      fileId,
      page,
      tool,
      color,
      size: tool === "highlighter" ? Math.max(12, size * 3) : size,
      points: [point, point],
    };
    const canvas = inkCanvasRef.current;
    if (canvas) drawInk(canvas, pageStrokes, draftRef.current);
  };

  const continueInk = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = pointFor(event);
    if (tool === "eraser" && event.buttons) {
      onAnnotationsChange(
        annotations.filter(
          (stroke) => stroke.page !== page || !strokeNearPoint(stroke, point.x, point.y),
        ),
      );
      return;
    }
    if (!draftRef.current) return;
    draftRef.current.points.push(point);
    const canvas = inkCanvasRef.current;
    if (canvas) drawInk(canvas, pageStrokes, draftRef.current);
  };

  const finishInk = () => {
    if (!draftRef.current) return;
    onAnnotationsChange([...annotations, draftRef.current]);
    draftRef.current = null;
  };

  return (
    <section className="study-reader pdf-study-reader" aria-label={`Annotating ${fileName}`}>
      <header className="study-reader-titlebar">
        <button type="button" onClick={onClose} aria-label="Close PDF">←</button>
        <div><small>PDF STUDY DESK</small><strong>{fileName}</strong></div>
        <span>{page} / {pages}</span>
      </header>
      <nav className="pdf-tool-ribbon" aria-label="PDF annotation tools">
        {([
          ["hand", "☝", "Move"],
          ["pen", "✎", "Pen"],
          ["highlighter", "▰", "Marker"],
          ["eraser", "◇", "Eraser"],
        ] as [PdfInkTool, string, string][]).map(([id, icon, label]) => (
          <button key={id} className={tool === id ? "active" : ""} onClick={() => setTool(id)}>
            <span>{icon}</span><small>{label}</small>
          </button>
        ))}
        <i className="pdf-tools-separator" />
        {["#25272b", "#df6d89", "#e1b94f", "#77a8d7", "#76aa80"].map((swatch) => (
          <button
            key={swatch}
            className={color === swatch ? "pdf-color active" : "pdf-color"}
            style={{ backgroundColor: swatch }}
            onClick={() => setColor(swatch)}
            aria-label={`Use ${swatch}`}
          />
        ))}
        <label className="pdf-size-control">
          <small>Size</small>
          <input type="range" min="2" max="16" value={size} onChange={(event) => setSize(Number(event.target.value))} />
        </label>
        <button
          disabled={!pageStrokes.length}
          onClick={() => {
            const lastId = pageStrokes.at(-1)?.id;
            if (lastId) onAnnotationsChange(annotations.filter((stroke) => stroke.id !== lastId));
          }}
        ><span>↶</span><small>Undo</small></button>
      </nav>
      <div className="pdf-page-wrap" ref={pageWrapRef} data-tool={tool}>
        {loading && <div className="study-reader-loading">{loading}</div>}
        <div className="pdf-page-stack">
          <canvas ref={pdfCanvasRef} className="pdf-paper-canvas" />
          <canvas
            ref={inkCanvasRef}
            className="pdf-ink-canvas"
            onPointerDown={beginInk}
            onPointerMove={continueInk}
            onPointerUp={finishInk}
            onPointerCancel={finishInk}
          />
        </div>
      </div>
      <footer className="study-reader-footer">
        <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Previous</button>
        <div className="pdf-zoom-controls">
          <button onClick={() => setZoom((value) => Math.max(.7, value - .15))}>−</button>
          <strong>{Math.round(zoom * 100)}%</strong>
          <button onClick={() => setZoom((value) => Math.min(2.4, value + .15))}>＋</button>
        </div>
        <button disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Next →</button>
      </footer>
    </section>
  );
}

export function EpubStudyReader({
  fileName,
  book,
  readingState,
  onReadingStateChange,
  onClose,
}: {
  fileName: string;
  book: EpubBook;
  readingState: EpubReadingState;
  onReadingStateChange: (state: EpubReadingState) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [outlineOpen, setOutlineOpen] = useState(true);
  const chapterIndex = Math.min(book.chapters.length - 1, Math.max(0, readingState.chapter));
  const chapter = book.chapters[chapterIndex];
  const paragraphs = useMemo(() => chapter.text.split(/\n{2,}/).filter(Boolean), [chapter.text]);
  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return book.chapters.flatMap((item, index) => {
      const at = item.text.toLowerCase().indexOf(query);
      if (at < 0 && !item.title.toLowerCase().includes(query)) return [];
      return [{
        index,
        title: item.title,
        preview: item.text.slice(Math.max(0, at - 45), Math.max(0, at - 45) + 150),
      }];
    }).slice(0, 12);
  }, [book.chapters, search]);

  const update = (patch: Partial<EpubReadingState>) => {
    onReadingStateChange({ ...readingState, ...patch });
  };
  const bookmarked = readingState.bookmarks.includes(chapterIndex);

  return (
    <section className="study-reader epub-study-reader" aria-label={`Reading ${fileName}`}>
      <header className="study-reader-titlebar">
        <button type="button" onClick={onClose} aria-label="Close EPUB">←</button>
        <div><small>EPUB READING NOOK</small><strong>{book.title}</strong><em>{book.author}</em></div>
        <button
          type="button"
          className={bookmarked ? "epub-bookmark active" : "epub-bookmark"}
          onClick={() => update({
            bookmarks: bookmarked
              ? readingState.bookmarks.filter((item) => item !== chapterIndex)
              : [...readingState.bookmarks, chapterIndex],
          })}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark chapter"}
        >{bookmarked ? "◆" : "◇"}</button>
      </header>
      <nav className="epub-tool-ribbon" aria-label="EPUB reading tools">
        <button onClick={() => setOutlineOpen((value) => !value)}>☰ <span>Chapters</span></button>
        <label><span>Search book</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this book" /></label>
        <button onClick={() => update({ fontSize: Math.max(14, readingState.fontSize - 1) })}>A−</button>
        <button onClick={() => update({ fontSize: Math.min(30, readingState.fontSize + 1) })}>A＋</button>
        <button onClick={() => update({ lineHeight: readingState.lineHeight === 1.7 ? 2 : 1.7 })}>↕ <span>Spacing</span></button>
      </nav>
      <div className={outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"}>
        <aside className="epub-outline">
          <small>CONTENTS</small>
          {book.chapters.map((item, index) => (
            <button key={item.id} className={index === chapterIndex ? "active" : ""} onClick={() => update({ chapter: index })}>
              <span>{String(index + 1).padStart(2, "0")}</span>{item.title}
              {readingState.bookmarks.includes(index) && <i>◆</i>}
            </button>
          ))}
        </aside>
        <main className="epub-paper">
          {results.length > 0 && (
            <section className="epub-search-results">
              <header><strong>{results.length} matches</strong><button onClick={() => setSearch("")}>Clear</button></header>
              {results.map((result) => (
                <button key={`${result.index}-${result.title}`} onClick={() => { update({ chapter: result.index }); setSearch(""); }}>
                  <strong>{result.title}</strong><span>{result.preview}</span>
                </button>
              ))}
            </section>
          )}
          <article style={{ fontSize: readingState.fontSize, lineHeight: readingState.lineHeight }}>
            <p className="epub-chapter-number">CHAPTER {chapterIndex + 1}</p>
            <h1>{chapter.title}</h1>
            {paragraphs.map((paragraph, index) => <p key={`${chapter.id}-${index}`}>{paragraph}</p>)}
          </article>
          <label className="epub-margin-note">
            <span>Margin note for this chapter</span>
            <textarea
              value={readingState.chapterNotes[chapter.id] || ""}
              onChange={(event) => update({
                chapterNotes: { ...readingState.chapterNotes, [chapter.id]: event.target.value },
              })}
              placeholder="A thought, question, or quotation to revisit…"
            />
          </label>
        </main>
      </div>
      <footer className="study-reader-footer">
        <button disabled={chapterIndex <= 0} onClick={() => update({ chapter: chapterIndex - 1 })}>← Previous chapter</button>
        <span>{chapterIndex + 1} of {book.chapters.length}</span>
        <button disabled={chapterIndex >= book.chapters.length - 1} onClick={() => update({ chapter: chapterIndex + 1 })}>Next chapter →</button>
      </footer>
    </section>
  );
}
