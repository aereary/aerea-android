// Run after npm run build:native, with Playwright/Chromium installed.
// Tests computed CSS in the built Android shell; no real user state or services.
// Isolated UI regression checks. Saved state and all native services are mocked.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.AEREA_QA_NODE_MODULES ? path.join(process.env.AEREA_QA_NODE_MODULES,'playwright') : 'playwright');
const root=fileURLToPath(new URL('../native-shell',import.meta.url));const output=fileURLToPath(new URL('../outputs/paper-notes-qa',import.meta.url));fs.mkdirSync(output,{recursive:true});
const launchBrowser=()=>chromium.launch({executablePath:process.env.AEREA_QA_BROWSER || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']});
let browser;
async function fixture(theme,mode,width=393,reducedMotion='no-preference',simplifiedCalendarMode=false,timing=false){
 browser=await launchBrowser();
 const context=await browser.newContext({viewport:{width,height:width<600?852:1100},hasTouch:true,isMobile:true,reducedMotion,serviceWorkers:'block'});
 await context.addInitScript(({theme,mode,simplifiedCalendarMode,timing})=>{
 localStorage.setItem('aerea-update-confirmation-seen','seen');localStorage.setItem('aerea-football-matches-v1',JSON.stringify([{external_event_id:'test-boca',team_key:'boca_juniors',match_date:'2026-10-06',kickoff_at:null,time_confirmed:false,home_team:'Boca Juniors',away_team:'Talleres',competition:'Argentina · Torneo Clausura 2026',venue:'Alberto J. Armando',status:'scheduled',home_score:null,away_score:null}]));
 window.qaState={classTimetable:{termName:'III',termDates:'',termStart:'2026-09-07',termEnd:'2026-12-26',classes:[{id:'qa-class',name:'Mechanical Technology',professor:'',color:'#ffe7a3',meetings:[{id:'qa-meeting',day:'wed',start:'17:45',end:'20:00',room:'I-13'}]}]},appTheme:theme,colorMode:mode,simplifiedCalendarMode,calendarEvents:Array.from({length:15},(_,i)=>({id:`routine-${i}`,date:'2026-10-06',title:i===0?'A long care routine title for testing':i===1?'💊':i===2?'🛁':'Routine '+i,time:'21:00',allDay:false,calendar:'Health',color:'cyan',repeat:'Daily',sourceType:'health-routine',healthRoutineGroupId:`care-${i}`,healthRoutineCadence:'daily',healthCompletedDates:[]})),entries:[{id:1,date:'October 6, 2026',mood:'(˶ᵔ ᵕ ᵔ˶)',text:'Task one and task two. The first is in module four and the second is in module five.'}],postIts:[{id:123,text:'Preserve this note',color:'pink',x:80,y:100,page:'journal'}]};
 if(timing)window.qaState.calendarEvents=[{id:'timing-first',date:'2026-10-08',time:'17:00',endTime:'20:00',title:'Evening event',calendar:'Personal',color:'lavender'},{id:'timing-second',date:'2026-10-08',time:'21:00',endTime:'22:00',title:'Later event',calendar:'Personal',color:'pink'}];
 const header=(name,methods)=>({name,methods:methods.map(name=>({name,rtype:'promise'}))});
 window.androidBridge={};window.Capacitor={PluginHeaders:[header('AereaAppIcons',['getCurrent','setIcon']),header('AereaStorage',['getState','putState','listSketches','listDocuments','finishLaunch','saveFile']),header('AereaWidget',['update']),header('AereaAuth',['consumePendingLink']),header('AereaEventNotifications',['schedule','status']),header('AereaSportsNotifications',['schedule','status']),header('SystemBars',['setStyle']),header('AereaNavigation',['exitApp','showExitHint']),{name:'AereaUpdates',methods:[{name:'getStatus',rtype:'promise'},{name:'check',rtype:'promise'},{name:'addListener',rtype:'callback'},{name:'removeListener',rtype:'promise'}]}],
 nativeCallback(){return Promise.resolve("qa-listener");},
 async nativePromise(plugin,method,options){if(plugin==='AereaAppIcons'){window.qaIconCalls ??=[];if(method==='getCurrent')return{id:localStorage.getItem('qa-icon')||'original'};window.qaIconCalls.push(options.id);await new Promise(r=>setTimeout(r,200));if(window.qaIconFail)throw new Error('Test failure');localStorage.setItem('qa-icon',options.id);return{id:options.id};}if(plugin==='AereaStorage'){if(method==='getState')return{state:JSON.stringify({state:window.qaState})};if(method==='putState')window.qaState=JSON.parse(options.state).state;if(method==='saveFile')return{id:'qa-file'};if(method==='listSketches')return{pages:[]};if(method==='listDocuments')return{files:[]};}if(plugin==='AereaUpdates')return{installedVersion:'0.114',installedCode:114,available:null,ready:false};return{};}};
 },{theme,mode,simplifiedCalendarMode,timing});
 const page=await context.newPage();await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='qa.local')return route.abort();const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});});
 await page.clock.install({time:new Date('2026-10-08T12:25:00')});await page.goto('https://qa.local/');await page.locator('.app-shell').waitFor();return{page,context};}





