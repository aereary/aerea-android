// Isolated UI regression checks. Saved state and all native services are mocked.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.AEREA_QA_NODE_MODULES ? path.join(process.env.AEREA_QA_NODE_MODULES,'playwright') : 'playwright');
const root=fileURLToPath(new URL('../native-shell',import.meta.url));const output=fileURLToPath(new URL('../outputs/theme-motion-qa',import.meta.url));fs.mkdirSync(output,{recursive:true});
const launchBrowser=()=>chromium.launch({executablePath:process.env.AEREA_QA_BROWSER || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']});
let browser;
async function fixture(theme,mode,width=393,reducedMotion='no-preference',simplifiedCalendarMode=false){
 browser=await launchBrowser();
 const context=await browser.newContext({viewport:{width,height:width<600?852:1100},reducedMotion,serviceWorkers:'block'});
 await context.addInitScript(({theme,mode,simplifiedCalendarMode})=>{
 localStorage.setItem('aerea-update-confirmation-seen','seen');
 window.qaState={appTheme:theme,colorMode:mode,simplifiedCalendarMode,postIts:[{id:123,text:'Preserve this note',color:'pink',x:80,y:100,page:'journal'}]};
 const header=(name,methods)=>({name,methods:methods.map(name=>({name,rtype:'promise'}))});
 window.androidBridge={};window.Capacitor={PluginHeaders:[header('AereaStorage',['getState','putState','listSketches','listDocuments','finishLaunch']),header('AereaWidget',['update']),header('AereaAuth',['consumePendingLink']),header('AereaEventNotifications',['schedule','status']),header('AereaSportsNotifications',['schedule','status']),header('SystemBars',['setStyle']),header('AereaNavigation',['exitApp','showExitHint']),{name:'AereaUpdates',methods:[{name:'getStatus',rtype:'promise'},{name:'check',rtype:'promise'},{name:'addListener',rtype:'callback'},{name:'removeListener',rtype:'promise'}]}],
 nativeCallback(){return Promise.resolve("qa-listener");},
 async nativePromise(plugin,method,options){if(plugin==='AereaStorage'){if(method==='getState')return{state:JSON.stringify({state:window.qaState})};if(method==='putState')window.qaState=JSON.parse(options.state).state;if(method==='listSketches')return{pages:[]};if(method==='listDocuments')return{files:[]};}if(plugin==='AereaUpdates')return{installedVersion:'0.114',installedCode:114,available:null,ready:false};return{};}};
 },{theme,mode,simplifiedCalendarMode});
 const page=await context.newPage();await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='qa.local')return route.abort();const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});});
 await page.goto('https://qa.local/');await page.locator('.app-shell').waitFor();return{page,context};}
