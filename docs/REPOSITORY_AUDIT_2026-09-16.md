# Repository audit — 2026-09-16

## Verified baseline

- Source branch: `fix/restore-just-calendar-baseline-20260915`
- Maintenance merge: `88354b1178305dc51474e20604f31101d17d8b7a`
- This commit is a descendant of the recent APK, Career, Health, timetable,
  post-it and calendar work. The default `main` branch is older and is not a
  safe source for maintenance work yet.
- `npm ci`, web build, native build, Android build and all 164 regression tests
  passed before the repository-cleanup phase.

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
9. The root README still described a generic Vinext starter, while three old
   Android/Codex handoff files repeated outdated instructions.
10. Two unused D1 starter examples, three unused starter SVGs and an unused
    ChatGPT-auth helper remained in the tracked source.
11. The APK release workflow watched an older recovery branch instead of the
    current stable line.
12. The remote contained 39 branches: the stable line, 30 fully merged
    historical branches, six old feature lines with unique prototype history,
    stale `main`, and one recovery merge line.

## Cleanup applied

- Replaced the starter README with an aérea-specific project entry point.
- Removed obsolete handoff documents, unused starter examples/assets and the
  unreferenced authentication helper.
- Pointed Release automation at the actual stable branch.
- Added a Pull Request checklist, a read-only branch audit command and explicit
  branch policy.
- Ignored local patch/Codespaces helpers and Android build products that should
  never enter a commit.
- Added regression coverage for repository hygiene.

## Recommended sequence

1. Archive unique historical branch tips, remove fully merged branches, and
   promote the stable line to `main` only after device update verification.
2. Extract `page.tsx` by feature boundary: Calendar, Today/Day Pocket, Health,
   Post-its, Settings, then navigation/modals.
3. Split `globals.css` by the same feature boundaries while preserving CSS
   order and visual snapshots.
4. Lazy-load PDF/EPUB readers and feature-only bridges.
5. Re-enable React compiler lint rules as errors feature by feature.
6. After an APK update test on phone and tablet, archive stale branches and
   make the stable branch the default source of future work.
