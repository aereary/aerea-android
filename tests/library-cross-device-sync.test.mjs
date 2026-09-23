import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const studyLibrary = readFileSync("app/study-library.tsx", "utf8");
const nativeStorage = readFileSync(
  "android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java",
  "utf8",
);

test("native Library images acquire a private cloud copy for other devices", () => {
  assert.match(page, /item\.nativeFileId && !item\.cloudPath/);
  assert.match(page, /AereaStorage\.readFile\(\{ id: item\.nativeFileId \}\)/);
  assert.match(page, /Capacitor\.convertFileSrc\(stored\.contentUri\)/);
  assert.match(page, /uploadAereaLibraryFile\(item\.id, blob\)/);
});

test("native EPUBs and documents survive an empty local inventory", () => {
  assert.match(studyLibrary, /cloudPath\?: string/);
  assert.match(page, /function mergeStudyFileInventory/);
  assert.match(page, /Boolean\(file\.cloudPath\)/);
  assert.match(page, /uploadAereaLibraryFile\(file\.id, blob\)/);
  assert.match(page, /const availableFiles = payload\.files\.filter/);
  assert.match(page, /mergeStudyFileInventory\([\s\S]{0,180}availableFiles/);
});

test("a second Android device restores a cloud file using its stable id", () => {
  assert.match(page, /downloadAereaLibraryFile\(file\.cloudPath\)/);
  assert.match(page, /AereaStorage\.saveDocument\(\{[\s\S]{0,100}id: file\.id/);
  assert.match(nativeStorage, /String id = call\.getString\("id"\)/);
  assert.match(nativeStorage, /UUID\.fromString\(id\)/);
  assert.match(nativeStorage, /writable\.update\([\s\S]{0,120}"study_files"/);
});

test("cloud-backed images are cached locally after their first restore", () => {
  assert.match(page, /nativeFileId = undefined;[\s\S]{0,80}nativeContentUri = undefined/);
  assert.match(page, /!nativeContentUri && item\.cloudPath/);
  assert.match(page, /downloadAereaLibraryFile\(item\.cloudPath\)/);
  assert.match(page, /AereaStorage\.saveFile\(\{/);
  assert.match(page, /nativeFileId = stored\.id/);
});

test("permanent deletion removes private Storage copies of every file kind", () => {
  const matches = page.match(/deleteAereaLibraryFile\(file\.cloudPath\)/g) ?? [];
  assert.ok(matches.length >= 3);
});
