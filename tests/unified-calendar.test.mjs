import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

const rendererStart = page.indexOf("const renderUnifiedCalendarGrid =");
const rendererEnd = page.indexOf("\n\n  return (", rendererStart);
const renderer = page.slice(rendererStart, rendererEnd);
const fullRendererStart = page.indexOf("const renderUnifiedCalendarView =");
const fullRendererEnd = page.indexOf("\n\n  return (", fullRendererStart);
const fullRenderer = page.slice(fullRendererStart, fullRendererEnd);

function sectionBetween(startText, endText) {
  const start = page.indexOf(startText);
  const end = page.indexOf(endText, start);
  assert.notEqual(start, -1, `Missing section: ${startText}`);
  assert.notEqual(end, -1, `Missing section end: ${endText}`);
  return page.slice(start, end);
}

test("both monthly entry points use the canonical full calendar renderer", () => {
  assert.equal((page.match(/renderUnifiedCalendarView\("(?:simplified|extended)"\)/g) ?? []).length, 2);
  assert.match(fullRenderer, /className="unified-calendar-header"/);
  assert.match(fullRenderer, /className="unified-month-picker"/);
  assert.match(fullRenderer, /className="unified-calendar-filters"/);
  assert.match(fullRenderer, /renderUnifiedCalendarGrid\(\)/);
  assert.doesNotMatch(page, /className="simplified-calendar-header"/);
  assert.doesNotMatch(page, /className="simplified-calendar-filters"/);
  assert.doesNotMatch(page, /className="extended-calendar-header"/);
  assert.doesNotMatch(page, /className="extended-calendar-filters"/);
  assert.match(
    sectionBetween("className=\"simplified-calendar-screen\"", "<div className=\"paper-grain\""),
    /renderUnifiedCalendarView\("simplified"\)/,
  );
  assert.match(
    sectionBetween("className=\"extended-calendar-view\"", "!calendarExpanded && !calendarScheduleOpen"),
    /renderUnifiedCalendarView\("extended"\)/,
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
  assert.match(unifiedCss, /\.unified-calendar-cell\.weekend \{ background: #fff; \}/);
  assert.match(unifiedCss, /\.unified-calendar-cell\.outside-month \{ background: #fff;/);
});

test("unified renderer keeps the Health marker layer and does not move it", () => {
  assert.match(renderer, /className=\"calendar-day-status complete\"/);
  const selectorStart = css.indexOf(".unified-month-grid .unified-calendar-cell .calendar-day-status");
  const selectorEnd = css.indexOf("}", selectorStart);
  const healthFix = css.slice(selectorStart, selectorEnd);
  assert.match(healthFix, /\.unified-month-grid \.unified-calendar-cell \.calendar-day-status/);
  assert.match(healthFix, /z-index:\s*5\s*!important/);
  assert.doesNotMatch(healthFix, /\b(?:top|right|bottom|left)\s*:/);
  assert.match(css, /\.unified-month-grid \.unified-calendar-cell \.calendar-cell-events\s*\{[\s\S]*z-index:\s*1/);
});

test("unified cells suppress the click that follows a long press", () => {
  assert.match(
    renderer,
    /onClick=\{\(\) => \{[\s\S]*calendarLongPressedRef\.current[\s\S]*calendarLongPressedRef\.current = false[\s\S]*return;/,
  );
});
