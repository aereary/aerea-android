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
const librarySource = await readFile(
  new URL("../app/study-library.tsx", import.meta.url),
  "utf8",
);
const readerSource = await readFile(
  new URL("../app/study-reader.tsx", import.meta.url),
  "utf8",
);
const sketchPaperSource = await readFile(
  new URL("../app/sketch-paper.ts", import.meta.url),
  "utf8",
);
const sketchApiSource = await readFile(
  new URL("../app/api/sketches/route.ts", import.meta.url),
  "utf8",
);
const fileApiSource = await readFile(
  new URL("../app/api/files/route.ts", import.meta.url),
  "utf8",
);
const nativeStorageSource = await readFile(
  new URL("../android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java", import.meta.url),
  "utf8",
);

test("keeps the approved worlds and removes the ten rejected themes", () => {
  for (const theme of [
    "storybook",
    "otter",
    "peachparlor",
    "mintletter",
    "blueberrynight",
    "duckmail",
    "moonquilt",
    "dreambear",
  ]) {
    assert.match(pageSource, new RegExp(`id: "${theme}"`));
  }
  assert.equal(
    [...pageSource.matchAll(/showCharm: false/g)].length,
    3,
    "the two full-scene themes and the dark reading theme should hide the welcome charm",
  );
  assert.equal(
    [...pageSource.matchAll(/decoratedScene: true/g)].length,
    3,
    "only the three remaining full-scene themes should decorate the sky",
  );
  for (const removedTheme of [
    "piggyparcel",
    "rainywindow",
    "scrapbookdesk",
    "tinyliner",
    "pocketcomputer",
    "piggygelato",
    "calicocafe",
    "pawcloud",
    "midnightracing",
    "pixelpenguin",
    "moonpond",
    "forestfriends",
    "cloudroad",
    "ducktram",
    "startide",
    "catcoast",
    "glassreef",
    "cherrynotebook",
    "mosslibrary",
    "primaryplayroom",
    "orbitconsole",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`id: "${removedTheme}"`));
  }
  assert.match(pageSource, /activeTheme\.decoratedScene &&/);
  assert.doesNotMatch(
    pageSource,
    /className="theme-scene-character"/,
    "the extra animal badge should never float above the welcome card",
  );
  assert.match(pageSource, /id: "dreambear"/);
  assert.match(pageSource, /\/assets\/openmoji\/teddy\.svg/);
  assert.match(cssSource, /data-theme="dreambear"/);
  assert.match(cssSource, /data-visual="dreambear"/);
});

test("curves the Lavender rest message", () => {
  assert.match(pageSource, /<textPath/);
  assert.match(pageSource, /YOU MAY REST/);
  assert.match(pageSource, /Q 50 94 85 70/);
});

