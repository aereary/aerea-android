import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const nativeEntry = readFileSync("app/native-entry.tsx", "utf8");
const nativeHtml = readFileSync("native.html", "utf8");
const css = readFileSync("app/styles/experimental-theme-lab.css", "utf8");

const themes = [
  ["porcelainday", "Porcelain day", "bare line dock"],
  ["bluebellpaper", "Bluebell stationery", "stacked paper tabs"],
  ["apricotpocket", "Apricot pocket", "pocket card dock"],
  ["mintledger", "Mint day ledger", "time rail ledger"],
  ["lilacorbit", "Lilac orbit", "orbit action dock"],
  ["cloudglass", "Cloud glass", "floating glass rail"],
  ["ticketgarden", "Ticket garden", "ticket tear cards"],
  ["linenstudio", "Linen studio", "file tab studio"],
  ["midnightindex", "Midnight index", "luminous index rail"],
  ["cherrynoir", "Cherry noir", "cinema action dock"],
];

test("offers ten new opt-in interface experiments", () => {
  for (const [id, name, idea] of themes) {
    assert.match(page, new RegExp(`\\| "${id}"`));
    assert.match(
      page,
      new RegExp(
        `id: "${id}",[\\s\\S]{0,180}name: "${name}"[\\s\\S]{0,700}showCharm: false,[\\s\\S]{0,140}interfaceIdea: "${idea}"`,
      ),
    );
    assert.match(nativeHtml, new RegExp(`"${id}"`));
  }
});

test("loads the experimental stylesheet last on web and native", () => {
  for (const source of [layout, nativeEntry]) {
    const globalsIndex = source.indexOf('import "./globals.css"');
    const themeLabIndex = source.indexOf(
      'import "./styles/experimental-theme-lab.css"',
    );
    assert.ok(globalsIndex >= 0);
    assert.ok(themeLabIndex > globalsIndex);
  }
});

test("keeps every experiment isolated from established themes", () => {
  for (const [id] of themes) {
    assert.match(css, new RegExp(`data-theme="${id}"`));
  }
  assert.doesNotMatch(css, /\.app-shell\[data-theme\](?!\=)/);
  assert.doesNotMatch(css, /data-theme="(?:storybook|otter|strawberry|duckpond|bunnybakery|mooncat|whalesong|ribbonpromise|gentlekitten|softguidance|velvetrest|rosegrid|littlesheets)"/);
});

test("gives every new world an original card or navigation language", () => {
  assert.match(css, /Porcelain day: extremely white, fine rules/);
  assert.match(css, /Bluebell stationery: layered sheets/);
  assert.match(css, /Apricot pocket: inset pockets/);
  assert.match(css, /Mint ledger: ruled records and a time rail/);
  assert.match(css, /Lilac orbit: rounded islands/);
  assert.match(css, /Cloud glass: translucent floating panes/);
  assert.match(css, /Ticket garden: stub-shaped cards/);
  assert.match(css, /Linen studio: editorial files/);
  assert.match(css, /Midnight index: dark modules/);
  assert.match(css, /Cherry noir: cinematic blocks/);
  assert.match(css, /schedule-card:not\(\.match-day-schedule-card\)/);
  assert.match(css, /\.bottom-nav/);
  assert.match(css, /@keyframes theme-lab-card-arrive/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
});

test("preserves the approved Boca event card while experimenting", () => {
  assert.doesNotMatch(css, /\.match-day-schedule-card\s*\{/);
  assert.match(css, /schedule-card:not\(\.match-day-schedule-card\)/);
});

test("keeps the two native-dark experiments readable at launch", () => {
  assert.match(
    page,
    /"midnightindex",\s*"cherrynoir",\s*\]\.includes\(appTheme\)/,
  );
  assert.match(
    css,
    /data-theme="midnightindex"[\s\S]{0,180}--ink:#edf3ff/,
  );
  assert.match(css, /data-theme="cherrynoir"[\s\S]{0,180}--ink:#fff1f3/);
});
