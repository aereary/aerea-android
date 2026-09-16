import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);

const screenShell = await readFile(
  new URL("../app/components/screen-shell.tsx", import.meta.url),
  "utf8",
);

const css = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("Habits keeps the same leaf sticker and uses it as the hidden routine trigger", () => {
  assert.match(page, /sticker="🌿"/);
  assert.match(page, /onStickerClick=\{openHealthRoutineNote\}/);
  assert.match(
    screenShell,
    /<span[\s\S]{0,180}className="screen-sticker"/,
  );

  // Do not replace the visible leaf with a new physical button/card.
  assert.doesNotMatch(
    screenShell,
    /<button[^>]*className="screen-sticker"/,
  );
});

test("daily rhythm routines are actual Health calendar events", () => {
  assert.match(
    page,
    /sourceType\?: "timetable" \| "health-routine"/,
  );
  assert.match(page, /calendar: "Health"/);
  assert.match(page, /color: "cyan" as EventColor/);
  assert.match(page, /healthRoutineGroupId/);
  assert.match(page, /healthCompletedDates/);
});

test("routine scheduler supports daily alternate and weekday patterns", () => {
  assert.match(
    page,
    /healthRoutineDraft\.cadence === "alternate"/,
  );
  assert.match(
    page,
    /makeRoutineEvent\([\s\S]*?"alternate"[\s\S]*?"Custom"[\s\S]*?2/,
  );
  assert.match(
    page,
    /customRepeatUnit:\s*repeat === "Custom" \? "days" : undefined/,
  );

  assert.match(
    page,
    /healthRoutineDraft\.cadence === "weekdays"/,
  );
  assert.match(
    page,
    /makeRoutineEvent\([\s\S]*?"Weekly"/,
  );

  assert.match(
    page,
    /makeRoutineEvent\("daily", todayKey, "Daily"\)/,
  );

  assert.match(page, />Every day</);
  assert.match(page, /Every other day/);
  assert.match(page, /Certain days/);
});

test("routine note has per-date Health completion", () => {
  assert.match(page, /isHealthCompletedOn\(/);
  assert.match(page, /toggleHealthOccurrence\(/);
  assert.match(page, /todayOccurrence/);
  assert.match(page, /todayKey/);
  assert.match(page, /healthCompletedDates/);
  assert.match(page, /completedToday/);
  assert.match(page, /health-routine-item/);
});

test("classic bottom nav is no longer hidden by the swipe CSS", () => {
  assert.doesNotMatch(
    css,
    /\.phone-canvas > \.bottom-nav,\s*\n\.agenda-v2-home-nav\s*\{\s*display:\s*none !important/,
  );
});

test("idle swipe surface no longer traps fixed overlays", () => {
  const block =
    css.match(/\.primary-swipe-surface\s*\{([\s\S]*?)\}/)?.[1] ?? "";

  assert.doesNotMatch(
    block,
    /transform:\s*translate3d\(0,0,0\)/,
  );
  assert.doesNotMatch(block, /will-change:\s*transform/);

  const resetStart = page.indexOf(
    "const resetPrimarySwipeSurface =",
  );
  const resetEnd = page.indexOf(
    "const beginPrimarySwipe =",
    resetStart,
  );

  assert.notEqual(resetStart, -1);
  assert.notEqual(resetEnd, -1);

  const resetBlock = page.slice(resetStart, resetEnd);

  assert.match(
    resetBlock,
    /if \(!animate\)[\s\S]*?surface\.style\.transform = ""/,
  );

  assert.match(
    resetBlock,
    /surface\.style\.transform = "translate3d\(0,0,0\)"/,
  );

  assert.match(
    resetBlock,
    /window\.setTimeout\([\s\S]*?surface\.style\.transform = ""/,
  );
});

test("health routine note is an overlay, not a Habits layout change", () => {
  assert.match(
    css,
    /\.health-routine-backdrop\s*\{[\s\S]*?position:\s*fixed\s*;/,
  );
  assert.match(page, /healthRoutineOpen/);
  assert.match(page, /className="health-routine-backdrop"/);
  assert.match(page, /aria-label="My daily rhythm"/);
});

test("weekday Health routines never reuse another weekday event id", () => {
  const start = page.indexOf("const makeRoutineEvent =");
  const end = page.indexOf("let nextEvents", start);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const makeRoutineEvent = page.slice(start, end);

  assert.match(
    makeRoutineEvent,
    /weekday === undefined/,
  );

  assert.match(
    makeRoutineEvent,
    /event\.healthRoutineWeekday === weekday/,
  );

  assert.doesNotMatch(
    makeRoutineEvent,
    /\?\? existingEvents\[0\]/,
  );

  assert.match(
    makeRoutineEvent,
    /`health-routine-event:\$\{groupId\}:\$\{suffix\}`/,
  );
});

test("Certain days cannot save without selecting a weekday", () => {
  assert.match(
    page,
    /healthRoutineDraft\.cadence === "weekdays"[\s\S]{0,100}healthRoutineDraft\.weekdays\.length === 0/,
  );

  assert.doesNotMatch(
    page,
    /healthRoutineDraft\.weekdays\.length[\s\S]{0,100}\[dateFromKey\(todayKey\)\.getDay\(\)\]/,
  );
});

test("Health routine uses one canonical CSS implementation", () => {
  assert.equal(
    (css.match(/\/\* AEREA_HEALTH_ROUTINE_NOTE_V2 \*\//g) ?? []).length,
    1,
  );

  assert.equal(
    (css.match(/\/\* AEREA_HEALTH_ROUTINE_NOTE \*\//g) ?? []).length,
    0,
  );
});
