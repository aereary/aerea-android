import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);
const bridge = await readFile(
  new URL("../app/generic-library-bridge.tsx", import.meta.url),
  "utf8",
);
const ao3 = await readFile(
  new URL("../app/ao3-library.tsx", import.meta.url),
  "utf8",
);

test("restores generic Drive books inside the AO3 Library without replacing AO3", () => {
  assert.match(page, /import GenericLibraryBridge from "\.\/generic-library-bridge"/);
  assert.match(
    page,
    /<Ao3Library onBack=\{closeAo3Library\} onSaveEpub=\{saveAo3Epub\} \/>[\s\S]{0,100}<GenericLibraryBridge \/>/,
  );

  assert.match(bridge, /\.from\("library_items"\)/);
  assert.match(bridge, /\.from\("library_item_versions"\)/);
  assert.match(bridge, /className="ao3-card aerea-generic-library-card"/);
  assert.match(bridge, /↗ Open in Drive/);
  assert.match(bridge, /Previous version/);
  assert.match(bridge, /\.ao3-library-layer \.ao3-grid/);
  assert.match(bridge, /if \(!filtersNeutral\) return \[\]/);

  assert.match(ao3, /className=\{`ao3-library-layer/);
  assert.match(ao3, /className="ao3-grid"/);
  assert.match(ao3, /\.from\("ao3_works"\)/);
  assert.match(ao3, /\.from\("ao3_epub_versions"\)/);
});

test("generic books remain visually distinct but use the AO3 card language", () => {
  assert.match(
    bridge,
    /\.aerea-generic-library-card \{ order: -1; \}/,
  );
  assert.match(
    bridge,
    /\.aerea-generic-library-card \.ao3-card-header \{ background: var\(--ao3-plum\); \}/,
  );
  assert.match(
    bridge,
    /\.aerea-generic-library-card \.ao3-card-meta \{ background: var\(--ao3-sage\); \}/,
  );
});
