import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

test("Class Library derives automatic shelves from the semester timetable", () => {
  assert.match(page, /AEREA_FIX_015A/);
  assert.match(page, /sourceType\?: "manual" \| "timetable"/);
  assert.match(page, /timetableClassIds\?: string\[\]/);
  assert.match(page, /const grouped = new Map<string, TimetableClass\[\]>/);
  assert.match(page, /sourceType: "timetable" as const/);
});

test("same subject on multiple weekdays becomes one recordings shelf", () => {
  assert.match(page, /Array\.from\(grouped\.entries\(\)\)\.map/);
  assert.match(page, /timetableEntries\.map\(\(entry\) => entry\.id\)/);
});

test("manual shelves survive while timetable shelves follow the timetable", () => {
  assert.match(page, /item\.sourceType !== "timetable"/);
  assert.match(page, /const next = \[\.\.\.manualShelves, \.\.\.timetableShelves\]/);
});

test("recordings get a stable class identity", () => {
  assert.match(page, /classItemId\?: string/);
  assert.match(page, /function recordingBelongsToClass/);
  assert.match(page, /classItemId: selectedClassItem\?\.id/);
  assert.match(page, /classItemId: linkedClass\.id/);
});

test("timetable-owned class shelf routes editing back to the timetable", () => {
  assert.match(page, /item\.sourceType === "timetable"/);
  assert.match(page, /item\.timetableClassIds\?\.\[0\]/);
  assert.match(page, /setRequestedTimetableClassId\(timetableClassId\)/);
});


test("New Class Audio keeps its card styling without the decorative splash", () => {
  assert.match(
    css,
    /\.record-card \{\s*\/\* AEREA_FIX_015B:[\s\S]{0,320}background:\s*linear-gradient\(145deg/,
  );
  assert.doesNotMatch(
    css,
    /\.record-card \{\s*\/\* AEREA_FIX_015B:[\s\S]{0,360}radial-gradient/,
  );
});
