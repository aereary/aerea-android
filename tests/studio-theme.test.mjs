import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { isNativeTheme, NATIVE_THEMES, NATIVE_THEME_IDS } from '../app/native-themes.ts';
const read = path => readFileSync(path,'utf8');

test('Studio is opt-in and keeps both existing interface identities', () => {
  assert.deepEqual(NATIVE_THEME_IDS, ['samsungminimal','samsungao3','studio']);
  assert.equal(isNativeTheme('studio'),true);
  assert.equal(isNativeTheme('storybook'),false);
  const theme=NATIVE_THEMES.find(theme=>theme.id==='studio');
  assert.ok(theme);
  assert.match(theme.name,/aérea Studio/);
  assert.match(read(`public${theme.art}`),/<svg/);
  assert.match(read('native.html'),/\["samsungminimal", "samsungao3", "studio"\]\.includes/);
});
test('Studio styles reach the compiled Android artifact and the web entry', () => {
  for(const entry of ['app/native-entry.tsx','app/layout.tsx']) assert.match(read(entry),/import "\.\/styles\/studio\.css"/);
  const css=readdirSync('native-shell/assets').filter(file=>file.endsWith('.css')).map(file=>read(`native-shell/assets/${file}`)).join('\n');
  assert.ok(css.includes('data-native-theme=studio'));
  assert.ok(css.includes('--one-page:#161616'));
  assert.ok(css.includes('.studio-wordmark'));
});
test('Studio supplies both color modes and never adds remote fonts or reader selectors', () => {
  const css=read('app/styles/studio.css');
  assert.match(css,/data-native-theme-mode="light"/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(css,/https?:|@import|ao3-|epub-|pdf-text-layer/);
  const selectors=css.replace(/\/\*[\s\S]*?\*\//g,'').match(/[^{}]+(?=\{)/g) || [];
  for(const selector of selectors.filter(selector=>!selector.trim().startsWith('@'))) assert.ok(selector.includes('data-native-theme="studio"'),selector);
});
