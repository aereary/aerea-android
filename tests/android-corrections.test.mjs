import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const manifest = await readFile(new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url), "utf8");
const storage = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java", import.meta.url), "utf8");
const notifications = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/AereaEventNotificationsPlugin.java", import.meta.url), "utf8");
const activity = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/MainActivity.java", import.meta.url), "utf8");
const microphone = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/AereaMicrophonePlugin.java", import.meta.url), "utf8");

test("Android Back closes layers, preserves real tab history, and double-confirms exit", () => {
  assert.match(activity, /getOnBackPressedDispatcher\(\)\.addCallback/);
  assert.match(page, /aereaAndroidBack/);
  assert.match(page, /Presiona Atrás otra vez para salir de aérea/);
  assert.match(page, /now - lastExitBackRef\.current <= 2000/);
  assert.match(page, /setTabHistory\(\(current\) => \[\.\.\.current, activeTab\]\)/);
});

test("event reminders use stable occurrence identities and survive system changes", () => {
  for (const label of ["At start time", "10 minutes before", "30 minutes before", "1 hour before", "1 day before"]) assert.match(notifications, new RegExp(label, "i"));
  assert.match(notifications, /event\.getString\("id"\) \+ ":" \+ day/);
  assert.match(notifications, /setExactAndAllowWhileIdle/);
  assert.match(notifications, /setAndAllowWhileIdle/);
  assert.match(notifications, /excludedDates/);
  assert.match(notifications, /customRepeatEvery/);
  assert.match(notifications, /scheduleQaNotification/);
  for (const action of ["BOOT_COMPLETED", "MY_PACKAGE_REPLACED", "TIME_SET", "TIMEZONE_CHANGED"]) assert.match(manifest, new RegExp(action));
  assert.match(page, /Las notificaciones están bloqueadas/);
});

test("Settings exposes the native 5-second QA notification without saving a demo event", () => {
  assert.match(page, /scheduleQaNotification\(options: \{ delaySeconds: number \}\)/);
  assert.match(page, /Test notifications/);
  assert.match(page, /Send test in 5 seconds/);
  assert.match(page, /delaySeconds: 5/);
  assert.match(page, /It does not create or save an event/);
  assert.match(notifications, /scheduleQaNotification/);
});

test("Study Library inventory cannot resurrect files that are still in Trash", () => {
  assert.match(page, /function isStudyFileTrashed/);
  assert.match(page, /const trashItemsRef = useRef<TrashItem\[\]>\(trashItems\)/);
  assert.match(page, /trashItemsRef\.current = trashItems/);
  const guards =
    page.match(/isStudyFileTrashed\(file\.id,\s*trashItemsRef\.current\)/g) ?? [];
  assert.equal(
    guards.length,
    2,
    "Trash filtering must guard both startup and post-import refresh",
  );
});

test("Start recording explicitly requests Android microphone permission before getUserMedia", () => {
  assert.match(manifest, /android\.permission\.RECORD_AUDIO/);
  assert.match(activity, /registerPlugin\(AereaMicrophonePlugin\.class\)/);
  assert.match(microphone, /name\s*=\s*"AereaMicrophone"/);
  assert.match(microphone, /Manifest\.permission\.RECORD_AUDIO/);
  assert.match(microphone, /requestPermissionForAlias\("microphone"/);
  assert.match(page, /registerPlugin<AereaMicrophonePlugin>\("AereaMicrophone"\)/);
  assert.match(page, /AereaMicrophone\.requestPermissions\(\)/);
  assert.match(page, /Please allow microphone access to record a class\./);
  const permissionIndex = page.indexOf("AereaMicrophone.requestPermissions()");
  const captureIndex = page.indexOf("navigator.mediaDevices.getUserMedia({ audio: true })");
  assert.ok(permissionIndex >= 0 && captureIndex > permissionIndex);
});

test("Library images are copied from the system picker without gallery-wide permission", () => {
  assert.match(storage, /ACTION_OPEN_DOCUMENT/);
  assert.match(storage, /OpenableColumns\.DISPLAY_NAME/);
  assert.match(storage, /application\/octet-stream/);
  for (const format of ["jpeg", "png", "webp", "gif", "heic", "heif", "avif"]) assert.match(storage, new RegExp(format));
  assert.match(storage, /FileProvider\.getUriForFile/);
  assert.doesNotMatch(manifest, /READ_EXTERNAL_STORAGE|READ_MEDIA_IMAGES/);
  const nativeLibraryRead = storage.slice(storage.indexOf("public void readFile"), storage.indexOf("public void deleteFile"));
  assert.doesNotMatch(nativeLibraryRead, /dataUrl|readAllBytes|Base64/);
});
