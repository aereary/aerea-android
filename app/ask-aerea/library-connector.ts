import { AEREA_ACCOUNT, supabase } from "../supabase-sync";
import { validAo3Works, validEpubVersions } from "../ao3-library";
import type { AskDocument } from "./core";

const WORK_FIELDS = "work_id,title,author,summary,fandoms,warnings,characters,relationships,tags,words,rating,chapters,complete,series,updated_on,bookmarked_on,source_url,archived,categories,bookmarker_tags";
const VERSION_FIELDS = "work_id,drive_file_id,filename,label,is_primary";
const ITEM_FIELDS = "id,drive_file_id,filename,title,author,kind,archived";
const PAGE = 500, MAX = 20000;
type Catalog = { works: NonNullable<ReturnType<typeof validAo3Works>>; epubs: NonNullable<ReturnType<typeof validEpubVersions>>; items: Record<string, unknown>[]; savedAt?: number };
export type CatalogResult = { documents: AskDocument[]; status: string };

function readExistingCatalog(): Catalog | undefined {
  try {
    const raw = localStorage.getItem("aerea-ao3-library-cache-v1");
    if (!raw) return;
    const cache = JSON.parse(raw);
    const works = validAo3Works(cache.works), epubs = validEpubVersions(cache.epubs);
    if (!works || !epubs) return;
    const other = JSON.parse(localStorage.getItem("aerea-generic-library-cache-v1") || "{}");
    return { works, epubs, items: Array.isArray(other.items) ? other.items : [], savedAt: cache.savedAt };
  } catch { return; }
}
async function rows(table: "ao3_works" | "ao3_epub_versions" | "library_items", fields: string, signal: AbortSignal) {
  const result: Record<string, unknown>[] = [];
  for (let start = 0; start < MAX; start += PAGE) {
    signal.throwIfAborted();
    const order = table === "library_items" ? "id" : table === "ao3_works" ? "work_id" : "drive_file_id";
    const { data, error } = await supabase.from(table).select(fields).order(order).range(start, start + PAGE - 1).abortSignal(signal);
    if (error) throw new Error("The private catalog could not be read. Open My AO3 Library to check its connection.");
    const page = (data ?? []) as unknown as Record<string, unknown>[];
    result.push(...page);
    if (page.length < PAGE) return result;
  }
  throw new Error("The catalog exceeds this stage's 20,000-row limit. Results would be incomplete.");
}
export function catalogDocuments(catalog: Catalog): AskDocument[] {
  const versions = new Map<number, Catalog["epubs"]>();
  for (const version of catalog.epubs) versions.set(version.work_id, [...(versions.get(version.work_id) ?? []), version]);
  const works = catalog.works.map(work => {
    const files = versions.get(work.work_id) ?? [];
    const primary = files.find(file => file.is_primary) ?? files[0];
    return {
      id: `ao3:${work.work_id}`, source: "library" as const, kind: "AO3 work", title: work.title,
      author: work.author ?? undefined, text: work.summary ?? "", workId: work.work_id,
      driveId: primary?.drive_file_id, reference: `AO3 work ${work.work_id}`,
      complete: work.complete, words: work.words, archived: work.archived,
      tags: [...work.tags, ...work.warnings, ...work.categories, ...work.characters, ...work.bookmarker_tags, ...(work.rating ? [work.rating] : [])],
      relationships: work.relationships, fandoms: work.fandoms,
      series: work.series.map(series => series.label), versionCount: files.length, fileNames: files.map(file => file.filename),
    };
  });
  const generic: AskDocument[] = catalog.items.flatMap(item => {
    if (typeof item.id !== "string" || typeof item.title !== "string" || typeof item.filename !== "string" || typeof item.drive_file_id !== "string") return [];
    return [{ id: `drive:${item.id}`, source: "library", kind: "Synced Drive file", title: item.title, text: item.filename, author: typeof item.author === "string" ? item.author : undefined, driveId: item.drive_file_id, reference: item.filename, archived: item.archived === true }];
  });
  return [...works, ...generic];
}
/** SELECT only. Never invokes import/sync/publish, downloads originals, or writes caches. */
export async function readLibraryCatalog(signal: AbortSignal, refresh = false): Promise<CatalogResult> {
  const { data } = await supabase.auth.getSession();
  signal.throwIfAborted();
  if (data.session?.user.email?.toLowerCase() !== AEREA_ACCOUNT) throw new Error("Sign in to your private account to search the library. Other selected sources still work.");
  const cached = readExistingCatalog();
  if (cached && !refresh) return { documents: catalogDocuments(cached), status: `Existing library cache${cached.savedAt ? ` · ${new Date(cached.savedAt).toLocaleString("en-US")}` : ""}. Refresh to check for changes.` };
  try {
    const [workRows, versionRows, items] = await Promise.all([rows("ao3_works", WORK_FIELDS, signal), rows("ao3_epub_versions", VERSION_FIELDS, signal), rows("library_items", ITEM_FIELDS, signal)]);
    const works = validAo3Works(workRows), epubs = validEpubVersions(versionRows);
    if (!works || !epubs) throw new Error("The private catalog format could not be verified.");
    return { documents: catalogDocuments({ works, epubs, items }), status: "Private catalog · current server results. No library data was changed." };
  } catch (error) {
    signal.throwIfAborted();
    if (!cached) throw error;
    return { documents: catalogDocuments(cached), status: "Connection unavailable · using the existing library cache. It may be out of date." };
  }
}
