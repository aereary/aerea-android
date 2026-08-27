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
const todayWidgetInfoSource = await readFile(
  new URL("../android/app/src/main/res/xml/aerea_today_widget_info.xml", import.meta.url),
  "utf8",
);
const monthWidgetInfoSource = await readFile(
  new URL("../android/app/src/main/res/xml/aerea_month_widget_info.xml", import.meta.url),
  "utf8",
);
const widgetFallbackSource = await readFile(
  new URL("../android/app/src/main/res/layout/aerea_widget_fallback.xml", import.meta.url),
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
const supabaseConfigSource = await readFile(
  new URL("../supabase/config.toml", import.meta.url),
  "utf8",
);

test("keeps the approved worlds and removes every rejected theme", () => {
  for (const theme of [
    "storybook",
    "otter",
    "peachparlor",
    "mintletter",
    "blueberrynight",
    "duckmail",
    "moonquilt",
  ]) {
    assert.match(pageSource, new RegExp(`id: "${theme}"`));
  }
  assert.equal(
    [...pageSource.matchAll(/showCharm: false/g)].length,
    2,
    "the two remaining full-scene themes should hide the welcome charm",
  );
  assert.equal(
    [...pageSource.matchAll(/decoratedScene: true/g)].length,
    2,
    "only the two remaining full-scene themes should decorate the sky",
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
    "dreambear",
    "lovelyevening",
    "noirrest",
    "ao3night",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(`id: "${removedTheme}"`));
  }
  assert.match(pageSource, /activeTheme\.decoratedScene &&/);
  assert.doesNotMatch(
    pageSource,
    /className="theme-scene-character"/,
    "the extra animal badge should never float above the welcome card",
  );
  for (const removedName of [
    "Starlit teddy sky",
    "Lovely lavender evening",
    "Noir quiet hours",
    "Rose Pine night letters",
  ]) {
    assert.doesNotMatch(pageSource, new RegExp(removedName));
  }
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

test("moves Library into Spaces and reserves the center action for Quick Capture", () => {
  assert.match(pageSource, /\{ id: "add", icon: "＋", label: "Add" \}/);
  assert.doesNotMatch(pageSource, /\{ id: "library", icon: "▥", label: "Library" \}/);
  assert.doesNotMatch(pageSource, /id: "campstudy"/);
  assert.doesNotMatch(pageSource, /CampStudyShell/);
  assert.doesNotMatch(cssSource, /data-theme="campstudy"/);
  assert.match(pageSource, /title="Library"[\s\S]*onClick=\{\(\) => setSpace\("library"\)\}/);
  assert.match(pageSource, /space === "library"[\s\S]*<StudyLibrary/);
  assert.match(pageSource, /tab\.id === "add" \? "quick-capture-nav" : ""/);
  assert.match(pageSource, /tab\.id === "add"[\s\S]*setQuickCaptureOpen\(true\)/);
  assert.match(pageSource, /Focus clock/);
  assert.doesNotMatch(pageSource, /Back to Sketchbook/);
  assert.match(cssSource, /Library belongs to Spaces; the center action opens Quick Capture/);
});

test("keeps notes, searchable readers, pastel highlights, and private files in Library", () => {
  assert.match(librarySource, /Your Library/);
  assert.doesNotMatch(librarySource, /HANDWRITING/);
  assert.match(librarySource, /READ & ANNOTATE/);
  assert.match(librarySource, /COLLECTIONS/);
  assert.match(librarySource, /favoriteFiles/);
  assert.match(librarySource, /favoriteNotes/);
  assert.match(librarySource, /favoriteRecordings/);
  assert.match(librarySource, /recentFiles/);
  assert.match(librarySource, /Recently opened/);
  assert.match(librarySource, /Continue ·/);
  assert.match(librarySource, /study-file-batch-actions/);
  assert.match(librarySource, /application\/epub\+zip/);
  assert.match(readerSource, /Search in this PDF/);
  assert.match(readerSource, /"contents" \| "pages" \| "bookmarks" \| "highlights" \| "notes"/);
  assert.match(readerSource, /SelectionHighlightMenu/);
  assert.match(readerSource, /highlightPdfSelection/);
  assert.match(readerSource, /epub-saved-highlight/);
  assert.match(readerSource, /EPUB reading tools/);
  assert.match(readerSource, /document\.getOutline\(\)/);
  assert.match(readerSource, /function PdfPageThumbnail/);
  assert.match(readerSource, /<canvas ref=\{canvasRef\}/);
  assert.match(readerSource, /bookmarkNames/);
  assert.match(readerSource, /Filter by color/);
  assert.match(readerSource, /stroke\.excerpt/);
  assert.match(readerSource, /pageNotes/);
  assert.match(readerSource, /Note for page/);
  assert.match(librarySource, /onDeleteNote/);
  assert.match(fileApiSource, /const \{ BUCKET \} = getRuntimeEnv\(\)/);
  assert.match(fileApiSource, /BUCKET\.put/);
  assert.match(nativeStorageSource, /listDocuments/);
  assert.match(nativeStorageSource, /saveDocument/);
  assert.match(nativeStorageSource, /getDocument/);
  assert.match(nativeStorageSource, /deleteDocument/);
});

test("makes reader search navigable and adds a reader-only dark mode", () => {
  assert.match(readerSource, /openPdfSearchResults/);
  assert.match(readerSource, /pageWrapRef\.current\?\.scrollTo\(\{ top: 0, left: 0/);
  assert.match(readerSource, /pdfSearchMatchSpans/);
  assert.match(readerSource, /onPointerDownCapture=\{dismissPdfSearchHighlight\}/);
  assert.match(readerSource, /openEpubSearchResults/);
  assert.match(readerSource, /epubPaperRef\.current\?\.scrollTo\(\{ top: 0/);
  assert.match(readerSource, /className="epub-search-match"/);
  assert.match(readerSource, /onPointerDownCapture=\{dismissEpubSearchHighlight\}/);
  assert.match(readerSource, /reader-dark-toggle/);
  assert.match(readerSource, /aria-pressed=\{readerDark\}/);
  assert.match(cssSource, /Reader-only night mode/);
  assert.match(cssSource, /\.study-reader\.reader-dark/);
  assert.match(cssSource, /filter:invert\(\.9\) hue-rotate\(180deg\)/);
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
  assert.match(pageSource, /openEventEditor\(calendarEvent\)/);
  assert.match(pageSource, /calendarEvent\.eventType === "sports_event"/);
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
  assert.match(
    pageSource,
    /className="day-summary-add event-detail-add"[\s\S]*openNewEvent\(eventDate\)/,
  );
  assert.match(
    pageSource,
    /const eventDate = selectedEventDetail\.date;[\s\S]{0,600}setCalendarOpen\(true\);[\s\S]{0,120}openNewEvent\(eventDate\)/,
  );
  assert.match(
    pageSource,
    /calendarDays\.map\([\s\S]{0,700}!hiddenCalendarSources\.includes\([\s\S]{0,100}event\.calendar \|\| "Personal"/,
  );
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
  assert.match(cssSource, /On phones the schedule meets the glass edges without showing outer corners[\s\S]*border-radius:0!important/);
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
  assert.match(
    pageSource,
    /className="calendar-search-result"[\s\S]{0,900}setSelectedCalendarDate\(date\);[\s\S]{0,120}openEventEditor\(event\)/,
  );
  assert.match(pageSource, /♡ Tap a result to edit the event/);
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
  assert.doesNotMatch(pageSource, /eventDetailDate/);
  assert.match(pageSource, /eventDetailHeadingDate/);
  assert.match(pageSource, /className="event-detail-date-eyebrow"/);
  assert.match(pageSource, /className="event-detail-category-row"/);
  assert.match(pageSource, /className="event-detail-title"/);
  assert.doesNotMatch(pageSource, /event-detail-corner/);
  assert.doesNotMatch(pageSource, /event-modal-cloud-sparkles\.png/);
  assert.match(pageSource, /className="event-detail-reminder"/);
  assert.match(pageSource, /<small>Reminder<\/small>/);
  assert.match(pageSource, /No reminder/);
  assert.match(pageSource, /aria-label="Close event details"[\s\S]*M7 7 17 17M17 7 7 17/);
  assert.match(cssSource, /Long-press event card — shared faithfully by every theme/);
  assert.match(cssSource, /backdrop-filter:blur\(7px\)/);
  assert.match(cssSource, /Reference-style event note shared by Personal and Day Pocket/);
  assert.match(cssSource, /Compact reference notes and the discreet aérea utility hub/);
  assert.match(cssSource, /\.app-shell\[data-theme\] \.event-detail-note[\s\S]*max-width:450px;[\s\S]*width:min\(84vw,450px\)/);
  assert.match(cssSource, /\.event-detail-date-eyebrow[\s\S]*letter-spacing:\.14em/);
  assert.match(cssSource, /\.event-detail-title[\s\S]*letter-spacing:-\.06em/);
  assert.match(pageSource, /<div className="event-detail-divider" aria-hidden="true" \/>/);
  assert.match(cssSource, /\.app-shell\[data-theme\] \.event-detail-divider::before \{ display:none; \}/);
  assert.match(cssSource, /\.event-detail-divider,[\s\S]*border-radius:999px;[\s\S]*height:6px;[\s\S]*width:38px;/);
  assert.match(cssSource, /\.event-detail-reminder[\s\S]*grid-template-columns:54px minmax\(0,1fr\)/);
  assert.match(cssSource, /\.app-shell\[data-theme\] \.event-detail-reminder,[\s\S]*background:#fff9ea;[\s\S]*border-color:#f1dfad/);
  assert.match(cssSource, /\.event-detail-header > button svg \{[\s\S]*stroke:currentColor/);
  assert.match(pageSource, /range: `\$\{startLabel\} – \$\{endLabel\}`/);
  assert.match(
    cssSource,
    /\.event-detail-note \.event-detail-add[\s\S]*background:linear-gradient\(180deg,#ff8b93,#ff737a\)/,
  );
});

test("opens the normal event editor only from its title and controls", () => {
  assert.match(pageSource, /const openSelectedEventEditor = \(\) =>/);
  assert.match(
    pageSource,
    /calendarEvents\.find\(\(event\) => event\.id === selectedEventDetail\.id\)[\s\S]{0,500}setCalendarOpen\(true\);[\s\S]{0,100}openEventEditor\(editableEvent\)/,
  );
  assert.match(
    pageSource,
    /className=\{`event-detail-note \$\{selectedEventDetail\.color\}`\}[\s\S]{0,900}onClickCapture=[\s\S]{0,900}\[data-event-detail-edit="true"\], button[\s\S]{0,400}openSelectedEventEditor\(\)/,
  );
  assert.match(pageSource, /className="event-detail-title"[\s\S]{0,120}data-event-detail-edit="true"/);
  assert.match(pageSource, /className="event-detail-time"[\s\S]{0,120}data-event-detail-edit="true"/);
  assert.match(pageSource, /className="event-detail-reminder"[\s\S]{0,120}data-event-detail-edit="true"/);
  assert.match(cssSource, /Event-note paper stays calm; only its title and controls invite editing/);
  assert.match(pageSource, /const closeCalendarEventEditor = \(\) =>[\s\S]{0,500}setCalendarOpen\(false\);[\s\S]{0,180}changeTab\("today"\)/);
  assert.match(pageSource, /onClick=\{closeCalendarEventEditor\}/);
  assert.match(pageSource, /closeCalendarEventEditor\(\);/);
});

test("matches the clean event-note language in Day Pocket", () => {
  assert.doesNotMatch(pageSource, /className="day-summary-orbs"/);
  assert.doesNotMatch(pageSource, /className="day-summary-doodle"/);
  assert.doesNotMatch(pageSource, /className="day-summary-cloud"/);
  assert.doesNotMatch(pageSource, /className="day-summary-sparkles"/);
  assert.match(pageSource, /className="day-summary-event-heart"[\s\S]*M12 20\.5C/);
  assert.doesNotMatch(pageSource, /className="day-summary-add-sparkle"/);
  assert.match(pageSource, /className="day-summary-close"[\s\S]*M7 7 17 17M17 7 7 17/);
  assert.doesNotMatch(pageSource, /className="day-summary-date-eyebrow"/);
  assert.match(pageSource, /className="day-summary-category">DAY POCKET/);
  assert.match(pageSource, /<h2>\{readableDate\(daySummaryDate\)\}<\/h2>/);
  assert.match(
    pageSource,
    /className="day-summary-card"[\s\S]*?<\/header>\s*<div className="day-summary-divider" aria-hidden="true" \/>\s*\{summaryEvents\.length/,
  );
  assert.doesNotMatch(pageSource, />Your plans</);
  assert.doesNotMatch(pageSource, /`pocket-tone-\$\{index % 4\}`/);
  assert.doesNotMatch(pageSource, /className="day-summary-event-category"/);
  assert.match(pageSource, /className="day-summary-add-spacer"/);
  assert.match(cssSource, /\.day-summary-card \.day-summary-divider \{ margin:18px 2px; \}/);
  assert.match(cssSource, /\.day-summary-card \.day-summary-add \{ margin-top:10px; \}/);
  assert.match(cssSource, /Clean reference card shared visually with the event note/);
  assert.match(cssSource, /\.day-summary-backdrop \.day-summary-card[\s\S]*max-width:450px;[\s\S]*width:min\(86vw,450px\)/);
  assert.match(cssSource, /\.day-summary-event\.yellow \{ --pocket-color:#ffe9a9; \}/);
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

test("runs the requested personal-content reset once without making updates destructive", () => {
  assert.match(pageSource, /personal-content-reset-2026-08-24/);
  assert.match(pageSource, /resetUserCreatedContent/);
  assert.match(pageSource, /AereaStorage\.clearPersonalContent\(\)/);
  assert.match(pageSource, /Compatibility with the last signed preview/);
  assert.match(pageSource, /future updates keep the same marker and preserve data/);
  assert.match(nativeStorageSource, /public void clearPersonalContent/);
  for (const table of ["sketches", "study_files", "library_files"]) {
    assert.match(
      nativeStorageSource,
      new RegExp(`writable\\.delete\\(\\"${table}\\", null, null\\)`),
    );
  }
  assert.doesNotMatch(nativeStorageSource, /writable\.delete\("documents"/);
  assert.doesNotMatch(pageSource, /localStorage\.clear\(/);
});

test("ships launcher-safe widgets with a useful empty first render", () => {
  for (const source of [todayWidgetSource, monthWidgetSource]) {
    assert.match(source, /updateWidgetSafely/);
    assert.match(source, /aerea_widget_fallback/);
    assert.match(source, /onAppWidgetOptionsChanged/);
  }
  for (const source of [todayWidgetInfoSource, monthWidgetInfoSource]) {
    assert.match(source, /android:initialLayout="@layout\/aerea_widget_fallback"/);
    assert.match(source, /android:previewImage="@mipmap\/ic_launcher"/);
    assert.match(source, /android:previewLayout="@layout\/aerea_widget_preview_/);
    assert.doesNotMatch(source, /android:configure=/);
  }
  assert.match(widgetFallbackSource, /android:text="aérea"/);
  assert.match(widgetFallbackSource, /android:text="No events yet ♡"/);
  assert.match(todayWidgetSource, /No events yet ♡/);
  assert.match(manifestSource, /AereaTodayWidget/);
  assert.match(manifestSource, /AereaMonthWidget/);
});

test("uses the central plus for universal Inbox capture", () => {
  assert.match(pageSource, /tab\.id === "add" \? "quick-capture-nav" : ""/);
  assert.match(pageSource, /tab\.id === "add" \? "Open Quick Capture" : tab\.label/);
  assert.equal(
    (pageSource.match(/\{tab\.id !== "add" && <small>\{tab\.label\}<\/small>\}/g) ?? []).length,
    2,
    "the center plus should not repeat the Add label in either bottom navigation",
  );
  assert.equal(
    (pageSource.match(/setQuickCaptureOpen\(true\)/g) ?? []).length,
    2,
    "only the two rendered variants of the central navigation plus may open Quick Capture",
  );
  assert.doesNotMatch(
    pageSource,
    /className="feature-space-toolbar"[\s\S]{0,500}setQuickCaptureOpen\(true\)/,
  );
  assert.match(pageSource, /Keep in Inbox/);
  for (const kind of ["photo", "pdf", "file", "link"]) {
    assert.match(featureSource, new RegExp(`\\| "${kind}"`));
  }
  for (const destination of ["event", "task", "post-it", "note", "library"]) {
    assert.match(pageSource, new RegExp(`"${destination}"`));
  }
  assert.match(pageSource, /ensureInboxLibraryItem/);
  assert.match(pageSource, /libraryItemAsStudyFile/);
  assert.match(pageSource, /Capture is still here/);
  assert.match(pageSource, /const openInboxDestination =/);
  assert.match(pageSource, /if \(item\.processedAs\?\.includes\(destination\)\) \{[\s\S]{0,180}openInboxDestination\(item, destination\)/);
  assert.match(pageSource, /className=\{converted \? "converted" : ""\}/);
  assert.match(pageSource, /Open saved \$\{destination\}/);
  assert.match(pageSource, /sourceInboxId: item\.id/);
  assert.match(pageSource, /setRequestedStudyNoteId\(note\.id\)/);
  assert.match(pageSource, /openTaskEditor\(task\)/);
  assert.match(pageSource, /className="task-editor-basics"/);
  assert.match(pageSource, />\s*Save task\s*</);
  assert.match(pageSource, /setHistoryMessage\(`Saved as \$\{destinationLabel\} ♡`\)/);
  assert.match(pageSource, /className="inbox-item-icon"/);
  assert.match(pageSource, /className="inbox-item-copy"/);
  assert.match(cssSource, /\.inbox-convert-actions button\.converted/);
});

test("keeps the Recordings class editor compact and centered", () => {
  assert.match(pageSource, /className="modal-backdrop class-editor-backdrop"/);
  assert.match(
    cssSource,
    /\.class-editor-backdrop \{[\s\S]{0,140}align-items:center;[\s\S]{0,140}padding:16px/,
  );
  assert.match(
    cssSource,
    /\.class-editor-backdrop > \.class-editor-modal \{[\s\S]{0,260}max-height:min\(660px,calc\(100dvh - 32px\)\);[\s\S]{0,180}width:min\(88vw,500px\)/,
  );
});

test("keeps reversible history, archive and a 30-day Trash", () => {
  assert.match(pageSource, /undoStackRef/);
  assert.match(pageSource, /redoStackRef/);
  assert.match(pageSource, /const undoGlobal/);
  assert.match(pageSource, /const redoGlobal/);
  assert.match(featureSource, /purgeAt/);
  assert.match(featureSource, /getDate\(\) \+ 30/);
  assert.match(pageSource, /Archive keeps things for later/);
  assert.match(pageSource, /purgeExpiredTrashFiles/);
  assert.match(pageSource, /deleteDocument\(\{ id: file\.id \}\)/);
  assert.match(pageSource, /moveToTrash\("note"/);
  assert.match(pageSource, /className="aerea-hub-modal"/);
  assert.match(
    pageSource,
    /brandOpensAo3 \? "Open My AO3 Library" : "Open aérea spaces"/,
  );
  assert.match(pageSource, /setSpace\("inbox"\)/);
  assert.match(pageSource, /setSpace\("postit-archive"\)/);
  assert.match(pageSource, /setSpace\("trash"\)/);
  assert.match(pageSource, /const emptyTrash = async \(\) =>/);
  assert.match(pageSource, /Promise\.all\(trashItems\.map\(\(item\) => purgeTrashItemPayload\(item\)\)\)/);
  assert.match(pageSource, /className="empty-trash-button"/);
  assert.match(pageSource, />\s*Empty trash\s*<\/button>/);
  assert.match(cssSource, /\.feature-space \.trash-list \{ margin-top:18px; \}/);
  assert.doesNotMatch(pageSource, /title="Post-it Archive"/);
  assert.doesNotMatch(pageSource, /className="global-history-controls"/);
});

test("keeps calendar drag without conflict warnings or rejected power tools", () => {
  assert.match(pageSource, /data-calendar-date=\{dayKey\}/);
  assert.match(pageSource, /startCalendarEventDrag\(event, calendarEvent\)/);
  assert.match(pageSource, /event\.stopPropagation\(\);\s*cancelCalendarLongPress\(\)/);
  assert.match(pageSource, /startScheduleEventDrag/);
  assert.match(pageSource, /moveCalendarEventTime/);
  assert.match(pageSource, /agenda-v2-drag-time/);
  assert.match(pageSource, /goToScheduleToday/);
  assert.doesNotMatch(pageSource, /className="event-detail-duplicate"/);
  assert.doesNotMatch(pageSource, /toggleCalendarEventSelection/);
  assert.doesNotMatch(pageSource, /copyCurrentWeek/);
  assert.doesNotMatch(pageSource, /Jump to date/);
  assert.doesNotMatch(pageSource, /Select events/);
  assert.match(pageSource, /className="agenda-v2-all-day-list"/);
  assert.doesNotMatch(pageSource, /Schedule conflict|These plans overlap|View conflicting event/);
  assert.doesNotMatch(pageSource, /calendarConflictRequest|calendarEventHasConflictOnDate/);
  assert.doesNotMatch(cssSource, /calendar-conflict|event-chip\.has-conflict/);
  assert.match(cssSource, /\.agenda-v2-event\.is-dragging/);
});

test("keeps Library links and backlinks bidirectional without duplicating content", () => {
  assert.match(featureSource, /export type EntityLink/);
  assert.match(pageSource, /const \[entityLinks, setEntityLinks\] = useState<EntityLink\[\]>/);
  assert.match(pageSource, /setEntityLinks\(snapshot\.entityLinks\)/);
  assert.match(pageSource, /fromType: "event",[\s\S]{0,140}toType: "file"/);
  assert.match(pageSource, /fromType: "event",[\s\S]{0,140}toType: "recording"/);
  assert.match(pageSource, /fromType: "task",[\s\S]{0,140}toType: "file"/);
  assert.match(pageSource, /toggleTaskFileAttachment/);
  assert.match(pageSource, /New attached note/);
  assert.match(pageSource, /Removing a link never deletes the original file or note/);
  assert.match(pageSource, /toggleEntityLink\([\s\S]{0,180}"class",[\s\S]{0,180}"note"/);
  assert.match(pageSource, /Attach from Library/);
  assert.match(pageSource, /Related notes & recordings/);
  assert.match(pageSource, /const fileUsedInLabels = \(fileId: string\) =>/);
  assert.match(pageSource, /usedInForFile=\{fileUsedInLabels\}/);
  assert.match(pageSource, /usedIn=\{fileUsedInLabels\(activeStudyFile\.id\)\}/);
  assert.match(librarySource, /Used in:/);
  assert.match(librarySource, /className="study-card-actions"/);
  assert.match(cssSource, /\.study-reader\.reader-dark \.pdf-navigation-panel/);
  assert.match(pageSource, /const alreadyLinked = hasEntityLink/);
  assert.match(pageSource, /alreadyLinked[\s\S]{0,220}current\.filter/);
});

test("draws edge-to-edge and handles the Android auth callback in every lifecycle", () => {
  assert.match(mainActivitySource, /setDecorFitsSystemWindows\(getWindow\(\), false\)/);
  assert.match(mainActivitySource, /Color\.TRANSPARENT/);
  assert.match(mainActivitySource, /onNewIntent/);
  assert.match(mainActivitySource, /getDataString/);
  assert.match(mainActivitySource, /setAppearanceLightStatusBars/);
  assert.match(mainActivitySource, /setAppearanceLightNavigationBars/);
  assert.match(pageSource, /SystemBarsStyle\.Dark/);
  assert.match(pageSource, /SystemBars\.setStyle/);
  assert.match(capacitorSource, /insetsHandling: "css"/);
  assert.match(manifestSource, /android:theme="@style\/AppTheme\.NoActionBar"/);
  assert.doesNotMatch(manifestSource, /AppTheme\.NoActionBarLaunch/);
  assert.match(manifestSource, /android:scheme="aerea"/);
  assert.match(manifestSource, /android:host="auth"/);
  assert.match(syncSource, /aerea:\/\/auth\/callback/);
  assert.match(syncSource, /exchangeCodeForSession/);
  assert.match(cssSource, /html\[data-native="true"\] \.phone-canvas/);
  assert.match(cssSource, /--aerea-safe-area-top: max\(var\(--safe-area-inset-top, 0px\), 32px\)/);
  assert.match(cssSource, /--aerea-safe-area-bottom: max\(var\(--safe-area-inset-bottom, 0px\), 48px\)/);
  assert.match(cssSource, /padding-bottom: calc\(102px \+ var\(--aerea-safe-area-bottom\)\)/);
  assert.match(cssSource, /bottom: calc\(9px \+ var\(--aerea-safe-area-bottom\)\)/);
  assert.match(
    cssSource,
    /@media \(min-width: 681px\)[\s\S]{0,260}--aerea-tablet-bottom-clearance: max\([\s\S]{0,100}72px[\s\S]{0,260}bottom: calc\(8px \+ var\(--aerea-tablet-bottom-clearance\)\)/,
  );
  assert.match(
    cssSource,
    /html\[data-native="true"\] \.bottom-nav \{[\s\S]{0,100}position: fixed;/,
  );
});

test("restores the original built-in habits once without replacing saved habits", () => {
  for (const habit of [
    "Drink 6 glasses of water",
    "Study for at least 25 minutes",
    "Write one gentle thought",
    "Stretch and breathe",
  ]) {
    assert.match(pageSource, new RegExp(habit));
  }
  assert.match(
    pageSource,
    /const BUILTIN_HABITS_RESTORE_VERSION = "builtin-habits-restored-2026-08-26"/,
  );
  assert.match(pageSource, /function restoreBuiltInHabits\(savedHabits: Habit\[\]\)/);
  assert.match(pageSource, /return \[\.\.\.savedHabits, \.\.\.missingHabits\]/);
  assert.match(
    pageSource,
    /habitRestoreVersion: BUILTIN_HABITS_RESTORE_VERSION/,
  );
});

test("keeps native clouds and full screens inside phone and tablet safe areas", () => {
  assert.match(pageSource, /"calendar-backdrop"/);
  assert.match(
    cssSource,
    /html\[data-native="true"\] \.phone-canvas > \.storybook-scene \{[\s\S]{0,100}inset:var\(--aerea-safe-area-top\) 0 auto/,
  );
  assert.match(
    cssSource,
    /html\[data-native="true"\] \.modal-backdrop \{[\s\S]{0,180}height:100dvh;[\s\S]{0,80}max-height:100dvh;/,
  );
  assert.match(
    cssSource,
    /html\[data-native="true"\] :is\(\.calendar-backdrop,\.settings-backdrop\) \{[\s\S]{0,120}padding:0/,
  );
  assert.match(
    cssSource,
    /\.calendar-backdrop > \.calendar-modal,[\s\S]{0,100}\.settings-backdrop > \.settings-modal[\s\S]{0,260}height:100dvh;[\s\S]{0,160}width:100vw;/,
  );
  assert.match(
    cssSource,
    /\.calendar-modal\.calendar-extended-month > \.extended-calendar-view \{[\s\S]{0,260}var\(--aerea-safe-area-top\)[\s\S]{0,220}var\(--aerea-safe-area-bottom\)/,
  );
  assert.match(
    cssSource,
    /\.settings-backdrop > \.settings-modal \{[\s\S]{0,260}var\(--aerea-safe-area-top\)[\s\S]{0,220}var\(--aerea-safe-area-bottom\)/,
  );
  assert.match(cssSource, /html\[data-native="true"\] \.focus-screen/);
  assert.match(
    cssSource,
    /\.app-shell:not\(\[data-color-mode="dark"\]\) :is\([\s\S]{0,180}\.extended-calendar-view[\s\S]{0,80}background:#fff!important;/,
  );
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
  assert.match(supabaseConfigSource, /verify_jwt = false/);
  assert.match(sportsFunctionSource, /x-sports-sync-secret/);
  assert.doesNotMatch(pageSource, /x-apisports-key/);
  assert.match(pageSource, /MATCH DAY/);
  assert.match(pageSource, /matchCountdownLabel\(comingUpEvent\)/);
  assert.match(pageSource, /match-day-pocket-card/);
  assert.doesNotMatch(pageSource, /aria-label="Sports settings"/);
  assert.doesNotMatch(pageSource, />Teams you follow</);
  assert.doesNotMatch(pageSource, />Add matches automatically</);
});

test("reads and caches the canonical Boca fixture independently", () => {
  assert.match(syncSource, /export type FootballMatch = \{/);
  assert.match(syncSource, /const FOOTBALL_MATCHES_KEY = "aerea-football-matches-v1"/);
  assert.match(syncSource, /\.from\("football_matches"\)/);
  assert.match(syncSource, /\.eq\("team_key", "boca_juniors"\)/);
  assert.match(syncSource, /external_event_id,team_key,match_date,kickoff_at,time_confirmed/);
  assert.match(syncSource, /new Map\(matches\.map\(\(match\) => \[match\.external_event_id, match\]\)\)/);
  assert.match(syncSource, /throw new Error\("Supabase returned an invalid Boca fixture\."\)/);
  assert.match(syncSource, /localStorage\.setItem\(FOOTBALL_MATCHES_KEY, JSON\.stringify\(matches\)\)/);
  assert.match(pageSource, /useState<FootballMatch\[\]>\(\[\]\)/);
  assert.match(pageSource, /readCachedFootballMatches\(\)/);
  assert.match(pageSource, /Never replace the last valid Boca fixture after a failed refresh/);
  assert.match(pageSource, /table: "football_matches"/);
  assert.match(pageSource, /filter: "team_key=eq\.boca_juniors"/);
  assert.match(pageSource, /window\.addEventListener\("online", refreshWhenOnline\)/);
  assert.match(pageSource, /document\.addEventListener\("visibilitychange", refreshWhenVisible\)/);
  assert.match(pageSource, /window\.setInterval\(refreshFootballMatches, 15 \* 60_000\)/);
});

test("keeps canonical Boca out of private and generic event state", () => {
  const privateStateStart = pageSource.indexOf("const state = {");
  const privateStateEnd = pageSource.indexOf("};", privateStateStart);
  const privateStatePayload = pageSource.slice(privateStateStart, privateStateEnd);
  assert.ok(privateStateStart >= 0 && privateStateEnd > privateStateStart);
  assert.match(privateStatePayload, /calendarEvents,/);
  assert.match(privateStatePayload, /sportsEvents,/);
  assert.doesNotMatch(privateStatePayload, /footballMatches/);
  assert.match(pageSource, /const footballCalendarEvents = useMemo<FootballVisualEvent\[\]>/);
  assert.match(pageSource, /\.\.\.calendarEvents,[\s\S]{0,100}\.\.\.sportsCalendarEvents,[\s\S]{0,100}\.\.\.footballCalendarEvents/);
  assert.match(pageSource, /state\.sportsEvents\.filter\([\s\S]{0,100}!isBocaSportsEvent\(event\)/);
  assert.match(pageSource, /sportsEvents[\s\S]{0,240}!isBocaSportsEvent\(event\)/);
  assert.match(syncSource, /\.filter\(\(event\) => !isBocaSportsEvent\(event\)\)/);
  assert.match(featureSource, /export function isBocaSportsTeam/);
  assert.match(featureSource, /providerExternalId === "451"/);
  assert.match(featureSource, /export function isBocaSportsEvent/);
});

test("renders one read-only Boca match across the current v156 surfaces", () => {
  assert.match(pageSource, /id: `football:\$\{match\.external_event_id\}`/);
  assert.match(pageSource, /sportsSource: "football_matches"/);
  assert.match(pageSource, /if \(!match\.time_confirmed \|\| !match\.kickoff_at\) return null/);
  assert.match(pageSource, /if \(!kickoff\) return "Hora por confirmar"/);
  assert.match(pageSource, /kickoff\.getHours\(\)/);
  assert.match(pageSource, /footballMatchFinished\(event\.footballMatch\)/);
  assert.match(pageSource, /footballMatchCancelled\(event\.footballMatch\)/);
  assert.match(pageSource, /start: Number\.POSITIVE_INFINITY/);
  assert.equal(
    [...pageSource.matchAll(/findComingUpEvent\(selectedDateEvents, now\)/g)].length,
    1,
  );
  assert.match(pageSource, /selectedFootballMatch &&/);
  assert.match(pageSource, /football-match-detail/);
  assert.match(pageSource, /Automatic match · read-only/);
  assert.doesNotMatch(pageSource, /selectedFootballMatch[\s\S]{0,5000}Edit this event/);
  assert.match(pageSource, /calendarEvent\.eventType !== "sports_event" &&[\s\S]{0,100}startCalendarEventDrag/);
  assert.match(pageSource, /if \(event\.eventType === "sports_event"\) return/);
  for (const surface of [
    "simplified-event-strip",
    "extended-event-pill",
    "calendar-cell-event",
    "agenda-v2-event",
    "event-chip",
    "match-day-pocket-card",
    "match-day-schedule-card",
  ]) {
    assert.match(pageSource, new RegExp(surface));
  }
  assert.match(pageSource, /<p className="day-summary-category">DAY POCKET<\/p>/);
  assert.match(pageSource, /beginCalendarLongPress\(dayKey, event\)/);
  assert.match(pageSource, /window\.setTimeout\([\s\S]{0,120}setDaySummaryDate/);
});

test("schedules only one confirmed Boca notification identity", () => {
  assert.match(pageSource, /const genericNotificationEvents = followedEvents\.map/);
  assert.match(pageSource, /const bocaNotificationEvents = footballMatches\.flatMap/);
  assert.match(pageSource, /if \(!kickoff\) return \[\]/);
  assert.match(pageSource, /externalId: `boca:\$\{match\.external_event_id\}`/);
  assert.match(pageSource, /externalId: `sports:\$\{event\.teamId\}:\$\{event\.externalId\}`/);
  assert.match(pageSource, /const uniqueSportsNotificationEvents = Array\.from/);
  assert.match(pageSource, /new Map\([\s\S]{0,240}\[event\.externalId, event\]/);
  assert.match(pageSource, /eventsJson: JSON\.stringify\(uniqueSportsNotificationEvents\)/);
  assert.equal(
    [...pageSource.matchAll(/AereaSportsNotifications\.sync\(/g)].length,
    1,
  );
});

test("keeps morning, night and smart rescheduling small but actionable", () => {
  assert.match(pageSource, /MORNING RESET ♡/);
  assert.match(pageSource, /NIGHT RESET ♡/);
  assert.match(pageSource, /reset-summary-categories/);
  assert.match(pageSource, /Still waiting from yesterday/);
  assert.match(pageSource, /task\.dueDate === yesterdayKey[\s\S]{0,80}\? "yesterday"/);
  assert.match(pageSource, /rescheduleHistory/);
  assert.match(pageSource, /skipped: dueDate === null/);
  assert.match(featureSource, /attachmentIds\?: string\[\]/);
  assert.match(featureSource, /checklist\?: string\[\]/);
  assert.match(featureSource, /tags\?: string\[\]/);
  assert.match(featureSource, /priority\?: "gentle" \| "important" \| "urgent"/);
  assert.match(pageSource, /Pick date/);
  assert.match(pageSource, /Move unfinished things to tomorrow\?/);
});

test("ships movable post-its with an editor that matches the placed note", () => {
  assert.match(pageSource, /type PostItNote/);
  assert.match(pageSource, /page: PostItPage/);
  assert.match(pageSource, /currentPostItPage/);
  assert.match(pageSource, /visiblePostIts\.map/);
  assert.match(pageSource, /className="post-it-layer"/);
  assert.match(pageSource, /startPostItDrag/);
  assert.match(pageSource, /locked:false/);
  assert.match(pageSource, /startPostItResize/);
  assert.match(pageSource, /raisePostItOnTouch/);
  assert.match(pageSource, /groupSelectedPostIts/);
  assert.match(pageSource, /choosePostItGroupAction/);
  assert.match(pageSource, /Group with other post-its…/);
  assert.match(pageSource, />Group it<\/button>/);
  assert.match(pageSource, /if \(selectedPostItIds\.length > 0\)/);
  assert.doesNotMatch(
    pageSource,
    /const groupSelectedPostIts = \(\) => \{[\s\S]{0,700}window\.prompt/,
  );
  assert.doesNotMatch(pageSource, /togglePostItLock/);
  assert.doesNotMatch(pageSource, /duplicatePostIt/);
  assert.doesNotMatch(pageSource, /archiveSelectedPostIts/);
  assert.doesNotMatch(pageSource, /ungroupSelectedPostIts/);
  assert.doesNotMatch(pageSource, /className="post-it-mini-actions"/);
  assert.doesNotMatch(cssSource, /\.post-it-mini-actions/);
  assert.doesNotMatch(pageSource, /className="post-it-editor-secondary-actions"/);
  assert.doesNotMatch(cssSource, /\.post-it-editor-secondary-actions/);
  assert.doesNotMatch(pageSource, /Bring forward/);
  assert.doesNotMatch(pageSource, /Send backward/);
  assert.match(cssSource, /\.post-it-resize-handle\s*\{[\s\S]{0,100}background:\s*transparent/);
  assert.match(pageSource, /postItLongPressRef/);
  assert.match(pageSource, /Movable post-it\. Hold to edit\./);
  assert.doesNotMatch(pageSource, /className="post-it-edit"/);
  assert.match(pageSource, /postIts,/);
  assert.match(pageSource, /className="extended-calendar-view"/);
  assert.match(pageSource, /extendedCalendarDays/);
  assert.match(pageSource, /hiddenCalendarSources/);
  assert.match(cssSource, /grid-template-areas:[\s\S]{0,100}"dot edit delete name"/);
  assert.match(
    cssSource,
    /\.category-editor-list article > button:not\(\.category-delete\)[\s\S]{0,120}width:100%/,
  );
  for (const color of ["lavender", "butter", "blush", "sky", "mint", "peach", "coral", "cream"]) {
    assert.match(pageSource, new RegExp(`value: "${color}"`));
    assert.match(cssSource, new RegExp(`post-it(?:-editor-preview)?\\.${color}`));
  }
  for (const color of ["orchid", "lemon", "petal", "ocean", "eucalyptus", "apricot", "terracotta", "oat", "plum", "sunshine", "berry", "denim", "forest", "tangerine", "brick", "cocoa"]) {
    assert.match(pageSource, new RegExp(`value: "${color}"`));
    assert.match(cssSource, new RegExp(`post-it-editor-preview\\.${color}`));
  }
  assert.match(pageSource, /function postItVisualStyle/);
  assert.match(pageSource, /const fontSize = length > 150 \? 15 : length > 80 \? 16 : 18/);
  assert.match(pageSource, /\.\.\.postItVisualStyle\(postIt\.text\)/);
  assert.match(pageSource, /style=\{postItVisualStyle\(postItDraft\.text\)\}/);
  assert.match(cssSource, /Movable paper notes/);
  assert.match(cssSource, /Full monthly calendar/);
  assert.match(cssSource, /font-family:"Gaegu","Chalkboard SE","Marker Felt",cursive/);
  assert.match(cssSource, /\.post-it-editor-preview \{[\s\S]*height:var\(--post-it-height,174px\);[\s\S]*width:var\(--post-it-width,184px\);/);
  assert.match(cssSource, /\.movable-post-it \{[\s\S]*height:var\(--post-it-height,174px\);[\s\S]*width:var\(--post-it-width,184px\);/);
  assert.match(cssSource, /\.post-it-editor-options fieldset \{[\s\S]*margin:0 auto;[\s\S]*width:max-content;/);
  assert.match(cssSource, /\.post-it-editor-options button \{[\s\S]*height:30px;[\s\S]*width:30px;/);
  assert.match(pageSource, /const postItColorPalettes:/);
  assert.match(pageSource, /const shiftPostItPalette =/);
  assert.match(pageSource, /onTouchStart=\{startPostItPaletteSwipe\}/);
  assert.match(pageSource, /onTouchEnd=\{finishPostItPaletteSwipe\}/);
  assert.match(pageSource, /Previous paper-color palette/);
  assert.match(pageSource, /Next paper-color palette/);
  assert.match(cssSource, /\.post-it-palette-picker \{[\s\S]*touch-action:pan-y/);
  assert.match(cssSource, /August 24 polish: match the latest event, calendar, and post-it references/);
  assert.match(cssSource, /\.post-it-group-action \{[\s\S]*margin:16px auto 0/);
  assert.match(cssSource, /\.post-it-editor-backdrop \{[\s\S]*align-items:center;[\s\S]*justify-content:center/);
  assert.match(cssSource, /\.movable-post-it p \{ font-size:var\(--post-it-text-size,18px\); height:100%; line-height:1\.22; max-height:none; \}/);
  assert.match(cssSource, /\.post-it-edit \{ display:none!important; \}/);
});

test("rejects impossible event ranges and keeps the restored journal footer", () => {
  assert.match(pageSource, /function eventDraftHasValidRange/);
  assert.match(pageSource, /endDate < draft\.date/);
  assert.match(pageSource, /minutesFromTime\(draft\.endTime\) > minutesFromTime\(draft\.time\)/);
  assert.match(pageSource, /disabled=\{!eventDraft\.title\.trim\(\) \|\| !eventDraftRangeIsValid\}/);
  assert.match(pageSource, /End must be later than start\./);
  assert.match(pageSource, /Your words, fully here\./);
  assert.doesNotMatch(pageSource, /Little doodle|post-it-doodle|postItDoodles|PostItDoodle/);
  assert.doesNotMatch(cssSource, /\.post-it-doodle/);
});

test("keeps the reference two-column home composition on every tablet theme", () => {
  assert.match(cssSource, /Tablet home composition: schedule and reminders share one row in every theme/);
  assert.match(cssSource, /@media \(min-width:681px\) and \(max-width:1200px\)/);
  assert.match(cssSource, /\.app-shell\[data-theme\] \.day-grid \{[\s\S]*grid-template-columns:minmax\(0,1\.08fr\) minmax\(300px,\.92fr\)/);
  assert.match(pageSource, /<section className="day-grid">/);
  assert.match(pageSource, /className="calendar-mood-note"/);
});

test("keeps editable event types above the redesigned extended calendar", () => {
  assert.match(pageSource, /starterCalendarCategories/);
  assert.match(pageSource, /calendarCategories,/);
  assert.match(pageSource, /openCalendarCategoryEditor/);
  assert.match(pageSource, /className="category-editor-modal"/);
  assert.match(pageSource, /className="extended-filter-list"/);
  assert.match(pageSource, /className=\{`extended-event-pill/);
  assert.doesNotMatch(pageSource, /date: null/);
  assert.match(pageSource, /extendedLeadingDays/);
  assert.match(pageSource, /const extendedCalendarWeekCount = Math\.max\(\s*6,/);
  assert.match(pageSource, /\['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'\]/);
  assert.match(pageSource, /previous-month month-spillover/);
  assert.match(pageSource, /date\.getDay\(\) === 0 \? "sunday"/);
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
  assert.match(pageSource, /className="extended-schedule-button"/);
  assert.match(pageSource, /className="extended-compact-glyph"/);
  assert.match(pageSource, /className="extended-compact-button extended-back-button"/);
  assert.match(pageSource, /className="extended-filter-control"/);
  assert.match(pageSource, /className="extended-filter-menu"/);
  assert.match(pageSource, /const extendedCalendarTabs = tabs\.filter/);
  assert.match(pageSource, /tab\.id !== "add"/);
  assert.match(pageSource, /extendedCalendarTabs\.map/);
  assert.match(cssSource, /\.extended-calendar-nav \{[\s\S]*position:static/);
  assert.match(cssSource, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(cssSource, /grid-template-rows:30px repeat\(var\(--extended-calendar-weeks,6\),minmax\(0,1fr\)\)/);
  assert.match(pageSource, /calendar-slide-\$\{calendarSlideDirection\}/);
  assert.match(pageSource, /aria-label="Extended calendar month\. Swipe left or right to change month\."/);
  assert.match(cssSource, /\.extended-month-grid\.calendar-slide-next/);
  assert.match(cssSource, /\.extended-calendar-cell\.selected,[\s\S]*background:color-mix\(in srgb,var\(--paper\) 74%,transparent\);[\s\S]*box-shadow:none/);
  assert.match(cssSource, /breathing room, quiet selection, and motion for the extended month/);
  assert.match(cssSource, /Reference month: Sunday-first, open week rows, and compact event labels/);
  assert.match(cssSource, /Exact reference chrome: two-tool month header, roomy type rail, and legible event slips/);
  assert.match(cssSource, /Extended month — the airy portrait reference, recolored by the active theme/);
  assert.match(cssSource, /\.extended-calendar-header > \.extended-back-button/);
  assert.match(cssSource, /\.extended-schedule-glyph \{[\s\S]*font-size:42px/);
  assert.match(cssSource, /\.extended-event-pill > span > strong \{[\s\S]*font-size:10\.5px/);
  assert.match(cssSource, /\.extended-calendar-cell\.sunday \.extended-calendar-date/);
  assert.match(cssSource, /\.extended-event-pill > i,[\s\S]*display:none/);
  assert.match(cssSource, /Edit types stays deliberately compact, including on Android/);
  assert.match(cssSource, /max-height:min\(76dvh,620px\)/);
  assert.match(cssSource, /max-width:560px/);
});

test("keeps the rose editorial interface in the theme gallery", () => {
  assert.match(pageSource, /id: "rosegrid"/);
  assert.match(cssSource, /data-theme="rosegrid"/);
  assert.match(cssSource, /data-theme-option="rosegrid"/);
  assert.match(pageSource, /themeId=\{appTheme\}/);
  assert.match(cssSource, /Rose paper editorial/);
  assert.match(cssSource, /linear-gradient\(rgba\(231,148,166,\.075\) 1px/);
});

test("shows Coming up next dynamically on today across every theme", () => {
  assert.match(pageSource, /function findComingUpEvent/);
  assert.match(pageSource, /if \(!isFootballVisualEvent\(event\)\) return !event\.allDay/);
  assert.match(pageSource, /\.filter\(\(\{ end \}\) => end > currentMinute\)/);
  assert.match(pageSource, /now=\{scheduleNow\}/);
  assert.match(pageSource, /selectedIsToday\s*\?\s*findComingUpEvent/);
  assert.match(pageSource, /selectedIsToday && comingUpEvent &&/);
  assert.doesNotMatch(pageSource, /Nothing else is waiting for you today/);
  assert.match(pageSource, /comingUpEvent\.sportsCardStyle \? "match-day-schedule-card"/);
  assert.match(pageSource, /`\$\{comingUpEvent\.color\}-card`/);
  assert.match(pageSource, /eventTimeBlockPrimary\(comingUpEvent\)/);
  assert.match(pageSource, /matchCountdownLabel\(comingUpEvent\)/);
  assert.match(pageSource, /<div className="schedule-line" \/>/);
  assert.match(pageSource, /<div className="mini-people">/);
  assert.match(cssSource, /Coming up reuses the exact schedule-card anatomy/);
  assert.doesNotMatch(pageSource, /coming-up-card/);
});

test("falls back safely when a saved theme is no longer offered", () => {
  assert.match(pageSource, /themeOptions\.some\(\(theme\) => theme\.id === savedTheme\)/);
  assert.match(pageSource, /setAppTheme\("storybook"\)/);
  assert.doesNotMatch(pageSource, /theme\.id === "ao3night"/);
});

test("offers a persisted Little aérea simplified calendar-only screen", () => {
  assert.match(pageSource, /const \[simplifiedCalendarMode, setSimplifiedCalendarMode\]/);
  assert.match(pageSource, /simplifiedCalendarMode\?: boolean/);
  assert.match(pageSource, /setSimplifiedCalendarMode\(state\.simplifiedCalendarMode\)/);
  assert.match(pageSource, /const chooseSimplifiedCalendarMode = \(enabled: boolean\)/);
  assert.match(pageSource, /data-simplified-calendar=\{simplifiedCalendarMode \? "true" : "false"\}/);
  assert.match(pageSource, /aria-label="Little aérea simplified"/);
  assert.match(pageSource, />\s*Just calendar\s*<\/button>/);
  assert.match(pageSource, /className="simplified-calendar-screen"/);
  assert.match(pageSource, /"simplified-month-grid"/);
  assert.match(pageSource, /className="simplified-calendar-filters"/);
  assert.match(pageSource, /className="simplified-calendar-add"/);
  assert.match(pageSource, /dayKey === todayKey \? "today" : ""/);
  assert.match(pageSource, /dayEvents\.slice\(0, 3\)/);
  assert.match(cssSource, /Little aérea simplified: the reference calendar, recolored by the active theme/);
  assert.match(cssSource, /data-simplified-calendar="true"\] > \.paper-grain/);
  assert.match(cssSource, /data-simplified-calendar="true"\] > \.phone-canvas[\s\S]*display:none/);
  assert.match(cssSource, /\.simplified-calendar-screen\s*\{/);
  assert.match(cssSource, /--simplified-card:color-mix/);
  assert.match(cssSource, /background:var\(--simplified-surface\)/);
  assert.match(cssSource, /\.simplified-calendar-header\s*\{[\s\S]*border-radius:34px/);
  assert.match(cssSource, /\.simplified-calendar-filters\s*\{[\s\S]*border-radius:31px/);
  assert.match(cssSource, /\.simplified-month-grid\s*\{[\s\S]*border-radius:30px/);
  assert.match(cssSource, /grid-template-rows:auto auto minmax\(0,1fr\) 58px/);
  assert.match(cssSource, /repeat\(var\(--simplified-calendar-weeks,6\),minmax\(0,1fr\)\)/);
  assert.match(cssSource, /\.simplified-calendar-cell\.today,[\s\S]*background:transparent/);
  assert.match(cssSource, /\.simplified-calendar-cell\.selected \.simplified-calendar-date/);
  assert.match(cssSource, /\.simplified-event-strip/);
  assert.doesNotMatch(cssSource, /data-simplified-calendar="true"\] \.calendar-modal\.calendar-extended-month/);
});
