"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { supabase } from "./supabase-sync";

type SeriesMembership = {
  label: string;
  part: number | null;
  name: string;
};

type Ao3Work = {
  work_id: number;
  title: string;
  author: string | null;
  summary: string | null;
  fandoms: string[];
  warnings: string[];
  characters: string[];
  relationships: string[];
  tags: string[];
  words: number | null;
  rating: string | null;
  chapters: string | null;
  complete: boolean | null;
  series: SeriesMembership[];
  updated_on: string | null;
  bookmarked_on: string | null;
  source_url: string | null;
  archived: boolean;
  categories: string[];
  bookmarker_tags: string[];
};

type EpubVersion = {
  work_id: number;
  drive_file_id: string;
  filename: string;
  label: string;
  is_primary: boolean;
};

type LibraryCache = {
  works: Ao3Work[];
  epubs: EpubVersion[];
  savedAt: number;
};

type SeriesGroup = {
  kind: "series";
  name: string;
  works: Ao3Work[];
  updatedOn: string | null;
  words: number;
  complete: boolean;
  fandoms: string[];
};

type SingleEntry = {
  kind: "fic";
  work: Ao3Work;
  updatedOn: string | null;
};

type LibraryEntry = SeriesGroup | SingleEntry;

type DownloadTarget = {
  title: string;
  driveFileId: string;
};

const CACHE_KEY = "aerea-ao3-library-cache-v1";
const DIRECT_DOWNLOAD_BASE = "https://drive.usercontent.google.com/download";

function compactUnique(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => (value || "").trim()).filter(Boolean)),
  );
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function readCache(): LibraryCache | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as
      | LibraryCache
      | null;
    if (!parsed?.works?.length || !parsed?.epubs?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(works: Ao3Work[], epubs: EpubVersion[]) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ works, epubs, savedAt: Date.now() } satisfies LibraryCache),
    );
  } catch {
    // A full browser storage area should never make the library unusable.
  }
}

async function fetchLibrary() {
  const [worksResult, epubsResult] = await Promise.all([
    supabase
      .from("ao3_works")
      .select(
        "work_id,title,author,summary,fandoms,warnings,characters,relationships,tags,words,rating,chapters,complete,series,updated_on,bookmarked_on,source_url,archived,categories,bookmarker_tags",
      )
      .order("updated_on", { ascending: false, nullsFirst: false })
      .limit(1000),
    supabase
      .from("ao3_epub_versions")
      .select("work_id,drive_file_id,filename,label,is_primary")
      .limit(1000),
  ]);

  if (worksResult.error) throw worksResult.error;
  if (epubsResult.error) throw epubsResult.error;

  return {
    works: (worksResult.data || []) as Ao3Work[],
    epubs: (epubsResult.data || []) as EpubVersion[],
  };
}

function buildEntries(works: Ao3Work[]): LibraryEntry[] {
  const primaryCounts = new Map<string, number>();
  for (const work of works) {
    const primary = work.series?.[0]?.name;
    if (primary) primaryCounts.set(primary, (primaryCounts.get(primary) || 0) + 1);
  }

  const groups = new Map<string, Ao3Work[]>();
  const singles: SingleEntry[] = [];

  for (const work of works) {
    const primary = work.series?.[0];
    if (primary && (primaryCounts.get(primary.name) || 0) > 1) {
      const members = groups.get(primary.name) || [];
      members.push(work);
      groups.set(primary.name, members);
    } else {
      singles.push({ kind: "fic", work, updatedOn: work.updated_on });
    }
  }

  const seriesEntries: SeriesGroup[] = Array.from(groups.entries()).map(
    ([name, members]) => {
      members.sort((a, b) => {
        const aPart = a.series?.[0]?.part ?? Number.MAX_SAFE_INTEGER;
        const bPart = b.series?.[0]?.part ?? Number.MAX_SAFE_INTEGER;
        return aPart - bPart || a.title.localeCompare(b.title);
      });
      const updated = members
        .map((work) => work.updated_on)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1);
      return {
        kind: "series",
        name,
        works: members,
        updatedOn: updated || null,
        words: members.reduce((sum, work) => sum + (work.words || 0), 0),
        complete: members.every((work) => work.complete === true),
        fandoms: compactUnique(members.flatMap((work) => work.fandoms || [])),
      };
    },
  );

  return [...seriesEntries, ...singles].sort((a, b) => {
    const dateCompare = (b.updatedOn || "").localeCompare(a.updatedOn || "");
    if (dateCompare) return dateCompare;
    const aTitle = a.kind === "series" ? a.name : a.work.title;
    const bTitle = b.kind === "series" ? b.name : b.work.title;
    return aTitle.localeCompare(bTitle);
  });
}

