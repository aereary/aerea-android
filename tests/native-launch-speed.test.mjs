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

test("native geometry and the correct greeting exist before the first paint", () => {
  assert.match(nativeHtml, /<html[^>]+data-native="true"/);
  assert.match(
    nativeEntry,
    /document\.documentElement\.dataset\.native = "true";[\s\S]{0,180}createRoot/,
  );
  assert.match(
    page,
    /const \[isNight, setIsNight\] = useState\(\(\) => \{[\s\S]{0,160}new Date\(\)\.getHours\(\)/,
  );
  assert.doesNotMatch(page, /const \[isNight, setIsNight\] = useState\(false\)/);
});

test("every offered theme can reuse its cached native background", () => {
  for (const theme of [
    "dreambear",
    "lovelyevening",
    "littlesheets",
    "noirrest",
    "ao3night",
  ]) {
    assert.match(nativeHtml, new RegExp(`"${theme}"`));
  }
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
  assert.match(
    page,
    /if \(isNative\(\) && localState\) \{[\s\S]{0,220}writeNativeLaunchState\(localState\);[\s\S]{0,120}\}\s*applyPersistedState\(localState\)/,
  );
});

test("secondary native bridges no longer block the first app frame", () => {
  assert.match(nativeEntry, /lazy\(\(\) => import\("\.\/career-plan-bridge"\)\)/);
  assert.match(nativeEntry, /lazy\(\(\) => import\("\.\/timetable-agenda-bridge"\)\)/);
  assert.match(nativeEntry, /<Suspense fallback=\{null\}>/);
  assert.doesNotMatch(nativeEntry, /import CareerPlanBridge from/);
  assert.doesNotMatch(nativeEntry, /import TimetableAgendaBridge from/);
});

test("document readers stay out of the native startup bundle", () => {
  assert.match(
    page,
    /const StudyLibrary = lazy\([\s\S]{0,180}import\("\.\/study-library"\)/,
  );
  assert.match(
    page,
    /const GenericLibraryBridge = lazy\(\(\) => import\("\.\/generic-library-bridge"\)\)/,
  );
  assert.match(page, /const loadStudyReaderModule = \(\) => import\("\.\/study-reader"\)/);
  assert.match(
    page,
    /const PdfStudyReader = lazy\([\s\S]{0,180}module\.PdfStudyReader/,
  );
  assert.match(
    page,
    /const EpubStudyReader = lazy\([\s\S]{0,180}module\.EpubStudyReader/,
  );
  assert.match(
    page,
    /const \{ readEpub \} = await import\("\.\/epub-reader"\)/,
  );
  assert.doesNotMatch(page, /import \{ EpubBook, readEpub \} from "\.\/epub-reader"/);
  assert.match(page, /<Suspense fallback=\{null\}>\s*<PdfStudyReader/);
  assert.match(page, /<Suspense fallback=\{null\}>\s*<EpubStudyReader/);
});
