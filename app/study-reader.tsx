"use client";

import {
  CSSProperties,
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
  highlights?: EpubTextHighlight[];
};

export type EpubTextHighlight = {
  id: string;
  chapterId: string;
  paragraphIndex: number;
  text: string;
  color: string;
};

type SelectionMenuPosition = { left: number; top: number };

const pastelHighlightColors = [
  { name: "Blush", value: "#f8c8dc" },
  { name: "Butter", value: "#f3dda4" },
  { name: "Lilac", value: "#d8c7f0" },
  { name: "Sky", value: "#bfddef" },
  { name: "Sage", value: "#c7e2cb" },
];

const readerDarkModeStorageKey = "aerea-reader-dark-mode";

function useReaderDarkMode() {
  const [readerDark, setReaderDark] = useState(false);

  useEffect(() => {
    try {
      setReaderDark(window.localStorage.getItem(readerDarkModeStorageKey) === "dark");
    } catch {
      // Reading preferences still work for this session when storage is unavailable.
    }
  }, []);

  const toggleReaderDark = () => {
    setReaderDark((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(readerDarkModeStorageKey, next ? "dark" : "light");
      } catch {
        // Keep the in-memory preference even when storage is unavailable.
      }
      return next;
    });
  };

  return { readerDark, toggleReaderDark };
}

function normalizeReaderSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function readerTextMatchRange(text: string, rawQuery: string) {
  const query = normalizeReaderSearch(rawQuery);
  if (!query) return null;

  let normalized = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let previousWasSpace = false;

  let characterIndex = 0;
  Array.from(text).forEach((character) => {
    const normalizedCharacter = character
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase();

    Array.from(normalizedCharacter).forEach((part) => {
      if (/\s/.test(part)) {
        if (!normalized || previousWasSpace) return;
        normalized += " ";
        starts.push(characterIndex);
        ends.push(characterIndex + character.length);
        previousWasSpace = true;
        return;
      }
      normalized += part;
      starts.push(characterIndex);
      ends.push(characterIndex + character.length);
      previousWasSpace = false;
    });
    characterIndex += character.length;
  });

  if (normalized.endsWith(" ")) {
    normalized = normalized.slice(0, -1);
    starts.pop();
    ends.pop();
  }

  const matchStart = normalized.indexOf(query);
  if (matchStart < 0) return null;
  return {
    start: starts[matchStart] ?? 0,
    end: ends[matchStart + query.length - 1] ?? text.length,
  };
}

function pdfSearchMatchSpans(textLayer: HTMLDivElement, rawQuery: string) {
  const query = normalizeReaderSearch(rawQuery);
  if (!query) return [];

  let searchableText = "";
  const entries: { element: HTMLSpanElement; start: number; end: number }[] = [];
  textLayer.querySelectorAll<HTMLSpanElement>("span").forEach((element) => {
    const text = normalizeReaderSearch(element.textContent || "");
    if (!text) return;
    if (searchableText) searchableText += " ";
    const start = searchableText.length;
    searchableText += text;
    entries.push({ element, start, end: searchableText.length });
  });

  const matchStart = searchableText.indexOf(query);
  if (matchStart < 0) return [];
  const matchEnd = matchStart + query.length;
  return entries
    .filter(({ start, end }) => end > matchStart && start < matchEnd)
    .map(({ element }) => element);
}

