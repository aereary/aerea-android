import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");
const blockStart = css.indexOf("/* Little Sheets Lab");
const blockEnd = css.indexOf("/* Refined extended calendar", blockStart);
const littleSheetsCss = css.slice(blockStart, blockEnd);
const enhancementStart = css.indexOf(
  "AEREA_INTERACTIVE_WEEK_MAP_AND_SHEET_CARDS_20260927",
);
const littleSheetsEnhancementCss = css.slice(enhancementStart);

test("offers Little Sheets Lab as a separate opt-in theme", () => {
  assert.match(page, /type AppTheme =[\s\S]*\| "littlesheets"/);
  assert.match(
    page,
    /id: "littlesheets",[\s\S]{0,160}name: "Little Sheets Lab"/,
  );
  assert.match(
    page,
    /id: "littlesheets",[\s\S]{0,500}showCharm: false,[\s\S]{0,120}interfaceIdea: "animated sheets"/,
  );
});

test("keeps the experimental card system isolated from every other theme", () => {
  assert.ok(blockStart >= 0, "Little Sheets CSS block is present");
  assert.ok(blockEnd > blockStart, "Little Sheets CSS block has a clear boundary");
  assert.match(littleSheetsCss, /\.app-shell\[data-theme="littlesheets"\]/);
  assert.doesNotMatch(littleSheetsCss, /\.app-shell\[data-theme\](?!\=)/);
  assert.doesNotMatch(littleSheetsCss, /\.app-shell:not\(/);
  assert.doesNotMatch(littleSheetsCss, /data-theme="(?!littlesheets)[^"]+"/);
});

test("recreates the approved card hierarchy without moving app behavior", () => {
  assert.match(littleSheetsCss, /\.schedule-card[\s\S]*border-radius:27px/);
  assert.match(littleSheetsCss, /\.schedule-card \.time-block[\s\S]*height:76px/);
  assert.match(littleSheetsCss, /\.reminder-card[\s\S]*overflow:hidden/);
  assert.match(littleSheetsCss, /\.bottom-nav[\s\S]*border-radius:30px/);
  assert.match(littleSheetsCss, /\.quick-capture-nav[\s\S]*border-radius:50%/);
});

test("turns existing editors into animated Little Sheets only in this theme", () => {
  assert.match(littleSheetsCss, /animation:little-sheets-scrim-in \.23s ease both/);
  assert.match(
    littleSheetsCss,
    /animation:little-sheets-rise \.34s cubic-bezier\(\.22,\.9,\.24,1\) both/,
  );
  assert.match(littleSheetsCss, /border-radius:36px 36px 0 0/);
  assert.match(littleSheetsCss, /--little-sheet-shadow:0 -20px 60px/);
  assert.match(littleSheetsCss, /from \{ opacity:\.35; transform:translateY\(105%\); \}/);
  assert.match(littleSheetsCss, /\.note-detail-card/);
  assert.match(littleSheetsCss, /\.day-summary-card/);
  assert.match(littleSheetsCss, /@media \(prefers-reduced-motion:reduce\)/);
});

test("adds rising pastel cards and bottom sheets only to Little Sheets Lab", () => {
  assert.ok(enhancementStart >= 0, "Little Sheets enhancement block is present");
  assert.match(
    littleSheetsEnhancementCss,
    /data-theme="littlesheets"[\s\S]*animation:little-sheets-card-rise/,
  );
  assert.match(littleSheetsEnhancementCss, /@keyframes little-sheets-card-rise/);
  assert.match(
    littleSheetsEnhancementCss,
    /data-theme="littlesheets"[^\n]*phone-canvas :is\([\s\S]*timetable-backdrop,[\s\S]*health-routine-backdrop[\s\S]*align-items:flex-end!important;/,
  );
  assert.match(
    littleSheetsEnhancementCss,
    /data-theme="littlesheets"[^\n]*phone-canvas :is\([\s\S]*timetable-card,[\s\S]*health-routine-note[\s\S]*border-radius:38px 38px 0 0!important;/,
  );
  assert.match(littleSheetsEnhancementCss, /--pink:#f7ddea/);
  assert.match(littleSheetsEnhancementCss, /--blue:#d9f0f7/);
  assert.doesNotMatch(
    littleSheetsEnhancementCss,
    /data-theme="(?!littlesheets)[^"]+"[^\n]*little-sheets-card-rise/,
  );
});
