# Shared post-its, mood stickers and Samsung daily care

Samsung Minimal and Samsung AO3 had replaced the shared paper and colorful mood
artwork with flat native surfaces. These two themes now use the existing post-it
paper, handwriting, tape, folded corner, shadows, palette swatches and mood faces.
The surrounding native sheets retain their upward motion and Back behavior.

The native control/text overrides explicitly exclude these shared components.
Paper uses the existing 24 palette values. Dark ink stays readable on every paper
and colored face; the paper palette has a light surface and readable captions.
Only narrow Samsung sheets gain extra horizontal room for the shared palette.
The other themes' stylesheets and presentation remain unchanged.

Samsung Health now has a live summary of routines scheduled today, separated
cards, title/cadence/state text, and a completion control on the left. The count
comes from actual occurrences and completion dates, including alternate-day and
weekday rules. Unscheduled routines say `Not today` and retain disabled checks.
User titles, including emoji-only names, remain unchanged. Forced decorative
plants are omitted in these two themes. Deletion lives inside the editor, while
other themes keep their original deletion control and layout. The add action
keeps its icon and label together.

All actions use the existing create/edit/delete/completion functions. This change
has no storage migration, auth, AO3, notifications, widgets, signing or native
navigation changes. Android Back still closes the editor, then the list, while
preserving the page underneath.

## Validation

- `npm ci` and `npm run check:repo`: web/native builds, boundaries, TypeScript and
  222 regression tests pass; ESLint has zero errors and 60 existing warnings.
- `verify-shared-paper-health.mjs`: compares computed paper and mood styles with
  Lavender for Samsung Minimal/AO3, light/dark, phone/tablet. Checks gesture
  suppression after swiping, palette navigation, dragging, save/reload, calendar
  mood selection, Health completion/edit/create/delete, scheduling and reload.
  Additional 320/360 px and keyboard-height checks verify that titles and checks
  do not overlap and sheets do not overflow horizontally.
- `verify-back-calendar.mjs`: all existing Back/origin and 24-paper contrast checks.
- `verify-samsung-sheets.mjs`: sheet motion, reduced motion, completion persistence,
  legacy-theme isolation, narrow phone and keyboard checks.
- QA state is isolated and synthetic. The harness now seeds once per browser
  context so reloads verify persisted edits instead of overwriting them.
- Capacitor sync succeeds. `./gradlew assembleDebug --stacktrace` was attempted;
  Gradle's distribution download is blocked by `Network is unreachable`. No
  local APK is supplied. Android CI and on-device font/keyboard verification
  remain necessary before distributing an APK.

## Repeat browser gates

After `npm run build:native`, run the three scripts above with Playwright available.
Use `AEREA_QA_BROWSER` for an installed Chromium and `AEREA_QA_OUTPUT` to choose
screenshots/report output. External requests are blocked by the QA harness.

This review supersedes the flat Samsung post-it treatment described in
`BACK_CALENDAR_REVIEW.md`; that review's Back and calendar changes remain intact.
