import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const logicSource = await readFile(
  new URL("../app/planner-logic.ts", import.meta.url),
  "utf8",
);
const logicJavaScript = ts.transpileModule(logicSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const logic = await import(
  `data:text/javascript;base64,${Buffer.from(logicJavaScript).toString("base64")}`
);
const pageSource = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);
const cssSource = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("formats time blocks in 12h without changing stored HH:mm", () => {
  const morningEvent = { time: "09:00" };
  const eveningEvent = { time: "19:30" };
  assert.deepEqual(logic.formatTimeBlock(morningEvent.time), {
    primary: "9:00",
    secondary: "AM",
  });
  assert.deepEqual(logic.formatTimeBlock(eveningEvent.time), {
    primary: "7:30",
    secondary: "PM",
  });
  assert.equal(morningEvent.time, "09:00");
  assert.equal(eveningEvent.time, "19:30");
});

test("detects Health case-insensitively and completes recurring events by date", () => {
  const recurring = {
    id: "health-weekly",
    calendar: " hEaLtH ",
    color: "cyan",
    repeat: "Weekly",
  };
  assert.equal(logic.isHealthCompletionEvent(recurring), true);
  const completed = logic.toggleHealthCompletedOn(recurring, "2026-08-28");
  assert.equal(logic.isHealthCompletedOn(completed, "2026-08-28"), true);
  assert.equal(logic.isHealthCompletedOn(completed, "2026-09-04"), false);
  assert.equal(completed.repeat, "Weekly");
  assert.equal(recurring.healthCompletedDates, undefined);
});

test("completed Health is emerald without mutating its base color", () => {
  const event = {
    calendar: "Health",
    color: "cyan",
    healthCompletedDates: ["2026-08-28"],
  };
  assert.equal(logic.eventDisplayColor(event, "2026-08-28"), "emerald");
  assert.equal(logic.eventDisplayColor(event, "2026-08-29"), "cyan");
  assert.equal(event.color, "cyan");
  assert.match(
    pageSource,
    /color\.value ===\s*eventDisplayColor\(event, date\)/,
  );
});

test("cycles habits empty to done to missed to empty", () => {
  const empty = { days: [false, false] };
  const done = logic.cycleHabitDay(empty, 0);
  assert.deepEqual(done.days, [true, false]);
  assert.deepEqual(done.missedDays, [false, false]);
  const missed = logic.cycleHabitDay(done, 0);
  assert.deepEqual(missed.days, [false, false]);
  assert.deepEqual(missed.missedDays, [true, false]);
  const reset = logic.cycleHabitDay(missed, 0);
  assert.deepEqual(reset.days, [false, false]);
  assert.deepEqual(reset.missedDays, [false, false]);
  assert.equal(empty.missedDays, undefined);
});

test("Day Pocket Health toggle stops propagation and exposes derived state", () => {
  assert.match(pageSource, /className=\{`health-completion-toggle/);
  assert.match(pageSource, /clickEvent\.stopPropagation\(\)/);
  assert.match(pageSource, /toggleHealthCompletedOn\(candidate, dateKey\)/);
  assert.match(cssSource, /\.health-completion-toggle\.active[\s\S]*background:#67ad8d/);
});

test("Library images use img with a decode fallback while PDF and EPUB keep readers", () => {
  const viewer = pageSource.slice(
    pageSource.indexOf('{selectedLibraryItem && ('),
    pageSource.indexOf('{selectedPostItIds.length > 0'),
  );
  assert.match(viewer, /selectedLibraryItem\.kind === "image"/);
  assert.match(viewer, /mimeType\?\.startsWith\("image\/"\)/);
  assert.match(viewer, /<img[\s\S]*onError=\{\(\) => setLibraryImageFailed\(true\)\}/);
  assert.match(viewer, /This image could not be displayed/);
  assert.match(viewer, /selectedLibraryItem\.dataUrl \? \([\s\S]*<iframe/);
  assert.match(pageSource, /opened\.kind === "pdf"[\s\S]*setActiveStudyFile/);
  assert.match(pageSource, /opened\.kind === "epub"[\s\S]*readEpub/);
});

test("timetable keeps MON through SAT and positions classes in a temporal grid", () => {
  for (const day of ["MON", "TUE", "WED", "THU", "FRI", "SAT"]) {
    assert.match(pageSource, new RegExp(`label: "${day}"`));
  }
  assert.match(pageSource, /className="timetable-time-axis"/);
  assert.match(pageSource, /timetableClassPosition\(/);
  assert.match(pageSource, /data-grid-start=\{timetableWindow\.start\}/);
  assert.match(pageSource, /Tap a class to edit or remove/);
  assert.match(cssSource, /\.timetable-board[\s\S]*grid-template-columns:42px repeat\(6/);
  const finalTimetableCss = cssSource.slice(
    cssSource.lastIndexOf("Timetable final cascade guard"),
  );
  assert.doesNotMatch(finalTimetableCss, /align-items:flex-end/);
});
