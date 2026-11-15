import test from 'node:test';import assert from 'node:assert/strict';import{pdfChapterHeadings}from'../app/pdf-chapters.ts';
test('fallback chapter index targets source pages and ignores repeated running headings',()=>{
 assert.deepEqual(pdfChapterHeadings(['Chapter 1\n\nOpening','Chapter 1\n\nContinued','Capítulo II\n\nNext']),[{title:'Chapter 1',page:1,depth:0},{title:'Capítulo II',page:3,depth:0}]);
});
test('does not invent chapters for scanned pages or ordinary prose',()=>{assert.deepEqual(pdfChapterHeadings(['','They read chapter 2 yesterday.']),[])});
