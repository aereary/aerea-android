import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);
const features = await readFile(
  new URL("../app/aerea-features.ts", import.meta.url),
  "utf8",
);
const events = await readFile(
  new URL(
    "../android/app/src/main/java/com/aereaary/aerea/AereaEventNotificationsPlugin.java",
    import.meta.url,
  ),
  "utf8",
);
const eventReceiver = await readFile(
  new URL(
    "../android/app/src/main/java/com/aereaary/aerea/AereaEventNotificationReceiver.java",
    import.meta.url,
  ),
  "utf8",
);
const sports = await readFile(
  new URL(
    "../android/app/src/main/java/com/aereaary/aerea/AereaSportsNotificationsPlugin.java",
    import.meta.url,
  ),
  "utf8",
);
const manifest = await readFile(
  new URL("../android/app/src/main/AndroidManifest.xml", import.meta.url),
  "utf8",
);

test("class timetable automatically routes to a 30-minute reminder", () => {
  assert.match(
    page,
    /calendar: "Classes"[\s\S]{0,160}reminder: "30 minutes before"[\s\S]{0,120}repeat: "Weekly"/,
  );
});

test("hydration reminder schedules editable daily notification times", () => {
  assert.match(
    page,
    /DEFAULT_HYDRATION_NOTIFICATION_TIMES = \["10:00", "14:00", "18:00"\]/,
  );
  assert.match(page, /notificationTimesForReminder/);
  assert.match(page, /id: `hydration:\$\{reminder\.id\}:\$\{index\}`/);
  assert.match(page, /repeat: "Daily"/);
  assert.match(page, /Water notifications/);
  assert.match(page, /type="time"/);
});

test("match notifications are enabled by default and migrated once", () => {
  assert.match(features, /notifyBeforeMatches: true/);
  assert.match(page, /aerea-notification-defaults-v1/);
  assert.match(page, /notifyBeforeMatches: true/);
  assert.match(page, /notificationLeadMinutes/);
});

test("recurring native reminders roll forward one occurrence at a time", () => {
  assert.match(events, /LocalDate scanStart/);
  assert.match(events, /count\+\+;\s*break;/);
  assert.match(
    eventReceiver,
    /AereaEventNotificationsPlugin\.advanceStoredAfterDelivery\(context, identity\)/,
  );
  assert.match(events, /boolean cancelExisting/);
  assert.match(events, /oldIds\.remove\(deliveredIdentity\)/);
  assert.match(events, /cancelExisting \? new HashSet<>\(\) : new HashSet<>\(oldIds\)/);
});

test("Android exposes precise alarm access and sports uses exact alarms when allowed", () => {
  assert.match(manifest, /android\.permission\.SCHEDULE_EXACT_ALARM/);
  assert.match(events, /ACTION_REQUEST_SCHEDULE_EXACT_ALARM/);
  assert.match(page, /openExactAlarmSettings/);
  assert.match(page, /Precise timing/);
  assert.match(sports, /canScheduleExactAlarms/);
  assert.match(sports, /setExactAndAllowWhileIdle/);
  assert.match(sports, /setAndAllowWhileIdle/);
});
