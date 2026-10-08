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





for (const [theme,mode,width] of [['samsungao3','dark',393],['samsungminimal','dark',320],['samsungminimal','dark',800],['samsungao3','light',393]]) {
 const {page,context}=await fixture(theme,mode,width);
 await page.getByRole('button',{name:'Hold to open your interactive class schedule',exact:true}).press('Enter');
 await page.getByRole('button',{name:'My degree',exact:true}).click();
 const degree=page.getByRole('dialog',{name:'My degree',exact:true});await degree.waitFor();
 await degree.getByRole('button',{name:'Plan',exact:true}).click();
 await degree.locator('[class*="quarterHead"]').nth(2).click();
 const colors=await degree.locator('[class*="quarter_"]').nth(2).evaluate(e=>({background:getComputedStyle(e).backgroundColor,panel:getComputedStyle(e.querySelector('[class*="courseRow"]')).backgroundColor}));
 assert.equal(colors.background,colors.panel,JSON.stringify({theme,mode,width,colors}));
 await context.close();await browser.close();console.log('PASS term seams',theme,mode,width);
}
