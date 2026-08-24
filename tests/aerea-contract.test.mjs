import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);
const cssSource = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const workflowSource = await readFile(
  new URL("../.github/workflows/build-apk.yml", import.meta.url),
  "utf8",
);
const capacitorSource = await readFile(
  new URL("../capacitor.config.ts", import.meta.url),
  "utf8",
);
const manifestSource = await readFile(
  new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url),
  "utf8",
);
const syncSource = await readFile(
  new URL("../app/supabase-sync.ts", import.meta.url),
  "utf8",
);
const featureSource = await readFile(
  new URL("../app/aerea-features.ts", import.meta.url),
  "utf8",
);
const mainActivitySource = await readFile(
  new URL("../android/app/src/main/java/com/aereaary/aerea/MainActivity.java", import.meta.url),
  "utf8",
);
const todayWidgetSource = await readFile(
  new URL("../android/app/src/main/java/com/aereaary/aerea/AereaTodayWidget.java", import.meta.url),
  "utf8",
);
const monthWidgetSource = await readFile(
  new URL("../android/app/src/main/java/com/aereaary/aerea/AereaMonthWidget.java", import.meta.url),
  "utf8",
);
const sportsFunctionSource = await readFile(
  new URL("../supabase/functions/sync-sports-events/index.ts", import.meta.url),
  "utf8",
);
const sportsMigrationSource = await readFile(
  new URL("../supabase/migrations/20260823090000_sports_events.sql", import.meta.url),
  "utf8",
);

test("keeps only the approved theme collection", () => {
  for (const theme of [
    "peachparlor",
    "mintletter",
    "blueberrynight",
    "sunsetsea",
    "duckmail",
    "calicotea",
    "moonquilt",
  ]) {
    assert.match(pageSource, new RegExp(`id: "${theme}"`));
  }
  assert.equal(
    [...pageSource.matchAll(/showCharm: false/g)].length,
    3,
    "only the three new decorated themes should hide the welcome charm",
  );
  assert.equal(
    [...pageSource.matchAll(/decoratedScene: true/g)].length,
    3,
    "only the three approved decorated themes should decorate the sky",
  );
  for (const removedTheme of [
    "moonpond",
    "forestfriends",
    "cloudroad",
    "ducktram",
    "startide",
    "catcoast",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`id: "${removedTheme}"`));
  }
  assert.match(pageSource, /activeTheme\.decoratedScene &&/);
  assert.doesNotMatch(
    pageSource,
    /className="theme-scene-character"/,
    "the extra animal badge should never float above the welcome card",
  );
});

test("curves the Lavender rest message", () => {
  assert.match(pageSource, /<textPath/);
  assert.match(pageSource, /YOU MAY REST/);
  assert.match(pageSource, /Q 50 94 85 70/);
});

test("ships Safe Place as authored offline copy", () => {
  for (const phrase of [
    "Welcome back, sweetheart.",
    "SECRET DIARY",
    "What can stay between these pages?",
    "My hidden pages",
    "Hold me",
    "Need praise",
    "Can I cry?",
    "Little things",
    "Nothing is generated",
  ]) {
    assert.match(pageSource, new RegExp(phrase.replace(/[?]/g, "\\?")));
  }
});

test("ships a clean draining focus clock and varied journal faces", () => {
  assert.doesNotMatch(pageSource, /timer-status-dot/);
  assert.doesNotMatch(pageSource, /timer-leaf/);
  assert.match(pageSource, /color fades gently with the time/);
  assert.ok(
    [...pageSource.matchAll(/timer-keepsake/g)].length >= 4,
    "the circular focus clock should use keepsake decorations instead of dots",
  );
  assert.match(pageSource, /journalFaceFor\(index\)/);
  assert.ok(
    [...pageSource.matchAll(/const journalFaces = \[([\s\S]*?)\];/g)][0][1]
      .split("\n")
      .filter((line) => line.trim().startsWith('"')).length >= 20,
    "journal moments should cycle through at least twenty cute faces",
  );
});

