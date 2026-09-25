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
    /useState<GenericLibraryCache \| null>\([\s\S]{0,80}readGenericLibraryCache/,
  );
  assert.doesNotMatch(
    bridge,
    /if \(!target\) return;[\s\S]{0,100}void refreshGenericLibrary\(\)/,
  );
});

test("cached Library content mounts before paint without the visible card jump", () => {
  assert.match(ao3, /useState<LibraryCache \| null>\(readCache\)/);
  assert.match(ao3, /useState<Ao3Work\[]>\([\s\S]{0,100}initialCache\?\.works/);
  assert.doesNotMatch(ao3, /const hydrate = window\.setTimeout/);
  assert.match(bridge, /useLayoutEffect\(\(\) => \{[\s\S]{0,320}syncTarget\(\)/);
  assert.match(bridge, /initialCache\?\.items/);
});

test("normal books have their own Library category and stable result count", () => {
  assert.match(ao3, /type LibraryTypeFilter = "all" \| "fic" \| "series" \| "book"/);
  assert.match(ao3, /<option value="book">Books<\/option>/);
  assert.match(ao3, /disabled=\{typeFilter === "book"\}/);
  assert.match(bridge, /filterMode === "books"/);
  assert.match(bridge, /aereaGenericCount/);
  assert.match(bridge, /aerea-generic-result-count/);
});

test("generic bridge does not observe every body mutation", () => {
  assert.doesNotMatch(bridge, /new MutationObserver/);
  assert.doesNotMatch(bridge, /observer\.observe\(document\.body/);
  assert.match(bridge, /window\.setInterval\(syncTarget, 120\)/);
});


test("Library back/header scrolls away while search tools own the sticky top", () => {
  assert.match(
    ao3,
    /\.ao3-screen-header \{[\s\S]{0,160}position: relative;/,
  );
  assert.doesNotMatch(
    ao3,
    /\.ao3-screen-header \{[\s\S]{0,160}position: sticky;/,
  );
  assert.match(
    ao3,
    /\.ao3-library-tools \{[\s\S]{0,100}position: sticky;[\s\S]{0,40}top: 0;/,
  );
});


test("AO3 search keeps keystrokes local and debounces the heavy list filter", () => {
  assert.match(ao3, /function Ao3SearchInput\(/);
  assert.match(ao3, /const \[draft, setDraft\] = useState\(value\)/);
  assert.match(
    ao3,
    /window\.setTimeout\([\s\S]{0,220}startSearchTransition\(\(\) => onValueChange\(nextValue\)\)[\s\S]{0,80}450\)/,
  );
  assert.match(ao3, /<Ao3SearchInput[\s\S]{0,240}setQuery\(nextQuery\)/);
  assert.match(ao3, /const entrySearchIndex = useMemo\(/);
  assert.match(ao3, /entrySearchIndex\.get\(entry\)/);
  assert.doesNotMatch(
    ao3,
    /className="ao3-search"[\s\S]{0,180}setQuery\(event\.target\.value\)/,
  );
});

test("native AO3 search tools avoid expensive blur during keyboard resize", () => {
  assert.match(
    ao3,
    /html\[data-native="true"\] \.ao3-library-tools[\s\S]{0,180}backdrop-filter: none;/,
  );
  assert.match(ao3, /will-change: auto;/);
});

test("generic bridge mirrors search input on the same debounce", () => {
  assert.match(bridge, /const syncFiltersSoon = \(\) =>/);
  assert.match(
    bridge,
    /window\.setTimeout\([\s\S]{0,180}startFilterTransition\(syncFilters\)[\s\S]{0,60}450\)/,
  );
  assert.match(bridge, /const itemSearchIndex = useMemo\(/);
  assert.match(bridge, /addEventListener\("input", syncFiltersSoon, true\)/);
});
