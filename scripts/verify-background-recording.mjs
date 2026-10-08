// Run after npm run build:native, with Playwright/Chromium installed.
// Tests computed CSS in the built Android shell; no real user state or services.
// Isolated UI regression checks. Saved state and all native services are mocked.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.AEREA_QA_NODE_MODULES ? path.join(process.env.AEREA_QA_NODE_MODULES,'playwright') : 'playwright');
const root=fileURLToPath(new URL('../native-shell',import.meta.url));const output=fileURLToPath(new URL('../outputs/compact-countdown-qa',import.meta.url));fs.mkdirSync(output,{recursive:true});
const launchBrowser=()=>chromium.launch({executablePath:process.env.AEREA_QA_BROWSER || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']});
let browser;
async function fixture(theme,mode,width=393,reducedMotion='no-preference',simplifiedCalendarMode=false,timing=false){
 browser=await launchBrowser();
 const context=await browser.newContext({viewport:{width,height:width<600?852:1100},hasTouch:true,isMobile:true,reducedMotion,serviceWorkers:'block'});
 await context.addInitScript(({theme,mode,simplifiedCalendarMode,timing})=>{
 localStorage.setItem('aerea-update-confirmation-seen','seen');localStorage.setItem('aerea-football-matches-v1',JSON.stringify([{external_event_id:'test-boca',team_key:'boca_juniors',match_date:'2026-10-06',kickoff_at:null,time_confirmed:false,home_team:'Boca Juniors',away_team:'Talleres',competition:'Argentina · Torneo Clausura 2026',venue:'Alberto J. Armando',status:'scheduled',home_score:null,away_score:null}]));
 window.qaState={classTimetable:{termName:'III',termDates:'',termStart:'2026-09-07',termEnd:'2026-12-26',classes:[{id:'qa-class',name:'Mechanical Technology',professor:'',color:'#ffe7a3',meetings:[{id:'qa-meeting',day:'wed',start:'17:45',end:'20:00',room:'I-13'}]}]},appTheme:theme,colorMode:mode,simplifiedCalendarMode,calendarEvents:Array.from({length:15},(_,i)=>({id:`routine-${i}`,date:'2026-10-06',title:i===0?'A long care routine title for testing':i===1?'💊':i===2?'🛁':'Routine '+i,time:'21:00',allDay:false,calendar:'Health',color:'cyan',repeat:'Daily',sourceType:'health-routine',healthRoutineGroupId:`care-${i}`,healthRoutineCadence:'daily',healthCompletedDates:[]})),postIts:[{id:123,text:'Preserve this note',color:'pink',x:80,y:100,page:'journal'}]};
 if(timing)window.qaState.calendarEvents=[{id:'timing-first',date:'2026-10-08',time:'17:00',endTime:'20:00',title:'Evening event',calendar:'Personal',color:'lavender'},{id:'timing-second',date:'2026-10-08',time:'21:00',endTime:'22:00',title:'Later event',calendar:'Personal',color:'pink'}];
 navigator.mediaDevices.getUserMedia=async()=>{window.qaWebCapture=true;throw Error('Android must never use WebView capture');}; const header=(name,methods)=>({name,methods:methods.map(name=>({name,rtype:'promise'}))});
 window.androidBridge={};window.Capacitor={convertFileSrc:path=>path.replace('file://','https://qa.local/_capacitor_file_'),PluginHeaders:[header('AereaMicrophone',['status','requestPermissions','recordingStatus','startRecording','stopRecording','acknowledgeRecordings','deleteRecording']),header('AereaAppIcons',['getCurrent','setIcon']),header('AereaStorage',['getState','putState','listSketches','listDocuments','finishLaunch','saveFile']),header('AereaWidget',['update']),header('AereaAuth',['consumePendingLink']),header('AereaEventNotifications',['schedule','status']),header('AereaSportsNotifications',['schedule','status']),header('SystemBars',['setStyle']),header('AereaNavigation',['exitApp','showExitHint']),{name:'AereaUpdates',methods:[{name:'getStatus',rtype:'promise'},{name:'check',rtype:'promise'},{name:'addListener',rtype:'callback'},{name:'removeListener',rtype:'promise'}]}],
 nativeCallback(){return Promise.resolve("qa-listener");},
 async nativePromise(plugin,method,options){
 if(plugin==='AereaMicrophone'){
 window.qaRecording ??= {recording:false,seconds:0,pending:[]};
 if(method==='status'||method==='requestPermissions')return {permission:window.qaDenied?'denied':'granted'};
 if(method==='startRecording') {window.qaRecording={recording:true,seconds:0,pending:[],started:Date.now(),session:options};window.qaStarts=(window.qaStarts||0)+1;}
 if(method==='stopRecording') {if(window.qaStopFails)throw Error('Test stop failure');const r=window.qaRecording;window.qaRecording={recording:false,seconds:0,pending:[{...r.session,id:123456,sessionId:'12345678-1234-1234-1234-123456789abc',duration:Math.floor((Date.now()-r.started)/1000),url:'file:///data/user/0/com.aereaary.aerea/files/class-recordings/qa.m4a'}]};}
 if(method==='acknowledgeRecordings') {window.qaAcknowledged=options.sessions;window.qaRecording.pending=window.qaRecording.pending.filter(r=>!options.sessions.includes(r.sessionId));}
 if(method==='deleteRecording'){window.qaDeleted=options.sessionId;return {};}
 return {...window.qaRecording,seconds:window.qaRecording.recording?Math.floor((Date.now()-window.qaRecording.started)/1000):0};
 }
if(plugin==='AereaAppIcons'){window.qaIconCalls ??=[];if(method==='getCurrent')return{id:localStorage.getItem('qa-icon')||'original'};window.qaIconCalls.push(options.id);await new Promise(r=>setTimeout(r,200));if(window.qaIconFail)throw new Error('Test failure');localStorage.setItem('qa-icon',options.id);return{id:options.id};}if(plugin==='AereaStorage'){if(method==='getState')return{state:JSON.stringify({state:window.qaState})};if(method==='putState'){if(window.qaSaveFails)throw Error('Test disk failure');window.qaState=JSON.parse(options.state).state;}if(method==='saveFile')return{id:'qa-file'};if(method==='listSketches')return{pages:[]};if(method==='listDocuments')return{files:[]};}if(plugin==='AereaUpdates')return{installedVersion:'0.114',installedCode:114,available:null,ready:false};return{};}};
 },{theme,mode,simplifiedCalendarMode,timing});
 const page=await context.newPage();await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='qa.local')return route.abort();const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});});
 await page.clock.install({time:new Date('2026-10-08T12:25:00')});await page.goto('https://qa.local/');await page.locator('.app-shell').waitFor();return{page,context};}





