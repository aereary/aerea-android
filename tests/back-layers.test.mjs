import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/back-layers.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createBackLayerStack } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const event = () => ({ prevented: 0, stopped: 0, preventDefault() { this.prevented++; }, stopImmediatePropagation() { this.stopped++; } });

test("Back reaches page history only when no local sheet is open", () => {
  const stack = createBackLayerStack();
  const back = event();
  assert.equal(stack.consume(back), false);
  assert.equal(back.prevented + back.stopped, 0);
  const closed = [];
  const release = stack.register(() => closed.push("reminder"), 10);
  assert.equal(stack.consume(back), true);
  assert.deepEqual(closed, ["reminder"]);
  assert.equal(back.prevented, 1);
  assert.equal(back.stopped, 1);
  release(); release();
  assert.equal(stack.size, 0);
  assert.equal(stack.consume(event()), false);
});

test("Back closes the top degree overlay before its underlying timetable", () => {
  const stack = createBackLayerStack();
  const closed = [];
  const releaseDegree = stack.register(() => closed.push("degree"), 20);
  stack.register(() => closed.push("timetable"), 10);
  stack.consume(event());
  assert.deepEqual(closed, ["degree"]);
  releaseDegree();
  stack.consume(event());
  assert.deepEqual(closed, ["degree", "timetable"]);
});

test("the most recently opened sheet wins equal priority without closing two layers", () => {
  const stack = createBackLayerStack();
  const closed = [];
  stack.register(() => closed.push("older"), 10);
  const release = stack.register(() => closed.push("newer"), 10);
  stack.consume(event());
  assert.deepEqual(closed, ["newer"]);
  release();
  stack.consume(event());
  assert.deepEqual(closed, ["newer", "older"]);
});
