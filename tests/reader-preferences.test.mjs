import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeReaderPreferences,readerDefaults,readerFraction,readerTapDirection} from '../app/reader-preferences.ts';
import {pdfReadingText} from '../app/pdf-reading-text.ts';
test('corrupt or older reading preferences recover usable defaults',()=>{
 assert.deepEqual(normalizeReaderPreferences(null),readerDefaults);
 const prefs=normalizeReaderPreferences({font:'missing-font',fontSize:900,lineHeight:NaN,width:-1,theme:'night',tapBack:false,plain:'false'});
 assert.equal(prefs.font,'serif');assert.equal(prefs.fontSize,40);assert.equal(prefs.lineHeight,1.7);assert.equal(prefs.width,320);assert.equal(prefs.theme,'night');assert.equal(prefs.tapBack,false);assert.equal(prefs.plain,false);
});
test('tap zones preserve a centre area for revealing controls and support previous page',()=>{
 assert.equal(readerTapDirection(50,50,100,100,readerDefaults),0);
 const p={...readerDefaults,tap:'right'};
 assert.equal(readerTapDirection(90,80,100,100,p),1);
 assert.equal(readerTapDirection(90,10,100,100,p),-1);
 assert.equal(readerTapDirection(10,80,100,100,p),0);
 assert.equal(readerTapDirection(50,80,100,100,{...p,mode:'pages'}),0);
 assert.equal(readerTapDirection(10,80,100,100,{...p,mode:'pages'}),-1);
});
test('reading offsets remain bounded at elastic edges and for short chapters',()=>{
 assert.equal(readerFraction(-10,1000,500),0);assert.equal(readerFraction(900,1000,500),1);assert.equal(readerFraction(250,1000,500),.5);assert.equal(readerFraction(0,200,500),0);
});
test('PDF reflow joins wrapped lines and keeps paragraph gaps without fabricating scanned text',()=>{
 assert.equal(pdfReadingText([]),'');
 const item=(str,y)=>({str,hasEOL:true,height:10,transform:[1,0,0,10,0,y]});
 assert.equal(pdfReadingText([item('A line',100),item('continues here.',88),item('New paragraph.',60)]),'A line continues here.\n\nNew paragraph.');
});