function workSearchText(work: Ao3Work) {
  return normalized(
    [
      work.title,
      work.author,
      work.summary,
      work.rating,
      work.chapters,
      work.archived ? "archivado drive eliminado ao3" : "ao3",
      ...(work.fandoms || []),
      ...(work.relationships || []),
      ...(work.tags || []),
      ...(work.bookmarker_tags || []),
      ...(work.series || []).flatMap((item) => [item.label, item.name]),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue to the WebView-safe fallback.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "8px";
  textarea.style.top = "8px";
  textarea.style.width = "1px";
  textarea.style.height = "1px";
  textarea.style.opacity = "0.01";
  textarea.style.fontSize = "16px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

function driveViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

function directDownloadUrl(fileId: string) {
  const query = new URLSearchParams({
    id: fileId,
    export: "download",
    confirm: "t",
  });
  return `${DIRECT_DOWNLOAD_BASE}?${query.toString()}`;
}

function TagCloud({ tags, limit = 14 }: { tags: string[]; limit?: number }) {
  const uniqueTags = compactUnique(tags);
  const first = uniqueTags.slice(0, limit);
  const hidden = uniqueTags.slice(limit);

  return (
    <div className="ao3-tags">
      {first.map((tag) => (
        <span className="ao3-tag" key={tag}>
          {tag}
        </span>
      ))}
      {hidden.length > 0 && (
        <details className="ao3-more-tags">
          <summary>+{hidden.length} más</summary>
          <div className="ao3-more-tags-list">
            {hidden.map((tag) => (
              <span className="ao3-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function WorkActions({
  work,
  versions,
  onDownload,
}: {
  work: Ao3Work;
  versions: EpubVersion[];
  onDownload: (target: DownloadTarget) => void;
}) {
  const ordered = [...versions].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const primary = ordered.find((version) => version.is_primary) || ordered[0];
  const alternatives = ordered.filter((version) => version !== primary);
  const externalHref = work.archived
    ? primary
      ? driveViewUrl(primary.drive_file_id)
      : null
    : work.source_url;

  return (
    <>
      <div className="ao3-actions">
        {externalHref && (
          <a href={externalHref} target="_blank" rel="noreferrer">
            ↗ {work.archived ? "Abrir copia en Drive" : "Abrir en AO3"}
          </a>
        )}
        {primary && (
          <button
            type="button"
            onClick={() =>
              onDownload({ title: work.title, driveFileId: primary.drive_file_id })
            }
          >
            ↓ Download EPUB
          </button>
        )}
      </div>

      {alternatives.length > 0 && (
        <details className="ao3-alternative">
          <summary>
            + Versión alternativa{alternatives.length > 1 ? "s" : ""}
          </summary>
          <div className="ao3-alternative-body">
            {alternatives.map((version) => (
              <div className="ao3-alternative-item" key={version.drive_file_id}>
                <p>{version.filename}</p>
                <div className="ao3-actions ao3-actions-small">
                  <a
                    href={driveViewUrl(version.drive_file_id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ↗ Abrir en Drive
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      onDownload({
                        title: `${work.title} · versión alternativa`,
                        driveFileId: version.drive_file_id,
                      })
                    }
                  >
                    ↓ Download EPUB alternativo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </>
  );
}

function WorkDetails({
  work,
  versions,
  onDownload,
}: {
  work: Ao3Work;
  versions: EpubVersion[];
  onDownload: (target: DownloadTarget) => void;
}) {
  const secondarySeries = (work.series || []).slice(1);
  return (
    <div className="ao3-work-details">
      <div className="ao3-context">
        <div>
          <b>Fandom</b>
          <span>{work.fandoms?.join(" · ") || "—"}</span>
        </div>
        <div>
          <b>Ship</b>
          <span>{work.relationships?.join(" · ") || "—"}</span>
        </div>
      </div>

      {secondarySeries.length > 0 && (
        <p className="ao3-secondary-series">
          <b>También en:</b>{" "}
          {secondarySeries.map((membership) => membership.label).join(" · ")}
        </p>
      )}

      <div className="ao3-synopsis">
        <b>Synopsis</b>
        <p>{work.summary || "Sin synopsis guardada."}</p>
      </div>

      <div className="ao3-tag-section">
        <b>Tags</b>
        <TagCloud tags={work.tags || []} limit={12} />
      </div>

      <WorkActions work={work} versions={versions} onDownload={onDownload} />
    </div>
  );
}

function FicCard({
  work,
  versions,
  onCopy,
  onDownload,
}: {
  work: Ao3Work;
  versions: EpubVersion[];
  onCopy: (title: string) => void;
  onDownload: (target: DownloadTarget) => void;
}) {
  return (
    <article className={`ao3-card ${work.archived ? "ao3-card-archive" : ""}`}>
      <header className="ao3-card-header">
        <span className="ao3-eyebrow">
          FIC{work.archived ? " · ARCHIVADO" : ""}
        </span>
        <button
          className="ao3-copy-title"
          type="button"
          title="Tocar para copiar el título"
          onClick={() => onCopy(work.title)}
        >
          {work.title}
        </button>
      </header>

      <div className="ao3-card-meta">
        <strong>{work.author || "Anonymous"}</strong>
        <span>
          {work.chapters || "? capítulos"} · {formatNumber(work.words)} palabras
        </span>
        <span className="ao3-status">
          {work.archived ? "Archivado · " : ""}
          {work.complete ? "Completo" : "WIP"}
        </span>
      </div>

      <div className="ao3-card-body">
        <div className="ao3-context">
          <div>
            <b>Fandom</b>
            <span>{work.fandoms?.join(" · ") || "—"}</span>
          </div>
          <div>
            <b>Ship</b>
            <span>{work.relationships?.join(" · ") || "—"}</span>
          </div>
        </div>

        <div className="ao3-synopsis">
          <b>Synopsis</b>
          <p>{work.summary || "Sin synopsis guardada."}</p>
        </div>

        <div className="ao3-tag-section">
          <b>Tags</b>
          <TagCloud tags={work.tags || []} />
        </div>

        {work.archived && (
          <p className="ao3-archive-note">
            Copia preservada en Google Drive · la obra ya no está en tu listado
            actual de AO3.
          </p>
        )}

        <WorkActions work={work} versions={versions} onDownload={onDownload} />
      </div>
    </article>
  );
}

function SeriesCard({
  entry,
  versionsByWork,
  onCopy,
  onDownload,
}: {
  entry: SeriesGroup;
  versionsByWork: Map<number, EpubVersion[]>;
  onCopy: (title: string) => void;
  onDownload: (target: DownloadTarget) => void;
}) {
  const first = entry.works[0];
  const authors = compactUnique(entry.works.map((work) => work.author));
  const relationships = compactUnique(
    entry.works.flatMap((work) => work.relationships || []),
  );
  const tags = compactUnique(entry.works.flatMap((work) => work.tags || []));

  return (
    <article className="ao3-card ao3-card-series">
      <header className="ao3-card-header">
        <span className="ao3-eyebrow">SERIE</span>
        <button
          className="ao3-copy-title"
          type="button"
          title="Tocar para copiar el título"
          onClick={() => onCopy(entry.name)}
        >
          {entry.name}
        </button>
      </header>

      <div className="ao3-card-meta">
        <strong>
          {authors.length === 1 ? authors[0] : `${authors.length} autores`}
        </strong>
        <span>
          {entry.works.length} obras · {formatNumber(entry.words)} palabras
        </span>
        <span className="ao3-status">
          {entry.complete ? "Serie completa" : "Serie en progreso"}
        </span>
      </div>

      <div className="ao3-card-body">
        <div className="ao3-context">
          <div>
            <b>Fandom</b>
            <span>{entry.fandoms.join(" · ") || "—"}</span>
          </div>
          <div>
            <b>Ship</b>
            <span>{relationships.slice(0, 3).join(" · ") || "—"}</span>
          </div>
        </div>

        <div className="ao3-synopsis">
          <b>Synopsis</b>
          <p>
            Sinopsis de la primera obra (“{first.title}”): {first.summary || "—"}
          </p>
        </div>

        <div className="ao3-tag-section">
          <b>Tags</b>
          <TagCloud tags={tags} />
        </div>
      </div>

      <details className="ao3-series-parts">
        <summary>Ver {entry.works.length} obras</summary>
        <ol>
          {entry.works.map((work) => (
            <li key={work.work_id}>
              <details className="ao3-part">
                <summary>
                  <strong>{work.title}</strong>
                  <small>
                    {work.series?.[0]?.part
                      ? `Parte ${work.series[0].part} · `
                      : ""}
                    {work.chapters || "? capítulos"} · {formatNumber(work.words)}
                    {" palabras"}
                  </small>
                </summary>
                <WorkDetails
                  work={work}
                  versions={versionsByWork.get(work.work_id) || []}
                  onDownload={onDownload}
                />
              </details>
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}

export function Ao3Library() {
  const [works, setWorks] = useState<Ao3Work[]>([]);
  const [epubs, setEpubs] = useState<EpubVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "fic" | "series">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "wip">(
    "all",
  );
  const [fandomFilter, setFandomFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<DownloadTarget | null>(null);

  const refresh = async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    setError(null);
    try {
      const result = await fetchLibrary();
      setWorks(result.works);
      setEpubs(result.epubs);
      writeCache(result.works, result.epubs);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load AO3 Library.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setWorks(cached.works);
      setEpubs(cached.epubs);
      setLoading(false);
    }
    void refresh(false);
    // The first cloud hydration is intentionally performed once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const versionsByWork = useMemo(() => {
    const map = new Map<number, EpubVersion[]>();
    for (const version of epubs) {
      const list = map.get(version.work_id) || [];
      list.push(version);
      map.set(version.work_id, list);
    }
    return map;
  }, [epubs]);

  const entries = useMemo(() => buildEntries(works), [works]);

  const fandoms = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      const values =
        entry.kind === "series" ? entry.fandoms : entry.work.fandoms || [];
      for (const fandom of compactUnique(values)) {
        counts.set(fandom, (counts.get(fandom) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = normalized(query.trim());
    return entries.filter((entry) => {
      if (typeFilter !== "all" && entry.kind !== typeFilter) return false;

      const complete =
        entry.kind === "series" ? entry.complete : entry.work.complete === true;
      if (statusFilter === "complete" && !complete) return false;
      if (statusFilter === "wip" && complete) return false;

      const fandomValues =
        entry.kind === "series" ? entry.fandoms : entry.work.fandoms || [];
      if (fandomFilter !== "all" && !fandomValues.includes(fandomFilter)) {
        return false;
      }

      if (!needle) return true;
      if (entry.kind === "fic") return workSearchText(entry.work).includes(needle);
      return normalized(
        [entry.name, ...entry.works.map((work) => workSearchText(work))].join(" "),
      ).includes(needle);
    });
  }, [entries, fandomFilter, query, statusFilter, typeFilter]);

  const archivedCount = useMemo(
    () => works.filter((work) => work.archived).length,
    [works],
  );
  const alternativeCount = useMemo(
    () => epubs.filter((version) => !version.is_primary).length,
    [epubs],
  );

  const onCopy = async (title: string) => {
    const copied = await copyText(title);
    setToast(copied ? "Título copiado ✓" : "No pude copiar el título");
  };

  const confirmDownload = () => {
    if (!downloadTarget) return;
    window.open(directDownloadUrl(downloadTarget.driveFileId), "_blank", "noopener");
    setDownloadTarget(null);
    setToast("Downloading EPUB… ♡");
  };

  if (loading && works.length === 0) {
    return (
      <div className="ao3-library ao3-library-state">
        <style>{AO3_LIBRARY_CSS}</style>
        <div className="ao3-loader" />
        <strong>Preparando tu AO3 Library…</strong>
        <span>La primera carga puede tardar un poquito.</span>
      </div>
    );
  }

  return (
    <div className="ao3-library">
      <style>{AO3_LIBRARY_CSS}</style>

      <div className="ao3-library-tools">
        <div className="ao3-library-intro">
          <div>
            <h2>My AO3 Library</h2>
            <p>
              {works.length} fics · {entries.length} fichas ·{" "}
              {entries.filter((entry) => entry.kind === "series").length} series
              agrupadas · {archivedCount} archivados · {epubs.length} EPUBs
              {alternativeCount ? ` · ${alternativeCount} alternativas` : ""}
            </p>
          </div>
          <button
            className="ao3-refresh"
            type="button"
            disabled={refreshing}
            onClick={() => void refresh(true)}
            aria-label="Refresh AO3 Library"
          >
            {refreshing ? "…" : "↻"}
          </button>
        </div>

        <input
          className="ao3-search"
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          placeholder="Buscar título, autor, ship, tag…"
          type="search"
        />

        <div className="ao3-filter-row">
          <select
            value={typeFilter}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setTypeFilter(event.target.value as "all" | "fic" | "series")
            }
          >
            <option value="all">Todo</option>
            <option value="fic">Fics</option>
            <option value="series">Series</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setStatusFilter(event.target.value as "all" | "complete" | "wip")
            }
          >
            <option value="all">Cualquier estado</option>
            <option value="complete">Completo</option>
            <option value="wip">WIP</option>
          </select>
          <select
            value={fandomFilter}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFandomFilter(event.target.value)}
          >
            <option value="all">Todos los fandoms</option>
            {fandoms.map(([fandom, count]) => (
              <option key={fandom} value={fandom}>
                {fandom} ({count})
              </option>
            ))}
          </select>
        </div>

        <p className="ao3-result-count">
          {filtered.length === entries.length
            ? `${entries.length} fichas`
            : `${filtered.length} de ${entries.length} fichas`}
        </p>

        {error && (
          <div className="ao3-error">
            <strong>No pude actualizar la nube.</strong>
            <span>{error}</span>
            {works.length > 0 && <small>Mostrando la copia guardada en este dispositivo.</small>}
          </div>
        )}
      </div>

      <div className="ao3-grid">
        {filtered.map((entry) =>
          entry.kind === "fic" ? (
            <FicCard
              key={`fic-${entry.work.work_id}`}
              work={entry.work}
              versions={versionsByWork.get(entry.work.work_id) || []}
              onCopy={onCopy}
              onDownload={(target) => setDownloadTarget(target)}
            />
          ) : (
            <SeriesCard
              key={`series-${entry.name}`}
              entry={entry}
              versionsByWork={versionsByWork}
              onCopy={onCopy}
              onDownload={(target) => setDownloadTarget(target)}
            />
          ),
        )}
      </div>

      {filtered.length === 0 && (
        <div className="ao3-empty">
          <span>♡</span>
          <strong>No encontré ninguna fichita.</strong>
          <p>Probá otra búsqueda o quitá algún filtro.</p>
        </div>
      )}

      {toast && <div className="ao3-toast">{toast}</div>}

      {downloadTarget && (
        <div
          className="ao3-modal-backdrop"
          role="presentation"
          onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
            if (event.target === event.currentTarget) setDownloadTarget(null);
          }}
        >
          <div className="ao3-modal" role="dialog" aria-modal="true">
            <span className="ao3-modal-kicker">EPUB FILE</span>
            <h3>Do you want to download this EPUB?</h3>
            <p>
              Do you want to download “{downloadTarget.title}” as an EPUB file?
            </p>
            <div className="ao3-modal-actions">
              <button type="button" onClick={() => setDownloadTarget(null)}>
                Cancel
              </button>
              <button className="ao3-modal-primary" type="button" onClick={confirmDownload}>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AO3_LIBRARY_CSS = String.raw`
.ao3-library {
  --ao3-ink: #42364d;
  --ao3-plum: #6c597a;
  --ao3-plum-dark: #554260;
  --ao3-rose: #fae9ef;
  --ao3-lav: #efe8f6;
  --ao3-cream: #fffdfc;
  --ao3-sage: #e9f2e6;
  --ao3-peach: #faf0e5;
  --ao3-muted: #746a79;
  --ao3-border: #ded4e2;
  --ao3-surface: rgba(247, 244, 248, .82);
  color: var(--ao3-ink);
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: 0 10px 72px;
}
.ao3-library * { box-sizing: border-box; }
.ao3-library-tools {
  position: sticky;
  top: 0;
  z-index: 15;
  padding: 10px 2px 14px;
  margin-bottom: 14px;
  background: color-mix(in srgb, var(--ao3-surface) 92%, transparent);
  backdrop-filter: blur(14px);
}
.ao3-library-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 2px 10px;
}
.ao3-library-intro h2 { margin: 0; font-size: clamp(1.35rem, 4vw, 1.9rem); line-height: 1.2; }
.ao3-library-intro p { margin: 5px 0 0; font-size: .86rem; color: var(--ao3-muted); }
.ao3-refresh {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border: 1px solid var(--ao3-border);
  border-radius: 999px;
  background: rgba(255,255,255,.74);
  color: var(--ao3-plum-dark);
  font: inherit;
  font-size: 1.25rem;
  cursor: pointer;
}
.ao3-refresh:disabled { opacity: .55; }
.ao3-search,
.ao3-filter-row select {
  width: 100%;
  border: 1px solid var(--ao3-border);
  background: rgba(255,255,255,.9);
  color: var(--ao3-ink);
  font: inherit;
  font-size: 16px;
  outline: none;
}
.ao3-search { min-height: 48px; border-radius: 15px; padding: 0 14px; }
.ao3-search:focus,
.ao3-filter-row select:focus { border-color: var(--ao3-plum); box-shadow: 0 0 0 3px rgba(108,89,122,.12); }
.ao3-filter-row { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; margin-top: 8px; }
.ao3-filter-row select { min-width: 0; min-height: 44px; border-radius: 12px; padding: 0 10px; }
.ao3-filter-row select:last-child { grid-column: 1 / -1; }
.ao3-result-count { margin: 8px 2px 0; color: var(--ao3-muted); font-size: .84rem; }
.ao3-error { margin-top: 9px; padding: 10px 12px; display: grid; gap: 2px; border: 1px solid #e8caca; border-radius: 12px; background: #fff3f3; font-size: .85rem; }
.ao3-error span, .ao3-error small { color: #7e6161; overflow-wrap: anywhere; }
.ao3-grid { display: grid; grid-template-columns: minmax(0,1fr); gap: 18px; align-items: start; }
.ao3-card {
  min-width: 0;
  border: 1px solid var(--ao3-border);
  border-radius: 18px;
  overflow: hidden;
  background: var(--ao3-cream);
  box-shadow: 0 4px 18px rgba(66,54,77,.055);
}
.ao3-card-header { padding: 16px 18px 15px; color: white; background: var(--ao3-plum-dark); }
.ao3-card-series .ao3-card-header { background: var(--ao3-plum); }
.ao3-card-archive .ao3-card-header { background: #725a74; }
.ao3-eyebrow { display: block; margin-bottom: 3px; font-size: .69rem; font-weight: 850; letter-spacing: .12em; opacity: .84; }
.ao3-copy-title {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
  font-size: clamp(1.16rem, 3vw, 1.42rem);
  line-height: 1.24;
  font-weight: 800;
  cursor: pointer;
  overflow-wrap: anywhere;
  -webkit-tap-highlight-color: transparent;
}
.ao3-copy-title:active { opacity: .72; }
.ao3-card-meta { position: relative; padding: 13px 112px 14px 18px; display: grid; gap: 3px; background: var(--ao3-rose); }
.ao3-card-series .ao3-card-meta { background: var(--ao3-lav); }
.ao3-card-meta strong { font-size: .95rem; overflow-wrap: anywhere; }
.ao3-card-meta > span:not(.ao3-status) { color: var(--ao3-muted); font-size: .84rem; }
.ao3-status { position: absolute; right: 13px; top: 12px; max-width: 105px; padding: 4px 8px; border: 1px solid rgba(85,66,96,.13); border-radius: 999px; background: rgba(255,255,255,.72); font-size: .71rem; font-weight: 850; text-align: center; }
.ao3-card-body { padding: 13px 18px 17px; display: grid; gap: 14px; }
.ao3-context { display: grid; gap: 9px; }
.ao3-context > div { min-width: 0; }
.ao3-context b,
.ao3-synopsis > b,
.ao3-tag-section > b { display: block; margin-bottom: 4px; color: var(--ao3-plum-dark); font-size: .75rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
.ao3-context span { font-size: .9rem; overflow-wrap: anywhere; }
.ao3-synopsis p { margin: 0; white-space: pre-line; font-size: .91rem; line-height: 1.55; }
.ao3-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-start; }
.ao3-tag { display: inline-block; max-width: 100%; padding: 5px 8px; border: 1px solid rgba(108,89,122,.12); border-radius: 999px; background: var(--ao3-peach); font-size: .75rem; line-height: 1.25; overflow-wrap: anywhere; }
.ao3-tag:nth-of-type(3n+2) { background: var(--ao3-lav); }
.ao3-tag:nth-of-type(3n+3) { background: var(--ao3-sage); }
.ao3-more-tags { width: 100%; }
.ao3-more-tags > summary { width: fit-content; list-style: none; cursor: pointer; padding: 5px 9px; border-radius: 999px; background: var(--ao3-rose); color: var(--ao3-plum-dark); font-size: .75rem; font-weight: 800; }
.ao3-more-tags > summary::-webkit-details-marker { display: none; }
.ao3-more-tags-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 7px; }
.ao3-actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); overflow: hidden; border: 1px solid rgba(85,66,96,.13); border-radius: 13px; }
.ao3-actions a,
.ao3-actions button { min-width: 0; min-height: 48px; display: grid; place-items: center; border: 0; padding: 9px 10px; background: rgba(255,255,255,.7); color: var(--ao3-plum-dark); text-decoration: none; text-align: center; font: inherit; font-size: .82rem; font-weight: 850; cursor: pointer; }
.ao3-actions button { border-left: 1px solid rgba(85,66,96,.11); background: var(--ao3-lav); }
.ao3-actions-small a,
.ao3-actions-small button { min-height: 43px; font-size: .77rem; }
.ao3-archive-note,
.ao3-secondary-series { margin: 0; padding: 9px 10px; border-radius: 10px; background: rgba(239,232,246,.6); color: var(--ao3-muted); font-size: .82rem; }
.ao3-alternative { margin-top: 11px; overflow: hidden; border: 1px solid rgba(116,85,119,.18); border-radius: 14px; background: rgba(247,239,247,.72); }
.ao3-alternative > summary { list-style: none; cursor: pointer; padding: 11px 13px; color: #6d526f; font-weight: 850; }
.ao3-alternative > summary::-webkit-details-marker { display: none; }
.ao3-alternative-body { display: grid; gap: 10px; padding: 0 12px 12px; border-top: 1px solid rgba(116,85,119,.12); }
.ao3-alternative-item { padding-top: 10px; }
.ao3-alternative-item p { margin: 0 0 8px; color: var(--ao3-muted); font-size: .82rem; overflow-wrap: anywhere; }
.ao3-series-parts { border-top: 1px solid var(--ao3-border); background: #f8f4fb; }
.ao3-series-parts > summary { list-style: none; cursor: pointer; padding: 13px 18px; color: var(--ao3-plum-dark); font-weight: 850; }
.ao3-series-parts > summary::-webkit-details-marker { display: none; }
.ao3-series-parts > summary::after { content: "＋"; float: right; }
.ao3-series-parts[open] > summary::after { content: "−"; }
.ao3-series-parts > ol { margin: 0; padding: 0 14px 14px; list-style: none; }
.ao3-series-parts > ol > li { margin: 0 0 8px; }
.ao3-part { overflow: hidden; border: 1px solid rgba(85,66,96,.13); border-radius: 12px; background: rgba(255,255,255,.5); }
.ao3-part > summary { list-style: none; cursor: pointer; padding: 11px 12px; display: grid; gap: 2px; }
.ao3-part > summary::-webkit-details-marker { display: none; }
.ao3-part > summary strong { padding-right: 20px; overflow-wrap: anywhere; }
.ao3-part > summary small { color: var(--ao3-muted); font-size: .77rem; }
.ao3-part[open] > summary { border-bottom: 1px solid rgba(85,66,96,.1); background: rgba(255,255,255,.58); }
.ao3-work-details { padding: 12px; display: grid; gap: 13px; }
.ao3-library-state { min-height: 280px; display: grid; place-items: center; align-content: center; gap: 8px; color: var(--ao3-muted); text-align: center; }
.ao3-library-state strong { color: var(--ao3-ink); }
.ao3-loader { width: 31px; height: 31px; border: 3px solid var(--ao3-lav); border-top-color: var(--ao3-plum); border-radius: 999px; animation: ao3-spin .8s linear infinite; }
.ao3-empty { min-height: 220px; display: grid; place-items: center; align-content: center; gap: 3px; text-align: center; color: var(--ao3-muted); }
.ao3-empty > span { font-size: 1.6rem; color: var(--ao3-plum); }
.ao3-empty strong { color: var(--ao3-ink); }
.ao3-empty p { margin: 0; font-size: .87rem; }
.ao3-toast { position: fixed; left: 50%; bottom: calc(22px + env(safe-area-inset-bottom)); z-index: 100; transform: translateX(-50%); padding: 9px 13px; border-radius: 999px; background: #4e4057; color: white; font-size: .82rem; font-weight: 800; box-shadow: 0 8px 28px rgba(35,28,41,.2); white-space: nowrap; }
.ao3-modal-backdrop { position: fixed; inset: 0; z-index: 110; display: grid; place-items: center; padding: 20px; background: rgba(40,31,46,.34); backdrop-filter: blur(4px); }
.ao3-modal { width: min(100%, 420px); padding: 20px; border: 1px solid var(--ao3-border); border-radius: 20px; background: #fffdfc; color: var(--ao3-ink); box-shadow: 0 24px 70px rgba(40,31,46,.23); }
.ao3-modal-kicker { color: var(--ao3-plum); font-size: .7rem; font-weight: 900; letter-spacing: .13em; }
.ao3-modal h3 { margin: 5px 0 7px; font-size: 1.2rem; }
.ao3-modal p { margin: 0; color: var(--ao3-muted); font-size: .9rem; line-height: 1.5; }
.ao3-modal-actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-top: 18px; }
.ao3-modal-actions button { min-height: 45px; border: 1px solid var(--ao3-border); border-radius: 12px; background: white; color: var(--ao3-ink); font: inherit; font-weight: 800; cursor: pointer; }
.ao3-modal-actions .ao3-modal-primary { border-color: var(--ao3-plum); background: var(--ao3-plum); color: white; }
@keyframes ao3-spin { to { transform: rotate(360deg); } }
@media (min-width: 720px) {
  .ao3-library { padding-left: 18px; padding-right: 18px; }
  .ao3-filter-row { grid-template-columns: repeat(3,minmax(0,1fr)); }
  .ao3-filter-row select:last-child { grid-column: auto; }
  .ao3-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px; }
}
@media (max-width: 390px) {
  .ao3-card-meta { padding-right: 18px; padding-bottom: 46px; }
  .ao3-status { top: auto; right: auto; left: 18px; bottom: 12px; max-width: calc(100% - 36px); }
  .ao3-actions { grid-template-columns: 1fr; }
  .ao3-actions button { border-left: 0; border-top: 1px solid rgba(85,66,96,.11); }
}
.app-shell[data-color-mode="dark"] .ao3-library {
  --ao3-ink: #eee9f1;
  --ao3-plum: #8b7398;
  --ao3-plum-dark: #735d7e;
  --ao3-rose: #3c3138;
  --ao3-lav: #393243;
  --ao3-cream: #29252d;
  --ao3-sage: #303a32;
  --ao3-peach: #3d342f;
  --ao3-muted: #c2b8c4;
  --ao3-border: #4c4350;
  --ao3-surface: rgba(34,31,37,.86);
}
.app-shell[data-color-mode="dark"] .ao3-search,
.app-shell[data-color-mode="dark"] .ao3-filter-row select,
.app-shell[data-color-mode="dark"] .ao3-refresh { background: rgba(44,39,48,.94); }
.app-shell[data-color-mode="dark"] .ao3-card { box-shadow: none; }
.app-shell[data-color-mode="dark"] .ao3-series-parts { background: #302a35; }
.app-shell[data-color-mode="dark"] .ao3-part { background: rgba(40,36,44,.72); }
.app-shell[data-color-mode="dark"] .ao3-part[open] > summary { background: rgba(54,47,59,.72); }
.app-shell[data-color-mode="dark"] .ao3-actions a { background: rgba(43,38,47,.85); }
.app-shell[data-color-mode="dark"] .ao3-modal { background: #29252d; }
.app-shell[data-color-mode="dark"] .ao3-modal-actions button { background: #332e37; color: var(--ao3-ink); }
`;
