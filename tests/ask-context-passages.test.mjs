import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { answerQuery } from '../app/ask-aerea/core.ts';
import { epubPassageBatches, chapterDocuments, eligibleEpubFile } from '../app/ask-aerea/epub-passages.ts';
const now=new Date('2026-11-06T12:00:00Z');
const books=[1,2].map(workId=>({id:`ao3:${workId}`,workId,source:'library',kind:'AO3 work',title:`Book ${workId}`,author:`Author ${workId}`,text:'A quiet hospital reunion.',reference:`Book ${workId}`,fileNames:[`Book ${workId}.epub`],tags:['Fluff'],complete:workId===2}));

test('an ambiguous reference asks, then a number resumes the pending search on that book only',()=>{
 const first=answerQuery('Busca mis libros',books,undefined,now);
 const question=answerQuery('Busca hospital en ese libro',books,first.context,now);
 assert.match(question.text,/Which result/);assert.equal(question.operation,undefined);
 const resumed=answerQuery('el segundo',books,question.context,now);
 assert.equal(resumed.operation,'search');assert.equal(resumed.context.filter.workId,2);
 assert.deepEqual(resumed.hits.map(hit=>hit.document.workId),[2]);
 assert.equal(resumed.context.pendingQuery,undefined);
 const author=answerQuery('¿Quién lo escribió?',books,resumed.context,now);
 assert.match(author.text,/Author 2/);
 const opened=answerQuery('Abre ese libro',books,author.context,now);
 assert.equal(opened.open.workId,2);
});
test('a fresh search drops the old selected book and filters can be phrased naturally',()=>{
 const first=answerQuery('Busca mis libros',books,undefined,now);
 const chosen=answerQuery('el segundo',books,first.context,now);
 const next=answerQuery('Busca mis libros',books,chosen.context,now);
 assert.equal(next.context.selected,undefined);
 const finished=answerQuery('Terminados',books,next.context,now);
 assert.deepEqual(finished.hits.map(hit=>hit.document.workId),[2]);
 const missing=answerQuery('Busca hospital en ese libro',books,{hits:[]},now);
 assert.match(missing.text,/Search for it first/);
});
test('an exam reference retrieves the subject across notes instead of requiring the exam date',()=>{
 const exam={id:'exam',source:'calendar',kind:'Event',title:'Examen Termodinámica',text:'',reference:'Calendar',date:'2026-11-09'};
 const note={id:'note',source:'notes',kind:'Note',title:'Termodinámica formulas',text:'First law',reference:'Notes'};
 const first=answerQuery('Busca próximos exámenes',[exam,note],undefined,now);
 const answer=answerQuery('Busca apuntes para ese examen',[exam,note],first.context,now);
 assert.deepEqual(answer.hits.map(hit=>hit.document.id),['note']);
 assert.equal(answer.context.filter.day,undefined);
});
test('all chapter characters, including the last scene, occur in bounded overlapping batches',()=>{
 const chapter={...books[0],fileId:'local',chapter:'Final chapter',text:'a'.repeat(3600)+'The final hospital scene.'};
 const original=structuredClone(chapter);
 const batches=[...epubPassageBatches([chapter],3)];
 assert.ok(batches.length>1);assert.ok(batches.every(batch=>batch.length<=3));
 const passages=batches.flat();assert.ok(passages.every(p=>p.text.length<=600));
 assert.ok(passages.at(-1).text.includes('final hospital scene'));
 for(let offset=0;offset<chapter.text.length;offset++) assert.ok(passages.some(p=>{const start=Number(p.id.split(':').at(-1));return start<=offset&&offset<start+p.text.length;}));
 assert.deepEqual(chapter,original);
});
test('book-scoped reading cannot fall through to unrelated or ambiguously linked files',()=>{
 assert.equal(eligibleEpubFile({id:'one',name:'Book 1.epub'},{terms:[],workId:1},books),true);
 assert.equal(eligibleEpubFile({id:'two',name:'Book 2.epub'},{terms:[],workId:1},books),false);
 assert.equal(eligibleEpubFile({id:'unknown',name:'Other.epub'},{terms:[],workId:1},books),false);
 const docs=chapterDocuments({id:'one',name:'Book 1.epub'},[{id:'last',title:'Last',text:'Verified words.'}],books[0]);
 assert.equal(docs[0].workId,1);assert.equal(docs[0].text,'Verified words.');assert.match(docs[0].reference,/Last/);
});
test('full-content embedding has no persistent index operations and remains opt-in',()=>{
 const worker=readFileSync('app/ask-aerea/semantic.worker.ts','utf8');
 const branch=worker.slice(worker.indexOf('if (mode === "passages")'),worker.indexOf('const index = await readIndex()'));
 assert.doesNotMatch(branch,/await (readIndex|writeIndex)\(/);
 const panel=readFileSync('app/ask-aerea/ask-panel.tsx','utf8');
 assert.match(panel,/if \(!best && meaningEnabled && semanticAvailable\)/);
 assert.match(panel,/sceneRecall\(contentQuery\)/);
 assert.doesNotMatch(branch,/fetch\(|supabase|upload/);
});

test('searching for quoted command words cannot turn a scene request into an action',()=>{
 for(const query of ['Busca la frase "open 1" en mis libros', 'Busca "create an event" en mis libros']) {
  const answer=answerQuery(query,books,undefined,now);
  assert.equal(answer.operation,'search');assert.equal(answer.open,undefined);assert.equal(answer.draft,undefined);
 }
 const results=answerQuery('Busca mis libros',books,undefined,now);
 assert.equal(answerQuery('Abre el primero',books,results.context,now).open.workId,1);
});
