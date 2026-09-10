import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const globalsCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const studyLibrary = await readFile(new URL("../app/study-library.tsx", import.meta.url), "utf8");
const ao3Library = await readFile(new URL("../app/ao3-library.tsx", import.meta.url), "utf8");
const features = await readFile(new URL("../app/aerea-features.ts", import.meta.url), "utf8");
const manifest = await readFile(new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url), "utf8");
const storage = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/AereaStoragePlugin.java", import.meta.url), "utf8");
const notifications = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/AereaEventNotificationsPlugin.java", import.meta.url), "utf8");
const activity = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/MainActivity.java", import.meta.url), "utf8");
const microphone = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/AereaMicrophonePlugin.java", import.meta.url), "utf8");
const navigation = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/AereaNavigationPlugin.java", import.meta.url), "utf8");
const notificationReceiver = await readFile(new URL("../android/app/src/main/java/com/aereaary/aerea/AereaEventNotificationReceiver.java", import.meta.url), "utf8");

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
  assert.match(manifest, /android\.permission\.MODIFY_AUDIO_SETTINGS/);
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

test("blocked Android microphone permission opens app settings instead of failing silently", () => {
  assert.match(microphone, /PermissionState\.DENIED/);
  assert.match(microphone, /Settings\.ACTION_APPLICATION_DETAILS_SETTINGS/);
  assert.match(microphone, /Uri\.parse\("package:" \+ getContext\(\)\.getPackageName\(\)\)/);
  assert.match(
    microphone,
    /state == PermissionState\.DENIED[\s\S]{0,260}openAppPermissionSettings\(\)/,
  );
  assert.match(
    microphone,
    /permissionResult\(PluginCall call\)[\s\S]{0,260}PermissionState\.DENIED[\s\S]{0,180}openAppPermissionSettings\(\)/,
  );
});

test("approved Android notification and Back hint keep native compact appearance", () => {
  assert.match(page, /AereaNavigation\.showExitHint\(\{ message: exitHint \}\)/);
  assert.match(navigation, /Toast\.makeText\(getContext\(\), message, Toast\.LENGTH_SHORT\)\.show\(\)/);
  assert.match(notifications, /Prueba de notificación de aérea/);
  assert.match(notifications, /Tu notificación de prueba está funcionando/);
  assert.match(notifications, /return pending\(c, id, title, "Tu evento comienza pronto", trigger, mode\)/);
  assert.match(notificationReceiver, /new NotificationCompat\.Builder\(context, CHANNEL_ID\)/);
  assert.match(notificationReceiver, /setSmallIcon\(R\.drawable\.ic_notification_aerea\)/);
  assert.doesNotMatch(notificationReceiver, /RemoteViews|setCustomContentView|DecoratedCustomViewStyle/);
});

