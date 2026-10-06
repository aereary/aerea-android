# Back navigation and Samsung calendar polish

With a reminder or timetable open, Android Back could also consume the page's
tab history. Closing an edited calendar event forced Home and reset its selected
date/scroll position. These actions now close one visible layer and preserve its
origin: Home, calendar month, search results or Day Pocket.

## Navigation

- `MainActivity` dispatches the custom Back event directly on `window`. At that
  target, registering a later capture listener does not give it priority over
  the page listener. The page now explicitly consumes registered local layers
  before touching tab history or the double-Back exit hint.
- `useBackLayer` registers local sheets and keeps callbacks current at commit.
  Reminder/timetable/note editors use priority 10; the degree portal uses 20.
  Each Back closes one nested editor, then its parent sheet, then page history.
- Health routine editors and journal details are included in the root handler.
- Event composition remembers the calendar's selected date, month, search state
  and scroll offset. Closing uses its origin rather than forcing a tab change.
  Search queries and Day Pocket return dates are retained.
- Root state remains mounted when local sheets close. No stored-data schema,
  Android signing configuration, notification or widget logic changes.

## Appearance

The new stylesheet requires the existing Samsung opt-in attributes; the other
themes keep their presentation. Both Samsung themes and color modes receive:

- Flat semester heading and circular class swatches with 44 px touch targets.
- Selected paper colors in the post-it preview and placed notes, with dark ink
  on all 24 papers; a flat palette with circular swatches and readable labels.
- Theme surfaces for degree statistics, navigation/search and term numbers;
  a readable selected tab without a transient dark-on-dark color transition.
- A centered month title, consistent arrows/search/Today controls, simplified
  calendar metadata and calmer selected-day/mood surfaces.

Calendar event dots, completion markers, Sunday-first ordering, weekend accents,
12-hour labels and center-based post-it dragging retain their existing logic.

## Validation

- `npm ci`, `npm test`: web/native builds and all 222 regression tests pass.
- Boundaries and TypeScript pass. ESLint has zero errors and 60 existing warnings.
- Capacitor sync passes. `assembleDebug --stacktrace` was attempted; Gradle's
  distribution download fails with `Network is unreachable`. No APK is supplied.
- Browser gate: Samsung Minimal/AO3, light/dark, 393×852 and 800×1100. Back is
  dispatched exactly as Android does. Tests cover one-layer closure, unchanged
  tab history/date/scroll, nested timetable/degree, reminders, Home/calendar event
  composition, calendar search, Day Pocket, health routine editors and Library
  notes. Measured text contrast in the checked fields/papers is at least 4.86:1.
- The previous Samsung sheet gate also verifies motion, reduced motion, Health
  completion/persistence, Lavender isolation, 320/360 px phones and a keyboard
  viewport. Browser tests use disposable synthetic state only.
- Signed APK update, actual Samsung keyboard/fonts and both widgets still
  require device verification through the existing Android build workflow.

## Repeat the UI gates

After `npm run build:native`, install Playwright without changing tracked package
files, then run `scripts/verify-back-calendar.mjs` and
`scripts/verify-samsung-sheets.mjs`. An existing browser can be supplied through
`AEREA_QA_BROWSER`; `AEREA_QA_OUTPUT` selects the screenshots/report folder.
The isolated browser origin uses HTTPS so Library's UUID API is available as it
is in the Android/Web production origins.
