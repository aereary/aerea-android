# Generic library content publisher

`library-content-publish` copies an already-indexed generic Drive file into the
private `aerea-drive-library` bucket. It never changes the source
`storage_path`, never removes an object, and never inserts or removes library
rows.

The endpoint expects a Google OAuth access token in `Authorization` and a JSON
body containing the current Drive identity and expected content digest:

```json
{
  "drive_file_id": "153WoAnQLO4CLNDnRJ8cTahywdji4OV1r",
  "sha256": "E6CE405331288C9771EF70EEDDF8D687A170BEBAC6E0B002D1F6A1833023BEEE",
  "metadata": {
    "filename": "The Little Prince - Antoine de Saint-Exupéry - EPUB.epub"
  }
}
```

`GenericLibrary.gs` must call the endpoint for every valid current generic
item after `aereaGenericSync`, not only the items reported as new or updated.
That makes a zero-change sync repair missing private content automatically.
The Apps Script call should use `ScriptApp.getOAuthToken()` and keep failures as
warnings so a later sync can retry:

```javascript
function aereaPublishGenericContent_(items) {
  const endpoint =
    "https://wislppgaikbxgibrjizz.supabase.co/functions/v1/library-content-publish";
  const token = ScriptApp.getOAuthToken();

  return items.map(function (item) {
    const response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify({
        drive_file_id: item.drive_file_id,
        sha256: item.sha256,
        metadata: {
          filename: item.filename,
          mime_type: item.mime_type,
          extension: item.extension
        }
      }),
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();
    const body = JSON.parse(response.getContentText() || "{}");
    return status >= 200 && status < 300
      ? { ok: true, drive_file_id: item.drive_file_id, result: body }
      : { ok: false, drive_file_id: item.drive_file_id, status: status, warning: body };
  });
}
```

The existing Apps Script source is intentionally not duplicated here. Apply
the helper and its unconditional post-sync call only inside the existing
`GenericLibrary.gs`; do not edit the stable `Code.gs` file.
