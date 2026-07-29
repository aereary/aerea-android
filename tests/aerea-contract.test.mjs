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

test("keeps every approved theme and removes only the three rejected themes", () => {
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
    0,
    "approved themes keep their original welcome charm",
  );
  assert.equal(
    [...pageSource.matchAll(/decoratedScene: true/g)].length,
    3,
    "only the original approved decorated themes should decorate the sky",
  );
  for (const removedTheme of [
    "moonpond",
    "forestfriends",
    "cloudroad",
    "ducktram",
    "startide",
    "catcoast",
    "starrainnight",
    "f1victory",
    "starrykitten",
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

test("keeps the original charm size and fits every curved message", () => {
  assert.match(pageSource, /<textPath/);
  assert.match(pageSource, /dayCharmText\.toUpperCase\(\)/);
  assert.match(pageSource, /Q 50 91 88 67/);
  assert.match(pageSource, /dayCharmText\.length >= 17/);
  assert.match(pageSource, /"medium-copy"/);
  assert.match(pageSource, /"short-copy"/);
  assert.match(cssSource, /The welcome charm keeps its original footprint/);
  assert.match(cssSource, /\.day-charm \{\s+height: 102px;/);
  assert.match(cssSource, /@media \(max-width: 680px\)[\s\S]*?\.day-charm \{\s+height: 84px;/);
  assert.match(
    cssSource,
    /The charm frame stays exactly the same size; its art and lettering grow/,
  );
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
  assert.doesNotMatch(pageSource, /timer-keepsake/);
  assert.match(pageSource, /timer-clock-pal/);
  assert.match(cssSource, /\.timer-bloom\.running[\s\S]*animation: none !important/);
  assert.match(pageSource, /journalFaceFor\(index\)/);
  assert.ok(
    [...pageSource.matchAll(/const journalFaces = \[([\s\S]*?)\];/g)][0][1]
      .split("\n")
      .filter((line) => line.trim().startsWith('"')).length >= 20,
    "journal moments should cycle through at least twenty cute faces",
  );
});

test("validates event timing and recognizes the afternoon", () => {
  assert.match(pageSource, /function eventHasValidTiming/);
  assert.match(pageSource, /function eventTimingValue/);
  assert.match(pageSource, /end > start/);
  assert.match(pageSource, /function keepEventEndingAfterStart/);
  assert.match(pageSource, /normalizeCalendarEventTiming/);
  assert.match(pageSource, /function formatTimeWithPeriod/);
  assert.match(pageSource, /hour >= 12 \? "PM" : "AM"/);
  assert.match(pageSource, /The event must end after it starts\./);
  assert.match(pageSource, /Good afternoon, lovely\./);
  assert.match(pageSource, /hour >= 18 \|\| hour < 5/);
  assert.match(pageSource, /hour >= 12[\s\S]*\? "afternoon"/);
});

test("offers a readable expanded month without replacing the compact calendar", () => {
  assert.match(pageSource, /calendarExpanded/);
  assert.match(pageSource, /Read events/);
  assert.match(pageSource, /calendar-event-preview-list/);
  assert.match(pageSource, /eventTimeLabel\(event\)/);
  assert.match(pageSource, /const calendarWeekRows = Math\.ceil/);
  assert.match(pageSource, /"--calendar-week-rows": calendarWeekRows/);
  assert.match(pageSource, /calendar-expanded-backdrop/);
  assert.match(cssSource, /\.month-grid\.expanded/);
  assert.match(
    cssSource,
    /\.month-grid\.expanded \.calendar-event-preview-list \{[\s\S]*grid-auto-rows: max-content/,
  );
  assert.match(
    cssSource,
    /\.calendar-modal\.calendar-expanded-mode \{[\s\S]*height: 100dvh;[\s\S]*width: 100vw;/,
  );
  assert.match(
    cssSource,
    /\.calendar-expanded-mode \.selected-day-panel,[\s\S]*display: none;/,
  );
  assert.match(
    cssSource,
    /grid-template-rows:[\s\S]*repeat\(var\(--calendar-week-rows\), minmax\(0, 1fr\)\)/,
  );
  assert.match(
    cssSource,
    /\.calendar-expanded-mode \.month-grid\.expanded > button \{[\s\S]*border-radius: 0;/,
  );
  assert.match(pageSource, /className="calendar-day-peek-card"/);
  assert.match(pageSource, /onPointerDown=\{\(\) => startDayLongPress\(dayKey\)\}/);
  assert.match(pageSource, /month-first-day/);
  assert.match(pageSource, /calendar-life-sticker/);
  assert.match(cssSource, /\.month-first-day/);
  assert.match(cssSource, /\.calendar-life-sticker/);
});

test("keeps secret diary writing aligned and saved pages recognizable", () => {
  assert.match(pageSource, /function firstSentencePreview/);
  assert.match(pageSource, /firstSentencePreview\(entry\.text\)/);
  assert.match(cssSource, /\.secret-diary-writing textarea[\s\S]*line-height: 35px/);
  assert.match(
    cssSource,
    /\.secret-page-list \.secret-page-open[\s\S]*height: auto;[\s\S]*width: 100%;/,
  );
  assert.match(cssSource, /\.secret-page-open time,[\s\S]*white-space: nowrap/);
  assert.match(
    cssSource,
    /\.secret-page-open > div \{[\s\S]*transform: translateY\(8px\);/,
  );
  assert.match(
    cssSource,
    /\.note-detail-backdrop\.secret \.note-detail-text[\s\S]*line-height: 37px/,
  );
});

test("keeps the approved warm focus-clock palette", () => {
  assert.match(
    cssSource,
    /\.timer-color-well::before[\s\S]*#f18991[\s\S]*#f7c96d[\s\S]*#75c8bd/,
  );
  assert.match(
    cssSource,
    /\.timer-clock-pal \{ background: #f6aa62; border-color: #fff4db; \}/,
  );
});

test("opens saved notes fully and edits calendar rows directly", () => {
  assert.match(pageSource, /function notePreview\(text: string/);
  assert.match(pageSource, /setSelectedJournalEntry\(entry\)/);
  assert.match(pageSource, /<NoteDetailDialog/);
  assert.match(pageSource, /onClick=\{\(\) => openEventEditor\(calendarEvent\)\}/);
  assert.match(pageSource, /className="event-chip-times"/);
  assert.match(
    pageSource,
    /formatTimeWithPeriod\(calendarEvent\.time\)[\s\S]*formatTimeWithPeriod\(calendarEvent\.endTime\)/,
  );
  assert.match(cssSource, /\.note-detail-text/);
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