const themes=['storybook','otter','strawberry','whalesong','ribbonpromise','gentlekitten','softguidance','velvetrest','littlesheets','mintletter','moonquilt','samsungminimal','samsungao3','custom'];
const results=[];
const part=process.env.AEREA_QA_PART || 'all';
const settled=page=>page.waitForFunction(()=>[...document.querySelectorAll('.reminder-editor-note')].every(el=>el.getAnimations().every(a=>a.playState==='finished')));
const contrast=el=>{
 const ctx=document.createElement('canvas').getContext('2d');
 const lum=color=>{ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);};
 const s=getComputedStyle(el), a=lum(s.color),b=lum(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
};
try{
 if(part!=='calendar')for(const theme of themes)for(const mode of ['light','dark'])for(const width of (['otter','littlesheets','samsungminimal','samsungao3'].includes(theme)?[393,800]:[393])){
  console.log(`Sheet ${theme}/${mode}/${width}`);
  const {page,context}=await fixture(theme,mode,width);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.getByRole('button',{name:'Add reminder',exact:true}).click();const sheet=page.getByRole('dialog',{name:'Edit reminder'});await settled(page);
  const box=await sheet.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&Math.abs(box.y+box.height-(width<600?852:1100))<2,`${theme}/${mode}/${width} sheet bounds`);
  const appearance=await sheet.evaluate(el=>{const s=getComputedStyle(el);return{bg:s.backgroundColor,radius:s.borderTopLeftRadius,animation:s.animationName,overflow:el.scrollWidth>el.clientWidth};});
  assert.equal(appearance.radius,'28px');assert.equal(appearance.animation,'one-sheet-rise');assert.equal(appearance.overflow,false);
  const ratio=await sheet.evaluate(contrast);assert.ok(ratio>=4.5,`${theme}/${mode} sheet contrast ${ratio}`);
  await sheet.getByLabel('Name',{exact:true}).fill('Test reminder');await sheet.getByRole('button',{name:'Save',exact:true}).click();await sheet.waitFor({state:'detached'});
  await page.waitForFunction(()=>window.qaState.reminders?.some(r=>r.title==='Test reminder'));
  await page.getByRole('button',{name:'Add reminder',exact:true}).click();await settled(page);await page.evaluate(()=>window.dispatchEvent(new Event('aereaAndroidBack')));await sheet.waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>window.qaState.postIts[0].text),'Preserve this note');assert.deepEqual(errors,[]);
  if(['otter','strawberry','samsungao3'].includes(theme)&&width===393){await page.getByRole('button',{name:'Add reminder',exact:true}).click();await settled(page);await page.screenshot({path:path.join(output,`${theme}-${mode}-sheet.png`)});}
  results.push({theme,mode,width,ratio,background:appearance.bg});await context.close();await browser.close();
 }
 if(results.length)fs.writeFileSync(path.join(output,'sheets.json'),JSON.stringify(results,null,2));
 if(part!=='sheets')for(const theme of ['otter','samsungao3'])for(const width of [393,800])for(const reducedMotion of ['no-preference','reduce'])for(const simplified of [false,true]){
  const {page,context}=await fixture(theme,theme==='otter'?'light':'dark',width,reducedMotion,simplified);
  console.log(`Calendar ${theme}/${width}/${reducedMotion}/${simplified}`);
  if(!simplified)await page.getByRole('button',{name:'Open calendar',exact:true}).click();
  const grid=page.locator(simplified?'.simplified-calendar-screen > .simplified-month-grid':'.month-grid-viewport > .month-grid');await grid.waitFor();
  const before=await grid.boundingBox();const month=Number(await grid.getAttribute('data-calendar-month-grid'));
  const swipe=async(dx=-210,dy=2)=>grid.evaluate((el,{dx,dy})=>{const start=new Touch({identifier:1,target:el,clientX:300,clientY:150}),end=new Touch({identifier:1,target:el,clientX:300+dx,clientY:150+dy});el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[start],changedTouches:[start]}));el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,touches:[],changedTouches:[end]}));},{dx,dy});
  await swipe();
  assert.equal(await page.locator('[data-calendar-month-grid]').evaluateAll(els=>Number(els.find(el=>!el.closest('.calendar-month-motion')).dataset.calendarMonthGrid)),month+1);
  if(reducedMotion==='reduce')assert.equal(await page.locator('.calendar-month-motion').count(),0);
  else{
   const motion=page.locator('.calendar-month-motion');await motion.waitFor();assert.equal(await motion.getAttribute('aria-hidden'),'true');
   const geometry=await motion.evaluate(el=>{const copies=[...el.children];copies.forEach(c=>c.getAnimations().forEach(a=>{a.pause();a.currentTime=170;}));const b=el.getBoundingClientRect(),old=copies[0].getBoundingClientRect(),next=copies[1].getBoundingClientRect();return{seam:Math.abs(old.right-next.left),width:b.width,oldLeft:old.left,bLeft:b.left,opacity:copies.map(c=>getComputedStyle(c).opacity),inert:el.inert};});
   assert.ok(geometry.seam<1,'months meet without a gap');assert.ok(geometry.oldLeft<geometry.bLeft);assert.deepEqual(geometry.opacity,['1','1']);assert.equal(geometry.inert,true);assert.ok(Math.abs(geometry.width-before.width)<1);
   await page.screenshot({path:path.join(output,`${theme}-${width}-${simplified?'simplified':'compact'}-transition.png`)});
   await motion.evaluate(el=>el.querySelectorAll('[data-calendar-month-grid]').forEach(c=>c.getAnimations().forEach(a=>a.play())));await motion.waitFor({state:'detached'});
  }
  const after=await grid.boundingBox();assert.ok(Math.abs(before.x-after.x)<1&&Math.abs(before.width-after.width)<1,'calendar geometry stays unchanged');
  // Vertical scrolling must not change the month; rapid taps/swipes leave one bounded layer.
  const endMonth=Number(await grid.getAttribute('data-calendar-month-grid'));
  await swipe(-20,250);assert.equal(Number(await grid.getAttribute('data-calendar-month-grid')),endMonth);
  await swipe();await swipe();assert.ok(await page.locator('.calendar-month-motion').count()<=1);await page.waitForFunction(()=>!document.querySelector('.calendar-month-motion'));assert.equal(Number(await grid.getAttribute('data-calendar-month-grid')),endMonth+2);
  await swipe(210,0);await page.waitForFunction(()=>!document.querySelector('.calendar-month-motion'));assert.equal(Number(await grid.getAttribute('data-calendar-month-grid')),endMonth+1);
  await swipe(210,0);await swipe(210,0);await page.waitForFunction(()=>!document.querySelector('.calendar-month-motion'));assert.ok(Math.abs((await grid.boundingBox()).height-before.height)<1,'same month keeps its original height');
  await context.close();await browser.close();
 }
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({sheets:results,calendarCases:16},null,2));console.log(`Passed ${results.length} themed sheet cases and ${part==='sheets'?0:16} calendar cases.`);
}finally{await browser?.close();}
