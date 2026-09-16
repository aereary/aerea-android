import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appConfig = await readFile(
  new URL("../app/config/app-config.ts", import.meta.url),
  "utf8",
);
const manualStyles = await readFile(
  new URL("../app/styles/manual-customization.css", import.meta.url),
  "utf8",
);
const globalStyles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const manifest = await readFile(
  new URL("../app/manifest.ts", import.meta.url),
  "utf8",
);

test("keeps safe manual configuration isolated from sensitive behavior", () => {
  const safeSource = `${appConfig}\n${manualStyles}`;
  assert.doesNotMatch(safeSource, /from\s+["'][^"']*supabase-sync["']/);
  assert.doesNotMatch(safeSource, /from\s+["'][^"']*ao3-library["']/);
  assert.doesNotMatch(safeSource, /\b(?:localStorage|sessionStorage)\b/);
  assert.doesNotMatch(safeSource, /\bfetch\s*\(/);
  assert.doesNotMatch(safeSource, /registerPlugin\s*</);
});

test("centralizes shared app identity and PWA colors", () => {
  assert.match(layout, /APP_APPEARANCE, APP_IDENTITY, UI_DEFAULTS/);
  assert.match(manifest, /APP_APPEARANCE, APP_IDENTITY/);
  assert.match(layout, /themeColor: APP_APPEARANCE\.browserThemeColor/);
  assert.match(manifest, /theme_color: APP_APPEARANCE\.browserThemeColor/);
  assert.match(manifest, /background_color: APP_APPEARANCE\.manifestBackgroundColor/);
});

test("loads editable design tokens before the established global styles", () => {
  assert.match(
    globalStyles,
    /^@import "tailwindcss";\n@import "\.\/styles\/manual-customization\.css";/,
  );
  assert.match(manualStyles, /--app-min-width: 320px/);
  assert.match(manualStyles, /--app-shell-padding: 24px/);
  assert.match(globalStyles, /min-width: var\(--app-min-width\)/);
  assert.match(globalStyles, /padding: var\(--app-shell-padding\)/);
});
