import test from 'node:test';
import assert from 'node:assert/strict';
import { paperOpacity, restoreUnique } from '../app/minor-updates.ts';

test('legacy and invalid paper opacity stays visible; imported values are bounded', () => {
  for (const value of [undefined, NaN, Infinity, '0', null]) assert.equal(paperOpacity(value), 1);
  assert.equal(paperOpacity(0), .25);
  assert.equal(paperOpacity(.6), .6);
  assert.equal(paperOpacity(3), 1);
});
test('Undo restores exact note metadata, position and opacity without duplicates', () => {
  const note = { id: 'note', text: 'Study', color: 'dusk-plum', paperOpacity: .5, x: 27, y: 41, groupId: 'group' };
  const restored = restoreUnique([], note);
  assert.equal(restored[0], note);
  assert.equal(restoreUnique(restored, note), restored);
  const other = { id: 'other' };
  assert.deepEqual(restoreUnique(restored, other), [note, other]);
});
