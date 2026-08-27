"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent, UIEvent as ReactUIEvent } from "react";
import { supabase } from "./supabase-sync";
import type { StudyFileItem } from "./study-library";

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

export type Ao3EpubDownloadTarget = {
  title: string;
  driveFileId: string;
  fileName: string;
  workId: number;
};

type Ao3LibraryProps = {
  onBack: () => void;
  onSaveEpub: (target: Ao3EpubDownloadTarget) => Promise<{
    file: StudyFileItem;
    alreadyStored: boolean;
    replaced: boolean;
  }>;
};

const CACHE_KEY = "aerea-ao3-library-cache-v1";

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

function normalizedWithSourceMap(value: string) {
  let folded = "";
  const sourceOffsets: number[] = [];
  let sourceOffset = 0;

  for (const character of Array.from(value)) {
    const normalizedCharacter = normalized(character);
    folded += normalizedCharacter;
    for (let index = 0; index < normalizedCharacter.length; index += 1) {
      sourceOffsets.push(sourceOffset);
    }
    sourceOffset += character.length;
  }

  sourceOffsets.push(value.length);
  return { folded, sourceOffsets };
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const needle = normalized(query.trim());
  if (!needle) return text;

  const { folded, sourceOffsets } = normalizedWithSourceMap(text);
  const pieces = [];
  let sourceCursor = 0;
  let searchCursor = 0;
  let matchIndex = folded.indexOf(needle, searchCursor);

  while (matchIndex >= 0) {
    const sourceStart = sourceOffsets[matchIndex] ?? sourceCursor;
    const sourceEnd =
      sourceOffsets[matchIndex + needle.length] ?? text.length;
    if (sourceStart > sourceCursor) {
      pieces.push(text.slice(sourceCursor, sourceStart));
    }
    pieces.push(
      <mark className="ao3-highlight" key={`${sourceStart}-${sourceEnd}`}>
        {text.slice(sourceStart, sourceEnd)}
      </mark>,
    );
    sourceCursor = sourceEnd;
    searchCursor = matchIndex + needle.length;
    matchIndex = folded.indexOf(needle, searchCursor);
  }

  if (sourceCursor === 0) return text;
  if (sourceCursor < text.length) pieces.push(text.slice(sourceCursor));
  return <>{pieces}</>;
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return null;
  }
  return value;
}

function seriesMemberships(value: unknown): SeriesMembership[] | null {
  if (!Array.isArray(value)) return null;
  const valid = value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const membership = item as Record<string, unknown>;
    return (
      typeof membership.label === "string" &&
      typeof membership.name === "string" &&
      (typeof membership.part === "number" || membership.part === null)
    );
  });
  return valid ? (value as SeriesMembership[]) : null;
}

export function validAo3Works(value: unknown): Ao3Work[] | null {
  if (!Array.isArray(value)) return null;
  const works: Ao3Work[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const work = item as Record<string, unknown>;
    const fandoms = stringArray(work.fandoms);
    const warnings = stringArray(work.warnings);
    const characters = stringArray(work.characters);
    const relationships = stringArray(work.relationships);
    const tags = stringArray(work.tags);
    const categories = stringArray(work.categories);
    const bookmarkerTags = stringArray(work.bookmarker_tags);
    const series = seriesMemberships(work.series);
    if (
      typeof work.work_id !== "number" ||
      !Number.isFinite(work.work_id) ||
      typeof work.title !== "string" ||
      !work.title.trim() ||
      (typeof work.author !== "string" && work.author !== null) ||
      (typeof work.summary !== "string" && work.summary !== null) ||
      fandoms === null ||
      warnings === null ||
      characters === null ||
      relationships === null ||
      tags === null ||
      categories === null ||
      bookmarkerTags === null ||
      series === null ||
      (typeof work.words !== "number" && work.words !== null) ||
      (typeof work.rating !== "string" && work.rating !== null) ||
      (typeof work.chapters !== "string" && work.chapters !== null) ||
      (typeof work.complete !== "boolean" && work.complete !== null) ||
      (typeof work.updated_on !== "string" && work.updated_on !== null) ||
      (typeof work.bookmarked_on !== "string" && work.bookmarked_on !== null) ||
      (typeof work.source_url !== "string" && work.source_url !== null) ||
      typeof work.archived !== "boolean"
    ) {
      return null;
    }
    works.push(work as Ao3Work);
  }

  return Array.from(new Map(works.map((work) => [work.work_id, work])).values());
}

