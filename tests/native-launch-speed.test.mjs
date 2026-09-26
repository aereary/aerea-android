import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const nativeEntry = readFileSync("app/native-entry.tsx", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const nativeHtml = readFileSync("native.html", "utf8");
const nativeAppearance = readFileSync("app/native-appearance.ts", "utf8");
const supabaseSync = readFileSync("app/supabase-sync.ts", "utf8");
const supabaseClient = readFileSync("app/supabase-client.ts", "utf8");
const mainActivity = readFileSync(
  "android/app/src/main/java/com/aereaary/aerea/MainActivity.java",
  "utf8",
);
const nativeStorage = readFileSync(
  "android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java",
  "utf8",
);
const androidManifest = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
const androidStyles = readFileSync("android/app/src/main/res/values/styles.xml", "utf8");
const androidColors = readFileSync("android/app/src/main/res/values/colors.xml", "utf8");
const androidNightColors = readFileSync("android/app/src/main/res/values-night/colors.xml", "utf8");

test("a warm native launch has the last complete day ready for its first React frame", () => {
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
  assert.doesNotMatch(nativeHtml, /classList\.remove\("startup-pending"\)/);
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

test("Android hands off its compact neutral splash after the first React frame", () => {
  assert.doesNotMatch(nativeHtml, /native-launch-cover|native-launch-mark/);
  assert.match(
    nativeHtml,
    /--native-launch-background:#f5f6f8/,
  );
  assert.match(nativeHtml, /prefers-color-scheme:dark[\s\S]{0,100}#0e1418/);
  assert.match(nativeHtml, /html\.startup-pending #root\{visibility:hidden\}/);
  assert.match(
    page,
    /useLayoutEffect\(\(\) => \{[\s\S]{0,260}classList\.remove\("startup-pending"\);\s*\}, \[\]\)/,
  );
  assert.doesNotMatch(page, /startupHydrated|setStartupHydrated/);
  assert.doesNotMatch(page, /launchCover\.remove\(\)/);
  assert.match(mainActivity, /SplashScreen\.installSplashScreen\(this\)/);
  assert.match(
    mainActivity,
    /setKeepOnScreenCondition\(\(\) -> !launchReady\)/,
  );
  assert.match(mainActivity, /MAX_SPLASH_HOLD_MS = 5000L/);
  assert.match(mainActivity, /postVisualStateCallback\(/);
  assert.match(
    mainActivity,
    /new WebView\.VisualStateCallback\(\)[\s\S]{0,240}postOnAnimation\(MainActivity\.this::forceFinishLaunch\)/,
  );
  assert.match(nativeStorage, /public void finishLaunch\(PluginCall call\)/);
  assert.match(
    page,
    /document\.fonts\.ready[\s\S]{0,500}requestAnimationFrame[\s\S]{0,300}AereaStorage\.finishLaunch\(\)/,
  );
  assert.match(androidManifest, /android:theme="@style\/AppTheme\.Starting"/);
  assert.match(
    androidStyles,
    /style name="AppTheme\.Starting" parent="Theme\.SplashScreen"[\s\S]{0,400}windowSplashScreenBackground">@color\/aerea_launch_background[\s\S]{0,400}postSplashScreenTheme">@style\/AppTheme\.NoActionBar/,
  );
  assert.match(androidStyles, /windowSplashScreenAnimatedIcon">@mipmap\/aerea_splash_icon/);
  assert.match(androidColors, /aerea_launch_background">#F5F6F8/);
  assert.match(androidNightColors, /aerea_launch_background">#0E1418/);
  for (const density of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
    assert.ok(
      existsSync(`android/app/src/main/res/mipmap-${density}/aerea_splash_icon.png`),
      `compact splash icon should exist for ${density}`,
    );
  }
});

test("Supabase waits for browser idle instead of blocking the native first frame", () => {
  assert.doesNotMatch(supabaseSync, /import\s*\{\s*createClient/);
  assert.match(supabaseSync, /requestIdleCallback\(resolve, \{ timeout: 800 \}\)/);
  assert.match(supabaseSync, /import\("\.\/supabase-client"\)/);
  assert.match(supabaseClient, /createClient\(/);
  assert.match(page, /getSupabase\(\)\.then\(\(supabase\) =>/);
});

test("native startup ships only the Latin Gaegu face used by the interface", () => {
  assert.match(nativeEntry, /@fontsource\/gaegu\/latin-700\.css/);
  assert.match(layout, /@fontsource\/gaegu\/latin-700\.css/);
  assert.doesNotMatch(nativeEntry, /@fontsource\/gaegu\/700\.css/);
  assert.doesNotMatch(layout, /@fontsource\/gaegu\/700\.css/);
});

test("the profile photo is present in the first native header frame", () => {
  assert.match(nativeAppearance, /NATIVE_PROFILE_PHOTO_KEY/);
  assert.match(nativeAppearance, /export function readNativeProfilePhoto/);
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
  assert.doesNotMatch(page, /hasNativeProfilePhotoCache\(\)/);
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

test("the normal Library renders directly like the other Spaces while readers stay lazy", () => {
  assert.match(
    page,
    /import \{[\s\S]{0,100}StudyLibrary,[\s\S]{0,240}\} from "\.\/study-library"/,
  );
  assert.doesNotMatch(page, /loadStudyLibraryModule|const StudyLibrary = lazy/);
  assert.doesNotMatch(
    page,
    /space === "library"[\s\S]{0,220}<Suspense/,
  );
  assert.match(page, /space === "library"[\s\S]{0,180}<StudyLibrary/);
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
