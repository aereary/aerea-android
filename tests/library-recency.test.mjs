import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { libraryAddedAt, libraryCardOrder } from "../app/library-recency.ts";

test("a newer fic precedes an older generic book, regardless of publication date", () => {
  const book = libraryAddedAt("2026-09-10", "2026-10-30");
  const fic = libraryAddedAt("2026-10-22", "2020-01-01");
  assert.ok(libraryCardOrder(fic) < libraryCardOrder(book));
  assert.equal(libraryAddedAt(undefined, "2026-10-22"), fic);
  assert.equal(libraryAddedAt("invalid", null), 0);
});

test("download confirmation lives outside the scrolling library and its filled animation", () => {
  const source = readFileSync("app/ao3-library.tsx", "utf8");
  assert.match(source, /<\/section>[\s\S]*ao3-overlay-host[\s\S]*className="ao3-modal-backdrop"/);
  assert.match(source, /ao3-overlay-host \.ao3-toast \{ z-index: 22001/);
});