const results=[];
try {
 for(const [theme,mode,width] of [['samsungao3','dark',393],['samsungminimal','dark',800],['samsungminimal','light',393],['samsungao3','light',800],['otter','dark',393],['storybook','dark',800],['otter','light',320],['storybook','light',960]]) {
  const {page,context}=await fixture(theme,mode,width);
  await page.waitForFunction(({theme,mode})=>document.querySelector('.app-shell')?.dataset.theme===theme&&document.querySelector('.app-shell')?.dataset.colorMode===mode,{theme,mode});
  await page.getByRole('button',{name:'Journal',exact:true}).click();
  await page.locator('.entry-card-open').click();
  const card=page.locator('.note-detail-card');await card.waitFor();await page.waitForTimeout(450);
  const paper=!(['samsungao3','samsungminimal'].includes(theme)&&mode==='dark');
  const style=await card.evaluate(e=>{const c=getComputedStyle(e);return{background:c.backgroundImage,color:c.color,radius:c.borderBottomLeftRadius,handle:getComputedStyle(e,'::before').display,animation:c.animationName};});
  assert.equal(style.background.includes('repeating-linear-gradient'),paper,`${theme}/${mode} paper selection`);
  if(paper){assert.equal(style.radius,'28px');assert.equal(style.handle,'none');assert.equal(style.color,'rgb(52, 70, 80)');assert.equal(await card.locator('.note-detail-text').evaluate(e=>getComputedStyle(e).fontFamily),'Georgia, "Times New Roman", serif');}
  const box=await card.boundingBox();assert(box&&box.x>=0&&box.x+box.width<=width+1,'Fits viewport');
  assert.equal(style.animation,'one-sheet-rise','Entrance motion retained');
  await page.screenshot({path:path.join(output,`${theme}-${mode}-${width}.png`)});
  // Long note must scroll inside its own card without horizontal overflow.
  await card.evaluate(e=>{e.querySelector('.note-detail-text').textContent='Long note line.\n'.repeat(80)});
  const scroll=await card.evaluate(e=>{e.scrollTop=e.scrollHeight;return{y:e.scrollTop,w:e.scrollWidth,c:e.clientWidth}});assert(scroll.y>0);assert(scroll.w<=scroll.c+1);
  await page.getByRole('button',{name:'Close note'}).click();
  await page.locator('.sheet-presence[data-sheet-state="closing"] .note-detail-card').waitFor();
  await card.waitFor({state:'detached'});
  results.push({theme,mode,width,paper});console.log('PASS',results.at(-1));await context.close();await browser.close();
 }
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
} finally {await browser?.close();}