export function validEpubVersions(value: unknown): EpubVersion[] | null {
  if (!Array.isArray(value)) return null;
  const versions = value.filter((item): item is EpubVersion => {
    if (!item || typeof item !== "object") return false;
    const version = item as Record<string, unknown>;
    return (
      typeof version.work_id === "number" &&
      Number.isFinite(version.work_id) &&
      typeof version.drive_file_id === "string" &&
      Boolean(version.drive_file_id.trim()) &&
      typeof version.filename === "string" &&
      typeof version.label === "string" &&
      typeof version.is_primary === "boolean"
    );
  });
  if (versions.length !== value.length) return null;
  return Array.from(
    new Map(
      versions.map((version) => [
        `${version.work_id}:${version.drive_file_id}`,
        version,
      ]),
    ).values(),
  );
}

function readCache(): LibraryCache | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as
      | LibraryCache
      | null;
    const works = validAo3Works(parsed?.works);
    const epubs = validEpubVersions(parsed?.epubs);
    if (!works?.length || !epubs) return null;
    return { works, epubs, savedAt: Number(parsed?.savedAt) || 0 };
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

  const works = validAo3Works(worksResult.data || []);
  const epubs = validEpubVersions(epubsResult.data || []);
  if (!works || !epubs) {
    throw new Error("Supabase returned an invalid AO3 Library response.");
  }
  return { works, epubs };
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

