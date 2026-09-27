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
const timetableBridgeSource = await readFile(
  new URL("../app/timetable-agenda-bridge.tsx", import.meta.url),
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
  assert.match(pageSource, /opened\.kind === "epub"[\s\S]*loadEpub/);
});

test("timetable filters the interactive weekly map by the selected day", () => {
  for (const day of ["MON", "TUE", "WED", "THU", "FRI", "SAT"]) {
    assert.match(pageSource, new RegExp(`label: "${day}"`));
  }
  assert.match(pageSource, /STUDY · WEEK MAP/);
  assert.match(pageSource, /This week’s map/);
  assert.match(pageSource, /className="timetable-week-map"/);
  assert.match(pageSource, /className="timetable-week-map-days"/);
  assert.match(pageSource, /const \[timetableSelectedDate, setTimetableSelectedDate\]/);
  assert.match(pageSource, /filter\(\(meeting\) => meeting\.day === timetableSelectedDay\)/);
  assert.match(pageSource, /onClick=\{\(\) => setTimetableSelectedDate\(day\.key\)\}/);
  assert.match(pageSource, /aria-pressed=\{timetableSelectedDate === day\.key\}/);
  assert.match(pageSource, /aria-live="polite"/);
  assert.match(pageSource, /timetableAgenda\.map/);
  assert.match(pageSource, /Tap a class to edit or remove/);
  assert.match(cssSource, /\.timetable-week-map-days[\s\S]*grid-template-columns:repeat\(7/);
  assert.match(cssSource, /\.timetable-week-map-days > button\.active/);
  assert.match(cssSource, /\.timetable-week-map-class[\s\S]*grid-template-columns:112px/);
});

test("Lovely Evening removes the old greeting card and keeps Week Map on hold", () => {
  assert.match(pageSource, /const welcomeOpensTimetable = themeId === "lovelyevening"/);
  assert.match(pageSource, /showDayCharm && !welcomeOpensTimetable/);
  assert.match(pageSource, /welcomeOpensTimetable \? beginTimetableLongPress : undefined/);
  assert.match(
    cssSource,
    /data-theme="lovelyevening"[^\n]*welcome-row\.welcome-row-timetable-trigger[\s\S]*background:transparent!important;[\s\S]*box-shadow:none!important;/,
  );
  assert.match(
    cssSource,
    /welcome-row\.welcome-row-timetable-trigger::before,[\s\S]*::after \{\s*display:none!important;/,
  );
});

test("semester editing avoids the old document-wide timetable observer", () => {
  assert.doesNotMatch(timetableBridgeSource, /new MutationObserver/);
  assert.match(pageSource, /timetableClassDraft \? "editing-class"/);
  assert.match(pageSource, /Your subjects/);
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

test("timetable mobile overlay keeps the roomy approved proportions", () => {
  const finalFix = cssSource.slice(
    cssSource.indexOf("AEREA_INTERACTIVE_WEEK_MAP_AND_SHEET_CARDS_20260927"),
  );

  assert.match(
    finalFix,
    /\.phone-canvas \.timetable-backdrop \{[\s\S]*align-items:center!important;[\s\S]*justify-content:center!important;/,
  );
  assert.match(
    finalFix,
    /\.phone-canvas \.timetable-card \{[\s\S]*display:block!important;[\s\S]*max-height:min\(88dvh,1120px\)!important;[\s\S]*min-height:min\(68dvh,1040px\)!important;/,
  );
  assert.match(
    finalFix,
    /width:min\(calc\(100vw - 44px\),584px\)!important;/,
  );
});

test("compact calendar markers change stacking without changing position", () => {
  const finalFix = cssSource.slice(
    cssSource.indexOf("AEREA_TARGETED_HEALTH_TIMETABLE_FIXES"),
  );

  assert.match(
    finalFix,
    /\.month-grid > button \.calendar-day-status \{\s*z-index: 5 !important;\s*\}/,
  );
  assert.match(
    finalFix,
    /\.month-grid > button \.calendar-event-dots \{\s*z-index: 1 !important;\s*\}/,
  );
});
