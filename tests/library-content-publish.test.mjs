import assert from "node:assert/strict";
import test from "node:test";
import {
  PublishError,
  publishLibraryContent,
  sha256Hex,
} from "../supabase/functions/library-content-publish/core.mjs";

const driveFileId = "drive_file_123456";
const ownerEmail = "owner@example.com";
const ownerUserId = "00000000-0000-0000-0000-000000000001";
const itemId = "00000000-0000-0000-0000-000000000002";

async function fixture(overrides = {}) {
  const bytes = new TextEncoder().encode("private library content");
  const sha256 = await sha256Hex(bytes);
  const calls = [];
  const dependencies = {
    googleEmailFromToken: async () => ownerEmail,
    libraryOwnerExists: async () => true,
    findLibraryItem: async () => ({
      id: itemId,
      ownerUserId,
      ownerEmail,
      sha256,
      extension: "epub",
      mimeType: "application/epub+zip",
    }),
    downloadDriveFile: async () => bytes,
    readContentObject: async () => null,
    uploadContentObject: async (...args) => {
      calls.push(["upload", ...args]);
      return "uploaded";
    },
    saveContentObjectPath: async (...args) => {
      calls.push(["save", ...args]);
      return 1;
    },
    ...overrides,
  };
  return { bytes, sha256, calls, dependencies };
}

test("publishes verified Drive bytes and links the immutable hash path", async () => {
  const { sha256, calls, dependencies } = await fixture();
  const result = await publishLibraryContent(
    {
      googleOAuthToken: "oauth-token",
      driveFileId,
      expectedSha256: sha256,
    },
    dependencies,
  );

  assert.equal(result.ok, true);
  assert.equal(result.object, "uploaded");
  assert.equal(result.destructive_operations, 0);
  assert.match(result.content_object_path, new RegExp(sha256));
  assert.equal(calls.filter(([name]) => name === "upload").length, 1);
  assert.equal(calls.filter(([name]) => name === "save").length, 1);
});

test("reuses a verified stored object without uploading it again", async () => {
  const base = await fixture();
  const { sha256, calls, dependencies } = await fixture({
    readContentObject: async () => base.bytes,
  });
  const result = await publishLibraryContent(
    {
      googleOAuthToken: "oauth-token",
      driveFileId,
      expectedSha256: sha256,
    },
    dependencies,
  );

  assert.equal(result.object, "already_present");
  assert.equal(calls.filter(([name]) => name === "upload").length, 0);
});

test("refuses content whose downloaded bytes do not match the database hash", async () => {
  const { sha256, dependencies } = await fixture({
    downloadDriveFile: async () => new TextEncoder().encode("different bytes"),
  });

  await assert.rejects(
    publishLibraryContent(
      {
        googleOAuthToken: "oauth-token",
        driveFileId,
        expectedSha256: sha256,
      },
      dependencies,
    ),
    (error) =>
      error instanceof PublishError &&
      error.code === "DRIVE_SHA_MISMATCH" &&
      error.status === 409,
  );
});
