import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);

const css = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

const nativeEntry = await readFile(
  new URL("../app/native-entry.tsx", import.meta.url),
  "utf8",
);

test("modal layering does not depend on unavailable parent state", () => {
  assert.doesNotMatch(
    page,
    /timetableOpen \|\| healthRoutineOpen \? "modal-open"/,
  );

  assert.match(
    css,
    /\.phone-canvas:has\(\.timetable-backdrop\) \.primary-swipe-surface/,
  );

  assert.match(
    css,
    /\.phone-canvas:has\(\.health-routine-backdrop\) \.primary-swipe-surface/,
  );
});

test("viewport modals own the screen above nav and post-its", () => {
  assert.match(
    css,
    /\.phone-canvas:has\(\.timetable-backdrop\) > \.bottom-nav,[\s\S]*?visibility:\s*hidden !important/,
  );

  assert.match(
    css,
    /\.phone-canvas:has\(\.timetable-backdrop\) \.post-it-layer,[\s\S]*?visibility:\s*hidden !important/,
  );

  assert.match(
    css,
    /\.phone-canvas \.timetable-backdrop,[\s\S]*?z-index:\s*20000 !important/,
  );
});

test("class timetable is centered against the viewport", () => {
  assert.match(
    css,
    /\.phone-canvas \.timetable-backdrop[\s\S]*?align-items:\s*center !important/,
  );

  assert.match(
    css,
    /\.phone-canvas \.timetable-backdrop[\s\S]*?justify-content:\s*center !important/,
  );
});

test("post-its use bundled Patrick Hand with Latin accents", () => {
  assert.match(
    nativeEntry,
    /@fontsource\/patrick-hand\/400\.css/,
  );

  assert.doesNotMatch(
    css,
    /fonts\.googleapis\.com\/css2\?family=Gaegu/,
  );

  const rules = [
    ...css.matchAll(
      /\.movable-post-it p,\s*\n\.post-it-editor-preview textarea\s*\{([\s\S]*?)\}/g,
    ),
  ];

  const fontRules = rules
    .map((match) => match[1])
    .filter((rule) => /font-family:/.test(rule));

  const finalFontRule = fontRules.at(-1) ?? "";

  assert.match(finalFontRule, /font-family:"Patrick Hand"/);
  assert.match(finalFontRule, /font-weight:400/);
  assert.match(finalFontRule, /font-synthesis:none/);
  assert.doesNotMatch(finalFontRule, /Gaegu/);
});
