import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const ao3Source = await readFile(
  new URL("../app/ao3-library.tsx", import.meta.url),
  "utf8",
);
const studyLibrarySource = await readFile(
  new URL("../app/study-library.tsx", import.meta.url),
  "utf8",
);
const syncSource = await readFile(
  new URL("../app/supabase-sync.ts", import.meta.url),
  "utf8",
);
const nativeStorageSource = await readFile(
  new URL(
    "../android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java",
    import.meta.url,
  ),
  "utf8",
);

test("opens AO3 only from the brand while the current screen is Spaces Library", () => {
  assert.match(pageSource, /activeTab === "spaces" && space === "library" && !calendarOpen/);
  assert.match(pageSource, /if \(!brandOpensAo3\) \{\s*setAereaHubOpen\(true\)/);
  assert.match(pageSource, /brandOpensAo3 \? "Open My AO3 Library" : "Open aérea spaces"/);
  assert.match(pageSource, /window\.history\.pushState\(/);
  assert.match(pageSource, /window\.addEventListener\("popstate", closeAo3FromHistory\)/);
  assert.match(pageSource, /inert=\{ao3LibraryOpen \? true : undefined\}/);
  assert.match(
    pageSource,
    /<Ao3Library onBack=\{closeAo3Library\} onSaveEpub=\{saveAo3Epub\} \/>/,
  );
  assert.equal((pageSource.match(/onClick=\{openAereaFromBrand\}/g) ?? []).length, 2);
  assert.match(ao3Source, />\s*← Library\s*<\/button>/);
});

test("keeps the normal Library mounted and does not add AO3 as a Spaces card", () => {
  assert.match(pageSource, /space === "library"[\s\S]*<StudyLibrary/);
  assert.match(studyLibrarySource, /<h1>Your Library<\/h1>/);
  assert.doesNotMatch(pageSource, /<SpaceCard[\s\S]{0,180}title="AO3 Library"/);
  assert.doesNotMatch(pageSource, /setSpace\("ao3"\)/);
});

test("reads the private automatic AO3 catalog from Supabase without joining private state", () => {
  assert.match(ao3Source, /\.from\("ao3_works"\)/);
  assert.match(ao3Source, /\.from\("ao3_epub_versions"\)/);
  assert.match(ao3Source, /\.limit\(1000\)/);
  assert.match(ao3Source, /validAo3Works\(worksResult\.data \|\| \[\]\)/);
  assert.match(ao3Source, /validEpubVersions\(epubsResult\.data \|\| \[\]\)/);
  assert.match(ao3Source, /aerea-ao3-library-cache-v1/);
  assert.doesNotMatch(ao3Source, /aerea_sync|service_role|sb_secret_/);
  assert.match(syncSource, /SUPABASE_PUBLISHABLE_KEY/);
});

test("keeps a valid offline cache and refreshes automatically", () => {
  assert.match(ao3Source, /const cached = readCache\(\)/);
  assert.match(ao3Source, /setWorks\(cached\.works\)/);
  assert.match(ao3Source, /writeCache\(result\.works, result\.epubs\)/);
  assert.match(ao3Source, /window\.addEventListener\("online", refreshIfAvailable\)/);
  assert.match(ao3Source, /document\.addEventListener\("visibilitychange", refreshWhenVisible\)/);
  assert.match(ao3Source, /table: "ao3_works"/);
  assert.match(ao3Source, /table: "ao3_epub_versions"/);
  assert.match(ao3Source, /void supabase\.removeChannel\(channel\)/);
  assert.doesNotMatch(ao3Source, /catch[\s\S]{0,160}setWorks\(\[\]\)/);
});

test("preserves the full AO3 card, series, search, filter and download experience", () => {
  for (const expected of [
    "My AO3 Library",
    "Download EPUB",
    "Versión alternativa",
    "Abrir copia en Drive",
    "Abrir en AO3",
    "Ver {entry.works.length} obras",
    "Título copiado",
    "Refresh AO3 Library",
    "Todos los fandoms",
    "Complete",
    "WIP",
  ]) {
    assert.match(ao3Source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(ao3Source, /const versionsByWork = useMemo/);
  assert.match(ao3Source, /const entries = useMemo/);
  assert.match(ao3Source, /const fandoms = useMemo/);
  assert.match(ao3Source, /const filtered = useMemo/);
  assert.match(ao3Source, /Do you want to download this EPUB\?/);
  assert.match(ao3Source, /await onSaveEpub\(downloadTarget\)/);
  assert.doesNotMatch(ao3Source, /openExternalUrl|directDownloadUrl/);
});

test("saves Drive EPUBs into Android study_files and refreshes Your Library immediately", () => {
  assert.match(pageSource, /AereaStorage\.downloadAo3Epub\(\{/);
  assert.match(pageSource, /driveFileId: target\.driveFileId/);
  assert.match(pageSource, /workId: target\.workId/);
  assert.match(pageSource, /setStudyFiles\(\(current\) => \{/);
  assert.match(nativeStorageSource, /public void downloadAo3Epub\(PluginCall call\)/);
  assert.match(nativeStorageSource, /connection\.setReadTimeout\(60_000\)/);
  assert.match(nativeStorageSource, /drive\.usercontent\.google\.com\/download\?id=/);
  assert.match(nativeStorageSource, /values\.put\("kind", "epub"\)/);
  assert.match(nativeStorageSource, /insertOrThrow\("study_files"/);
  assert.match(nativeStorageSource, /source_drive_file_id=\? OR source_work_id=\?/);
  assert.match(nativeStorageSource, /study_files_ao3_drive_idx/);
  assert.match(nativeStorageSource, /study_files_ao3_work_idx/);
  assert.match(nativeStorageSource, /result\.put\("alreadyStored", true\)/);
  assert.doesNotMatch(nativeStorageSource, /setRequestMethod\("(?:DELETE|PATCH|PUT)"\)/);
});

test("retains the standalone AO3 visual language on phone, tablet and dark mode", () => {
  assert.match(ao3Source, /\.ao3-card-header \{[\s\S]{0,120}background: var\(--ao3-plum-dark\)/);
  assert.match(ao3Source, /\.ao3-card-meta[\s\S]{0,180}background: var\(--ao3-rose\)/);
  assert.match(ao3Source, /@media \(min-width: 720px\)/);
  assert.match(ao3Source, /@media \(max-width: 390px\)/);
  assert.match(ao3Source, /data-color-mode="dark"/);
  assert.match(ao3Source, /content-visibility: auto/);
});
