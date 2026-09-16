import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("repository documentation describes aérea instead of the starter", async () => {
  const readme = await read("README.md");
  assert.match(readme, /^# aérea$/m);
  assert.doesNotMatch(readme, /# vinext-starter/);
  assert.match(readme, /docs\/BRANCH_POLICY\.md/);
});

test("release automation follows main and tags the built commit", async () => {
  const workflow = await read(".github/workflows/build-apk.yml");
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /target_commitish:\s*\$\{\{ github\.sha \}\}/);
  assert.doesNotMatch(workflow, /fix\/restore-just-calendar-baseline-20260915/);
  assert.doesNotMatch(workflow, /recovery\/consolidation-2026-09-05/);
});

test("obsolete starter and handoff files stay removed", async () => {
  const obsolete = [
    "ANDROID-README.md",
    "CODEX_ANDROID_HANDOFF.md",
    "CODEX_PROMPT.md",
    "app/chatgpt-auth.ts",
    "examples/d1/app/api/notes/route.ts",
    "examples/d1/db/schema.ts",
    "public/file.svg",
    "public/globe.svg",
    "public/window.svg",
  ];

  for (const path of obsolete) {
    await assert.rejects(access(new URL(`../${path}`, import.meta.url)));
  }
});
