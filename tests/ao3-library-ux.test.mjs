import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ao3 = readFileSync("app/ao3-library.tsx", "utf8");
const bridge = readFileSync("app/generic-library-bridge.tsx", "utf8");

test("generic books hydrate and refresh without waiting for AO3 grid", () => {
  assert.match(bridge, /GENERIC_LIBRARY_CACHE_KEY/);
  assert.match(bridge, /readGenericLibraryCache\(\)/);
  assert.match(bridge, /writeGenericLibraryCache\(nextItems, nextVersions\)/);
  assert.match(
    bridge,
    /const cached = readGenericLibraryCache\(\);[\s\S]{0,260}void refreshGenericLibrary\(\);/,
  );
  assert.doesNotMatch(
    bridge,
    /if \(!target\) return;[\s\S]{0,100}void refreshGenericLibrary\(\)/,
  );
});

test("generic bridge does not observe every body mutation", () => {
  assert.doesNotMatch(bridge, /new MutationObserver/);
  assert.doesNotMatch(bridge, /observer\.observe\(document\.body/);
  assert.match(bridge, /window\.setInterval\(syncTarget, 120\)/);
});