test("opens saved notes fully and edits calendar rows directly", () => {
  assert.match(pageSource, /function notePreview\(text: string/);
  assert.match(pageSource, /setSelectedJournalEntry\(entry\)/);
  assert.match(pageSource, /<NoteDetailDialog/);
  assert.match(pageSource, /openEventEditor\(calendarEvent\)/);
  assert.match(pageSource, /calendarEvent\.eventType === "sports_event"/);
  assert.match(cssSource, /\.note-detail-text/);
});

test("starts without demo content and never resets an older install", () => {
  assert.match(pageSource, /const starterReminders: Reminder\[\] = \[\];/);
  assert.match(pageSource, /const starterHabits: Habit\[\] = \[\];/);
  assert.match(pageSource, /const starterClasses: ClassItem\[\] = \[\];/);
  assert.match(pageSource, /Older payloads are migrated in place/);
  assert.doesNotMatch(pageSource, /localStorage\.clear\(/);
});

test("ships launcher-safe widgets with a useful empty first render", () => {
  for (const source of [todayWidgetSource, monthWidgetSource]) {
    assert.match(source, /updateWidgetSafely/);
    assert.match(source, /aerea_widget_fallback/);
    assert.match(source, /onAppWidgetOptionsChanged/);
  }
  assert.match(todayWidgetSource, /No events yet ♡/);
  assert.match(manifestSource, /AereaTodayWidget/);
  assert.match(manifestSource, /AereaMonthWidget/);
});

test("uses the central plus for universal Inbox capture", () => {
  assert.match(pageSource, /className="nav-item quick-capture-nav"/);
  assert.match(pageSource, /aria-label="Open Quick Capture"/);
  assert.match(pageSource, /Keep in Inbox/);
  for (const kind of ["photo", "pdf", "file", "link"]) {
    assert.match(featureSource, new RegExp(`\\| "${kind}"`));
  }
  for (const destination of ["event", "task", "post-it", "note", "library"]) {
    assert.match(pageSource, new RegExp(`"${destination}"`));
  }
});

test("keeps reversible history, archive and a 30-day Trash", () => {
  assert.match(pageSource, /undoStackRef/);
  assert.match(pageSource, /redoStackRef/);
  assert.match(pageSource, /const undoGlobal/);
  assert.match(pageSource, /const redoGlobal/);
  assert.match(featureSource, /purgeAt/);
  assert.match(featureSource, /getDate\(\) \+ 30/);
  assert.match(pageSource, /Archive keeps things for later/);
});

test("draws edge-to-edge and handles the Android auth callback in every lifecycle", () => {
  assert.match(mainActivitySource, /setDecorFitsSystemWindows\(getWindow\(\), false\)/);
  assert.match(mainActivitySource, /Color\.TRANSPARENT/);
  assert.match(mainActivitySource, /onNewIntent/);
  assert.match(mainActivitySource, /getDataString/);
  assert.match(manifestSource, /android:scheme="aerea"/);
  assert.match(manifestSource, /android:host="auth"/);
  assert.match(syncSource, /aerea:\/\/auth\/callback/);
  assert.match(syncSource, /exchangeCodeForSession/);
  assert.match(cssSource, /html\[data-native="true"\] \.phone-canvas/);
});

test("keeps sports provider secrets behind a normalized Supabase model", () => {
  for (const table of [
    "sports",
    "teams",
    "competitions",
    "sports_events",
    "user_followed_teams",
  ]) {
    assert.match(sportsMigrationSource, new RegExp(`public\\.${table}`));
  }
  assert.match(sportsFunctionSource, /Deno\.env\.get\("SPORTS_API_KEY"\)/);
  assert.match(sportsFunctionSource, /provider_external_id/);
  assert.match(sportsFunctionSource, /resolution=merge-duplicates/);
  assert.doesNotMatch(pageSource, /x-apisports-key/);
  assert.match(pageSource, /MATCH DAY/);
});

test("keeps Safe Place light enough for mobile typing", () => {
  assert.match(pageSource, /secretDiaryTextareaRef/);
  assert.doesNotMatch(pageSource, /value=\{secretDiaryText\}/);
  assert.match(cssSource, /\.refuge-backdrop \{\s+animation: none;/);
  assert.match(
    cssSource,
    /\.app-shell\[data-refuge-open="true"\] \.phone-canvas \*/,
  );
  assert.match(
    cssSource,
    /\.app-shell\[data-refuge-open="true"\] > \.phone-canvas[\s\S]*content-visibility: hidden/,
  );
});

test("keeps pinch zoom on the compositor until the gesture ends", () => {
  assert.match(pageSource, /sketchZoomFrameRef/);
  assert.match(pageSource, /setSketchZoomAround\([\s\S]*nextGesture\.midpoint,\s+false/);
  assert.match(cssSource, /transform: translateZ\(0\) scale\(var\(--sketch-zoom\)\)/);
  assert.doesNotMatch(
    pageSource,
    /\[activeTab, sketchFullscreen, sketchZoom, space\]/,
  );
});

test("builds releases from the checked-out repository", () => {
  assert.doesNotMatch(workflowSource, /AEREA_SOURCE_URL/);
  assert.doesNotMatch(workflowSource, /curl --fail/);
  assert.match(workflowSource, /git archive/);
  assert.doesNotMatch(workflowSource, /aerea-debug\.keystore\.base64/);
  assert.match(workflowSource, /secrets\.AEREA_KEYSTORE_BASE64/);
});

test("packages the application and declares contextual Android capabilities", () => {
  assert.doesNotMatch(capacitorSource, /server:\s*\{/);
  assert.match(capacitorSource, /webDir: "native-shell"/);
  for (const permission of [
    "READ_CALENDAR",
    "WRITE_CALENDAR",
    "POST_NOTIFICATIONS",
    "RECORD_AUDIO",
  ]) {
    assert.match(manifestSource, new RegExp(permission));
  }
});

test("keeps cross-device sync private and local-first", () => {
  assert.match(syncSource, /aereaary@gmail\.com/);
  assert.match(syncSource, /persistSession: true/);
  assert.match(syncSource, /reconcileCloudState/);
  assert.match(syncSource, /aerea-private-state-v1/);
  assert.doesNotMatch(syncSource, /service_role/i);
});
