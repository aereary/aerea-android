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

test("post-it handwriting stays bundled locally", () => {
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
});

test("primary paging follows the finger instead of waiting for release", () => {
  assert.match(page, /onTouchMove=\{movePrimarySwipe\}/);
  assert.match(page, /velocityX/);
  assert.match(page, /translate3d\(\$\{clampedDelta\}px,0,0\)/);
  assert.match(page, /Math\.abs\(velocityX\) >= 0\.42/);
  assert.match(page, /outgoingMs/);

  assert.doesNotMatch(page, /pageSwipeAnimation/);
  assert.doesNotMatch(css, /aerea-page-enter-from-right/);
  assert.doesNotMatch(css, /aerea-page-enter-from-left/);
});

test("corner Quick Capture is gone and non-home screens get Home", () => {
  assert.doesNotMatch(
    page,
    /!sketchFullscreen && <nav className="bottom-nav"/,
  );

  assert.match(
    page,
    /activeTab !== "today"/,
  );

  assert.match(
    page,
    /className="floating-home-button"/,
  );

  assert.match(
    page,
    /aria-label="Back to Today"/,
  );

  assert.match(
    page,
    /setActiveTab\("today"\)/,
  );

  assert.match(
    css,
    /\.floating-home-button/,
  );
});
