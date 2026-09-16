# Repository audit — 2026-09-16

## Verified baseline

- Source branch: `fix/restore-just-calendar-baseline-20260915`
- Baseline commit: `58f6b933001c163b62e6a3b93176255009fc6af1`
- This commit is a descendant of the recent APK, Career, Health, timetable,
  post-it and calendar work. The default `main` branch is older and is not a
  safe source for maintenance work yet.
- `npm ci`, web build, native build and all 161 regression tests pass.

## Findings

1. `app/page.tsx` is 17,544 lines and `app/globals.css` is 31,758 lines. This is
   the largest source of accidental coupling and makes small edits difficult to
   review.
2. The native bundle reports a large main JavaScript chunk and a large combined
   stylesheet. Reader and PDF code are candidates for later lazy loading.
3. Product identity, PWA colors and ordinary defaults were duplicated across
   files. They are now centralized in `app/config/app-config.ts`.
4. Base design tokens were embedded at the top of the global stylesheet. They
   are now isolated in `app/styles/manual-customization.css`.
5. Type checking exposed two narrow DOM/navigation issues. They were corrected
   without changing behavior.
6. ESLint's React compiler rules report legacy patterns in the monolithic
   component. They remain visible as warnings while feature extraction is done
   incrementally; ordinary lint errors still fail the command.
7. The repository has many historical and task branches. They are useful as
   references, but deleting or merging them before the current stable branch is
   promoted would be unnecessarily risky.
8. The release workflow both verifies and publishes an APK. A separate
   read-only PR workflow now verifies web, native and Android builds without
   creating a release.

## Recommended sequence

1. Promote the reviewed maintenance line to the long-lived stable branch.
2. Extract `page.tsx` by feature boundary: Calendar, Today/Day Pocket, Health,
   Post-its, Settings, then navigation/modals.
3. Split `globals.css` by the same feature boundaries while preserving CSS
   order and visual snapshots.
4. Lazy-load PDF/EPUB readers and feature-only bridges.
5. Re-enable React compiler lint rules as errors feature by feature.
6. After an APK update test on phone and tablet, archive stale branches and
   make the stable branch the default source of future work.
