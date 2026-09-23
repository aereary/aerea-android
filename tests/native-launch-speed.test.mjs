import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const nativeEntry = readFileSync("app/native-entry.tsx", "utf8");
const nativeHtml = readFileSync("native.html", "utf8");

test("a warm native launch paints the last complete day on its first React frame", () => {
  assert.match(page, /NATIVE_LAUNCH_STATE_KEY = "aerea-native-launch-state-v1"/);
  assert.match(page, /function readNativeLaunchState/);
  assert.match(page, /isNative\(\) \? readNativeLaunchState\(\) : null/);
  assert.match(page, /cachedNativeState\?\.reminders \?\? starterReminders/);
  assert.match(page, /cachedNativeState\?\.calendarEvents \?\? \[\]/);
  assert.match(page, /cachedNativeState\?\.postIts \?\? \[\]/);
  assert.match(
    page,
    /simplifiedCalendarMode && \(stateReady \|\| cachedNativeState !== null\)/,
  );
  assert.match(
    nativeHtml,
    /aerea-native-launch-state-v1[\s\S]{0,420}classList\.remove\("startup-pending"\)/,
  );
});

test("the native launch cache is refreshed before the authoritative SQLite save", () => {
  assert.match(page, /function writeNativeLaunchState/);
  assert.match(
    page,
    /if \(isNative\(\)\) \{\s*writeNativeLaunchState\(state\);\s*await AereaStorage\.putState/,
  );
  assert.doesNotMatch(
    page.slice(
      page.indexOf("function writeNativeLaunchState"),
      page.indexOf("function writeNativeLaunchState") + 1600,
    ),
    /libraryItems|studyFiles|pdfAnnotations|profilePhoto/,
  );
});

test("secondary native bridges no longer block the first app frame", () => {
  assert.match(nativeEntry, /lazy\(\(\) => import\("\.\/career-plan-bridge"\)\)/);
  assert.match(nativeEntry, /lazy\(\(\) => import\("\.\/timetable-agenda-bridge"\)\)/);
  assert.match(nativeEntry, /<Suspense fallback=\{null\}>/);
  assert.doesNotMatch(nativeEntry, /import CareerPlanBridge from/);
  assert.doesNotMatch(nativeEntry, /import TimetableAgendaBridge from/);
});
