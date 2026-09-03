import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PublishError,
  publishLibraryContent,
  sha256Hex,
} from "../supabase/functions/library-content-publish/core.mjs";

const ownerUserId = "9c111111-2222-4333-8444-555555555555";
const itemId = "7cc11111-2222-4333-8444-555555555555";
const driveFileId = "153WoAnQLO4CLNDnRJ8cTahywdji4OV1r";
const ownerEmail = "aereaary@gmail.com";
const driveBytes = new TextEncoder().encode("generic library test bytes");
const expectedSha = await sha256Hex(driveBytes);

function createDependencies(overrides = {}) {
  const objects = overrides.objects ?? new Map();
  const calls = {
    ownerEmails: [],
    uploads: 0,
    savedPaths: [],
  };
  const item = {
    id: itemId,
    ownerUserId,
    ownerEmail,
    sha256: expectedSha,
    extension: "epub",
    mimeType: "application/epub+zip",
    ...overrides.item,
  };

  return {
    calls,
    objects,
    dependencies: {
      async googleEmailFromToken() {
        return overrides.googleEmail ?? ownerEmail;
      },
      async libraryOwnerExists(email) {
        calls.ownerEmails.push(email);
        return overrides.ownerExists ?? true;
      },
      async findLibraryItem() {
        return overrides.findItem === false ? null : item;
      },
      async downloadDriveFile() {
        return overrides.driveBytes ?? driveBytes;
      },
      async readContentObject(objectPath) {
        return objects.get(objectPath) ?? null;
      },
      async uploadContentObject(objectPath, bytes) {
        if (objects.has(objectPath)) return "already-exists";
        objects.set(objectPath, new Uint8Array(bytes));
        calls.uploads += 1;
        return "uploaded";
      },
      async saveContentObjectPath(input) {
        calls.savedPaths.push(input);
        return 1;
      },
    },
  };
}

function requestInput(sha256 = expectedSha) {
  return {
    googleOAuthToken: "google-oauth-token-for-test",
    driveFileId,
    expectedSha256: sha256,
  };
}

test("publisher resolves and preserves the correct owner", async () => {
  const fixture = createDependencies();
  const result = await publishLibraryContent(requestInput(), fixture.dependencies);

  assert.deepEqual(fixture.calls.ownerEmails, [ownerEmail]);
  assert.equal(result.owner_user_id, ownerUserId);
  assert.equal(fixture.calls.savedPaths[0].ownerUserId, ownerUserId);
});

test("publisher accepts matching Drive bytes and SHA", async () => {
  const fixture = createDependencies();
  const result = await publishLibraryContent(requestInput(), fixture.dependencies);

  assert.equal(result.sha256, expectedSha);
  assert.equal(result.object, "uploaded");
  assert.equal(result.destructive_operations, 0);
});

test("publisher rejects a downloaded SHA mismatch", async () => {
  const fixture = createDependencies({
    driveBytes: new TextEncoder().encode("wrong bytes"),
  });

  await assert.rejects(
    publishLibraryContent(requestInput(), fixture.dependencies),
    (error) =>
      error instanceof PublishError &&
      error.code === "DRIVE_SHA_MISMATCH" &&
      error.status === 409,
  );
  assert.equal(fixture.objects.size, 0);
  assert.equal(fixture.calls.savedPaths.length, 0);
});

test("publisher path begins with owner_user_id and uses current item SHA", async () => {
  const fixture = createDependencies();
  const result = await publishLibraryContent(requestInput(), fixture.dependencies);

  assert.equal(
    result.content_object_path,
    `${ownerUserId}/current/${itemId}/${expectedSha}.epub`,
  );
  assert.ok(result.content_object_path.startsWith(`${ownerUserId}/`));
});

test("two publications produce one logical object", async () => {
  const fixture = createDependencies();
  const first = await publishLibraryContent(requestInput(), fixture.dependencies);
  const second = await publishLibraryContent(requestInput(), fixture.dependencies);

  assert.equal(first.object, "uploaded");
  assert.equal(second.object, "already_present");
  assert.equal(fixture.calls.uploads, 1);
  assert.equal(fixture.objects.size, 1);
  assert.equal(fixture.calls.savedPaths.length, 2);
});

test("publisher implementation has zero deletes and zero AO3 references", async () => {
  const directory = fileURLToPath(
    new URL("../supabase/functions/library-content-publish/", import.meta.url),
  );
  const files = await readdir(directory);
  const source = (
    await Promise.all(
      files
        .filter((filename) => /\.(?:ts|mjs)$/.test(filename))
        .map((filename) => readFile(path.join(directory, filename), "utf8")),
    )
  ).join("\n");

  assert.doesNotMatch(source, /\bao3_/i);
  assert.doesNotMatch(source, /\.remove\s*\(/);
  assert.doesNotMatch(source, /\.delete\s*\(/);
  assert.doesNotMatch(source, /method\s*:\s*["']DELETE["']/i);
});

test("version migration preserves history immutability while allowing the content path", async () => {
  const migration = await readFile(
    fileURLToPath(
      new URL(
        "../supabase/migrations/20260903033500_allow_library_version_content_path_updates.sql",
        import.meta.url,
      ),
    ),
    "utf8",
  );

  assert.match(migration, /tg_op\s*=\s*'UPDATE'/i);
  assert.match(migration, /to_jsonb\(new\)\s*-\s*'content_object_path'/i);
  assert.match(migration, /to_jsonb\(old\)\s*-\s*'content_object_path'/i);
  assert.match(migration, /LIBRARY_ITEM_VERSIONS_ARE_IMMUTABLE/);
  assert.doesNotMatch(migration, /\bdelete\b/i);
});
