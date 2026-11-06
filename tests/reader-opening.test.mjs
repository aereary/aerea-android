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

test('hidden EPUB contents cannot collapse the reading page into the empty grid column',()=>{
 const css=readFileSync('app/globals.css','utf8');
 assert.match(css,/\.epub-paper\s*\{[^}]*grid-column:2;[^}]*min-width:0;/);
});

test('back-to-top stays outside the animated scrolling library layer',()=>{
 const library=readFileSync('app/ao3-library.tsx','utf8');
 const button=library.indexOf('className="ao3-back-to-top"');
 const layer=library.indexOf('ref={libraryLayerRef}');
 const end=library.indexOf('</section>',layer);
 assert.ok(button>end);
 assert.match(library,/z-index: 1201; display: grid;/);
 assert.match(library,/libraryLayerRef.current\?\.scrollTo\(\{ top: 0/);
});
