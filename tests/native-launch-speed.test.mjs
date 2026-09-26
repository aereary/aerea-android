import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const nativeEntry = readFileSync("app/native-entry.tsx", "utf8");
const nativeHtml = readFileSync("native.html", "utf8");
const nativeAppearance = readFileSync("app/native-appearance.ts", "utf8");

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

test("Android hands off directly to the cached app without a duplicate web splash", () => {
  assert.doesNotMatch(nativeHtml, /native-launch-cover|native-launch-mark/);
  assert.match(nativeHtml, /html\.startup-pending #root\{visibility:hidden\}/);
  assert.match(
    page,
    /if \(!startupHydrated\) return;\s*document\.documentElement\.classList\.remove\("startup-pending"\)/,
  );
  assert.doesNotMatch(page, /launchCover\.remove\(\)/);
});

test("the profile photo is present in the first native header frame", () => {
  assert.match(nativeAppearance, /NATIVE_PROFILE_PHOTO_KEY/);
  assert.match(nativeAppearance, /export function readNativeProfilePhoto/);
  assert.match(nativeAppearance, /export function hasNativeProfilePhotoCache/);
  assert.match(nativeAppearance, /export function writeNativeProfilePhoto/);
  assert.match(
    page,
    /const \[profilePhoto, setProfilePhoto\] = useState<string \| null>\(\(\) =>[\s\S]{0,100}readNativeProfilePhoto\(\)/,
  );
  assert.match(
    page,
    /setProfilePhoto\(state\.profilePhoto\);[\s\S]{0,100}writeNativeProfilePhoto\(state\.profilePhoto\)/,
  );
  assert.match(page, /writeNativeProfilePhoto\(null\)/);
  assert.match(
    page,
    /cachedNativeState !== null && hasNativeProfilePhotoCache\(\)/,
  );
  assert.match(nativeAppearance, /NATIVE_PROFILE_PHOTO_NONE/);
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

test("AO3 is loaded just after first paint instead of blocking cold start", () => {
  assert.match(page, /const loadAo3LibraryModule = \(\) => import\("\.\/ao3-library"\)/);
  assert.match(page, /const Ao3Library = lazy\([\s\S]{0,180}module\.Ao3Library/);
  assert.match(
    page,
    /requestIdleCallback\(\(\) => \{[\s\S]{0,100}loadAo3LibraryModule\(\)/,
  );
  assert.doesNotMatch(page, /import \{[\s\S]{0,120}Ao3Library[\s\S]{0,120}\} from "\.\/ao3-library"/);
});

test("the normal Library is warmed after first paint without bundling its readers", () => {
  assert.match(
    page,
    /const loadStudyLibraryModule = \(\) => import\("\.\/study-library"\)/,
  );
  assert.match(
    page,
    /const StudyLibrary = lazy\([\s\S]{0,180}loadStudyLibraryModule\(\)/,
  );
  assert.match(
    page,
    /requestAnimationFrame\(\(\) => \{[\s\S]{0,100}loadStudyLibraryModule\(\)/,
  );
  assert.match(
    page,
    /space === "library"[\s\S]{0,220}<Suspense[\s\S]{0,500}className="study-library-screen"[\s\S]{0,120}aria-busy="true"/,
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
