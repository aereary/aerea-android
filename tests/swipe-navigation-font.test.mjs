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

const layout = await readFile(
  new URL("../app/layout.tsx", import.meta.url),
  "utf8",
);

const packageJson = JSON.parse(
  await readFile(
    new URL("../package.json", import.meta.url),
    "utf8",
  ),
);

test("post-it handwriting is bundled locally for the APK", () => {
  assert.ok(
    packageJson.dependencies["@fontsource/patrick-hand"],
  );

  assert.match(
    nativeEntry,
    /@fontsource\/patrick-hand\/400\.css/,
  );

  assert.match(
    layout,
    /@fontsource\/patrick-hand\/400\.css/,
  );

  assert.match(
    css,
    /font-family:"Patrick Hand"/,
  );

  assert.doesNotMatch(
    css,
    /family=Patrick\+Hand/,
  );
});

test("primary navigation is swipe-first", () => {
  assert.match(
    page,
    /const primarySwipeTabs: Tab\[\] = \[[\s\S]*"today"[\s\S]*"habits"[\s\S]*"journal"[\s\S]*"spaces"/,
  );

  assert.match(page, /beginPrimarySwipe/);
  assert.match(page, /finishPrimarySwipe/);
  assert.match(page, /Math\.abs\(deltaX\) < 72/);

  assert.match(
    page,
    /onTouchStart=\{beginPrimarySwipe\}/,
  );

  assert.match(
    page,
    /onTouchEnd=\{finishPrimarySwipe\}/,
  );
});

test("the large bottom navigation is removed visually", () => {
  assert.match(
    css,
    /\.nav-item:not\(\.quick-capture-nav\)[\s\S]*display: none !important/,
  );

  assert.match(
    css,
    /\.agenda-v2-home-nav[\s\S]*display: none !important/,
  );

  assert.match(css, /aerea-page-enter-from-right/);
  assert.match(css, /aerea-page-enter-from-left/);
});
