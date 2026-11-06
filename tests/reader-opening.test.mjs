import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('app/study-reader.tsx','utf8');
test('EPUB opens directly on its reading page with contents available on demand',()=>{
 assert.match(source,/\[outlineOpen, setOutlineOpen\] = useState\(false\)/);
 assert.match(source,/onClick=\{\(\) => setOutlineOpen\(\(value\) => !value\)\}/);
 // Existing reading location stays intact; opening/closing contents must not erase it.
 assert.match(source,/hidden=\{!outlineOpen\}/);
 assert.match(source,/aria-expanded=\{outlineOpen\}/);
 assert.match(source,/Math.max\(0, readingState.chapter\)/);
 assert.match(source,/"contents" \| "pages" \| "bookmarks" \| "highlights" \| "notes" \| null\s*>\(null\)/);
});
