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

test("keeps the approved theme collection and its cute additions", () => {
  for (const theme of [
    "peachparlor",
    "mintletter",
    "blueberrynight",
    "sunsetsea",
    "duckmail",
    "calicotea",
    "moonquilt",
    "peachpuppy",
    "matchabunny",
    "cherryribbon",
    "neonheart",
  ]) {
    assert.match(pageSource, new RegExp(`id: "${theme}"`));
  }
  assert.equal(
    [...pageSource.matchAll(/showCharm: false/g)].length,
    7,
    "the seven decorated themes should hide the welcome charm",
  );
  assert.equal(
    [...pageSource.matchAll(/decoratedScene: true/g)].length,
    7,
    "the seven approved decorated themes should decorate the sky",
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
  assert.match(pageSource, /onClick=\{\(\) => openEventEditor\(calendarEvent\)\}/);
  assert.match(cssSource, /\.note-detail-text/);
});

test("keeps compact calendar and offers an interactive daily schedule", () => {
  assert.match(pageSource, /calendarExpanded/);
  assert.match(pageSource, />\s*Cronograma\s*</);
  assert.match(pageSource, /agenda-v2/);
  assert.match(pageSource, /layoutScheduleEvents/);
  assert.match(pageSource, /openNewEventAtMinute/);
  assert.match(pageSource, /outside-month/);
  assert.match(pageSource, /selectedTimedScheduleEvents/);
  assert.match(pageSource, /startScheduleSwipe/);
  assert.match(pageSource, /scheduleTimelineScrollRef/);
  assert.match(pageSource, /scheduleEventIcon/);
  assert.match(pageSource, /agenda-v2-event-extras/);
  assert.match(pageSource, /SCHEDULE_TOTAL_MINUTES/);
  assert.match(pageSource, /scheduleMarks/);
  assert.match(pageSource, /flushOverlapGroup/);
  assert.match(pageSource, /duration \/ SCHEDULE_TOTAL_MINUTES/);
  assert.match(pageSource, /is-short/);
  assert.match(pageSource, /Cronograma/);
  assert.match(pageSource, /agenda-v3-scene/);
  assert.match(pageSource, /agenda-v2-now/);
  assert.match(pageSource, /topbar agenda-v2-homebar/);
  assert.match(pageSource, /bottom-nav agenda-v2-home-nav/);
  assert.match(pageSource, /className=\{tab\.id === activeTab \? "nav-item active" : "nav-item"\}/);
  assert.match(pageSource, /aria-label="Back to compact calendar"/);
  assert.match(pageSource, />\s*Calendar\s*<\/button>/);
  assert.match(pageSource, /agenda-overlay-backdrop/);
  assert.match(cssSource, /\.calendar-modal\.calendar-expanded/);
  assert.match(cssSource, /\.agenda-v2-timeline/);
  assert.match(cssSource, /\.agenda-v2-time-grid \.half-hour i/);
  assert.match(cssSource, /\.agenda-v2-time-axis/);
  assert.match(cssSource, /\.agenda-v2-event/);
  assert.match(cssSource, /\.agenda-v2-event-category/);
  assert.match(cssSource, /--v2-highlight/);
  assert.match(cssSource, /\.agenda-v2-now[\s\S]*right:0/);
  assert.match(cssSource, /\.agenda-v2-event\.is-short/);
  assert.doesNotMatch(cssSource, /min-width: 920px/);
});

test("removes the secret area and all of its entry points", () => {
  assert.doesNotMatch(pageSource, /SafePlace/);
  assert.doesNotMatch(pageSource, /safePlace/);
  assert.doesNotMatch(pageSource, /refuge/);
  assert.doesNotMatch(pageSource, /secretDiary/);
  assert.doesNotMatch(pageSource, /secret-moon-button/);
  assert.doesNotMatch(pageSource, /PlannerInkCanvas/);
  assert.doesNotMatch(cssSource, /\.secret-studio-backdrop/);
  assert.doesNotMatch(cssSource, /\.secret-moon-button/);
});

test("adds Neon heartbreak as an isolated complete theme", () => {
  assert.match(pageSource, /id: "neonheart"/);
  assert.match(pageSource, /name: "Neon heartbreak"/);
  assert.match(cssSource, /\.app-shell\[data-theme="neonheart"\]/);
  assert.match(cssSource, /\.storybook-scene\[data-visual="neonheart"\]/);
  assert.match(cssSource, /\.theme-option\[data-theme-option="neonheart"\]/);
  assert.match(cssSource, /#ff0a9a/);
});

test("toggles selected moods and keeps reminders editable", () => {
  assert.match(pageSource, /next\[dateKey\] === mood/);
  assert.match(pageSource, /delete next\[dateKey\]/);
  assert.match(pageSource, /reminderDraft/);
  assert.match(pageSource, /aria-label="Add reminder"/);
  assert.match(pageSource, /deleteReminder/);
  assert.match(pageSource, /delete-reminder-button/);
  assert.doesNotMatch(pageSource, /Day not marked complete/);
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