function readerSearchSnippet(text: string, rawQuery: string) {
  const normalizedText = normalizeReaderSearch(text);
  const query = normalizeReaderSearch(rawQuery);
  const at = normalizedText.indexOf(query);
  const start = Math.max(0, at < 0 ? 0 : at - 58);
  const snippet = text.slice(start, start + 170).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${snippet}${start + 170 < text.length ? "…" : ""}`;
}

function SelectionHighlightMenu({
  position,
  onChoose,
}: {
  position: SelectionMenuPosition;
  onChoose: (color: string) => void;
}) {
  return (
    <div
      className="selection-highlight-menu"
      style={{ left: position.left, top: position.top } as CSSProperties}
      role="toolbar"
      aria-label="Highlight selected text"
    >
      <small>Highlight</small>
      {pastelHighlightColors.map((color) => (
        <button
          key={color.value}
          type="button"
          style={{ "--selection-color": color.value } as CSSProperties}
          aria-label={`Highlight ${color.name.toLowerCase()}`}
          onPointerDown={(event) => {
            event.preventDefault();
            onChoose(color.value);
          }}
        />
      ))}
    </div>
  );
}

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
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const pageStackRef = useRef<HTMLDivElement | null>(null);
  const pageWrapRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  const activeTextLayerRef = useRef<{ cancel: () => void } | null>(null);
  const draftRef = useRef<PdfInkStroke | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<PdfInkTool>("hand");
  const [color, setColor] = useState("#25272b");
  const [size, setSize] = useState(4);
  const [loading, setLoading] = useState("Opening your PDF…");
  const [renderVersion, setRenderVersion] = useState(0);
  const [textLayerVersion, setTextLayerVersion] = useState(0);
  const [pdfSearch, setPdfSearch] = useState("");
  const [pdfSearchOpen, setPdfSearchOpen] = useState(false);
  const [activePdfSearch, setActivePdfSearch] = useState<{
    page: number;
    query: string;
  } | null>(null);
  const [pdfPageTexts, setPdfPageTexts] = useState<string[]>([]);
  const [indexedPages, setIndexedPages] = useState(0);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuPosition | null>(null);
  const { readerDark, toggleReaderDark } = useReaderDarkMode();

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
        setPdfPageTexts([]);
        setIndexedPages(0);
        const searchablePages: string[] = [];
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          if (cancelled) return;
          const searchablePage = await document.getPage(pageNumber);
          const textContent = await searchablePage.getTextContent();
          searchablePages.push(
            textContent.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ")
              .replace(/\s+/g, " ")
              .trim(),
          );
          setPdfPageTexts([...searchablePages]);
          setIndexedPages(pageNumber);
        }
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
      activeTextLayerRef.current?.cancel();
      activeTextLayerRef.current = null;
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
      const textLayerContainer = textLayerRef.current;
      const wrap = pageWrapRef.current;
      if (!document || !pdfCanvas || !inkCanvas || !textLayerContainer || !wrap) return;
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
      textLayerContainer.replaceChildren();
      textLayerContainer.style.width = `${viewport.width}px`;
      textLayerContainer.style.height = `${viewport.height}px`;
      const context = pdfCanvas.getContext("2d");
      if (!context || cancelled) return;
      await pdfPage.render({
        canvas: pdfCanvas,
        canvasContext: context,
        viewport,
        transform: density === 1 ? undefined : [density, 0, 0, density, 0, 0],
      }).promise;
      if (cancelled) return;
      const pdfjs = await import("pdfjs-dist");
      activeTextLayerRef.current?.cancel();
      const textLayer = new pdfjs.TextLayer({
        textContentSource: await pdfPage.getTextContent({
          includeMarkedContent: true,
          disableNormalization: true,
        }),
        container: textLayerContainer,
        viewport,
      });
      activeTextLayerRef.current = textLayer;
      await textLayer.render();
      if (!cancelled) {
        drawInk(inkCanvas, pageStrokes);
        setTextLayerVersion((value) => value + 1);
      }
    }
    void renderPage();
    return () => {
      cancelled = true;
      activeTextLayerRef.current?.cancel();
    };
  }, [page, pageStrokes, renderVersion, zoom]);

  const pdfSearchResults = useMemo(() => {
    const query = normalizeReaderSearch(pdfSearch);
    if (!query) return [];
    return pdfPageTexts.flatMap((text, index) => {
      const normalized = normalizeReaderSearch(text);
      if (!normalized.includes(query)) return [];
      let matches = 0;
      let cursor = 0;
      while ((cursor = normalized.indexOf(query, cursor)) >= 0) {
        matches += 1;
        cursor += Math.max(1, query.length);
      }
      return [{
        page: index + 1,
        matches,
        preview: readerSearchSnippet(text, pdfSearch),
      }];
    });
  }, [pdfPageTexts, pdfSearch]);

  useEffect(() => {
    const textLayer = textLayerRef.current;
    const wrap = pageWrapRef.current;
    if (!textLayer || !wrap) return;
    textLayer.querySelectorAll(".pdf-search-match").forEach((element) => {
      element.classList.remove("pdf-search-match");
    });
    if (!activePdfSearch || activePdfSearch.page !== page) return;

    const matchingSpans = pdfSearchMatchSpans(textLayer, activePdfSearch.query);
    matchingSpans.forEach((element) => element.classList.add("pdf-search-match"));
    const frame = window.requestAnimationFrame(() => {
      const firstMatch = matchingSpans[0];
      if (!firstMatch) {
        wrap.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const wrapBounds = wrap.getBoundingClientRect();
      const matchBounds = firstMatch.getBoundingClientRect();
      wrap.scrollTo({
        top: Math.max(
          0,
          wrap.scrollTop + matchBounds.top - wrapBounds.top - wrap.clientHeight * 0.34,
        ),
        left: Math.max(
          0,
          wrap.scrollLeft + matchBounds.left - wrapBounds.left - wrap.clientWidth * 0.24,
        ),
        behavior: "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePdfSearch, page, textLayerVersion]);

  const openPdfSearchResults = () => {
    if (!normalizeReaderSearch(pdfSearch)) return;
    setActivePdfSearch(null);
    setPdfSearchOpen(true);
    window.requestAnimationFrame(() => {
      pageWrapRef.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
  };

  const dismissPdfSearchHighlight = () => {
    setActivePdfSearch(null);
    setPdfSearchOpen(false);
  };

  useEffect(() => {
    const updateSelectionMenu = () => {
      if (tool !== "hand") {
        setSelectionMenu(null);
        return;
      }
      const selection = window.getSelection();
      const textLayer = textLayerRef.current;
      if (!selection || selection.isCollapsed || !selection.rangeCount || !textLayer) {
        setSelectionMenu(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!textLayer.contains(range.commonAncestorContainer)) {
        setSelectionMenu(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        setSelectionMenu(null);
        return;
      }
      setSelectionMenu({
        left: Math.max(126, Math.min(window.innerWidth - 126, rect.left + rect.width / 2)),
        top: Math.max(74, rect.top - 58),
      });
    };
    document.addEventListener("selectionchange", updateSelectionMenu);
    window.addEventListener("scroll", updateSelectionMenu, true);
    return () => {
      document.removeEventListener("selectionchange", updateSelectionMenu);
      window.removeEventListener("scroll", updateSelectionMenu, true);
    };
  }, [page, tool]);

  const highlightPdfSelection = (highlightColor: string) => {
    const selection = window.getSelection();
    const stack = pageStackRef.current;
    const textLayer = textLayerRef.current;
    if (!selection || selection.isCollapsed || !selection.rangeCount || !stack || !textLayer) return;
    const range = selection.getRangeAt(0);
    if (!textLayer.contains(range.commonAncestorContainer)) return;
    const stackBounds = stack.getBoundingClientRect();
    const highlightStrokes = Array.from(range.getClientRects())
      .filter(
        (rect) =>
          rect.width > 2 &&
          rect.height > 2 &&
          rect.right > stackBounds.left &&
          rect.left < stackBounds.right &&
          rect.bottom > stackBounds.top &&
          rect.top < stackBounds.bottom,
      )
      .map((rect) => {
        const left = Math.max(stackBounds.left, rect.left);
        const right = Math.min(stackBounds.right, rect.right);
        const middle = Math.max(
          stackBounds.top,
          Math.min(stackBounds.bottom, rect.top + rect.height * 0.57),
        );
        return {
          id: crypto.randomUUID(),
          fileId,
          page,
          tool: "highlighter" as const,
          color: highlightColor,
          size: Math.max(12, (rect.height / Math.max(1, stackBounds.width)) * 900 * 0.78),
          points: [
            { x: (left - stackBounds.left) / stackBounds.width, y: (middle - stackBounds.top) / stackBounds.height },
            { x: (right - stackBounds.left) / stackBounds.width, y: (middle - stackBounds.top) / stackBounds.height },
          ],
        };
      });
    if (highlightStrokes.length) {
      onAnnotationsChange([...annotations, ...highlightStrokes]);
    }
    selection.removeAllRanges();
    setSelectionMenu(null);
  };

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
    <section
      className={`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`}
      aria-label={`Annotating ${fileName}`}
    >
      <header className="study-reader-titlebar">
        <button type="button" onClick={onClose} aria-label="Close PDF">←</button>
        <div><small>PDF STUDY DESK</small><strong>{fileName}</strong></div>
        <span>{page} / {pages}</span>
      </header>
      <nav className="pdf-tool-ribbon" aria-label="PDF annotation tools">
        {([
          ["hand", "☝", "Select"],
          ["pen", "✎", "Pen"],
          ["highlighter", "▰", "Marker"],
          ["eraser", "◇", "Eraser"],
        ] as [PdfInkTool, string, string][]).map(([id, icon, label]) => (
          <button key={id} className={tool === id ? "active" : ""} onClick={() => setTool(id)}>
            <span>{icon}</span><small>{label}</small>
          </button>
        ))}
        <button
          type="button"
          className={`reader-dark-toggle${readerDark ? " active" : ""}`}
          onClick={toggleReaderDark}
          aria-label={readerDark ? "Use light reading mode" : "Use dark reading mode"}
          aria-pressed={readerDark}
        >
          <span aria-hidden="true">{readerDark ? "☀" : "☾"}</span>
          <small>{readerDark ? "Light" : "Dark"}</small>
        </button>
        <label className="pdf-search-control">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={pdfSearch}
            onChange={(event) => {
              const nextSearch = event.target.value;
              setPdfSearch(nextSearch);
              setActivePdfSearch(null);
              setPdfSearchOpen(Boolean(normalizeReaderSearch(nextSearch)));
            }}
            onFocus={() => setPdfSearchOpen(Boolean(normalizeReaderSearch(pdfSearch)))}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              openPdfSearchResults();
            }}
            placeholder="Search in this PDF"
            aria-label="Search in this PDF"
          />
          <small>
            {indexedPages < pages
              ? `Indexing ${indexedPages}/${pages}`
              : pdfSearch.trim()
                ? `${pdfSearchResults.reduce((total, result) => total + result.matches, 0)} matches`
                : "All pages ready"}
          </small>
        </label>
        <i className="pdf-tools-separator" />
        {["#25272b", ...pastelHighlightColors.map((item) => item.value)].map((swatch) => (
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
        {pdfSearchOpen && pdfSearch.trim() && (
          <aside className="pdf-search-results" aria-label="PDF search results">
            <header>
              <span>
                <strong>{pdfSearchResults.length}</strong> pages with matches
              </span>
              <button
                type="button"
                onClick={() => {
                  setPdfSearch("");
                  setPdfSearchOpen(false);
                  setActivePdfSearch(null);
                }}
              >
                Clear
              </button>
            </header>
            {indexedPages < pages && <p>Reading the remaining pages…</p>}
            {indexedPages === pages && pdfSearchResults.length === 0 && (
              <p>No matches in this PDF.</p>
            )}
            {pdfSearchResults.map((result) => (
              <button
                type="button"
                key={result.page}
                className={activePdfSearch?.page === result.page ? "active" : ""}
                onClick={() => {
                  setTool("hand");
                  setPdfSearchOpen(false);
                  setActivePdfSearch({ page: result.page, query: pdfSearch });
                  setPage(result.page);
                }}
              >
                <strong>Page {result.page}</strong>
                <span>{result.preview}</span>
                <small>{result.matches} {result.matches === 1 ? "match" : "matches"}</small>
              </button>
            ))}
          </aside>
        )}
        <div
          className="pdf-page-stack"
          ref={pageStackRef}
          onPointerDownCapture={dismissPdfSearchHighlight}
        >
          <canvas ref={pdfCanvasRef} className="pdf-paper-canvas" />
          <div ref={textLayerRef} className="pdf-text-layer textLayer" />
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
      {selectionMenu && (
        <SelectionHighlightMenu
          position={selectionMenu}
          onChoose={highlightPdfSelection}
        />
      )}
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
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [activeEpubSearch, setActiveEpubSearch] = useState<{
    chapterId: string;
    query: string;
  } | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuPosition | null>(null);
  const epubArticleRef = useRef<HTMLElement | null>(null);
  const epubPaperRef = useRef<HTMLElement | null>(null);
  const { readerDark, toggleReaderDark } = useReaderDarkMode();
  const chapterIndex = Math.min(book.chapters.length - 1, Math.max(0, readingState.chapter));
  const chapter = book.chapters[chapterIndex];
  const paragraphs = useMemo(() => chapter.text.split(/\n{2,}/).filter(Boolean), [chapter.text]);
  const results = useMemo(() => {
    const query = normalizeReaderSearch(search);
    if (!query) return [];
    return book.chapters.flatMap((item, index) => {
      const searchable = normalizeReaderSearch(`${item.title} ${item.text}`);
      if (!searchable.includes(query)) return [];
      let matches = 0;
      let cursor = 0;
      while ((cursor = searchable.indexOf(query, cursor)) >= 0) {
        matches += 1;
        cursor += Math.max(1, query.length);
      }
      return [{
        index,
        title: item.title,
        matches,
        preview: readerSearchSnippet(item.text || item.title, search),
      }];
    }).slice(0, 40);
  }, [book.chapters, search]);

  const update = (patch: Partial<EpubReadingState>) => {
    onReadingStateChange({ ...readingState, ...patch });
  };
  const bookmarked = readingState.bookmarks.includes(chapterIndex);

  const openEpubSearchResults = () => {
    if (!normalizeReaderSearch(search)) return;
    setActiveEpubSearch(null);
    setSearchResultsOpen(true);
    window.requestAnimationFrame(() => {
      epubPaperRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const dismissEpubSearchHighlight = () => {
    setActiveEpubSearch(null);
    setSearchResultsOpen(false);
  };

  useEffect(() => {
    if (!activeEpubSearch || activeEpubSearch.chapterId !== chapter.id) return;
    const frame = window.requestAnimationFrame(() => {
      const article = epubArticleRef.current;
      const paper = epubPaperRef.current;
      const match = article?.querySelector<HTMLElement>(".epub-search-match");
      if (!article || !paper) return;
      if (!match) {
        paper.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const paperBounds = paper.getBoundingClientRect();
      const matchBounds = match.getBoundingClientRect();
      paper.scrollTo({
        top: Math.max(
          0,
          paper.scrollTop + matchBounds.top - paperBounds.top - paper.clientHeight * 0.3,
        ),
        behavior: "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeEpubSearch, chapter.id]);

  useEffect(() => {
    const updateSelectionMenu = () => {
      const selection = window.getSelection();
      const article = epubArticleRef.current;
      if (!selection || selection.isCollapsed || !selection.rangeCount || !article) {
        setSelectionMenu(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!article.contains(range.commonAncestorContainer)) {
        setSelectionMenu(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        setSelectionMenu(null);
        return;
      }
      setSelectionMenu({
        left: Math.max(126, Math.min(window.innerWidth - 126, rect.left + rect.width / 2)),
        top: Math.max(74, rect.top - 58),
      });
    };
    document.addEventListener("selectionchange", updateSelectionMenu);
    window.addEventListener("scroll", updateSelectionMenu, true);
    return () => {
      document.removeEventListener("selectionchange", updateSelectionMenu);
      window.removeEventListener("scroll", updateSelectionMenu, true);
    };
  }, [chapter.id]);

  const highlightEpubSelection = (highlightColor: string) => {
    const selection = window.getSelection();
    const article = epubArticleRef.current;
    if (!selection || selection.isCollapsed || !selection.rangeCount || !article) return;
    const range = selection.getRangeAt(0);
    if (!article.contains(range.commonAncestorContainer)) return;
    const anchorElement =
      selection.anchorNode instanceof Element
        ? selection.anchorNode
        : selection.anchorNode?.parentElement;
    const paragraph = anchorElement?.closest<HTMLElement>("[data-epub-paragraph]");
    const paragraphIndex = Number(paragraph?.dataset.epubParagraph);
    const selectedText = selection.toString().replace(/\s+/g, " ").trim();
    if (!paragraph || !Number.isInteger(paragraphIndex) || !selectedText) return;
    update({
      highlights: [
        ...(readingState.highlights ?? []),
        {
          id: crypto.randomUUID(),
          chapterId: chapter.id,
          paragraphIndex,
          text: selectedText,
          color: highlightColor,
        },
      ],
    });
    selection.removeAllRanges();
    setSelectionMenu(null);
  };

  const renderParagraph = (paragraph: string, paragraphIndex: number) => {
    const paragraphHighlights = (readingState.highlights ?? [])
      .filter(
        (highlight) =>
          highlight.chapterId === chapter.id &&
          highlight.paragraphIndex === paragraphIndex &&
          paragraph.includes(highlight.text),
      )
      .map((highlight) => ({
        ...highlight,
        start: paragraph.indexOf(highlight.text),
        end: paragraph.indexOf(highlight.text) + highlight.text.length,
      }))
      .sort((first, second) => first.start - second.start);
    const searchMatch =
      activeEpubSearch?.chapterId === chapter.id
        ? readerTextMatchRange(paragraph, activeEpubSearch.query)
        : null;
    if (!paragraphHighlights.length && !searchMatch) return paragraph;

    const boundaries = new Set([0, paragraph.length]);
    paragraphHighlights.forEach((highlight) => {
      boundaries.add(highlight.start);
      boundaries.add(highlight.end);
    });
    if (searchMatch) {
      boundaries.add(searchMatch.start);
      boundaries.add(searchMatch.end);
    }
    const orderedBoundaries = [...boundaries].sort((first, second) => first - second);

    return orderedBoundaries.slice(0, -1).map((start, index) => {
      const end = orderedBoundaries[index + 1];
      const text = paragraph.slice(start, end);
      const isSearchMatch = Boolean(
        searchMatch && start >= searchMatch.start && end <= searchMatch.end,
      );
      if (isSearchMatch) {
        return (
          <mark className="epub-search-match" key={`search-${paragraphIndex}-${start}`}>
            {text}
          </mark>
        );
      }
      const savedHighlight = paragraphHighlights.find(
        (highlight) => start >= highlight.start && end <= highlight.end,
      );
      if (savedHighlight) {
        return (
          <mark
            className="epub-saved-highlight"
            key={`${savedHighlight.id}-${start}`}
            style={{ "--saved-highlight": savedHighlight.color } as CSSProperties}
          >
            {text}
          </mark>
        );
      }
      return text;
    });
  };

  return (
    <section
      className={`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`}
      aria-label={`Reading ${fileName}`}
    >
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
        <label>
          <span>Search book</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              const nextSearch = event.target.value;
              setSearch(nextSearch);
              setActiveEpubSearch(null);
              setSearchResultsOpen(Boolean(normalizeReaderSearch(nextSearch)));
            }}
            onFocus={() => setSearchResultsOpen(Boolean(normalizeReaderSearch(search)))}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              openEpubSearchResults();
            }}
            placeholder="Search this book"
            aria-label="Search this book"
          />
        </label>
        <button onClick={() => update({ fontSize: Math.max(14, readingState.fontSize - 1) })}>A−</button>
        <button onClick={() => update({ fontSize: Math.min(30, readingState.fontSize + 1) })}>A＋</button>
        <button onClick={() => update({ lineHeight: readingState.lineHeight === 1.7 ? 2 : 1.7 })}>↕ <span>Spacing</span></button>
        <button
          type="button"
          className={`reader-dark-toggle${readerDark ? " active" : ""}`}
          onClick={toggleReaderDark}
          aria-label={readerDark ? "Use light reading mode" : "Use dark reading mode"}
          aria-pressed={readerDark}
        >
          {readerDark ? "☀" : "☾"} <span>{readerDark ? "Light" : "Dark"}</span>
        </button>
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
        <main className="epub-paper" ref={epubPaperRef}>
          {searchResultsOpen && results.length > 0 && (
            <section className="epub-search-results">
              <header>
                <strong>{results.reduce((total, result) => total + result.matches, 0)} matches in {results.length} chapters</strong>
                <button
                  onClick={() => {
                    setSearch("");
                    setSearchResultsOpen(false);
                    setActiveEpubSearch(null);
                  }}
                >
                  Clear
                </button>
              </header>
              {results.map((result) => (
                <button
                  key={`${result.index}-${result.title}`}
                  onClick={() => {
                    setSearchResultsOpen(false);
                    setActiveEpubSearch({
                      chapterId: book.chapters[result.index].id,
                      query: search,
                    });
                    update({ chapter: result.index });
                  }}
                >
                  <strong>{result.title}</strong><span>{result.preview}</span><small>{result.matches}</small>
                </button>
              ))}
            </section>
          )}
          {searchResultsOpen && search.trim() && results.length === 0 && (
            <section className="epub-search-results empty">No matches in this book.</section>
          )}
          <article
            ref={epubArticleRef}
            style={{ fontSize: readingState.fontSize, lineHeight: readingState.lineHeight }}
            onPointerDownCapture={dismissEpubSearchHighlight}
          >
            <p className="epub-chapter-number">CHAPTER {chapterIndex + 1}</p>
            <h1>{chapter.title}</h1>
            {paragraphs.map((paragraph, index) => (
              <p data-epub-paragraph={index} key={`${chapter.id}-${index}`}>
                {renderParagraph(paragraph, index)}
              </p>
            ))}
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
      {selectionMenu && (
        <SelectionHighlightMenu
          position={selectionMenu}
          onChoose={highlightEpubSelection}
        />
      )}
      <footer className="study-reader-footer">
        <button disabled={chapterIndex <= 0} onClick={() => update({ chapter: chapterIndex - 1 })}>← Previous chapter</button>
        <span>{chapterIndex + 1} of {book.chapters.length}</span>
        <button disabled={chapterIndex >= book.chapters.length - 1} onClick={() => update({ chapter: chapterIndex + 1 })}>Next chapter →</button>
      </footer>
    </section>
  );
}
