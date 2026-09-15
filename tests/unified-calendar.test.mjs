import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

const rendererStart = page.indexOf("const renderUnifiedCalendarGrid =");
const rendererEnd = page.indexOf("\n\n  return (", rendererStart);
const renderer = page.slice(rendererStart, rendererEnd);

function sectionBetween(startText, endText) {
  const start = page.indexOf(startText);
  const end = page.indexOf(endText, start);
  assert.notEqual(start, -1, `Missing section: ${startText}`);
  assert.notEqual(end, -1, `Missing section end: ${endText}`);
  return page.slice(start, end);
}

test("both monthly entry points use the canonical calendar grid renderer", () => {
  assert.equal((page.match(/renderUnifiedCalendarGrid\(\)/g) ?? []).length, 2);
  assert.match(
    sectionBetween("className=\"simplified-calendar-screen\"", "<div className=\"paper-grain\""),
    /renderUnifiedCalendarGrid\(\)/,
  );
  assert.match(
    sectionBetween("className=\"extended-calendar-view\"", "!calendarExpanded && !calendarScheduleOpen"),
    /renderUnifiedCalendarGrid\(\)/,
  );
});

test("the unified renderer is Sunday-first and keeps event color data", () => {
  assert.match(renderer, /\[\"SUN\", \"MON\", \"TUE\", \"WED\", \"THU\", \"FRI\", \"SAT\"\]/);
  assert.match(renderer, /eventDisplayColor\(calendarEvent, dayKey\)/);
  assert.match(renderer, /eventColors\.find\(/);
  assert.match(renderer, /\"--event-color\": eventColor/);
  assert.match(renderer, /dayEvents\.slice\(0, 3\)/);
  assert.doesNotMatch(renderer, /event-dot|calendar-event-dots|background:\s*#(?:3b82f6|2563eb)/i);
});

test("unified surfaces are white with centered pastel event chips and no bottom navigation", () => {
  const unifiedCss = css.slice(css.indexOf("/* Unified monthly calendar"));
  assert.match(unifiedCss, /\.unified-month-grid[\s\S]*background: #fff !important/);
  assert.match(unifiedCss, /background: color-mix\(in srgb, var\(--event-color\) 16%, #fff\)/);
  assert.match(unifiedCss, /\.calendar-cell-event > strong[\s\S]*text-align: center/);
  assert.match(unifiedCss, /\.app-shell:has\(\.unified-month-grid\)[\s\S]*\.bottom-nav[\s\S]*display: none !important/);
});

test("unified renderer keeps the Health marker layer and does not move it", () => {
  assert.match(renderer, /className=\"calendar-day-status complete\"/);
  const fixStart = css.indexOf("/* AEREA_TARGETED_HEALTH_TIMETABLE_FIXES */");
  const fixEnd = css.indexOf("/* END AEREA_TARGETED_HEALTH_TIMETABLE_FIXES */");
  const healthFix = css.slice(fixStart, fixEnd);
  assert.match(healthFix, /\.month-grid > button \.calendar-day-status[\s\S]*z-index:\s*5\s*!important/);
  assert.doesNotMatch(healthFix, /\.month-grid > button \.calendar-day-status[^{]*\{[^}]*\b(?:top|right|bottom|left)\s*:/);
});