const {page,context}=await fixture('samsungao3','dark');
await page.getByRole('button',{name:'Spaces',exact:true}).click();
await page.getByRole('button',{name:/Recordings with notes Class recordings/}).click();
await page.getByRole('button',{name:'Start recording',exact:false}).waitFor();
await page.clock.runFor(1500);
await page.getByRole('textbox',{name:'Recording name',exact:true}).fill('Background lecture');
await page.evaluate(()=>{window.qaDenied=true;});
await page.getByRole('button',{name:'Start recording',exact:false}).click();
await page.clock.runFor(100);
assert.equal(await page.evaluate(()=>window.qaStarts||0),0);
await page.evaluate(()=>{window.qaDenied=false;});
await page.getByRole('button',{name:'Start recording',exact:false}).click();
await page.getByRole('button',{name:'Stop & save',exact:false}).waitFor();
assert.equal(await page.evaluate(()=>window.qaWebCapture||false),false);
await page.getByRole('button',{name:'Today',exact:true}).click();
await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.qaHidden?'hidden':'visible'});window.qaHidden=true;document.dispatchEvent(new Event('visibilitychange'));});
await page.clock.fastForward(65000);
assert.equal(await page.evaluate(()=>window.qaRecording.recording),true);
await page.evaluate(()=>{window.qaHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
await page.getByRole('button',{name:'Spaces',exact:true}).click();
await page.getByRole('button',{name:/Recordings with notes Class recordings/}).click();
await page.clock.runFor(1000);
assert.match(await page.locator('.record-controls strong').innerText(),/1:0[56]/);
await page.evaluate(()=>{window.qaStopFails=true;});
await page.getByRole('button',{name:'Stop & save',exact:false}).click();
await page.clock.runFor(100);
assert(await page.getByRole('button',{name:'Stop & save',exact:false}).isVisible());
await page.evaluate(()=>{window.qaStopFails=false;window.qaSaveFails=true;});
await page.getByRole('button',{name:'Stop & save',exact:false}).click();
await page.clock.runFor(3000);
assert.equal(await page.evaluate(()=>window.qaRecording.pending.length),1);
assert.equal(await page.locator('.audio-item').count(),1);
await page.evaluate(()=>{window.qaSaveFails=false;});
await page.clock.runFor(6500);
assert.equal(await page.evaluate(()=>window.qaRecording.pending.length),0);
assert.equal(await page.evaluate(()=>window.qaState.recordings.length),1);
assert.equal(await page.evaluate(()=>window.qaState.recordings[0].duration),66);
assert.equal(await page.locator('.audio-item').count(),1);
assert.equal(await page.locator('.audio-item audio').getAttribute('src'),'https://qa.local/_capacitor_file_/data/user/0/com.aereaary.aerea/files/class-recordings/qa.m4a');
// Stop from the Android notification while the WebView is hidden, then import on return.
await page.getByRole('textbox',{name:'Recording name',exact:true}).fill('Notification lecture');
await page.getByRole('button',{name:'Start recording',exact:false}).click();
await page.getByRole('button',{name:'Stop & save',exact:false}).waitFor();
await page.evaluate(()=>{window.qaHidden=true;document.dispatchEvent(new Event('visibilitychange'));});
await page.clock.fastForward(10000);
await page.evaluate(async()=>{
 await window.Capacitor.nativePromise('AereaMicrophone','stopRecording',{});
 // The service gives each recording a distinct ID.
 window.qaRecording.pending[0].id=123457;window.qaRecording.pending[0].sessionId='12345678-1234-1234-1234-123456789abd';
 window.qaHidden=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));
});
await page.clock.runFor(2000);
assert.equal(await page.locator('.audio-item').count(),2);
assert.equal(await page.evaluate(()=>window.qaState.recordings.length),2);
assert.equal(await page.evaluate(()=>window.qaState.recordings[0].name),'Notification lecture');
assert.equal(await page.evaluate(()=>window.qaState.recordings[0].duration),10);
await context.close();await browser.close();console.log('PASS native start, permission refusal, background/resume elapsed clock, failed stop, durable save retry, duplicate prevention, playback source, notification stop and import');
