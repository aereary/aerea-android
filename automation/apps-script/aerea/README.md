# AÉREA Drive synchronizer

This folder mirrors the Google Apps Script project that synchronizes the Drive
library with Supabase. The live Apps Script project should only be updated from a
reviewed revision of these files.

## Script Properties

Configure these values in Apps Script **Project settings → Script properties**:

- `AEREA_DOWNLOADS_FOLDER_ID`
- `AEREA_FOLDER_ID`
- `AEREA_VERSIONS_FOLDER_ID`
- `AEREA_SUPABASE_FUNCTIONS_BASE_URL` (for example, the project functions URL
  ending in `/functions/v1`)

Folder IDs and environment URLs intentionally do not live in source control.

## Triggers

Keep one time-driven trigger for `aereaAutoSyncAll`. The synchronizer is
additive: it does not delete Drive files, works, or stored versions.

For near-real-time updates, deploy `drive-change-signal`, apply the companion
database migration, then run `aereaInstallDrivePushSync()` once. This adds:

- a Drive `changes.watch` notification channel, renewed before its one-week
  maximum expiration;
- a one-minute lightweight signal check that reads Drive's change feed and
  calls `aereaAutoSyncAll()` only for changes in the configured library folders;
- the existing ten-minute full sync as a fallback.

The push layer is read-only with respect to Drive. It does not move, rename,
delete, edit, or reorganize any file or folder, including Nianryna's folder.
