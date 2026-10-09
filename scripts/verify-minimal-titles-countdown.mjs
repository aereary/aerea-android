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
 const header=(name,methods)=>({name,methods:methods.map(name=>({name,rtype:'promise'}))});
 window.androidBridge={};window.Capacitor={PluginHeaders:[header('AereaAppIcons',['getCurrent','setIcon']),header('AereaStorage',['getState','putState','listSketches','listDocuments','finishLaunch','saveFile']),header('AereaWidget',['update']),header('AereaAuth',['consumePendingLink']),header('AereaEventNotifications',['schedule','status']),header('AereaSportsNotifications',['schedule','status']),header('SystemBars',['setStyle']),header('AereaNavigation',['exitApp','showExitHint']),{name:'AereaUpdates',methods:[{name:'getStatus',rtype:'promise'},{name:'check',rtype:'promise'},{name:'addListener',rtype:'callback'},{name:'removeListener',rtype:'promise'}]}],
 nativeCallback(){return Promise.resolve("qa-listener");},
 async nativePromise(plugin,method,options){if(plugin==='AereaAppIcons'){window.qaIconCalls ??=[];if(method==='getCurrent')return{id:localStorage.getItem('qa-icon')||'original'};window.qaIconCalls.push(options.id);await new Promise(r=>setTimeout(r,200));if(window.qaIconFail)throw new Error('Test failure');localStorage.setItem('qa-icon',options.id);return{id:options.id};}if(plugin==='AereaStorage'){if(method==='getState')return{state:JSON.stringify({state:window.qaState})};if(method==='putState')window.qaState=JSON.parse(options.state).state;if(method==='saveFile')return{id:'qa-file'};if(method==='listSketches')return{pages:[]};if(method==='listDocuments')return{files:[]};}if(plugin==='AereaUpdates')return{installedVersion:'0.114',installedCode:114,available:null,ready:false};return{};}};
 },{theme,mode,simplifiedCalendarMode,timing});
 const page=await context.newPage();await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='qa.local')return route.abort();const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});});
 await page.clock.install({time:new Date('2026-10-08T12:25:00')});await page.goto('https://qa.local/');await page.locator('.app-shell').waitFor();return{page,context};}





const results=[];
try {
 for(const [theme,mode,width] of [
  ['samsungao3','dark',393], ['samsungao3','dark',320],
  ['samsungminimal','dark',393], ['samsungminimal','dark',800],
  ['samsungminimal','light',393], ['samsungao3','light',393],
  ['otter','dark',393], ['storybook','dark',800],
 ]) {
  const {page,context}=await fixture(theme,mode,width,'no-preference',false,true);
  await page.waitForFunction(({theme,mode})=>{
   const shell=document.querySelector('.app-shell');
   return shell?.dataset.theme===theme && shell?.dataset.colorMode===mode;
  },{theme,mode});
  const hidden=['samsungminimal','samsungao3'].includes(theme)&&mode==='dark';
  for(const name of ['Habits','Journal','Spaces']) {
   await page.getByRole('button',{name,exact:true}).click();
   await page.locator('.screen-intro').waitFor();
   await page.waitForTimeout(400);
   assert.equal(await page.locator('.screen-sticker').isVisible(),!hidden,`${theme}/${mode}: ${name} title emoji`);
   if(name==='Habits') {
    const care=hidden?page.getByRole('button',{name:'Daily care',exact:true}):page.locator('.screen-sticker');
    await care.click();await page.getByRole('dialog',{name:'My daily rhythm'}).waitFor();
    await page.getByRole('button',{name:'Close daily rhythm'}).click();
    await page.locator('.health-routine-note').waitFor({state:'detached'});
   }
   if(name==='Spaces') {
    assert.equal(await page.locator('.space-icon:visible').count(),3,'Keep the individual space icons');
    if(theme==='samsungao3'&&mode==='dark'&&width===393)await page.screenshot({path:path.join(output,'minimal-spaces.png')});
   }
  }
  await page.getByRole('button',{name:'Today',exact:true}).click();
  const next=page.getByRole('region',{name:'Coming up next'});
  await page.waitForFunction(()=>document.querySelector('.coming-up-timing')?.textContent==='in 4:35');
  await page.waitForTimeout(400);
  const card=next.locator('.schedule-card');
  const reference=page.locator('.day-grid .schedule-card').filter({hasText:'Evening event'});
  const bounds=await card.boundingBox(),original=await reference.boundingBox();
  assert(bounds&&original);
  assert(Math.abs(bounds.height-original.height)<1,`${theme}: countdown card ${bounds.height}px vs original ${original.height}px`);
  const badge=await next.locator('.coming-up-timing').boundingBox();
  assert(badge&&badge.x>bounds.x+bounds.width/2,'Badge stays on the right');
  const border=await card.evaluate(e=>parseFloat(getComputedStyle(e).borderBottomWidth));
  assert(Math.abs(bounds.y+bounds.height-badge.y-badge.height-10-border)<2,`${theme}: badge bottom offset ${bounds.y+bounds.height-badge.y-badge.height}, border ${border}`);
  assert(badge.x+badge.width<=bounds.x+bounds.width,'Badge fits');
  if(theme==='samsungao3'&&mode==='dark'&&width===393)await page.screenshot({path:path.join(output,'compact-countdown.png')});
  await page.clock.setSystemTime(new Date('2026-10-08T17:00:00'));
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(()=>document.querySelector('.coming-up-timing')?.classList.contains('is-now'));
  assert(Math.abs((await card.boundingBox()).height-bounds.height)<1,'Now keeps the same height');
  assert.equal(await next.locator('.is-now').evaluate(e=>getComputedStyle(e).animationName),'coming-up-now-pulse');
  assert.equal(await next.locator('.is-now i').evaluate(e=>getComputedStyle(e).animationName),'none','The dot inherits the badge pulse without a second animation');
  if(theme==='samsungao3'&&mode==='dark'&&width===393)await page.screenshot({path:path.join(output,'compact-now.png')});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await next.locator('.is-now').evaluate(e=>getComputedStyle(e).animationName),'none','Reduced motion disables the entire pulse');
  results.push({theme,mode,width,titleEmojisHidden:hidden,countdownHeight:bounds.height,originalHeight:original.height});
  console.log('PASS',results.at(-1));
  await context.close();await browser.close();
 }
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
} finally {await browser?.close();}
