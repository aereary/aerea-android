// Browser regression gate for Samsung sheets. Uses isolated synthetic state only.
// npm run build:native first; install Playwright and its Chromium browser to run.
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const root=fileURLToPath(new URL('../native-shell',import.meta.url));
const output=process.env.AEREA_QA_OUTPUT || fileURLToPath(new URL('../outputs/samsung-sheet-qa',import.meta.url));
fs.mkdirSync(output,{recursive:true});
export async function setup(theme,mode,width,reduced=false){
const browser=await chromium.launch({executablePath:process.env.AEREA_QA_BROWSER || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']});
const c=await browser.newContext({viewport:{width,height:width<600?852:1100},deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:reduced?'reduce':'no-preference'});
await c.addInitScript(({theme,mode})=>{
 // Seed this isolated context once; reloads must exercise actual persistence.
 if(localStorage.getItem('aerea-private-state-v1'))return;
 const date=new Date(); const today=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 const routines=['Skincare','Vitamins','Wash hair'].map((title,i)=>({id:'qa-health-'+i,title,date:today,time:'08:00',color:'pink',calendar:'Health',sourceType:'health-routine',healthRoutineGroupId:'qa-routine-'+i,healthRoutineCadence:'daily',repeat:'Daily'}));
 const state={appTheme:theme,colorMode:mode,calendarEvents:routines,classTimetable:{termName:'Second semester',termDates:'',termStart:'2026-09-01',termEnd:'2026-12-31',classes:[{id:'qa-class',name:'Introduction to research and critical thinking',professor:'Professor Example',color:'#dff2f7',meetings:[{id:'qa-meeting',day:'mon',start:'09:00',end:'11:00',room:'Room 4'}]}]}};
 localStorage.setItem('aerea-private-state-v1',JSON.stringify({state}));
}, {theme,mode});
const p=await c.newPage(); p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.route('**/*',route=>{
const u=new URL(route.request().url());if(u.hostname!=='qa.local')return route.abort();
const path=root+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname));
if(!fs.existsSync(path))return route.fulfill({status:404,body:'Not found'});
return route.fulfill({status:200,contentType:path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.html')?'text/html':path.endsWith('.svg')?'image/svg+xml':'application/octet-stream',body:fs.readFileSync(path)});
});
await p.goto('https://qa.local/');await p.waitForSelector('[data-theme="'+theme+'"]'); await p.waitForTimeout(500);
// The browser has no Capacitor Android host. Apply the same native geometry
// after its web-only platform probe; include the Android safe-area fallbacks.
await p.evaluate(()=>document.documentElement.dataset.native='true');
if(process.env.AEREA_QA_EMOJI_FONT){
const emoji=fs.readFileSync(process.env.AEREA_QA_EMOJI_FONT).toString('base64');
await p.addStyleTag({content:"@font-face{font-family:'QA Emoji';src:url(data:font/woff2;base64,"+emoji+") format('woff2');font-weight:400;unicode-range:U+1F000-1FAFF,U+2600-27FF,U+FE0F,U+200D}html[data-native-theme]{--one-font:Arial,'QA Emoji',sans-serif}"});
}
await p.evaluate(()=>document.fonts.ready);return {browser,p};
}
async function checkSheet(p,selector,label,reduced=false){
await p.locator(selector).waitFor();
const motion=await p.locator(selector).evaluate(el=>{
const animation=el.getAnimations().find(a=>a.animationName==='one-sheet-rise');
if(!animation)return null;
const saved=animation.currentTime; animation.pause();
animation.currentTime=0;const start=el.getBoundingClientRect().top;
animation.currentTime=180;const middle=el.getBoundingClientRect().top;
animation.currentTime=360;const end=el.getBoundingClientRect().top;
animation.currentTime=saved;animation.play();
return {start,middle,end,height:innerHeight};
});
if(reduced)assert.equal(motion,null,label+' reduced motion');
else {assert.ok(motion,label+' animation exists');assert.ok(motion.start>=motion.height,label+' begins below viewport');assert.ok(motion.start>motion.middle&&motion.middle>motion.end,label+' rises upward');}
await p.waitForTimeout(450);
const facts=await p.locator(selector).evaluate(el=>{
const r=el.getBoundingClientRect();
return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,transform:getComputedStyle(el).transform,viewportWidth:innerWidth,viewportHeight:innerHeight};
});
assert.ok(Math.abs(facts.bottom-facts.viewportHeight)<2,label+' rests at bottom');
assert.ok(facts.top>=0&&facts.left>=0&&facts.right<=facts.viewportWidth+1,label+' viewport bounds');
assert.ok(facts.scrollWidth<=facts.clientWidth+1,label+' no sheet overflow');
assert.equal(facts.transform,'none',label+' no retained transform');
assert.equal(await p.locator(selector).evaluate(el=>getComputedStyle(el,'::before').clipPath),'none',label+' clean sheet handle');
assert.ok(await p.evaluate(()=>!!document.elementFromPoint(8,60)?.closest('[class*="backdrop"]')),label+' scrim above app header');
await p.screenshot({path:output+'/polish-'+label+'.png'});return {motion,facts};
}
function contrast(fg,bg){
const parse=c=>c.match(/[\d.]+/g).slice(0,3).map(Number);
const lum=c=>parse(c).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const a=lum(fg),b=lum(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
export async function checkContrast(p,selector,label,pseudo=null){
const colors=await p.locator(selector).evaluate((el,pseudo)=>{
let parent=el;let bg='rgba(0, 0, 0, 0)';
while(parent&&bg==='rgba(0, 0, 0, 0)'){bg=getComputedStyle(parent).backgroundColor;parent=parent.parentElement;}
return {color:getComputedStyle(el,pseudo).color,bg};},pseudo);
const ratio=contrast(colors.color,colors.bg);assert.ok(ratio>=4.5,label+' text contrast '+ratio.toFixed(2));return {label,...colors,ratio};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) (async()=>{
const results=[];
for(const theme of ['samsungminimal','samsungao3'])for(const mode of ['dark','light'])for(const width of [393,800]){
const {browser,p}=await setup(theme,mode,width);const label=theme+'-'+mode+'-'+width;const checks=[];
await p.getByRole('button',{name:'Open details for Skincare',exact:true}).last().click();
checks.push(await checkSheet(p,'.event-detail-note',label+'-event'));
checks.push(await checkContrast(p,'.event-detail-health-completion strong',label+' completion'));
checks.push(await checkContrast(p,'.event-detail-health-completion small',label+' completion date'));
await p.getByRole('button',{name:'Mark complete: Skincare',exact:true}).click();await p.waitForTimeout(80);
assert.ok(await p.locator('.event-detail-health-completion.complete').isVisible(),'completion works');
checks.push(await checkContrast(p,'.event-detail-health-completion button',label+' completed check'));
await p.waitForTimeout(600);
const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('aerea-private-state-v1')||'null'));
assert.ok(stored?.state.calendarEvents.find(event=>event.id==='qa-health-0')?.healthCompletedDates?.length,label+' completion persisted');
await p.getByRole('button',{name:'Close event details',exact:true}).click();
await p.getByRole('button',{name:'Habits',exact:true}).click();
await p.getByRole('button',{name:'Open daily health routine',exact:true}).click();
checks.push(await checkSheet(p,'.health-routine-note',label+'-routines'));
assert.equal(await p.locator('.health-routine-item').count(),3);
const rects=await p.locator('.health-routine-item').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));
assert.ok(rects.every(r=>r.width>width*.7||r.width>500),label+' full width routine rows');
assert.ok(rects[1].top>=rects[0].bottom,label+' stacked routine rows');
checks.push(await checkContrast(p,'.health-routine-body strong >> nth=0',label+' routine title'));
await p.getByRole('button',{name:'Add a little routine',exact:true}).click();
await p.locator('.health-routine-editor input').first().fill('A long routine title with details');
checks.push(await checkContrast(p,'.health-routine-editor input >> nth=0',label+' routine input'));
await p.screenshot({path:output+'/polish-'+label+'-routine-editor.png'});
await p.getByRole('button',{name:'Close daily rhythm',exact:true}).click();
await p.getByRole('button',{name:/Add a new habit/}).click();
checks.push(await checkSheet(p,'.habit-editor-modal',label+'-habit'));
await p.locator('.habit-editor-modal > header > button').click();
await p.getByRole('button',{name:'Today',exact:true}).click();
await p.locator('.welcome-row').focus();await p.keyboard.press('Enter');
checks.push(await checkSheet(p,'.timetable-card',label+'-timetable'));
assert.equal(await p.locator('.timetable-week-map-days > button').count(),7);
const dayRects=await p.locator('.timetable-week-map-days > button').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));
assert.ok(dayRects.every(r=>r.width>=40),label+' day touch targets');
await p.getByRole('button',{name:'Edit semester',exact:true}).click();
checks.push(await checkContrast(p,'.timetable-term-fields label > span >> nth=0',label+' semester label'));
await p.locator('.timetable-edit-row').first().click();
const editorInputs=await p.locator('.timetable-meeting-row input').evaluateAll(els=>els.map(el=>({width:el.clientWidth,scroll:el.scrollWidth})));
assert.ok(editorInputs.every(r=>r.width>=100),label+' readable meeting fields');
await p.screenshot({path:output+'/polish-'+label+'-class-editor.png'});
await p.getByRole('button',{name:'Close class schedule',exact:true}).click();
await p.getByRole('button',{name:'Add reminder',exact:true}).click();
checks.push(await checkSheet(p,'.reminder-editor-note',label+'-reminder'));
await p.locator('.reminder-editor-note button').filter({hasText:'Cancel'}).click();
await p.getByRole('button',{name:'Open appearance settings',exact:true}).click();
checks.push(await checkSheet(p,'.settings-modal',label+'-settings'));
await p.getByRole('button',{name:'Close settings',exact:true}).click();
await p.locator('.add-event-button').click();
checks.push(await checkSheet(p,'.calendar-event-mode',label+'-composer'));
checks.push(await checkContrast(p,'.event-title-input input',label+' composer input'));
results.push({label,checks});console.log('PASS',label);await browser.close();
}
const {browser,p}=await setup('samsungao3','dark',393,true);
await p.getByRole('button',{name:'Add reminder',exact:true}).click();await checkSheet(p,'.reminder-editor-note','reduced-motion',true);await browser.close();
const legacy=await setup('otter','dark',393);
assert.equal(await legacy.p.evaluate(()=>document.documentElement.dataset.nativeTheme),undefined);
await legacy.p.getByRole('button',{name:'Habits',exact:true}).click();
assert.equal(await legacy.p.locator('.screen-sticker > .native-icon').evaluate(el=>getComputedStyle(el).display),'none');
await legacy.p.getByRole('button',{name:'Open daily health routine',exact:true}).click();
assert.notEqual(await legacy.p.locator('.health-routine-note').evaluate(el=>getComputedStyle(el).animationName),'one-sheet-rise');
await legacy.browser.close();
fs.writeFileSync(output+'/polish-qa.json',JSON.stringify(results,null,2));
console.log('PASS reduced motion and legacy theme isolation');
for(const width of [320,360]){
const narrow=await setup('samsungao3','dark',width);
await narrow.p.locator('.add-event-button').click();
await checkSheet(narrow.p,'.calendar-event-mode','narrow-'+width);
await narrow.p.locator('.event-title-input input').fill('A new appointment');
assert.ok(await narrow.p.getByRole('button',{name:'Save',exact:true}).isEnabled(),'narrow composer save');
await narrow.p.setViewportSize({width,height:480});
await checkSheet(narrow.p,'.calendar-event-mode','keyboard-'+width);
const inputs=await narrow.p.locator('.event-dates input').evaluateAll(els=>els.map(el=>el.clientWidth));
assert.ok(inputs.every(width=>width>=150),'dates remain readable with a narrow viewport');
await narrow.browser.close();
}
console.log('PASS narrow phones and keyboard viewport');
})().catch(e=>{console.error(e);process.exit(1)});
