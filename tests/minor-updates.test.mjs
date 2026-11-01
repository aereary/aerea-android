import test from 'node:test';
import assert from 'node:assert/strict';
import { paperInk, paperOpacity, restoreUnique } from '../app/minor-updates.ts';

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

test('the Android artifact ships the visual fixes instead of only the web layout', async () => {
  const { readFile, readdir } = await import('node:fs/promises');
  const cssFiles = (await readdir('native-shell/assets')).filter((file) => file.endsWith('.css'));
  const styles = (await Promise.all(cssFiles.map((file) => readFile(`native-shell/assets/${file}`, 'utf8')))).join('\n');
  for (const selector of ['.deletion-undo', '[data-paper-opacity]', '.health-done']) assert.ok(styles.includes(selector), `${selector} must reach the Android bundle`);
  const nativeEntry = await readFile('app/native-entry.tsx', 'utf8');
  const layout = await readFile('app/layout.tsx', 'utf8');
  for (const source of [nativeEntry, layout]) assert.match(source, /import "\.\/styles\/minor-updates\.css"/);
});

test('paper ink stays readable as pale and dark notes become transparent', () => {
  assert.equal(paperInk('#f6e2a9', 1, true), '#282337');
  assert.equal(paperInk('#f6e2a9', .25, true), '#f5eef5');
  assert.equal(paperInk('#52435f', 1, false), '#f5eef5');
  assert.equal(paperInk('#52435f', .25, false), '#282337');
});
