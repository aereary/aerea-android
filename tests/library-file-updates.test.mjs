import test from 'node:test';
import assert from 'node:assert/strict';
import {applyNormalLibraryFiles} from '../app/library-file-updates.ts';
test('opening a normal file preserves private downloads in the shared session inventory',()=>{
 const download={id:'private',sourceWorkId:123,name:'Private EPUB',readerLocation:{chapter:4}};
 const normal={id:'normal',name:'PDF'};
 const opened={...normal,lastOpenedAt:'2026-11-14T23:00:00Z'};
 const result=applyNormalLibraryFiles([download,normal],[opened],new Set());
 assert.equal(result.find(f=>f.id==='private'),download);
 assert.equal(result.find(f=>f.id==='normal'),opened);
 const again=applyNormalLibraryFiles(result,[{...opened,favorite:true}],new Set());
 assert.equal(again.filter(f=>f.sourceWorkId).length,1);
});
test('normal removals and captured-file updates cannot remove or replace private downloads',()=>{
 const download={id:'private',sourceWorkId:123,name:'Private EPUB'};
 const result=applyNormalLibraryFiles([download,{id:'removed'}],[{id:'captured'},{id:'private',name:'wrong'}],new Set(['captured']));
 assert.deepEqual(result,[download]);
});