function TagCloud({
  tags,
  limit = 14,
  query,
  activeTag,
  onTagSearch,
}: {
  tags: string[];
  limit?: number;
  query: string;
  activeTag: string | null;
  onTagSearch: (tag: string) => void;
}) {
  const uniqueTags = compactUnique(tags);
  const needle = normalized(activeTag || query.trim());
  const orderedTags = needle
    ? [
        ...uniqueTags.filter((tag) => normalized(tag).includes(needle)),
        ...uniqueTags.filter((tag) => !normalized(tag).includes(needle)),
      ]
    : uniqueTags;
  const first = orderedTags.slice(0, limit);
  const hidden = orderedTags.slice(limit);

  const tagButton = (tag: string) => {
    const selected = Boolean(activeTag && normalized(activeTag) === normalized(tag));
    return (
      <button
        className={`ao3-tag ${selected ? "is-searching" : ""}`}
        key={tag}
        type="button"
        onClick={() => onTagSearch(tag)}
        aria-label={`Buscar el tag ${tag}`}
        aria-pressed={selected}
      >
        <HighlightText text={tag} query={query} />
      </button>
    );
  };

  return (
    <div className="ao3-tags">
      {first.map(tagButton)}
      {hidden.length > 0 && (
        <details className="ao3-more-tags">
          <summary>+{hidden.length} más</summary>
          <div className="ao3-more-tags-list">
            {hidden.map(tagButton)}
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
  onDownload: (target: Ao3EpubDownloadTarget) => void;
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
              onDownload({
                title: work.title,
                driveFileId: primary.drive_file_id,
                fileName: primary.filename,
                workId: work.work_id,
              })
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
                        fileName: version.filename,
                        workId: work.work_id,
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
  query,
  activeTag,
  onTagSearch,
}: {
  work: Ao3Work;
  versions: EpubVersion[];
  onDownload: (target: Ao3EpubDownloadTarget) => void;
  query: string;
  activeTag: string | null;
  onTagSearch: (tag: string) => void;
}) {
  const secondarySeries = (work.series || []).slice(1);
  return (
    <div className="ao3-work-details">
      <div className="ao3-context">
        <div>
          <b>Fandom</b>
          <span>
            <HighlightText text={work.fandoms?.join(" · ") || "—"} query={query} />
          </span>
        </div>
        <div>
          <b>Ship</b>
          <span>
            <HighlightText
              text={work.relationships?.join(" · ") || "—"}
              query={query}
            />
          </span>
        </div>
      </div>

      {secondarySeries.length > 0 && (
        <p className="ao3-secondary-series">
          <b>También en:</b>{" "}
          <HighlightText
            text={secondarySeries.map((membership) => membership.label).join(" · ")}
            query={query}
          />
        </p>
      )}

      <div className="ao3-synopsis">
        <b>Synopsis</b>
        <p>
          <HighlightText text={work.summary || "Sin synopsis guardada."} query={query} />
        </p>
      </div>

      <div className="ao3-tag-section">
        <b>Tags</b>
        <TagCloud
          tags={work.tags || []}
          limit={12}
          query={query}
          activeTag={activeTag}
          onTagSearch={onTagSearch}
        />
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
  query,
  activeTag,
  onTagSearch,
}: {
  work: Ao3Work;
  versions: EpubVersion[];
  onCopy: (title: string) => void;
  onDownload: (target: Ao3EpubDownloadTarget) => void;
  query: string;
  activeTag: string | null;
  onTagSearch: (tag: string) => void;
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
          <HighlightText text={work.title} query={query} />
        </button>
      </header>

      <div className="ao3-card-meta">
        <strong>
          <HighlightText text={work.author || "Anonymous"} query={query} />
        </strong>
        <span>
          {work.chapters || "? capítulos"} · {formatNumber(work.words)} palabras
        </span>
        <span className="ao3-status">
          {work.archived ? "Archivado · " : ""}
          {work.complete ? "Complete" : "WIP"}
        </span>
      </div>

      <div className="ao3-card-body">
        <div className="ao3-context">
          <div>
            <b>Fandom</b>
            <span>
              <HighlightText text={work.fandoms?.join(" · ") || "—"} query={query} />
            </span>
          </div>
          <div>
            <b>Ship</b>
            <span>
              <HighlightText
                text={work.relationships?.join(" · ") || "—"}
                query={query}
              />
            </span>
          </div>
        </div>

        <div className="ao3-synopsis">
          <b>Synopsis</b>
          <p>
            <HighlightText text={work.summary || "Sin synopsis guardada."} query={query} />
          </p>
        </div>

        <div className="ao3-tag-section">
          <b>Tags</b>
          <TagCloud
            tags={work.tags || []}
            query={query}
            activeTag={activeTag}
            onTagSearch={onTagSearch}
          />
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
  query,
  activeTag,
  onTagSearch,
}: {
  entry: SeriesGroup;
  versionsByWork: Map<number, EpubVersion[]>;
  onCopy: (title: string) => void;
  onDownload: (target: Ao3EpubDownloadTarget) => void;
  query: string;
  activeTag: string | null;
  onTagSearch: (tag: string) => void;
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
          <HighlightText text={entry.name} query={query} />
        </button>
      </header>

      <div className="ao3-card-meta">
        <strong>
          <HighlightText
            text={authors.length === 1 ? authors[0] : `${authors.length} autores`}
            query={query}
          />
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
            <span>
              <HighlightText text={entry.fandoms.join(" · ") || "—"} query={query} />
            </span>
          </div>
          <div>
            <b>Ship</b>
            <span>
              <HighlightText
                text={relationships.slice(0, 3).join(" · ") || "—"}
                query={query}
              />
            </span>
          </div>
        </div>

        <div className="ao3-synopsis">
          <b>Synopsis</b>
          <p>
            <HighlightText
              text={`Sinopsis de la primera obra (“${first.title}”): ${first.summary || "—"}`}
              query={query}
            />
          </p>
        </div>

        <div className="ao3-tag-section">
          <b>Tags</b>
          <TagCloud
            tags={tags}
            query={query}
            activeTag={activeTag}
            onTagSearch={onTagSearch}
          />
        </div>
      </div>

      <details className="ao3-series-parts" open={Boolean(query.trim())}>
        <summary>Ver {entry.works.length} obras</summary>
        <ol>
          {entry.works.map((work) => (
            <li key={work.work_id}>
              <details className="ao3-part">
                <summary>
                  <strong>
                    <HighlightText text={work.title} query={query} />
                  </strong>
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
                  query={query}
                  activeTag={activeTag}
                  onTagSearch={onTagSearch}
                />
              </details>
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}

export function Ao3Library({ onBack, onSaveEpub }: Ao3LibraryProps) {
  const libraryLayerRef = useRef<HTMLElement | null>(null);
  const lastScrollTopRef = useRef(0);
  const [works, setWorks] = useState<Ao3Work[]>([]);
  const [epubs, setEpubs] = useState<EpubVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchToolsHidden, setSearchToolsHidden] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "fic" | "series">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "wip">(
    "all",
  );
  const [fandomFilter, setFandomFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<Ao3EpubDownloadTarget | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const refresh = useCallback(async (showSpinner = true) => {
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
  }, []);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const cached = readCache();
      if (cached) {
        setWorks(cached.works);
        setEpubs(cached.epubs);
        setLoading(false);
      }
      void refresh(false);
    }, 0);
    return () => window.clearTimeout(hydrate);
  }, [refresh]);

  useEffect(() => {
    const refreshIfAvailable = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void refresh(false);
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshIfAvailable();
    };
    window.addEventListener("online", refreshIfAvailable);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    const channel = supabase
      .channel("aerea-ao3-library")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ao3_works" },
        refreshIfAvailable,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ao3_epub_versions" },
        refreshIfAvailable,
      )
      .subscribe();

    return () => {
      window.removeEventListener("online", refreshIfAvailable);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onBack();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onBack]);

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

      if (activeTag) {
        const tagNeedle = normalized(activeTag);
        const entryWorks = entry.kind === "series" ? entry.works : [entry.work];
        return entryWorks.some((work) =>
          (work.tags || []).some((tag) => normalized(tag) === tagNeedle),
        );
      }

      if (!needle) return true;
      if (entry.kind === "fic") return workSearchText(entry.work).includes(needle);
      return normalized(
        [entry.name, ...entry.works.map((work) => workSearchText(work))].join(" "),
      ).includes(needle);
    });
  }, [activeTag, entries, fandomFilter, query, statusFilter, typeFilter]);

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

  const handleLibraryScroll = useCallback(
    (event: ReactUIEvent<HTMLElement>) => {
      const nextScrollTop = event.currentTarget.scrollTop;
      if (nextScrollTop <= 72) {
        lastScrollTopRef.current = nextScrollTop;
        setSearchToolsHidden(false);
        return;
      }

      const delta = nextScrollTop - lastScrollTopRef.current;
      if (delta >= 8) {
        lastScrollTopRef.current = nextScrollTop;
        setSearchToolsHidden(true);
      } else if (delta <= -8) {
        lastScrollTopRef.current = nextScrollTop;
        setSearchToolsHidden(false);
      }
    },
    [],
  );

  const searchByTag = useCallback((tag: string) => {
    setQuery(tag);
    setActiveTag(tag);
    setTypeFilter("all");
    setStatusFilter("all");
    setFandomFilter("all");
    setSearchToolsHidden(false);
    window.requestAnimationFrame(() => {
      libraryLayerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  const confirmDownload = async () => {
    if (!downloadTarget) return;
    setDownloadBusy(true);
    setDownloadError("");
    try {
      const result = await onSaveEpub(downloadTarget);
      setDownloadTarget(null);
      setToast(
        result.alreadyStored
          ? "Este EPUB ya está en Your Library ♡"
          : result.replaced
            ? "EPUB actualizado en Your Library ♡"
            : "EPUB guardado en Your Library ♡",
      );
    } catch (reason) {
      setDownloadError(
        reason instanceof Error
          ? reason.message
          : "No pude guardar este EPUB. Intentá de nuevo.",
      );
    } finally {
      setDownloadBusy(false);
    }
  };

  return (
    <section
      ref={libraryLayerRef}
      className={`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="My AO3 Library"
      onScroll={handleLibraryScroll}
    >
      <style>{AO3_LIBRARY_CSS}</style>
      <header className="ao3-screen-header">
        <button type="button" onClick={onBack} autoFocus>
          ← Library
        </button>
      </header>

      {loading && works.length === 0 ? (
        <div className="ao3-library ao3-library-state">
          <div className="ao3-loader" />
          <strong>Preparando tu AO3 Library…</strong>
          <span>La primera carga puede tardar un poquito.</span>
        </div>
      ) : (
      <div className="ao3-library">

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
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setActiveTag(null);
            setQuery(event.target.value);
          }}
          onFocus={() => setSearchToolsHidden(false)}
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
              onDownload={(target) => {
                setDownloadError("");
                setDownloadTarget(target);
              }}
              query={query}
              activeTag={activeTag}
              onTagSearch={searchByTag}
            />
          ) : (
            <SeriesCard
              key={`series-${entry.name}`}
              entry={entry}
              versionsByWork={versionsByWork}
              onCopy={onCopy}
              onDownload={(target) => {
                setDownloadError("");
                setDownloadTarget(target);
              }}
              query={query}
              activeTag={activeTag}
              onTagSearch={searchByTag}
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
            if (!downloadBusy && event.target === event.currentTarget) {
              setDownloadTarget(null);
            }
          }}
        >
          <div className="ao3-modal" role="dialog" aria-modal="true">
            <span className="ao3-modal-kicker">EPUB FILE</span>
            <h3>Do you want to download this EPUB?</h3>
            <p>
              Do you want to download “{downloadTarget.title}” as an EPUB file?
            </p>
            {downloadError && <p className="ao3-modal-error">{downloadError}</p>}
            <div className="ao3-modal-actions">
              <button
                type="button"
                disabled={downloadBusy}
                onClick={() => setDownloadTarget(null)}
              >
                Cancel
              </button>
              <button
                className="ao3-modal-primary"
                type="button"
                disabled={downloadBusy}
                onClick={() => void confirmDownload()}
              >
                {downloadBusy ? "Saving…" : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </section>
  );
}

const AO3_LIBRARY_CSS = String.raw`
.ao3-library-layer {
  position: fixed;
  inset: 0;
  z-index: 1200;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-top: env(safe-area-inset-top);
  background: #f7f4f8;
  -webkit-overflow-scrolling: touch;
}
.ao3-screen-header {
  position: sticky;
  top: 0;
  z-index: 30;
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: 10px 12px 7px;
  background: rgba(247,244,248,.94);
  backdrop-filter: blur(15px);
}
.ao3-screen-header button {
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #ded4e2;
  border-radius: 999px;
  background: rgba(255,255,255,.82);
  color: #554260;
  font: inherit;
  font-size: .88rem;
  font-weight: 850;
  cursor: pointer;
}
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
  top: 59px;
  z-index: 15;
  padding: 10px 2px 14px;
  margin-bottom: 14px;
  background: color-mix(in srgb, var(--ao3-surface) 92%, transparent);
  backdrop-filter: blur(14px);
  transform: translateY(0);
  transform-origin: top center;
  transition: transform .22s ease, opacity .18s ease;
  will-change: transform;
}
.ao3-library-layer.ao3-search-tools-hidden .ao3-library-tools {
  opacity: 0;
  pointer-events: none;
  transform: translateY(calc(-100% - 70px));
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
  content-visibility: auto;
  contain-intrinsic-size: auto 620px;
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
.ao3-tag { display: inline-block; max-width: 100%; padding: 5px 8px; border: 1px solid rgba(108,89,122,.12); border-radius: 999px; background: var(--ao3-peach); color: inherit; cursor: pointer; font: inherit; font-size: .75rem; line-height: 1.25; overflow-wrap: anywhere; text-align: left; }
.ao3-tag:nth-of-type(3n+2) { background: var(--ao3-lav); }
.ao3-tag:nth-of-type(3n+3) { background: var(--ao3-sage); }
.ao3-tag.is-searching { border-color: var(--ao3-plum); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ao3-plum) 18%, transparent); }
.ao3-highlight { padding: 0 .08em; border-radius: 4px; background: #fff0a8; color: #4b3b52; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
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
.ao3-modal .ao3-modal-error { margin-top: 10px; color: #985b63; font-weight: 750; }
.ao3-modal-actions { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-top: 18px; }
.ao3-modal-actions button { min-height: 45px; border: 1px solid var(--ao3-border); border-radius: 12px; background: white; color: var(--ao3-ink); font: inherit; font-weight: 800; cursor: pointer; }
.ao3-modal-actions .ao3-modal-primary { border-color: var(--ao3-plum); background: var(--ao3-plum); color: white; }
.ao3-modal-actions button:disabled { cursor: wait; opacity: .62; }
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
.app-shell[data-color-mode="dark"] .ao3-library-layer {
  background: #221f25;
}
.app-shell[data-color-mode="dark"] .ao3-screen-header {
  background: rgba(34,31,37,.94);
}
.app-shell[data-color-mode="dark"] .ao3-screen-header button {
  border-color: #4c4350;
  background: rgba(44,39,48,.94);
  color: #eee9f1;
}
.app-shell[data-color-mode="dark"] .ao3-search,
.app-shell[data-color-mode="dark"] .ao3-filter-row select,
.app-shell[data-color-mode="dark"] .ao3-refresh { background: rgba(44,39,48,.94); }
.app-shell[data-color-mode="dark"] .ao3-card { box-shadow: none; }
.app-shell[data-color-mode="dark"] .ao3-series-parts { background: #302a35; }
.app-shell[data-color-mode="dark"] .ao3-part { background: rgba(40,36,44,.72); }
.app-shell[data-color-mode="dark"] .ao3-part[open] > summary { background: rgba(54,47,59,.72); }
.app-shell[data-color-mode="dark"] .ao3-actions a { background: rgba(43,38,47,.85); }
.app-shell[data-color-mode="dark"] .ao3-highlight { background: #725c2e; color: #fff5dc; }
.app-shell[data-color-mode="dark"] .ao3-modal { background: #29252d; }
.app-shell[data-color-mode="dark"] .ao3-modal-actions button { background: #332e37; color: var(--ao3-ink); }
`;
