import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=file=>ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const url=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

test('the passage worker returns original evidence and never opens the persistent index', async()=>{
 // Deterministic vectors test the worker protocol/privacy, not model quality.
 const original={self:globalThis.self,caches:globalThis.caches,indexedDB:globalThis.indexedDB};
 const replies=[];
 globalThis.self={location:{href:'https://local.invalid/worker.js'},postMessage:message=>replies.push(message)};
 globalThis.caches={open:async()=>({})};
 globalThis.indexedDB={open:()=>{throw new Error('Passage vectors must stay ephemeral');}};
 try {
  const core=url(compile('app/ask-aerea/core.ts'));
  const semantic=url(compile('app/ask-aerea/semantic-core.ts').replace('"./core"',JSON.stringify(core)));
  const worker=compile('app/ask-aerea/semantic.worker.ts')
   .replace(/^import .*from "@huggingface\/transformers";$/m,`const env={backends:{onnx:{wasm:{}}}}; const pipeline=async()=>async(texts)=>({tolist:()=>texts.map(text=>/hospital|medical ward/.test(text)?[1,0]:[0,1])});`)
   .replace(/^import wasmUrl .*;$/m,'const wasmUrl="test.wasm";')
   .replace(/^import moduleUrl .*;$/m,'const moduleUrl="test.mjs";')
   .replace('"./core"',JSON.stringify(core)).replace('"./semantic-core"',JSON.stringify(semantic));
  await import(url(worker));
  await self.onmessage({data:{id:7,mode:'passages',query:'Recuerdo una escena hospital',now:'2026-11-06T12:00:00Z',documents:[
   {id:'epub:one:0',source:'library',kind:'EPUB passage',title:'Book',fileId:'one',chapter:'Chapter 9',text:'A walk through the desert.',reference:'Book · Chapter 9'},
   {id:'epub:one:6000',source:'library',kind:'EPUB passage',title:'Book',fileId:'one',chapter:'Chapter 9',text:'A reunion in the medical ward.',reference:'Book · Chapter 9'}
  ]}});
  const reply=replies.find(message=>message.passage||message.error);
  assert.equal(reply.error,undefined);
  assert.equal(reply.passage.excerpt,'A reunion in the medical ward.');
  assert.equal(reply.passage.document.fileId,'one');
  assert.equal(reply.passage.document.chapter,'Chapter 9');
  assert.equal(reply.passage.match,'semantic');
 } finally {
  for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
 }
});
