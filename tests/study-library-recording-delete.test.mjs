import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const study = readFileSync("app/study-library.tsx", "utf8");

test("normal Library recording menu exposes an explicit delete action", () => {
  assert.match(
    study,
    /onClick=\{\(\) => deleteRecording\(recording\)\}/,
  );
  assert.match(
    study,
    />\s*Delete recording\s*</,
  );
});

test("deleting a recording requires confirmation and removes only that recording", () => {
  assert.match(
    study,
    /const deleteRecording = \(recording: StudyRecordingItem\) => \{[\s\S]{0,220}window\.confirm/,
  );
  assert.match(
    study,
    /recordings\.filter\(\(item\) => item\.id !== recording\.id\)/,
  );
  assert.match(
    study,
    /setMessage\(`\$\{recording\.name\} was deleted\.`\)/,
  );
});

test("deleting a blob-backed recording releases its temporary object URL", () => {
  assert.match(
    study,
    /recording\.url\?\.startsWith\("blob:"\)[\s\S]{0,100}URL\.revokeObjectURL\(recording\.url\)/,
  );
});
