import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { timetableMeetingSkipped } from "../app/timetable-day-exceptions.ts";

test("a canceled Thursday class is skipped only for its selected occurrence", () => {
  const exceptions = [{ date: "2026-10-15", kind: "no-classes", meetingIds: ["physics:thu"] }];
  const isSkipped = (date, classId, meetingId) =>
    exceptions.some((exception) => exception.date === date &&
      timetableMeetingSkipped(exception, classId, meetingId));

  assert.equal(isSkipped("2026-10-15", "physics", "thu"), true);
  assert.equal(isSkipped("2026-10-15", "thermo", "thu"), false);
  assert.equal(isSkipped("2026-10-22", "physics", "thu"), false);
});

test("day off and vacation skip all classes, while exam day leaves scheduled classes", () => {
  for (const kind of ["no-classes", "day-off", "vacation"]) {
    assert.equal(timetableMeetingSkipped({ date: "2026-10-15", kind }, "physics", "thu"), true);
  }
  assert.equal(timetableMeetingSkipped({ date: "2026-10-15", kind: "exam-day" }, "physics", "thu"), false);
});

test("day exceptions are persisted and reused in calendar recurrence exclusions", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /dayExceptions\?: TimetableDayException\[\]/);
  assert.match(page, /excludedDates: \(timetable\.dayExceptions \?\? \[\]\)[\s\S]*?timetableMeetingSkipped\(exception, classItem\.id, meeting\.id\)/);
  assert.match(page, /classTimetable,\s*recordings/);
  assert.match(page, /timetableExceptionCalendarEvent/);
});
