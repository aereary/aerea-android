import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const data = readFileSync(new URL("../app/career-plan-data.ts", import.meta.url), "utf8");
const bridge = readFileSync(new URL("../app/career-plan-bridge.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const nativeEntry = readFileSync(new URL("../app/native-entry.tsx", import.meta.url), "utf8");
const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260910115136_add_aerea_academic_profile.sql",
    import.meta.url,
  ),
  "utf8",
);

test("career plan keeps the spreadsheet baseline intact", () => {
  assert.equal((data.match(/quarter: \d+, code:/g) ?? []).length, 72);
  assert.equal((data.match(/id: "baseline-/g) ?? []).length, 19);
  assert.match(data, /code: "IMP-75", name: "Termodinámica"/);
  assert.match(data, /code: "IMP-67", name: "Tecnología Mecánica"/);
  assert.match(data, /name: "Alena Baliga", rating: "avoid"/);
  assert.match(data, /name: "Edgar A Charris", rating: "maybe"/);
});

test("career plan is isolated from the protected page state", () => {
  assert.match(bridge, /querySelector<HTMLElement>\("\.timetable-card"\)/);
  assert.match(bridge, /data-aerea-career-plan-slot/);
  assert.match(bridge, /createPortal/);
  assert.match(bridge, /aereaAndroidBack/);
  assert.match(bridge, /aerea_academic_profile/);
  assert.match(bridge, /aerea-academic-profile-v1/);
  assert.match(bridge, /＋ Agregar profesor/);
  assert.match(bridge, /Horario/);
  assert.match(bridge, /Mi carrera/);
  assert.match(layout, /<CareerPlanBridge \/>/);
});

test("academic cloud state is private to the authenticated user", () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /auth\.uid\(\) = user_id/g);
  assert.match(migration, /revoke all on public\.aerea_academic_profile from anon/i);
});
