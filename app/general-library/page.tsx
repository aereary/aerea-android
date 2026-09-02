"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { readEpub, type EpubBook } from "../epub-reader";
import {
  EpubStudyReader,
  PdfStudyReader,
  type EpubReadingState,
} from "../study-reader";
import { supabase } from "../supabase-sync";
import styles from "./general-library.module.css";

const GENERAL_LIBRARY_BUCKET = "aerea-drive-library";

type GeneralLibraryKind = "pdf" | "epub" | "document" | "file";

type GeneralLibraryItem = {
  id: string;
  filename: string;
  title: string;
  author: string | null;
  kind: GeneralLibraryKind;
  mimeType: string | null;
  extension: string | null;
  sizeBytes: number;
  storagePath: string | null;
  modifiedAt: string | null;
  versionCount: number;
};

type ActiveReader =
  | { kind: "pdf"; item: GeneralLibraryItem; source: string }
  | { kind: "epub"; item: GeneralLibraryItem; book: EpubBook };

type LibraryLoadState = "loading" | "ready" | "signed-out" | "error";

const initialEpubReadingState: EpubReadingState = {
  chapter: 0,
  scrollOffset: 0,
  fontSize: 19,
  lineHeight: 1.7,
  bookmarks: [],
  bookmarkNames: {},
  chapterNotes: {},
  highlights: [],
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function fileTitle(filename: string): string {
  const withoutExtension = filename.replace(/\.[^.]+$/, "").trim();
  return withoutExtension || filename;
}

function normalizeLibraryItem(
  value: unknown,
  versionCounts: Map<string, number>,
): GeneralLibraryItem | null {
  const row = asRecord(value);
  if (!row || typeof row.id !== "string" || typeof row.filename !== "string") {
    return null;
  }

  const kind = row.kind;
  if (kind !== "pdf" && kind !== "epub" && kind !== "document" && kind !== "file") {
    return null;
  }

  const numericSize = Number(row.size_bytes);
  const title = optionalText(row.title) ?? fileTitle(row.filename);
  return {
    id: row.id,
    filename: row.filename,
    title,
    author: optionalText(row.author),
    kind,
    mimeType: optionalText(row.mime_type),
    extension: optionalText(row.extension),
    sizeBytes: Number.isFinite(numericSize) && numericSize >= 0 ? numericSize : 0,
    storagePath: optionalText(row.storage_path),
    modifiedAt: optionalText(row.source_modified_at) ?? optionalText(row.updated_at),
    versionCount: versionCounts.get(row.id) ?? 0,
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${new Intl.NumberFormat("es-PA", {
    maximumFractionDigits: value >= 10 ? 1 : 2,
  }).format(value)} ${unit}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function fileType(item: GeneralLibraryItem): string {
  if (item.extension) return item.extension.replace(/^\./, "").toUpperCase();
  if (item.kind === "document") return "DOCUMENTO";
  if (item.kind === "file") return "ARCHIVO";
  return item.kind.toUpperCase();
}

async function fetchGeneralLibrary(): Promise<{
  signedIn: boolean;
  items: GeneralLibraryItem[];
}> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, items: [] };
  if (authError) throw authError;

  const [itemsResult, versionsResult] = await Promise.all([
    supabase
      .from("library_items")
      .select(
        "id,filename,title,author,kind,mime_type,extension,size_bytes,storage_path,source_modified_at,updated_at,archived",
      )
      .eq("owner_user_id", user.id)
      .eq("archived", false)
      .order("source_modified_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("library_item_versions")
      .select("library_item_id")
      .eq("owner_user_id", user.id),
  ]);

  if (itemsResult.error) throw itemsResult.error;
  if (versionsResult.error) throw versionsResult.error;

  const versionCounts = new Map<string, number>();
  for (const value of versionsResult.data ?? []) {
    const row = asRecord(value);
    if (!row || typeof row.library_item_id !== "string") continue;
    versionCounts.set(
      row.library_item_id,
      (versionCounts.get(row.library_item_id) ?? 0) + 1,
    );
  }

  return {
    signedIn: true,
    items: (itemsResult.data ?? [])
      .map((item) => normalizeLibraryItem(item, versionCounts))
      .filter((item): item is GeneralLibraryItem => item !== null),
  };
}

export default function GeneralLibraryPage() {
  const [loadState, setLoadState] = useState<LibraryLoadState>("loading");
  const [items, setItems] = useState<GeneralLibraryItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openMessage, setOpenMessage] = useState("");
  const [activeReader, setActiveReader] = useState<ActiveReader | null>(null);
  const [epubReadingState, setEpubReadingState] = useState<EpubReadingState>(
    initialEpubReadingState,
  );
  const requestIdRef = useRef(0);
  const readerUrlRef = useRef<string | null>(null);

  const clearReader = useCallback(() => {
    if (readerUrlRef.current) URL.revokeObjectURL(readerUrlRef.current);
    readerUrlRef.current = null;
    setActiveReader(null);
    setEpubReadingState(initialEpubReadingState);
  }, []);

  const loadLibrary = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoadState("loading");
    setLoadError("");
    try {
      const result = await fetchGeneralLibrary();
      if (requestId !== requestIdRef.current) return;
      setItems(result.items);
      setLoadState(result.signedIn ? "ready" : "signed-out");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLoadError(
        error instanceof Error
          ? error.message
          : "No pudimos cargar la Biblioteca General.",
      );
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadLibrary(), 0);
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void loadLibrary(), 0);
    });
    return () => {
      window.clearTimeout(initialLoad);
      requestIdRef.current += 1;
      data.subscription.unsubscribe();
    };
  }, [loadLibrary]);

  useEffect(
    () => () => {
      if (readerUrlRef.current) URL.revokeObjectURL(readerUrlRef.current);
    },
    [],
  );

  const openFile = async (item: GeneralLibraryItem) => {
    if (!item.storagePath || openingId) return;
    setOpeningId(item.id);
    setOpenMessage("");
    clearReader();
    try {
      const { data, error } = await supabase.storage
        .from(GENERAL_LIBRARY_BUCKET)
        .download(item.storagePath);
      if (error) throw error;

      if (item.kind === "pdf") {
        const source = URL.createObjectURL(data);
        readerUrlRef.current = source;
        setActiveReader({ kind: "pdf", item, source });
        return;
      }

      if (item.kind === "epub") {
        const book = await readEpub(data);
        setEpubReadingState(initialEpubReadingState);
        setActiveReader({ kind: "epub", item, book });
        return;
      }

      const source = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = source;
      link.download = item.filename;
      link.target = "_blank";
      link.rel = "noopener";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(source), 60_000);
      setOpenMessage(
        `“${item.filename}” se envió al visor o gestor de archivos de tu dispositivo.`,
      );
    } catch (error) {
      setOpenMessage(
        error instanceof Error
          ? error.message
          : "Este archivo no se pudo abrir en este momento.",
      );
    } finally {
      setOpeningId(null);
    }
  };

  const totalVersions = items.reduce((total, item) => total + item.versionCount, 0);

  return (
    <main
      className={`app-shell ${styles.shell}`}
      data-theme="otter"
      data-color-mode="light"
    >
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/" aria-label="Volver a aérea">
          <span className={styles.brandMark} aria-hidden="true">a</span>
          <span>
            <small>MY LITTLE DAY</small>
            <strong>aérea</strong>
          </span>
        </Link>
        <span className={styles.readOnlyPill}>solo lectura</span>
      </header>

      <section className={styles.intro} aria-labelledby="general-library-title">
        <div>
          <p className={styles.eyebrow}>TU COLECCIÓN PROTEGIDA</p>
          <h1 id="general-library-title">Biblioteca General</h1>
          <p>
            Tus EPUB, PDF y documentos sincronizados, reunidos sin tocar tu
            Biblioteca AO3.
          </p>
        </div>
        {loadState === "ready" && (
          <dl className={styles.summary}>
            <div>
              <dt>archivos</dt>
              <dd>{items.length}</dd>
            </div>
            <div>
              <dt>versiones</dt>
              <dd>{totalVersions}</dd>
            </div>
          </dl>
        )}
      </section>

      {openMessage && (
        <p className={styles.notice} role="status">
          {openMessage}
        </p>
      )}

      {loadState === "loading" && (
        <section className={styles.loading} aria-label="Cargando Biblioteca General">
          <span />
          <span />
          <span />
        </section>
      )}

      {loadState === "signed-out" && (
        <section className={styles.stateCard}>
          <span aria-hidden="true">♡</span>
          <h2>Tu biblioteca está esperando</h2>
          <p>
            Inicia sesión desde aérea para ver únicamente los archivos que te
            permite tu cuenta privada.
          </p>
          <Link href="/">Volver a aérea</Link>
        </section>
      )}

      {loadState === "error" && (
        <section className={styles.stateCard} role="alert">
          <span aria-hidden="true">!</span>
          <h2>No pudimos abrir la biblioteca</h2>
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadLibrary()}>
            Intentar de nuevo
          </button>
        </section>
      )}

      {loadState === "ready" && items.length === 0 && (
        <section className={styles.stateCard}>
          <span aria-hidden="true">◇</span>
          <h2>Aún no hay archivos aquí</h2>
          <p>
            Cuando la sincronización encuentre un archivo compatible, aparecerá
            en este espacio.
          </p>
        </section>
      )}

      {loadState === "ready" && items.length > 0 && (
        <section className={styles.grid} aria-label="Archivos de la Biblioteca General">
          {items.map((item) => {
            const opening = openingId === item.id;
            const canOpen = Boolean(item.storagePath);
            return (
              <article className={styles.card} key={item.id}>
                <header className={styles.cardHeader}>
                  <span className={styles.fileMark} data-kind={item.kind}>
                    {fileType(item)}
                  </span>
                  <div>
                    <p>{item.kind === "document" ? "DOCUMENTO" : "ARCHIVO"}</p>
                    <h2>{item.title}</h2>
                    {item.author && <span>por {item.author}</span>}
                  </div>
                </header>

                <dl className={styles.metadata}>
                  <div>
                    <dt>Nombre</dt>
                    <dd title={item.filename}>{item.filename}</dd>
                  </div>
                  <div>
                    <dt>Tamaño</dt>
                    <dd>{formatSize(item.sizeBytes)}</dd>
                  </div>
                  <div>
                    <dt>Modificado</dt>
                    <dd>{formatDate(item.modifiedAt)}</dd>
                  </div>
                  <div>
                    <dt>Versiones protegidas</dt>
                    <dd>{item.versionCount}</dd>
                  </div>
                </dl>

                <button
                  className={styles.openButton}
                  type="button"
                  disabled={!canOpen || Boolean(openingId)}
                  onClick={() => void openFile(item)}
                >
                  <span aria-hidden="true">↗</span>
                  {opening
                    ? "Abriendo…"
                    : canOpen
                      ? "Abrir archivo"
                      : "Archivo no disponible"}
                </button>
              </article>
            );
          })}
        </section>
      )}

      {activeReader?.kind === "pdf" && (
        <div className={styles.readOnlyReader}>
          <PdfStudyReader
            fileId={activeReader.item.id}
            fileName={activeReader.item.filename}
            source={activeReader.source}
            annotations={[]}
            onAnnotationsChange={() => undefined}
            pageNotes={{}}
            onPageNotesChange={() => undefined}
            onClose={clearReader}
          />
        </div>
      )}

      {activeReader?.kind === "epub" && (
        <div className={styles.readOnlyReader}>
          <EpubStudyReader
            fileName={activeReader.item.filename}
            book={activeReader.book}
            readingState={epubReadingState}
            onReadingStateChange={setEpubReadingState}
            onClose={clearReader}
          />
        </div>
      )}
    </main>
  );
}
