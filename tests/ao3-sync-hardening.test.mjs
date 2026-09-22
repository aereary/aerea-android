import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

const config = await read("automation/apps-script/aerea/Config.gs");
const ao3Drive = await read("automation/apps-script/aerea/Code.gs");
const genericDrive = await read(
  "automation/apps-script/aerea/GenericLibrary.gs",
);
const autoSync = await read("automation/apps-script/aerea/AutoSync.gs");
const drivePushSync = await read(
  "automation/apps-script/aerea/DrivePushSync.gs",
);
const manifest = await read("automation/apps-script/aerea/appsscript.json");
const googleAuth = await read(
  "supabase/functions/_shared/google-auth.ts",
);
const epubReader = await read("app/epub-reader.ts");
const studyReader = await read("app/study-reader.tsx");
const migration = await read(
  "supabase/migrations/20260921153000_harden_ao3_library.sql",
);
const driveSignalMigration = await read(
  "supabase/migrations/20260922153000_drive_change_signal.sql",
);
const driveSignalFunction = await read(
  "supabase/functions/drive-change-signal/index.ts",
);

test("keeps the Apps Script project parseable and free of environment IDs", () => {
  for (const source of [
    config,
    ao3Drive,
    genericDrive,
    autoSync,
    drivePushSync,
  ]) {
    assert.doesNotThrow(() => new Function(source));
  }
  assert.doesNotThrow(() => JSON.parse(manifest));
  const combined = [
    config,
    ao3Drive,
    genericDrive,
    autoSync,
    drivePushSync,
  ].join("\n");
  assert.doesNotMatch(combined, /script\.google\.com\/d\//);
  assert.doesNotMatch(combined, /https:\/\/[a-z]+\.supabase\.co/);
  assert.match(config, /AEREA_SUPABASE_FUNCTIONS_BASE_URL/);
  assert.match(ao3Drive, /aereaRequiredProperty_\("AEREA_DOWNLOADS_FOLDER_ID"\)/);
});

test("uses authenticated Drive notifications without modifying Drive content", () => {
  assert.match(drivePushSync, /drive\/v3\/changes\/watch/);
  assert.match(drivePushSync, /aereaRelevantDriveChanges_/);
  assert.match(drivePushSync, /everyMinutes\(AEREA_DRIVE_PUSH\.CHECK_EVERY_MINUTES\)/);
  assert.match(drivePushSync, /aereaAutoSyncAll\(\)/);
  assert.match(drivePushSync, /aereaAutoSyncStatus\(\)/);
  assert.doesNotMatch(
    drivePushSync,
    /setName\(|moveTo\(|setTrashed\(|Drive\.Files\.remove|Drive\.Files\.delete/,
  );

  assert.match(driveSignalFunction, /x-goog-channel-token/);
  assert.match(driveSignalFunction, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(driveSignalFunction, /aerea_library_owner_exists/);
  assert.match(driveSignalFunction, /aerea_mark_drive_sync_pending/);
  assert.match(driveSignalMigration, /enable row level security/);
  assert.match(
    driveSignalMigration,
    /revoke all privileges on table public\.aerea_drive_sync_signal from authenticated/,
  );
  assert.match(driveSignalMigration, /generation = generation \+ 1/);
});

test("inventories Drive once and opens file blobs only when needed", () => {
  assert.match(config, /AEREA_FOLDER_INVENTORY_CACHE_/);
  assert.match(config, /googleapis\.com\/drive\/v3\/files/);
  assert.match(config, /pageSize=1000/);
  assert.match(ao3Drive, /aereaListFolderFiles_/);
  assert.doesNotMatch(ao3Drive, /const files =\s*downloads\.getFiles\(\)/);
  assert.match(genericDrive, /aereaMetadataIterator_/);
  assert.doesNotMatch(genericDrive, /const files =\s*downloads\.getFiles\(\)/);
});

test("publishes only pending generic content in parallel", () => {
  assert.match(genericDrive, /published_sha256/);
  assert.match(genericDrive, /function aereaGenericPublishPending_/);
  assert.match(genericDrive, /UrlFetchApp\.fetchAll/);
  assert.match(genericDrive, /scan\.publishItems/);
  assert.match(genericDrive, /aereaGenericMarkPublished_/);
  assert.doesNotMatch(
    genericDrive,
    /aereaGenericPublishCurrent_\(\s*scan\.currentItems/,
  );
});

test("serializes manual and scheduled sync runs", () => {
  assert.match(config, /function aereaWithScriptLock_/);
  assert.match(ao3Drive, /aereaWithScriptLock_\(\s*aereaDriveSyncUnlocked_/);
  assert.match(
    genericDrive,
    /aereaWithScriptLock_\(\s*aereaGenericSyncUnlocked_/,
  );
  assert.match(autoSync, /aereaDriveSyncUnlocked_\(\)/);
  assert.match(autoSync, /aereaGenericSyncUnlocked_\(\)/);
});

test("verifies Google identity without putting OAuth tokens in URLs", () => {
  assert.match(
    googleAuth,
    /openidconnect\.googleapis\.com\/v1\/userinfo/,
  );
  assert.match(googleAuth, /authorization: "Bearer " \+ token/);
  assert.match(googleAuth, /email_verified !== true/);
  assert.doesNotMatch(googleAuth, /tokeninfo|access_token=/);
});

test("hardens database access and enables the subscriptions used by the app", () => {
  assert.match(migration, /revoke all privileges on table public\.ao3_works/);
  assert.match(migration, /grant select on table public\.ao3_works/);
  assert.match(migration, /drop policy if exists ao3_works_private_insert/);
  assert.match(migration, /ao3_epub_snapshots_work_id_idx/);
  assert.match(migration, /ao3_work_sync_state_work_id_idx/);
  assert.match(
    migration,
    /alter publication supabase_realtime add table public\.ao3_works/,
  );
});

test("limits EPUB decompression and indexes search text once per book", () => {
  assert.match(epubReader, /MAX_EPUB_BYTES/);
  assert.match(epubReader, /MAX_EPUB_ENTRY_BYTES/);
  assert.match(epubReader, /await reader\.cancel\(\)/);
  assert.match(studyReader, /const epubSearchIndex = useMemo/);
  assert.match(
    studyReader,
    /epubSearchIndex\.flatMap\(\(\{ item, index, searchable \}\)/,
  );
});
