import assert from "node:assert/strict";
import test from "node:test";
import { advanceLibraryScroll, initialLibraryScroll } from "../app/library-scroll.ts";

test("slow scrolling accumulates movement and tiny reversals do not flicker", () => {
  let state = advanceLibraryScroll(initialLibraryScroll(), 72, 1000);
  for (let y = 74; y < 136; y += 2) state = advanceLibraryScroll(state, y, 1000);
  assert.equal(state.hidden, false);
  state = advanceLibraryScroll(state, 136, 1000);
  assert.equal(state.hidden, true);
  for (const y of [133, 137, 131, 140, 138, 141]) state = advanceLibraryScroll(state, y, 1000);
  assert.equal(state.hidden, true);
  state = advanceLibraryScroll(state, 105, 1000);
  assert.equal(state.hidden, false);
});

test("elastic overscroll cannot toggle the toolbar and returning to the top reveals it", () => {
  let state = advanceLibraryScroll(initialLibraryScroll(), 1000, 1000);
  assert.equal(state.hidden, true);
  for (const y of [1100, 1040, 1000]) state = advanceLibraryScroll(state, y, 1000);
  assert.equal(state.hidden, true);
  state = advanceLibraryScroll(state, -20, 1000);
  assert.equal(state.hidden, false);
  assert.equal(state.y, 0);
});
