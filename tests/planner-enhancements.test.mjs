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

test("Today Health details reuse the existing per-date completion state", () => {
  assert.match(pageSource, /isHealthCompletionEvent\(selectedEventDetail\)/);
  assert.match(pageSource, /isHealthCompletedOn\(\s*selectedEventDetail,\s*selectedEventDetail\.date/);
  assert.match(pageSource, /toggleHealthOccurrence\(\s*clickEvent,\s*selectedEventDetail,\s*selectedEventDetail\.date/);
  assert.match(pageSource, /openEventDetail\(calendarEvent, null, selectedDate\)/);
  assert.match(pageSource, /setSelectedEventDetail\(\(current\) =>/);
  assert.match(pageSource, /event-detail-health-completion/);
  assert.match(cssSource, /\.event-detail-health-completion\.complete/);
});

test("non-Health event details do not render the Health completion control", () => {
  const detail = pageSource.slice(
    pageSource.indexOf('{selectedEventDetail &&'),
    pageSource.indexOf('{selectedEventDetail &&') + 9500,
  );
  assert.match(detail, /isHealthCompletionEvent\(selectedEventDetail\) &&/);
  assert.match(detail, /event-detail-health-completion/);
});

test("timetable classes have stable parent ids with independent meeting rows", () => {
  assert.match(pageSource, /type TimetableMeeting/);
  assert.match(pageSource, /meetings: TimetableMeeting\[\]/);
  assert.match(pageSource, /normalizeTimetableClass/);
  assert.match(pageSource, /classItem\.meetings\s*\.map\(\(meeting\) => timetableClassCalendarEvent/);
  assert.match(pageSource, /id: `timetable-event:\$\{classItem\.id\}:\$\{meeting\.id\}`/);
  assert.match(pageSource, /timetableClassIds: \[classItem\.id\]/);
  assert.match(pageSource, /Add weekly meeting/);
  assert.match(pageSource, /Remove meeting/);
  assert.match(pageSource, /<span>Room<\/span>/);
  assert.match(pageSource, /value=\{meeting\.room \?\? ""\}/);
  assert.match(pageSource, /value=\{timetableClassDraft\.professor \?\? ""\}/);
  assert.match(pageSource, /classItem\.day && classItem\.start && classItem\.end/);
});

test("timetable mobile overlay keeps the header reachable and schedule internally scrollable", () => {
  assert.match(cssSource, /\.phone-canvas \.timetable-backdrop \{[\s\S]*align-items: flex-start !important;[\s\S]*max\(76px/);
  assert.match(cssSource, /\.phone-canvas \.timetable-card \{[\s\S]*max-height:[\s\S]*overflow: hidden;/);
  assert.match(cssSource, /\.phone-canvas \.timetable-board,[\s\S]*\.phone-canvas \.timetable-editor \{[\s\S]*overflow-y: auto;/);
});

test("Health calendar markers stack above event dots", () => {
  const finalFix = cssSource.slice(cssSource.indexOf("AEREA_TARGETED_HEALTH_TIMETABLE_FIXES"));
  assert.match(finalFix, /\.calendar-expanded \.calendar-day-status \{[\s\S]*z-index: 3/);
  assert.match(finalFix, /\.calendar-expanded \.calendar-event-dots \{[\s\S]*z-index: 1/);
});
