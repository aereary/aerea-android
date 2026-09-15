import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("app/globals.css", "utf8");

test("compact calendar completion check sits physically above event dots", () => {
  assert.match(
    css,
    /\.month-grid > button \.calendar-day-status\s*\{[\s\S]{0,180}bottom:\s*27px\s*!important/,
  );

  assert.match(
    css,
    /\.month-grid > button \.calendar-event-dots\s*\{[\s\S]{0,180}bottom:\s*6px\s*!important/,
  );
});

test("phone timetable is deliberately compact instead of nearly full-height", () => {
  assert.match(
    css,
    /AEREA_MOBILE_TIMETABLE_CHECK_POSITION_FIX_20260915[\s\S]*max-height:\s*min\([\s\S]*68dvh/,
  );

  assert.match(
    css,
    /width:\s*min\(84vw,\s*540px\)\s*!important/,
  );

  assert.match(
    css,
    /max\(118px,\s*calc\(env\(safe-area-inset-top\) \+ 92px\)\)/,
  );
});
