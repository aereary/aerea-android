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

## Trigger

Keep one time-driven trigger for `aereaAutoSyncAll`. The synchronizer is
additive: it does not delete Drive files, works, or stored versions.
