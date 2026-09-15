import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("app/globals.css", "utf8");

const start = css.indexOf("/* AEREA_TARGETED_HEALTH_TIMETABLE_FIXES */");
const end = css.indexOf("/* END AEREA_TARGETED_HEALTH_TIMETABLE_FIXES */");

assert.ok(start >= 0 && end > start);

const fix = css.slice(start, end);

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = fix.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Missing rule: ${selector}`);
  return match[1];
}

test("calendar completion check changes stacking only, never its position", () => {
  const status = ruleBody(".month-grid > button .calendar-day-status");
  const dots = ruleBody(".month-grid > button .calendar-event-dots");

  assert.match(status, /z-index:\s*5\s*!important/);
  assert.match(dots, /z-index:\s*1\s*!important/);

  assert.doesNotMatch(status, /\b(?:top|right|bottom|left)\s*:/);
  assert.doesNotMatch(dots, /\b(?:top|right|bottom|left)\s*:/);
});

test("mobile timetable is centered without flex-compressing its contents", () => {
  const backdrop = ruleBody(".phone-canvas .timetable-backdrop");
  const card = ruleBody(".phone-canvas .timetable-card");
  const board = ruleBody(".phone-canvas .timetable-board");

  assert.match(backdrop, /align-items:\s*center\s*!important/);
  assert.match(backdrop, /justify-content:\s*center\s*!important/);

  assert.match(card, /display:\s*block\s*!important/);
  assert.match(card, /max-height:\s*min\(62dvh,\s*760px\)\s*!important/);
  assert.match(card, /overflow:\s*auto\s*!important/);

  assert.match(board, /flex:\s*none\s*!important/);
  assert.doesNotMatch(board, /flex:\s*1/);
});
