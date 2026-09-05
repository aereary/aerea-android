"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase-sync";

type GenericLibraryKind = "epub" | "pdf" | "document" | "file";

type GenericLibraryItem = {
  id: string;
  drive_file_id: string;
  filename: string;
  title: string;
  author: string | null;
  kind: GenericLibraryKind;
  mime_type: string | null;
  extension: string | null;
  size_bytes: number | null;
  sha256: string;
  source_modified_at: string | null;
  archived: boolean;
};

type GenericLibraryVersion = {
  id: string;
  library_item_id: string;
  drive_file_id: string;
  filename: string;
  title: string;
  author: string | null;
  kind: GenericLibraryKind;
  extension: string | null;
  size_bytes: number | null;
  sha256: string;
  captured_at: string | null;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function driveViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

function kindLabel(item: GenericLibraryItem) {
  if (item.kind === "epub") return "LIBRO · EPUB";
  if (item.kind === "pdf") return "DOCUMENTO · PDF";
  if (item.kind === "document") return "DOCUMENTO";
  return "ARCHIVO";
}

function kindHuman(kind: GenericLibraryKind) {
  if (kind === "epub") return "Libro EPUB";
  if (kind === "pdf") return "Documento PDF";
  if (kind === "document") return "Documento";
  return "Archivo";
}

function fileSizeLabel(bytes: number | null) {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) {
    return "Tamaño no disponible";
  }
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

function dateLabel(value: string | null) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function validGenericItems(value: unknown): GenericLibraryItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is GenericLibraryItem => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return (
      typeof row.id === "string" &&
      typeof row.drive_file_id === "string" &&
      Boolean(row.drive_file_id.trim()) &&
      typeof row.filename === "string" &&
      typeof row.title === "string" &&
      Boolean(row.title.trim()) &&
      (typeof row.author === "string" || row.author === null) &&
      (row.kind === "epub" ||
        row.kind === "pdf" ||
        row.kind === "document" ||
        row.kind === "file") &&
      (typeof row.mime_type === "string" || row.mime_type === null) &&
      (typeof row.extension === "string" || row.extension === null) &&
      (typeof row.size_bytes === "number" || row.size_bytes === null) &&
      typeof row.sha256 === "string" &&
      Boolean(row.sha256.trim()) &&
      (typeof row.source_modified_at === "string" ||
        row.source_modified_at === null) &&
      typeof row.archived === "boolean"
    );
  });
}

function validGenericVersions(value: unknown): GenericLibraryVersion[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is GenericLibraryVersion => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return (
      typeof row.id === "string" &&
      typeof row.library_item_id === "string" &&
      typeof row.drive_file_id === "string" &&
      Boolean(row.drive_file_id.trim()) &&
      typeof row.filename === "string" &&
      typeof row.title === "string" &&
      (typeof row.author === "string" || row.author === null) &&
      (row.kind === "epub" ||
        row.kind === "pdf" ||
        row.kind === "document" ||
        row.kind === "file") &&
      (typeof row.extension === "string" || row.extension === null) &&
      (typeof row.size_bytes === "number" || row.size_bytes === null) &&
      typeof row.sha256 === "string" &&
      Boolean(row.sha256.trim()) &&
      (typeof row.captured_at === "string" || row.captured_at === null)
    );
  });
}