test("colors Saturday and Sunday across every theme and calendar surface", () => {
  assert.match(cssSource, /--weekend-accent:/);
  assert.match(cssSource, /\.week-strip \.day:nth-child\(6\) > span/);
  assert.match(cssSource, /\.week-strip \.day:nth-child\(7\) > span/);
  assert.match(cssSource, /\.agenda-v2-days button:nth-child\(6\) > small/);
  assert.match(cssSource, /\.agenda-v2-days button:nth-child\(7\) > small/);
  assert.match(cssSource, /\.month-grid > strong:nth-child\(6\)/);
  assert.match(cssSource, /\.month-grid > strong:nth-child\(7\)/);
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

test("moves Library into Spaces and uses the center navigation action for events", () => {
  assert.match(pageSource, /\{ id: "add", icon: "＋", label: "Add" \}/);
  assert.doesNotMatch(pageSource, /\{ id: "library", icon: "▥", label: "Library" \}/);
  assert.doesNotMatch(pageSource, /id: "campstudy"/);
  assert.doesNotMatch(pageSource, /CampStudyShell/);
  assert.doesNotMatch(cssSource, /data-theme="campstudy"/);
  assert.match(pageSource, /title="Library"[\s\S]*onClick=\{\(\) => setSpace\("library"\)\}/);
  assert.match(pageSource, /space === "library"[\s\S]*<StudyLibrary/);
  assert.match(pageSource, /openNewEventFromNavigation/);
  assert.match(pageSource, /tab\.id === "add" \? "nav-add-event" : ""/);
  assert.match(pageSource, /Focus clock/);
  assert.doesNotMatch(pageSource, /Back to Sketchbook/);
  assert.match(cssSource, /Library belongs to Spaces; the center action adds events/);
});

test("keeps notes, searchable readers, pastel highlights, and private files in Library", () => {
  assert.match(librarySource, /Your Library/);
  assert.doesNotMatch(librarySource, /HANDWRITING/);
  assert.match(librarySource, /READ & ANNOTATE/);
  assert.match(librarySource, /application\/epub\+zip/);
  assert.match(readerSource, /Search in this PDF/);
  assert.match(readerSource, /SelectionHighlightMenu/);
  assert.match(readerSource, /highlightPdfSelection/);
  assert.match(readerSource, /epub-saved-highlight/);
  assert.match(readerSource, /EPUB reading tools/);
  assert.match(fileApiSource, /const \{ BUCKET \} = getRuntimeEnv\(\)/);
  assert.match(fileApiSource, /BUCKET\.put/);
  assert.match(nativeStorageSource, /listDocuments/);
  assert.match(nativeStorageSource, /saveDocument/);
  assert.match(nativeStorageSource, /getDocument/);
  assert.match(nativeStorageSource, /deleteDocument/);
});

test("removes the Sketchbook entry while preserving legacy drawings safely", () => {
  for (const size of ["letter", "legal", "oficio", "a4", "a5", "tabloid", "executive"]) {
    assert.match(sketchPaperSource, new RegExp(`id: "${size}"`));
  }
  assert.doesNotMatch(pageSource, /title="Cute sketchbook"/);
  assert.match(pageSource, /false && space === "sketchbook"/);
  assert.match(sketchApiSource, /isValidSketchPaperDescriptor/);
});

test("opens saved notes fully and edits calendar rows directly", () => {
  assert.match(pageSource, /function notePreview\(text: string/);
  assert.match(pageSource, /setSelectedJournalEntry\(entry\)/);
  assert.match(pageSource, /<NoteDetailDialog/);
  assert.match(pageSource, /onClick=\{\(\) => openEventEditor\(calendarEvent\)\}/);
  assert.match(cssSource, /\.note-detail-text/);
});

test("tints the event editor from the chosen event color", () => {
  assert.match(pageSource, /eventEditorOpen \? "event-editor-themed" : ""/);
  assert.match(pageSource, /"--event-editor-accent"/);
  assert.match(pageSource, /color\.value === eventDraft\.color/);
  assert.match(cssSource, /--event-editor-control:/);
  assert.match(cssSource, /\.event-row-icon[\s\S]*var\(--event-editor-wash\)/);
  assert.match(cssSource, /\.event-dates > label[\s\S]*var\(--event-editor-wash\)/);
  assert.match(cssSource, /\.event-todo-field > div button[\s\S]*var\(--event-editor-control\)/);
  assert.match(cssSource, /\.mobile-event-save[\s\S]*var\(--event-editor-control\)/);
});

test("keeps compact calendar and offers an interactive daily schedule", () => {
  assert.match(pageSource, /calendarExpanded/);
  assert.match(pageSource, /aria-label="Open schedule"/);
  assert.match(pageSource, /agenda-v2/);
  assert.match(pageSource, /layoutScheduleEvents/);
  assert.match(pageSource, /openNewEventAtMinute/);
  assert.match(pageSource, /outside-month/);
  assert.match(pageSource, /selectedTimedScheduleEvents/);
  assert.match(pageSource, /startScheduleSwipe/);
  assert.match(pageSource, /scheduleSlideDirection/);
  assert.match(pageSource, /schedule-slide-\$\{scheduleSlideDirection\}/);
  assert.match(pageSource, /todayKey === dateKey \? "today" : ""/);
  assert.match(pageSource, /aria-current=\{todayKey === dateKey \? "date" : undefined\}/);
  assert.match(pageSource, /scheduleTimelineScrollRef/);
  assert.match(pageSource, /scheduleEventIcon/);
  assert.match(pageSource, /agenda-v2-event-extras/);
  assert.match(pageSource, /className=\{`agenda-v2-event[\s\S]*openEventDetail\(event\)/);
  assert.match(pageSource, /className="event-detail-edit"[\s\S]*openEventEditor\(event\)/);
  assert.match(pageSource, /SCHEDULE_TOTAL_MINUTES/);
  assert.match(pageSource, /scheduleMarks/);
  assert.match(pageSource, /flushOverlapGroup/);
  assert.match(pageSource, /duration \/ SCHEDULE_TOTAL_MINUTES/);
  assert.match(pageSource, /is-short/);
  assert.match(pageSource, /title="Open schedule"/);
  assert.match(pageSource, /agenda-v3-scene/);
  assert.match(pageSource, /agenda-v2-now/);
  assert.match(pageSource, /topbar agenda-v2-homebar/);
  assert.match(pageSource, /bottom-nav agenda-v2-home-nav/);
  assert.doesNotMatch(pageSource, /welcome-row agenda-v2-greeting/);
  assert.match(pageSource, /agenda-v2-week-arrow/);
  assert.match(pageSource, /agenda-v2-section-heading/);
  assert.match(pageSource, /onClick=\{goToScheduleToday\}/);
  assert.match(pageSource, /const goToScheduleToday[\s\S]*setScheduleSlideDirection/);
  assert.match(pageSource, />\s*Return to today\s*<\/button>/);
  assert.match(pageSource, /"nav-item",[\s\S]*tab\.id === activeTab \? "active" : ""/);
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
  assert.match(cssSource, /border-radius:38px 38px 0 0/);
  assert.match(cssSource, /\.agenda-v2-time-grid > span:last-child \.agenda-v2-time-label/);
  assert.match(cssSource, /\.agenda-v2-week-content\.schedule-slide-next/);
  assert.match(cssSource, /\.agenda-v2-days button\.today:not\(\.selected\)/);
  assert.match(cssSource, /\.agenda-v2-week-content[\s\S]*grid-template-columns:42px minmax\(0,1fr\) 42px/);
  assert.match(cssSource, /\.agenda-v2-return-today/);
  assert.match(cssSource, /Schedule composition v7/);
  assert.match(cssSource, /\.calendar-modal\.calendar-expanded\.agenda-v2-modal \.agenda-v3-scene[\s\S]*height:100%/);
  assert.match(cssSource, /\.calendar-modal\.calendar-expanded\.agenda-v2-modal::after[\s\S]*background:var\(--cream\)[\s\S]*height:142px/);
  assert.doesNotMatch(cssSource, /agenda-v2-home-nav::after/);
  assert.doesNotMatch(cssSource, /agenda-v2-home-nav \.nav-item/);
  assert.match(cssSource, /The daily schedule starts with its week strip; the old greeting card is gone/);
  assert.match(cssSource, /\.event-detail-backdrop[\s\S]*z-index:\s*320/);
  assert.doesNotMatch(cssSource, /min-width: 920px/);
});

test("searches every event from the compact calendar", () => {
  assert.match(pageSource, /calendarSearchOpen/);
  assert.match(pageSource, /calendarSearchQuery/);
  assert.match(pageSource, /normalizeCalendarSearch/);
  assert.match(pageSource, /calendarEventSearchText/);
  assert.match(pageSource, /calendarSearchGroups/);
  assert.match(pageSource, /calendarEventAtOccurrence/);
  assert.match(pageSource, /aria-label="Search calendar events"/);
  assert.match(pageSource, /placeholder="Search events"/);
  assert.match(pageSource, /title · calendar · notes · place/);
  assert.match(pageSource, /setSelectedEventDetail\([\s\S]*calendarEventAtOccurrence/);
  assert.match(cssSource, /\.calendar-search-trigger/);
  assert.match(cssSource, /\.calendar-search-screen/);
  assert.match(cssSource, /\.calendar-search-result/);
  assert.match(cssSource, /\.calendar-modal:has\(\.calendar-search-screen\)/);
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

test("does not expose any of the rejected interface themes", () => {
  for (const theme of [
    "piggyparcel",
    "rainywindow",
    "scrapbookdesk",
    "tinyliner",
    "pocketcomputer",
    "piggygelato",
    "calicocafe",
    "pawcloud",
    "midnightracing",
    "pixelpenguin",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`id: "${theme}"`));
  }
  assert.match(pageSource, /name: "Cloudberry meadow"/);
  assert.match(pageSource, /name: "Lavender otter"/);
});

test("keeps the original event cards without later styling layers", () => {
  assert.doesNotMatch(cssSource, /Event notes v2/);
  assert.doesNotMatch(cssSource, /loved event-note anatomy/);
  assert.doesNotMatch(cssSource, /Approved compact Today note/);
  assert.doesNotMatch(cssSource, /Approved selected-day note/);
  assert.doesNotMatch(cssSource, /\.app-shell\[data-theme\] \.schedule-card/);
  assert.match(cssSource, /\.schedule-card \{[\s\S]*background: var\(--paper\);[\s\S]*grid-template-columns: 64px 4px minmax\(0, 1fr\) auto;/);
  assert.match(cssSource, /\.schedule-card::before \{[\s\S]*height: 110px;[\s\S]*opacity: 0\.55;/);
  assert.match(cssSource, /\.time-block \{[\s\S]*border-radius: 17px;[\s\S]*height: 64px;/);
  assert.match(cssSource, /\.schedule-line \{[\s\S]*background: var\(--orange\);/);
  assert.match(cssSource, /\.text-button \{[\s\S]*background: var\(--blue\);/);
  assert.match(cssSource, /\.event-chip \{[\s\S]*background: var\(--chip-color, var\(--yellow-soft\)\);[\s\S]*grid-template-columns: 64px minmax\(0, 1fr\) 32px;/);
  assert.doesNotMatch(pageSource, /className="event-chip-time"/);
  assert.doesNotMatch(pageSource, /className="event-chip-line"/);
  assert.match(pageSource, /eventCompactTimeLabel\(calendarEvent\)/);
  assert.match(cssSource, /Icon-only calendar tools: no filled pills and no visible labels/);
  assert.match(cssSource, /\.calendar-sources \.calendar-search-trigger,[\s\S]*flex:0 0 30px/);
  assert.match(cssSource, /background:transparent;[\s\S]*border-radius:50%/);
  assert.match(cssSource, /\.calendar-sources \.calendar-search-trigger \{ margin-left:auto; \}/);
  assert.match(pageSource, /title="Search events"/);
  assert.match(pageSource, /title="Open schedule"/);
  assert.doesNotMatch(pageSource, />\s*Search\s*<\/button>/);
  assert.doesNotMatch(pageSource, />\s*Cronograma\s*<\/button>/);
});

test("opens the faithful event note with a real long press", () => {
  assert.match(pageSource, /scheduleLongPressTimerRef/);
  assert.match(pageSource, /beginScheduleLongPress/);
  assert.match(pageSource, /window\.setTimeout\([\s\S]*520/);
  assert.match(pageSource, /onPointerMove=\{moveScheduleLongPress\}/);
  assert.match(pageSource, /onContextMenu=\{\(contextEvent\) => contextEvent\.preventDefault\(\)\}/);
  assert.match(pageSource, /Hold to preview event/);
  assert.match(pageSource, /eventDetailTimeParts/);
  assert.match(pageSource, /eventDetailDate/);
  assert.match(pageSource, /event-detail-corner/);
  assert.match(pageSource, /className="event-detail-title-row"/);
  assert.match(pageSource, /event-modal-cloud-sparkles\.png/);
  assert.match(pageSource, /className="event-detail-reminder"/);
  assert.match(pageSource, /No reminder/);
  assert.match(cssSource, /Long-press event card — shared faithfully by every theme/);
  assert.match(cssSource, /backdrop-filter:blur\(7px\)/);
  assert.match(cssSource, /The approved detail note, scaled down/);
  assert.match(cssSource, /\.app-shell\[data-theme\] \.event-detail-note[\s\S]*max-width:450px/);
  assert.match(cssSource, /\.event-detail-title-row \.event-detail-doodle[\s\S]*flex:0 0 78px/);
  assert.match(cssSource, /\.event-detail-divider span[\s\S]*background:transparent/);
  assert.match(cssSource, /\.event-detail-divider::before[\s\S]*right:29px/);
  assert.match(cssSource, /\.event-detail-corner::after[\s\S]*background:rgba\(246,213,232,\.42\)/);
  assert.match(cssSource, /\.event-detail-corner::after[\s\S]*border-radius:58% 0 0 100%/);
  assert.match(pageSource, /event-detail-reminder[\s\S]*<svg viewBox="0 0 24 24">[\s\S]*M12 21C/);
  assert.match(cssSource, /\.event-detail-reminder b svg[\s\S]*fill:currentColor/);
  assert.match(cssSource, /\.event-detail-corner[\s\S]*border-radius:0 38px 0 100%/);
  assert.match(cssSource, /\.event-detail-edit[\s\S]*background:linear-gradient\(180deg,#ff8f82,#f8796e\)/);
});

test("keeps the Day Pocket decorations faithful and stable across devices", () => {
  assert.match(pageSource, /className="day-summary-orbs"/);
  assert.match(pageSource, /className="day-summary-doodle"/);
  assert.match(pageSource, /className="day-summary-close"[\s\S]*M7 7 17 17M17 7 7 17/);
  assert.match(pageSource, /className="day-summary-event-heart"[\s\S]*M12 20\.5C/);
  assert.match(cssSource, /\.day-summary-orbs i:nth-child\(1\)[\s\S]*border-radius:0 0 0 100%/);
  assert.match(cssSource, /\.day-summary-cloud[\s\S]*fill:none/);
  assert.match(cssSource, /\.day-summary-sparkles i[\s\S]*clip-path:polygon/);
  assert.match(cssSource, /\.day-summary-event-heart svg[\s\S]*stroke-linejoin:round/);
  assert.match(cssSource, /White paper for Day Pocket and event notes; decorations remain untouched/);
  assert.match(cssSource, /\.app-shell:not\(\[data-theme="ao3night"\]\) \.day-summary-card/);
});

test("deletes unique events safely and edits repeating cycles by occurrence", () => {
  assert.match(pageSource, /repeatUntil\?: string/);
  assert.match(pageSource, /excludedDates\?: string\[\]/);
  assert.match(pageSource, /event\.repeatUntil && dateKey > event\.repeatUntil/);
  assert.match(pageSource, /event\.excludedDates\?\.includes\(dateKey\)/);
  assert.match(pageSource, /setEventDeleteRequest\(\{/);
  assert.match(pageSource, /Delete only this event/);
  assert.match(pageSource, /Delete this and future events/);
  assert.match(pageSource, /Delete all events/);
  assert.match(pageSource, /Are you sure you want to delete this event\?/);
  assert.match(pageSource, /This only affects the cycle that created this event/);
  assert.match(pageSource, /new Set\(\[\.\.\.\(event\.excludedDates \?\? \[\]\), occurrenceDate\]\)/);
  assert.match(pageSource, /repeatUntil: previousDateKey\(occurrenceDate\)/);
  assert.match(cssSource, /Unique and recurring deletion deliberately use different decision dialogs/);
});

test("offers saved event settings while a new title is being typed", () => {
  assert.match(pageSource, /eventTitleSuggestions/);
  assert.match(pageSource, /eventTemplateSuggestionsDismissed/);
  assert.match(pageSource, /normalizeCalendarSearch\(eventDraft\.title\)/);
  assert.match(pageSource, /Copy settings from \$\{suggestion\.title\}/);
  assert.match(pageSource, /applyEventTemplate/);
  assert.match(pageSource, /excludedDates: \[\]/);
  assert.match(pageSource, /repeatUntil: undefined/);
  assert.match(pageSource, /USE AN EXISTING PLAN/);
  assert.match(cssSource, /Event title recall/);
  assert.match(cssSource, /\.event-title-suggestions/);
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

test("returns an event note to the same Day Pocket", () => {
  assert.match(pageSource, /eventDetailReturnDayPocket/);
  assert.match(pageSource, /const returnToDayPocket = \(\) =>/);
  assert.match(pageSource, /setDaySummaryDate\(returnDate\)/);
  assert.match(
    pageSource,
    /openEventDetail\([\s\S]*calendarEventAtOccurrence\(event, returnDate\)[\s\S]*returnDate/,
  );
  assert.match(pageSource, /className="event-detail-back"/);
  assert.match(pageSource, /aria-label=\{`Back to Day Pocket for/);
  assert.match(pageSource, /onClick=\{closeEventDetail\}[\s\S]*aria-label="Close event details"/);
  assert.match(cssSource, /Contextual return from an event note to its Day Pocket/);
  assert.match(cssSource, /\.event-detail-back svg/);
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

test("ships movable post-its, the extended month, and Lovely Lavender Evening", () => {
  assert.match(pageSource, /type PostItNote/);
  assert.match(pageSource, /page: PostItPage/);
  assert.match(pageSource, /currentPostItPage/);
  assert.match(pageSource, /visiblePostIts\.map/);
  assert.match(pageSource, /className="post-it-layer"/);
  assert.match(pageSource, /startPostItDrag/);
  assert.match(pageSource, /postItLongPressRef/);
  assert.match(pageSource, /Movable post-it\. Hold to edit\./);
  assert.doesNotMatch(pageSource, /className="post-it-edit"/);
  assert.match(pageSource, /postIts,/);
  assert.match(pageSource, /className="extended-calendar-view"/);
  assert.match(pageSource, /extendedCalendarDays/);
  assert.match(pageSource, /hiddenCalendarSources/);
  assert.match(pageSource, /id: "lovelyevening"/);
  assert.match(cssSource, /Movable paper notes/);
  assert.match(cssSource, /Full monthly calendar/);
  assert.match(cssSource, /Lovely lavender evening theme/);
  assert.match(cssSource, /data-theme="lovelyevening"/);
  assert.match(cssSource, /font-family:"Gaegu","Chalkboard SE","Marker Felt",cursive/);
  assert.match(cssSource, /\.post-it-edit \{ display:none!important; \}/);
});

test("keeps editable event types above the redesigned extended calendar", () => {
  assert.match(pageSource, /starterCalendarCategories/);
  assert.match(pageSource, /calendarCategories,/);
  assert.match(pageSource, /openCalendarCategoryEditor/);
  assert.match(pageSource, /className="category-editor-modal"/);
  assert.match(pageSource, /className="extended-filter-list"/);
  assert.match(pageSource, /className=\{`extended-event-pill/);
  assert.match(pageSource, /date: null/);
  assert.match(pageSource, /\['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'\]/);
  assert.match(cssSource, /\.extended-calendar-cell\.calendar-blank/);
  assert.match(cssSource, /Event-type editing must sit over every calendar surface/);
  assert.match(cssSource, /\.category-editor-backdrop \{[\s\S]*z-index:520/);
});

test("keeps the schedule separate, restyles the extended month, and removes statistics", () => {
  assert.match(pageSource, /calendarScheduleOpen/);
  assert.match(pageSource, /setCalendarScheduleOpen\(true\)/);
  assert.match(pageSource, /setCalendarExpanded\(true\)/);
  assert.match(pageSource, /aria-label="Open extended monthly calendar"/);
  assert.match(pageSource, /calendar-extended-month/);
  assert.doesNotMatch(pageSource, /onClick=\{openMetrics\}/);
  assert.match(pageSource, /false && metricsOpen/);
  assert.doesNotMatch(pageSource, /className="extended-calendar-add"/);
  assert.match(cssSource, /Extended month — the same glass, rhythm, and event anatomy as the schedule/);
  assert.match(cssSource, /\.extended-calendar-add \{ display:none!important; \}/);
  assert.match(cssSource, /the extended month is the screen, never a card behind controls/);
  assert.match(pageSource, /className="extended-calendar-header-actions"/);
  assert.match(pageSource, /const extendedCalendarTabs = tabs\.filter/);
  assert.match(pageSource, /tab\.id !== "add"/);
  assert.match(pageSource, /extendedCalendarTabs\.map/);
  assert.match(cssSource, /\.extended-calendar-nav \{[\s\S]*position:static/);
  assert.match(cssSource, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(cssSource, /grid-template-rows:30px repeat\(var\(--extended-calendar-weeks,6\),minmax\(0,1fr\)\)/);
});

test("ships the rose editorial and noir quiet-hours interfaces", () => {
  for (const theme of ["rosegrid", "noirrest"]) {
    assert.match(pageSource, new RegExp(`id: "${theme}"`));
    assert.match(cssSource, new RegExp(`data-theme="${theme}"`));
    assert.match(cssSource, new RegExp(`data-theme-option="${theme}"`));
  }
  assert.match(pageSource, /themeId=\{appTheme\}/);
  assert.match(pageSource, /className="noir-coming-up"/);
  assert.match(pageSource, /className="noir-greeting-name"/);
  assert.match(pageSource, /Rhea <i aria-hidden="true">✦<\/i>/);
  assert.match(cssSource, /Rose paper editorial/);
  assert.match(cssSource, /Noir quiet hours/);
  assert.match(cssSource, /linear-gradient\(rgba\(231,148,166,\.075\) 1px/);
  assert.match(cssSource, /\.noir-coming-up-card/);
});

test("ships an AO3-inspired dark theme with pastel ink", () => {
  assert.match(pageSource, /id: "ao3night"/);
  assert.match(pageSource, /name: "Rose Pine night letters"/);
  assert.match(pageSource, /theme\.id === "ao3night"/);
  assert.match(cssSource, /Rose Pine night letters — dark AO3 base with the user's pastel accents/);
  assert.match(cssSource, /data-theme="ao3night"/);
  assert.match(cssSource, /data-theme-option="ao3night"/);
  for (const pastel of ["#f8c8dc", "#c4a7e7", "#b8d7e8", "#b9d8c0"]) {
    assert.match(cssSource, new RegExp(pastel));
  }
});
