import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const load=async name=>import('data:text/javascript;base64,'+Buffer.from(ts.transpile(readFileSync(new URL('../app/'+name,import.meta.url),'utf8'),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022})).toString('base64'));
const {matchesAllTags,suggestTags}=await load('ao3-search.ts');
test('tag intersection requires every tag on the same work, never across a series',()=>{assert.equal(matchesAllTags(['Omega','Comfort'],['omega','comfort']),true);assert.equal(matchesAllTags(['Omega'],['Omega','Comfort']),false);assert.equal(matchesAllTags(['Omega'],['Omegaverse']),false);assert.equal(matchesAllTags([],[]),true)});
test('suggestions are real remaining intersections, omit selected tags, and prefer prefixes',()=>{const works=[{tags:['Omega','Comfort']},{tags:['Omega','Cold']},{tags:['Other']}];assert.deepEqual(suggestTags(works,'co',['Omega']).map(x=>x.tag),['Cold','Comfort']);assert.deepEqual(suggestTags(works,'ome',['Omega']),[]);assert.deepEqual(suggestTags(works,'not here',[]),[])});
test('PIN verifies, rejects wrong PIN, changes and removes only with current PIN',async()=>{const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};const {readPin,checkPin,changePin}=await load('private-shelf-pin.ts');assert.equal(readPin(),null);await changePin('','12345678');assert.equal(await checkPin('00000000'),false);assert.equal(await checkPin('12345678'),true);await assert.rejects(changePin('wrong','87654321'));await changePin('12345678','87654321');assert.equal(await checkPin('12345678'),false);assert.equal(await checkPin('87654321'),true);await changePin('87654321','');assert.equal(readPin(),null);await changePin('','12345678');for(let i=0;i<5;i++)await checkPin('bad');await assert.rejects(checkPin('12345678'),/wait one minute/);memory.set('aerea-private-shelf-pin-v1','bad');assert.throws(readPin);});
// Fingerprints of the approved UI from the integration base. Kept here so CI
// and source ZIPs can verify the contract without any Git history or binary.
// Normalize Windows line endings, but retain every other source byte.
const approvedCardsSha256 = '52831974374ce9c1cbf3742b1ec6b7e210bc5bc1220de75fdcb7905707c4394f';
const approvedCssSha256 = '4ba0efca81781cdc02953681e6f9f2ead02a74257016a1f50aadece885162c9d';
const sha256 = value => createHash('sha256').update(value.replace(/\r\n/g, '\n')).digest('hex');
test('existing cards and CSS remain unchanged from approved baseline', () => {
  const current = readFileSync(new URL('../app/ao3-library.tsx', import.meta.url), 'utf8');
  const cardsStart = current.indexOf('function TagCloud(');
  const cardsEnd = current.indexOf('function Ao3SearchInput(');
  const cssRoot = current.indexOf('const AO3_LIBRARY_CSS');
  const cssStart = cssRoot < 0 ? -1 : current.indexOf('.ao3-back-to-top,', cssRoot);
  assert.ok(cardsStart >= 0 && cardsEnd > cardsStart, 'Approved card component boundaries are missing');
  assert.ok(cssStart >= 0, 'Approved library CSS boundary is missing');
  assert.equal(sha256(current.slice(cardsStart, cardsEnd)), approvedCardsSha256, 'Existing card components changed; review the approved design before updating this fingerprint');
  assert.equal(sha256(current.slice(cssStart)), approvedCssSha256, 'Existing library CSS changed; review the approved design before updating this fingerprint');
});

test('Ask cannot bypass the private shelf with a cached catalog or conversation',()=>{const panel=readFileSync(new URL('../app/ask-aerea/ask-panel.tsx',import.meta.url),'utf8');assert.match(panel,/privateCatalogLocked\(\)/);assert.match(panel,/catalog.current = null; context.current = \{ hits: \[\] \}/);assert.match(panel,/enabled.includes\("library"\) && !privateLocked/);});

test('four-digit PINs are accepted and shorter PINs are rejected',async()=>{const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};const {changePin,checkPin}=await load('private-shelf-pin.ts');await assert.rejects(changePin('','123'));await changePin('','0123');assert.equal(await checkPin('0123'),true);});
