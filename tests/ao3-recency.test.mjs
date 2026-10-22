import assert from "node:assert/strict";
import test from "node:test";
import {
  AO3_NEW_WINDOW_MS, ao3NewUntil, isNewAo3Work,
  newAo3WorkIds, nextAo3BadgeExpiry,
} from "../app/ao3-recency.ts";

const added = "2026-10-22T05:00:00.000Z";
const start = Date.parse(added);

test("new works expire exactly 48 hours after their cloud insertion, across devices", () => {
  assert.equal(AO3_NEW_WINDOW_MS, 172_800_000);
  assert.equal(isNewAo3Work(added, start), true);
  assert.equal(isNewAo3Work(added, start + AO3_NEW_WINDOW_MS - 1), true);
  assert.equal(isNewAo3Work(added, start + AO3_NEW_WINDOW_MS), false);
  // A later launch/refresh always uses the same insertion date.
  assert.equal(isNewAo3Work(added, start + 3 * AO3_NEW_WINDOW_MS), false);
  assert.equal(ao3NewUntil(added), Date.parse("2026-10-24T05:00:00.000Z"));
});

test("legacy caches, invalid dates and future dates do not mark the entire shelf new", () => {
  for (const value of [undefined, null, "", "bad-date"]) {
    assert.equal(isNewAo3Work(value, start), false);
    assert.equal(ao3NewUntil(value), null);
  }
  assert.equal(isNewAo3Work("2026-10-23T05:00:00Z", start), false);
});

test("AO3 publication/modified dates cannot restart a work's new badge", () => {
  const work = { work_id: 1, created_at: "2026-09-01T00:00:00Z",
    updated_on: "2026-10-22", updated_at: added };
  assert.deepEqual([...newAo3WorkIds([work], start)], []);
});

test("a mixed series flags only its new members and schedules the next real expiry", () => {
  const works = [
    { work_id: 1, created_at: "2026-09-01T00:00:00Z" },
    { work_id: 2, created_at: added },
    { work_id: 3, created_at: "2026-10-21T05:00:00Z" },
    { work_id: 4 },
  ];
  assert.deepEqual([...newAo3WorkIds(works, start)], [2, 3]);
  assert.equal(nextAo3BadgeExpiry(works, start), Date.parse("2026-10-23T05:00:00Z"));
  assert.equal(nextAo3BadgeExpiry(works, start + AO3_NEW_WINDOW_MS), null);
});
