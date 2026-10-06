# Android updates inside aérea

The Android app checks the public `aereary/aerea-android` releases feed 2.5 seconds
after the planner is ready, and at most every six hours when returning to the app.
Offline checks fail silently. Settings → App updates → Check for updates checks
immediately and reports errors. Web builds do not expose this Android feature.

Preview releases are included deliberately. A release must have a complete
`aerea.apk` asset with its GitHub SHA-256 digest, a tag `aerea-v0.<run number>`, and
a higher Android version code than the installed app. The numbering remains
`260827000 + GITHUB_RUN_NUMBER`; publishing and signing stay in the existing
`build-apk.yml` workflow. Do not replace this with `/releases/latest`, which can
exclude preview releases. No GitHub access token is embedded in the app.

Download & install downloads to `cache/aerea-updates`, checks size, checksum,
package identity, version code and the installed signing certificate, then asks
Android to install the update. Android 8+ may first ask the user to allow updates
from aérea; returning after granting permission continues to the installer.
The user still confirms installation. Cancelling installation keeps the verified
APK available for retry for up to 24 hours. Cancelling a download removes its
partial file. A package-replaced receiver removes temporary update files after
successful installation; startup also removes expired/orphaned files. It never
clears planner state, SQLite, books, recordings, images or other caches.

The first APK containing this updater must be installed manually. It will not
prompt to reinstall its own version. Publish a later stable-signed preview to
exercise the complete update flow.

## Verification

- `npm ci`, `npm test`, `npm run check:types`, `npm run lint`, `git diff --check`.
- `npx cap sync android`, then `./gradlew testDebugUnitTest assembleDebug --stacktrace`.
- `node scripts/verify-app-updates.mjs` after a native build with Playwright and Chromium available.
  This uses an isolated mocked Android bridge, never a user account or a real installer.
- On a real phone/tablet: install this APK manually; save a note/import a book;
  publish a newer preview with the same signing key; open the app; Later/Back must
  leave the current page unchanged. Check in Settings, download, deny/grant the
  install permission, cancel/retry installation, then confirm Update. Verify
  version, saved data, both widgets, and removal of `cache/aerea-updates` files.
- Also test offline startup, interrupted download, a full cache, a corrupted APK,
  and a differently signed APK. Failed verification must never open the installer.
