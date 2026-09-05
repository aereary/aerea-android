# aérea — Recovery Manifest

## Purpose

This file is the source-of-truth checklist for consolidating the Android app without resurrecting previously fixed regressions.

**Golden source baseline**

- Repository: `aereary/aerea-android`
- Stable branch: `recovery/chat-stable-2026-09-05`
- Immutable baseline commit: `78df166e6442540fde71612917247e7c0270d118`
- Historical behavioral/visual reference: `aerea-0.18-segura.apk`
- Android application id: `com.aereaary.aerea`

Do not rebuild the app from an older APK, old branch, stale artifact, or historical file just because it contains one desired fix. New work must be applied on top of the baseline and reviewed as a small diff.

## Status legend

- `PROTECTED`: already present in the baseline; do not reimplement from old code.
- `APK VERIFY`: source support is present, but must be checked on a real Android build/device.
- `RECOVER`: known approved behavior is missing from the current baseline and must be restored narrowly.
- `HOLD`: exists elsewhere but is not part of the approved recovery baseline yet.

## Protected behavior

| Area | Status | Contract |
| --- | --- | --- |
| Android Back | PROTECTED | Close the topmost layer first, then real tab history; on Home require a second Back press within ~2 seconds to exit. |
| Event reminders | PROTECTED | Native Android scheduling, stable event/occurrence identities, cancel/reschedule on edits, recurrence exclusions, reboot/package/time rescheduling. |
| Image picker/import | PROTECTED | Use Android system picker, copy immediately to app-private storage, render via native URI, no broad gallery permission. |
| 12-hour time | PROTECTED | User-facing planner time remains 12-hour with AM/PM; do not regress to 24-hour formatting. |
| Boca Day Pocket | PROTECTED + APK VERIFY | Keep the approved special Boca presentation. Functional fixes elsewhere must not redesign it. |
| Post-it dragging | PROTECTED + APK VERIFY | Drag remains fluid and center-based; do not restore older corner/offset behavior. |
| Audio recording | PROTECTED + APK VERIFY | Microphone recording remains available; Start recording -> Stop & save must work on Android. |
| Android identity | PROTECTED | Keep `com.aereaary.aerea` so stable-signed builds update instead of installing as a different app. |
| AO3 library/reader | PROTECTED | Do not alter AO3 cards, filters, reader, version handling, sync, tables, or visual design during recovery work. |
| No demo data | PROTECTED | A clean install contains no fake events, notes, recordings, drawings, classes, etc. |
| Update data safety | PROTECTED + APK VERIFY | Installing an update must preserve real local data. |
| Phone + tablet | APK VERIFY | Every recovery APK must be checked on both form factors; do not regress already-approved navigation/layout positions. |

## Known recovery work

| Area | Status | Required behavior |
| --- | --- | --- |
| Trash refresh after image import | RECOVER | Importing/refreshing Study Library must never resurrect files that are still in Trash. Filter trashed IDs both at startup inventory hydration and after import refresh. |
| Notification QA in Settings | RECOVER | Restore a visible native-only test control that schedules an ephemeral notification in ~5 seconds without creating/saving a demo event, plus a path to Android notification settings. |
| Notification appearance | APK VERIFY | Preserve the previously approved notification appearance. Do not use notification recovery as an excuse to redesign unrelated UI or behavior. |
| Image open end-to-end | APK VERIFY | Import -> open -> close -> reopen app -> open again must work. |
| Microphone end-to-end | APK VERIFY | Permission request, record, stop/save and playback must work in the actual APK. |
| Persistence after reinstall/sign-in | APK VERIFY / SEPARATE AUDIT | Do not conflate Android update persistence with cloud restore. Supabase restore/sync must be audited separately before claiming reinstall recovery. |

## General Library decision

`feature/general-library-independent` / PR #12 is **not automatically part of this baseline**. It was implemented and tested separately but was not merged into the stable recovery line. `main` also contains later manual `GenericLibraryBridge` work. Do not merge either path wholesale during Android regression recovery.

If General Library is added later, integrate it as a separate reviewed change after the recovery APK passes this manifest.

## Notification visual reference

The approved concept uses the existing aérea notification language (normal / important / gentle behavior and the already-approved Android appearance). During recovery:

1. do not change unrelated event reminder logic while adjusting appearance;
2. do not replace the approved small notification icon/channel behavior with launcher-icon defaults;
3. verify the actual Samsung notification shade/lockscreen result on-device before marking this item complete.

## Mandatory regression gate for every future change

Before a recovery change can be considered approved:

1. Start from this consolidation branch or a descendant of its reviewed commit.
2. Make one scoped change; do not copy whole historical files over current files.
3. Review the complete `git diff`.
4. Run `git diff --check`.
5. Run `npm test`.
6. For APK delivery also run the Android steps required by `AGENTS.md`.
7. Verify the touched feature plus these high-risk regressions: images, microphone, notifications, Back, 12-hour time, post-it drag, Boca card, AO3, phone/tablet.
8. Add or strengthen a regression test when a bug is fixed.
9. Never delete a test just to make the build green.

## Rule for historical code

A historical branch/commit/APK may be inspected to understand an approved behavior, but it must **not** replace the current implementation wholesale. Recover the smallest necessary behavior on top of the baseline.