test("Android email-link sign-in immediately reloads the persisted day for Supabase restore", () => {
  assert.match(
    page,
    /handleAereaAuthCallback\(url\)[\s\S]{0,900}currentAereaEmail\(\)[\s\S]{0,900}Private sync is on\. Reloading your saved day…[\s\S]{0,200}window\.location\.reload\(\)/,
  );
  const reloads = page.match(/window\.location\.reload\(\)/g) ?? [];
  assert.ok(
    reloads.length >= 2,
    "both manual OTP and Android email-link auth should reload into startup reconciliation",
  );
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

test("Import a file recognizes Android images by extension and routes them to the image viewer path", () => {
  assert.match(features, /export function normalizedFileMimeType/);
  for (const format of ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"]) {
    assert.match(features, new RegExp(`${format}: "image/`));
  }
  assert.match(features, /reportedType !== "application\/octet-stream"/);
  assert.match(features, /mimeType\.startsWith\("image\/"\)/);
  assert.match(page, /normalizedFileMimeType,\s+inferInboxKind/);
  assert.match(
    page,
    /const importLibraryFile = async \(file: File\)[\s\S]{0,500}const mimeType = normalizedFileMimeType\(file\)[\s\S]{0,500}AereaStorage\.saveFile\(\{[\s\S]{0,250}mimeType,/,
  );
  assert.match(
    page,
    /const importStudyFiles = async \(files: File\[\]\)[\s\S]{0,650}if \(fileKind\(file\) === "image"\) \{[\s\S]{0,120}await importLibraryFile\(file\);[\s\S]{0,80}continue;/,
  );
  assert.match(
    page,
    /const capturedFile = libraryItems\.find\([\s\S]{0,180}if \(capturedFile\) \{[\s\S]{0,100}openLibraryItem\(capturedFile\)/,
  );
});

test("Library images stay images in cards and legacy imported JPGs open in the image viewer", () => {
  assert.match(studyLibrary, /kind: "pdf" \| "epub" \| "image" \| "file"/);
  assert.match(studyLibrary, /function studyFileIsImage/);
  assert.match(studyLibrary, /file\.kind === "image"/);
  assert.match(studyLibrary, /"IMAGE"/);
  assert.match(studyLibrary, /"Open image"/);

  assert.match(
    page,
    /function libraryItemAsStudyFile[\s\S]{0,450}item\.kind === "image"[\s\S]{0,80}\? "image"/,
  );
  assert.match(
    page,
    /const openStudyFile = async[\s\S]{0,1500}normalizedFileMimeType\(\{[\s\S]{0,120}name: readableFile\.name,[\s\S]{0,120}type: readableFile\.mediaType,[\s\S]{0,160}readableMimeType\.startsWith\("image\/"\)[\s\S]{0,500}setSelectedLibraryItem\(\{[\s\S]{0,180}kind: "image"/,
  );
});

test("native Library images use Capacitor's WebView-safe src and the styled reader structure", () => {
  assert.match(
    page,
    /selectedLibraryItem\.nativeContentUri[\s\S]{0,120}Capacitor\.convertFileSrc\(selectedLibraryItem\.nativeContentUri\)/,
  );
  assert.doesNotMatch(
    page,
    /src=\{selectedLibraryItem\.nativeContentUri \|\| selectedLibraryItem\.dataUrl\}/,
  );
  assert.match(page, /library-reader-modal/);
  assert.match(page, /className="library-reader-header"/);
  assert.match(
    page,
    /<aside className="library-reader-panel">[\s\S]{0,200}<nav aria-label="Reader tools">/,
  );
});


test("image-only Library viewer stays compact and hides document reader tools", () => {
  assert.match(page, /library-image-viewer/);
  assert.match(globalsCss, /AEREA_RECOVERY_FIX_006D/);
  assert.match(
    globalsCss,
    /\.library-reader-modal\.library-image-viewer[\s\S]{0,320}height:\s*auto/,
  );
  assert.match(
    globalsCss,
    /\.library-image-viewer \.library-reader-panel\s*\{[\s\S]{0,100}display:\s*none/,
  );
  assert.match(
    globalsCss,
    /\.library-image-viewer \.library-document-stage > img[\s\S]{0,320}max-height:\s*58dvh/,
  );
});


test("importing a Library image does not hide recordings by forcing the Files filter", () => {
  const start = studyLibrary.indexOf("const importDocuments = async");
  const end = studyLibrary.indexOf("const hasNote =", start);
  assert.ok(start >= 0 && end > start, "importDocuments must exist");
  const importBlock = studyLibrary.slice(start, end);

  assert.match(importBlock, /await onImportFiles\(selected\)/);
  assert.doesNotMatch(importBlock, /setFilter\("files"\)/);
  assert.match(importBlock, /now in Library/);
});


test("native Library toast clears the elevated Android bottom navigation", () => {
  assert.match(
    globalsCss,
    /AEREA_RECOVERY_FIX_008[\s\S]{0,320}html\[data-native="true"\] \.study-library-toast[\s\S]{0,140}bottom:\s*calc\(96px \+ var\(--aerea-safe-area-bottom\)\)/,
  );
});

test("native touch UX does not auto-focus editors or select interface chrome", () => {
  assert.doesNotMatch(page, /\bautoFocus\b/);
  assert.doesNotMatch(studyLibrary, /\bautoFocus\b/);
  assert.doesNotMatch(ao3Library, /\bautoFocus\b/);

  assert.match(globalsCss, /AEREA_RECOVERY_FIX_009/);
  assert.match(
    globalsCss,
    /html\[data-native="true"\] \.app-shell[\s\S]{0,220}user-select:\s*none/,
  );
  assert.match(
    globalsCss,
    /input,[\s\S]{0,120}textarea,[\s\S]{0,160}\[contenteditable="true"\][\s\S]{0,300}user-select:\s*text/,
  );
  assert.match(globalsCss, /html\[data-native="true"\] \.study-reader/);
  assert.match(globalsCss, /html\[data-native="true"\] \.ao3-library-layer/);
});


test("Site sync keeps Home and compact calendar Sunday-first", () => {
  assert.match(
    page,
    /function weekForDate[\s\S]{0,360}const sundayOffset = anchor\.getDay\(\)[\s\S]{0,220}new Date\(sunday\)/,
  );
  assert.match(
    page,
    /const leadingDays =\s*new Date\(calendarYear, calendarMonth, 1\)\.getDay\(\)/,
  );
  assert.match(
    page,
    /\["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"\]\.map/,
  );
  assert.match(
    page,
    /function scheduleDatesFor[\s\S]{0,260}mondayOffset/,
    "Cronograma keeps its approved Monday-first week",
  );
});


test("Site sync uses approved emojis for Library and Calendar", () => {
  assert.match(page, /title="Library"[\s\S]{0,180}icon="📚"/);
  assert.match(page, /title="Calendar"[\s\S]{0,180}icon="🗓️"/);
});

test("class timetable owns recurring Calendar class events", () => {
  assert.match(page, /termStart: string;[\s\S]{0,100}termEnd: string;/);
  assert.match(page, /sourceType\?: "timetable";[\s\S]{0,120}timetableClassId\?: string;/);
  assert.match(page, /function timetableClassCalendarEvent[\s\S]{0,1000}repeat: "Weekly"[\s\S]{0,180}repeatUntil: timetable\.termEnd/);
  assert.match(page, /id: `timetable-event:\$\{classItem\.id\}`/);
  assert.match(page, /calendar: "Classes"/);
  assert.match(page, /event\.sourceType !== "timetable"/);
});

test("class timetable requires real semester dates for recurrences", () => {
  assert.match(page, /<span>Semester starts<\/span>[\s\S]{0,140}type="date"/);
  assert.match(page, /<span>Semester ends<\/span>[\s\S]{0,140}type="date"/);
  assert.match(page, /timetableDraft\.classes\.length > 0 && !timetableDateRangeValid/);
  assert.match(page, /timetableTermDateLabel\(classTimetable\)/);
});

test("deleting a timetable class removes its generated Calendar series on semester save", () => {
  assert.match(page, /deleteTimetableClass[\s\S]{0,340}classItem\.id !== classId/);
  assert.match(page, /setClassTimetable\(nextTimetable\)/);
  assert.match(page, /return unchanged \? current : \[\.\.\.manualEvents, \.\.\.generated\]/);
});
