# Samsung sheet corrections

The Samsung Minimal and Samsung AO3 dialogs previously appeared as centered cards,
and inherited pale surfaces sometimes made light text unreadable. Their dialogs
now rise from below the viewport, rest at its bottom, and use flat, readable
surfaces with consistent spacing and controls.

This follows the 105-second phone recording supplied on October 5, 2026, after
PR #83 was merged. All presentation rules require the opt-in native-theme
attributes. Existing theme styles and Android signing/widget configuration are
unchanged.

## Changes

- Bottom sheets for event details/composition, habits, health routines, reminders,
  classes, timetable, notes, capture, categories, study editors and settings.
- A 360 ms entrance, dimmed background, clean handle, rounded upper corners,
  viewport scrolling and Android safe-area padding. Reduced motion is respected.
- Independent CSS translation avoids old important transform declarations.
  Screen animation and stacking contexts are cleared while a sheet is open so
  fixed sheets and their background also cover the app header.
- Health routines use full-width rows. Completion, semester fields, reminder
  fields and timetable tabs inherit the selected theme's readable surface/text
  pair. Inputs and controls use the same font family.
- Weekdays fit on one row; class names wrap; meeting fields have usable widths.
  Narrow phone composers stack date groups and keep Save visible while scrolling.
- Decorative page stickers are removed in these two themes. The health trigger
  remains available through a line icon.
- Health completion buttons bypass the event card's edit interception, so tapping
  a completion check updates the occurrence instead of opening the editor.

## Verification

- npm ci; npm test: all 219 existing tests pass, including web/native builds and
  recovery, Android and widget contracts.
- Architecture boundaries and TypeScript checks pass. ESLint has no errors;
  existing warnings remain.
- Capacitor Android synchronization passes.
- Browser regression gate: both themes in light/dark at 393 × 852 and 800 × 1100;
  actual sheet positions and animation trajectory, screen bounds, header layering,
  input widths, 7-day timetable, Health completion and persisted state.
- Seven representative sheets per configuration: event, health, habit,
  timetable, reminder, settings and event composer.
- Reduced motion, Lavender isolation, 320/360 px phones and 480 px keyboard
  viewport also pass.
- Measured text contrast in the tested completion/semester/input/routine fields
  is at least 4.77:1.
- The APK build was attempted but Gradle's distribution download failed with
  Network is unreachable. No new APK is included. Real Samsung keyboard/fonts,
  signed update/data preservation and both device widgets remain an on-device
  verification step.

## Repeating the browser gate

The script serves the built native shell on an isolated local route and seeds
synthetic state only inside disposable browser contexts. It does not change
product defaults or access a user's account.

After npm run build:native, install Playwright locally without changing tracked
package files:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node scripts/verify-samsung-sheets.mjs
```

An existing browser executable can be selected with AEREA_QA_BROWSER. Screenshots
and the report go to outputs/samsung-sheet-qa, or AEREA_QA_OUTPUT. An optional
AEREA_QA_EMOJI_FONT file makes emoji screenshots reproducible on Linux.
