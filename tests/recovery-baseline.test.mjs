import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const planner = await readFile(new URL("../app/planner-logic.ts", import.meta.url), "utf8");
const capacitor = await readFile(new URL("../capacitor.config.ts", import.meta.url), "utf8");
const ao3 = await readFile(new URL("../app/ao3-library.tsx", import.meta.url), "utf8");

test("recovery baseline keeps Android identity and 12-hour planner time", () => {
  assert.match(capacitor, /appId:\s*"com\.aereaary\.aerea"/);
  assert.match(capacitor, /appName:\s*"aérea"/);
  assert.match(planner, /hours % 12 \|\| 12/);
  assert.match(planner, /hours >= 12 \? "PM" : "AM"/);
});

test("recovery baseline keeps Boca UI and center-based post-it dragging", () => {
  assert.match(page, /function BocaDayPocketTicket/);
  assert.match(page, /offsetX:\s*event\.clientX - centerX/);
  assert.match(page, /offsetY:\s*event\.clientY - centerY/);
});

test("recovery baseline keeps microphone recording wired", () => {
  assert.match(page, /navigator\.mediaDevices\?\.getUserMedia/);
  assert.match(page, /window\.MediaRecorder/);
  assert.match(page, /new MediaRecorder\(stream\)/);
  assert.match(page, /Stop & save/);
});

test("recovery baseline keeps AO3 in its dedicated implementation", () => {
  assert.match(page, /from "\.\/ao3-library"/);
  assert.match(page, /<Ao3Library/);
  assert.doesNotMatch(ao3, /generic-library-bridge/);
});
