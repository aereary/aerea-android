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
  assert.match(pageSource, /onClick=\{\(\) => openEventEditor\(calendarEvent\)\}/);
  assert.match(cssSource, /\.note-detail-text/);
});

test("keeps compact calendar and offers an interactive daily schedule", () => {
  assert.match(pageSource, /calendarExpanded/);
  assert.match(pageSource, /Daily schedule/);
  assert.match(pageSource, /schedule-shell/);
  assert.match(pageSource, /layoutScheduleEvents/);
  assert.match(pageSource, /openNewEventAtMinute/);
  assert.match(pageSource, /outside-month/);
  assert.match(pageSource, /selectedTimedScheduleEvents/);
  assert.match(pageSource, /startScheduleSwipe/);
  assert.match(pageSource, /scheduleTimelineScrollRef/);
  assert.match(pageSource, /scheduleEventIcon/);
  assert.match(pageSource, /schedule-event-extras/);
  assert.match(pageSource, /schedule-brand-back/);
  assert.match(pageSource, /Cronograma/);
  assert.match(pageSource, /schedule-now-line/);
  assert.match(pageSource, /schedule-bottom-dock/);
  assert.match(cssSource, /\.calendar-modal\.calendar-expanded/);
  assert.match(cssSource, /\.schedule-timeline/);
  assert.match(cssSource, /\.schedule-event/);
  assert.match(cssSource, /\.schedule-event-category/);
  assert.match(cssSource, /--schedule-highlight/);
  assert.match(cssSource, /--agenda-accent:#6d56e8/);
  assert.doesNotMatch(cssSource, /min-width: 920px/);
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