function GenericLibraryCard({
  item,
  versions,
}: {
  item: GenericLibraryItem;
  versions: GenericLibraryVersion[];
}) {
  const historicalVersions = useMemo(() => {
    const bySha = new Map<string, GenericLibraryVersion>();

    [...versions]
      .sort((a, b) => (b.captured_at || "").localeCompare(a.captured_at || ""))
      .forEach((version) => {
        const sha = version.sha256.toUpperCase();
        if (sha === item.sha256.toUpperCase()) return;
        if (!bySha.has(sha)) bySha.set(sha, version);
      });

    return Array.from(bySha.values());
  }, [item.sha256, versions]);

  const copyTitle = async () => {
    try {
      await navigator.clipboard?.writeText(item.title);
    } catch {
      // Copy is optional. A clipboard failure must not affect the Library.
    }
  };

  const extension = (item.extension || item.kind).toUpperCase();

  return (
    <article className="ao3-card aerea-generic-library-card">
      <header className="ao3-card-header">
        <span className="ao3-eyebrow">{kindLabel(item)}</span>
        <button
          className="ao3-copy-title"
          type="button"
          title="Tocar para copiar el título"
          onClick={() => void copyTitle()}
        >
          {item.title}
        </button>
      </header>

      <div className="ao3-card-meta">
        <strong>{item.author || "Sin autor guardado"}</strong>
        <span>{item.filename}</span>
        <span className="ao3-status">{extension}</span>
      </div>

      <div className="ao3-card-body">
        <div className="ao3-context">
          <div>
            <b>Tipo</b>
            <span>{kindHuman(item.kind)}</span>
          </div>
          <div>
            <b>Archivo</b>
            <span>{fileSizeLabel(item.size_bytes)}</span>
          </div>
        </div>

        <div className="ao3-actions aerea-generic-actions">
          <a
            href={driveViewUrl(item.drive_file_id)}
            target="_blank"
            rel="noreferrer"
          >
            ↗ Abrir en Drive
          </a>
        </div>

        {historicalVersions.length > 0 && (
          <details className="ao3-alternative">
            <summary>
              + Versión anterior
              {historicalVersions.length > 1 ? "es" : ""}
            </summary>
            <div className="ao3-alternative-body">
              {historicalVersions.map((version) => (
                <div className="ao3-alternative-item" key={version.id}>
                  <p>
                    <strong>{version.title || "Versión anterior"}</strong>
                    {version.author ? ` · ${version.author}` : ""}
                    {" · "}
                    {dateLabel(version.captured_at)}
                  </p>
                  <div className="ao3-actions aerea-generic-actions ao3-actions-small">
                    <a
                      href={driveViewUrl(version.drive_file_id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ↗ Abrir versión protegida
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

export default function GenericLibraryBridge() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<GenericLibraryItem[]>([]);
  const [versions, setVersions] = useState<GenericLibraryVersion[]>([]);
  const [query, setQuery] = useState("");
  const [filtersNeutral, setFiltersNeutral] = useState(true);

  useEffect(() => {
    const syncTarget = () => {
      const next = document.querySelector<HTMLElement>(
        ".ao3-library-layer .ao3-grid",
      );
      setTarget((current) => (current === next ? current : next));
    };

    syncTarget();
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const refreshGenericLibrary = useCallback(async () => {
    const [itemsResult, versionsResult] = await Promise.all([
      supabase
        .from("library_items")
        .select(
          "id,drive_file_id,filename,title,author,kind,mime_type,extension,size_bytes,sha256,source_modified_at,archived",
        )
        .eq("archived", false)
        .order("source_modified_at", { ascending: false, nullsFirst: false })
        .limit(1000),

      supabase
        .from("library_item_versions")
        .select(
          "id,library_item_id,drive_file_id,filename,title,author,kind,extension,size_bytes,sha256,captured_at",
        )
        .order("captured_at", { ascending: false, nullsFirst: false })
        .limit(3000),
    ]);

    if (itemsResult.error) {
      console.warn("Could not load generic library items", itemsResult.error);
      return;
    }

    if (versionsResult.error) {
      console.warn(
        "Could not load generic library versions",
        versionsResult.error,
      );
    }

    setItems(validGenericItems(itemsResult.data || []));
    setVersions(validGenericVersions(versionsResult.data || []));
  }, []);

  useEffect(() => {
    if (!target) return;

    void refreshGenericLibrary();

    const channel = supabase
      .channel("aerea-generic-library-bridge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "library_items" },
        () => void refreshGenericLibrary(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "library_item_versions" },
        () => void refreshGenericLibrary(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshGenericLibrary, target]);

  useEffect(() => {
    const layer = target?.closest<HTMLElement>(".ao3-library-layer");

    if (!layer) {
      setQuery("");
      setFiltersNeutral(true);
      return;
    }

    const syncFilters = () => {
      const search = layer.querySelector<HTMLInputElement>(".ao3-search");
      const selects = layer.querySelectorAll<HTMLSelectElement>(
        ".ao3-filter-row select",
      );

      setQuery(search?.value || "");
      setFiltersNeutral(
        Array.from(selects).every((select) => select.value === "all"),
      );
    };

    syncFilters();
    layer.addEventListener("input", syncFilters, true);
    layer.addEventListener("change", syncFilters, true);

    return () => {
      layer.removeEventListener("input", syncFilters, true);
      layer.removeEventListener("change", syncFilters, true);
    };
  }, [target]);

  const versionsByItem = useMemo(() => {
    const map = new Map<string, GenericLibraryVersion[]>();

    versions.forEach((version) => {
      const list = map.get(version.library_item_id) || [];
      list.push(version);
      map.set(version.library_item_id, list);
    });

    return map;
  }, [versions]);

  const filtered = useMemo(() => {
    /*
     * AO3-specific filters (Fics / Series, WIP / Complete, fandom)
     * intentionally hide generic books. This keeps AO3 filter behavior intact.
     */
    if (!filtersNeutral) return [];

    const needle = normalizeSearch(query.trim());
    if (!needle) return items;

    return items.filter((item) =>
      normalizeSearch(
        [item.title, item.author, item.filename, item.kind, item.extension]
          .filter(Boolean)
          .join(" "),
      ).includes(needle),
    );
  }, [filtersNeutral, items, query]);

  useEffect(() => {
    const layer = target?.closest<HTMLElement>(".ao3-library-layer");
    if (!layer) return;

    if (filtered.length > 0) {
      layer.dataset.aereaGenericVisible = "true";
    } else {
      delete layer.dataset.aereaGenericVisible;
    }

    return () => {
      delete layer.dataset.aereaGenericVisible;
    };
  }, [filtered.length, target]);

  return (
    <>
      <style>{GENERIC_LIBRARY_CSS}</style>

      {target && filtered.length > 0
        ? createPortal(
            <>
              {filtered.map((item) => (
                <GenericLibraryCard
                  key={item.id}
                  item={item}
                  versions={versionsByItem.get(item.id) || []}
                />
              ))}
            </>,
            target,
          )
        : null}
    </>
  );
}

const GENERIC_LIBRARY_CSS = String.raw`
.aerea-generic-library-card { order: -1; }
.aerea-generic-library-card .ao3-card-header { background: var(--ao3-plum); }
.aerea-generic-library-card .ao3-card-meta { background: var(--ao3-sage); }
.aerea-generic-library-card .aerea-generic-actions {
  grid-template-columns: minmax(0, 1fr);
}
.ao3-library-layer[data-aerea-generic-visible="true"] .ao3-empty {
  display: none;
}
`;

PATCH MANUAL — app/page.tsx
=============================

1) AGREGAR IMPORT:

 import {
   Ao3Library,
   type Ao3EpubDownloadTarget,
 } from "./ao3-library";
+import GenericLibraryBridge from "./generic-library-bridge";


2) REEMPLAZAR BLOQUE:

-{ao3LibraryOpen && (
-  <Ao3Library onBack={closeAo3Library} onSaveEpub={saveAo3Epub} />
-)}

+{ao3LibraryOpen && (
+  <>
+    <Ao3Library onBack={closeAo3Library} onSaveEpub={saveAo3Epub} />
+    <GenericLibraryBridge />
+  </>
+)}

AÉREA — GENERIC LIBRARY UI SAFE v1
==================================

OBJETIVO
--------
Mostrar library_items (EPUB normal, PDF y documentos) dentro de la misma
pantalla de Librería, sin modificar la lógica ni el diseño de las fichas AO3.

IMPORTANTE
----------
NO editar app/ao3-library.tsx.
NO tocar Supabase.
NO tocar Apps Script.
NO tocar Code.gs.
NO tocar el sync AO3.

Solo hay que:
1) crear UN archivo nuevo;
2) hacer DOS cambios pequeños en app/page.tsx.

ARCHIVO NUEVO
-------------
Crea exactamente:

app/generic-library-bridge.tsx

y pega TODO el contenido del archivo generic-library-bridge.tsx incluido aquí.

CAMBIO 1 — IMPORT EN app/page.tsx
---------------------------------
Cerca del principio del archivo ya existe:

import {
  Ao3Library,
  type Ao3EpubDownloadTarget,
} from "./ao3-library";

Inmediatamente DEBAJO agrega:

import GenericLibraryBridge from "./generic-library-bridge";

CAMBIO 2 — MONTAR EL BRIDGE
---------------------------
Busca exactamente este bloque:

{ao3LibraryOpen && (
  <Ao3Library onBack={closeAo3Library} onSaveEpub={saveAo3Epub} />
)}

Reemplázalo SOLO por:

{ao3LibraryOpen && (
  <>
    <Ao3Library onBack={closeAo3Library} onSaveEpub={saveAo3Epub} />
    <GenericLibraryBridge />
  </>
)}

Eso es todo.

QUÉ HACE
--------
- AO3 sigue leyendo ao3_works + ao3_epub_versions exactamente igual.
- El nuevo componente lee library_items + library_item_versions.
- No modifica app/ao3-library.tsx.
- Si el componente genérico falla, AO3 sigue funcionando.
- El Principito aparecerá como LIBRO · EPUB.
- Las versiones históricas genéricas aparecen debajo como “Versión anterior”.
- Los EPUB/PDF genéricos se pueden abrir desde Drive.
- Los filtros AO3 siguen siendo AO3: al elegir Fics/Series/WIP/Fandom,
  los libros genéricos se ocultan.
- La búsqueda general sí encuentra título/autor/nombre de archivo genérico.
- No hay escrituras a Supabase desde esta UI.

POR QUÉ ES SEGURO
-----------------
Este cambio es de SOLO LECTURA para library_items.
No cambia ninguna tabla, ningún sync ni ninguna regla principal/alternativa AO3.

DESPUÉS DE HACERLO
------------------
Haz commit en GitHub y pásame:
- el SHA del commit, o
- una captura de los cambios.

Yo reviso el diff antes de que generes un APK.
