// Isolated UI regression checks. Saved state and all native services are mocked.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.AEREA_QA_NODE_MODULES ? path.join(process.env.AEREA_QA_NODE_MODULES,'playwright') : 'playwright');
const root=fileURLToPath(new URL('../native-shell',import.meta.url));const output=fileURLToPath(new URL('../outputs/care-pocket-qa',import.meta.url));fs.mkdirSync(output,{recursive:true});
const launchBrowser=()=>chromium.launch({executablePath:process.env.AEREA_QA_BROWSER || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']});
let browser;
async function fixture(theme,mode,width=393,reducedMotion='no-preference',simplifiedCalendarMode=false){
 browser=await launchBrowser();
 const context=await browser.newContext({viewport:{width,height:width<600?852:1100},hasTouch:true,isMobile:true,reducedMotion,serviceWorkers:'block'});
 await context.addInitScript(({theme,mode,simplifiedCalendarMode})=>{
 localStorage.setItem('aerea-update-confirmation-seen','seen');localStorage.setItem('aerea-football-matches-v1',JSON.stringify([{external_event_id:'test-boca',team_key:'boca_juniors',match_date:'2026-10-06',kickoff_at:null,time_confirmed:false,home_team:'Boca Juniors',away_team:'Talleres',competition:'Argentina · Torneo Clausura 2026',venue:'Alberto J. Armando',status:'scheduled',home_score:null,away_score:null}]));
 window.qaState={appTheme:theme,colorMode:mode,simplifiedCalendarMode,calendarEvents:Array.from({length:15},(_,i)=>({id:`routine-${i}`,date:'2026-10-06',title:i===0?'A long care routine title for testing':i===1?'💊':i===2?'🛁':'Routine '+i,time:'21:00',allDay:false,calendar:'Health',color:'cyan',repeat:'Daily',sourceType:'health-routine',healthRoutineGroupId:`care-${i}`,healthRoutineCadence:'daily',healthCompletedDates:[]})),postIts:[{id:123,text:'Preserve this note',color:'pink',x:80,y:100,page:'journal'}]};
 const header=(name,methods)=>({name,methods:methods.map(name=>({name,rtype:'promise'}))});
 window.androidBridge={};window.Capacitor={PluginHeaders:[header('AereaStorage',['getState','putState','listSketches','listDocuments','finishLaunch']),header('AereaWidget',['update']),header('AereaAuth',['consumePendingLink']),header('AereaEventNotifications',['schedule','status']),header('AereaSportsNotifications',['schedule','status']),header('SystemBars',['setStyle']),header('AereaNavigation',['exitApp','showExitHint']),{name:'AereaUpdates',methods:[{name:'getStatus',rtype:'promise'},{name:'check',rtype:'promise'},{name:'addListener',rtype:'callback'},{name:'removeListener',rtype:'promise'}]}],
 nativeCallback(){return Promise.resolve("qa-listener");},
 async nativePromise(plugin,method,options){if(plugin==='AereaStorage'){if(method==='getState')return{state:JSON.stringify({state:window.qaState})};if(method==='putState')window.qaState=JSON.parse(options.state).state;if(method==='listSketches')return{pages:[]};if(method==='listDocuments')return{files:[]};}if(plugin==='AereaUpdates')return{installedVersion:'0.114',installedCode:114,available:null,ready:false};return{};}};
 },{theme,mode,simplifiedCalendarMode});
 const page=await context.newPage();await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.hostname!=='qa.local')return route.abort();const file=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});return route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});});
 await page.goto('https://qa.local/');await page.locator('.app-shell').waitFor();return{page,context};}

const themes = ['storybook','otter','dreambear','strawberry','duckpond','bunnybakery','mooncat','whalesong','ribbonpromise','gentlekitten','softguidance','velvetrest','lovelyevening','rosegrid','littlesheets','noirrest','ao3night','peachparlor','mintletter','blueberrynight','duckmail','moonquilt','samsungminimal','samsungao3','custom'];
const results = [];
const only = process.env.AEREA_QA_THEME;
const settle = page => page.evaluate(() => document.getAnimations().forEach(a => a.finish()));
const visibleSticker = async (page, emoji) => {
  const sticker = page.locator('.screen-sticker');
  await sticker.waitFor({state:'visible'});
  assert.equal((await sticker.textContent()).trim(), emoji);
  assert.equal(await sticker.locator('svg').count(), 0);
  const box = await sticker.boundingBox();
  assert.ok(box.width >= 24 && box.height >= 24);
  assert.ok(await sticker.evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 20));
};
// Resolve the background under each label instead of comparing text with a
// transparent element. This catches the pale-on-pale match facts in dark mode.
const textContrast = el => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  let background = el;
  while (background.parentElement && getComputedStyle(background).backgroundColor === 'rgba(0, 0, 0, 0)') background = background.parentElement;
  const lum = color => {
    context.fillStyle = color; context.fillRect(0,0,1,1);
    return [...context.getImageData(0,0,1,1).data].slice(0,3).map(n => n / 255)
      .map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
      .reduce((sum,n,i) => sum + n * [.2126,.7152,.0722][i], 0);
  };
  const a = lum(getComputedStyle(el).color), b = lum(getComputedStyle(background).backgroundColor);
  return (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
};
try {
  for (const theme of themes.filter(t => !only || t === only)) for (const mode of ['light','dark']) {
    const widths = ['otter','littlesheets','samsungminimal','samsungao3'].includes(theme) ? [393,800] : [393];
    if (['otter','samsungao3'].includes(theme)) widths.push(320);
    for (const width of widths) {
      console.log(`Care/Pocket ${theme}/${mode}/${width}`);
      const {page,context} = await fixture(theme,mode,width);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.getByRole('button',{name:'Habits',exact:true}).click();
      await visibleSticker(page,'🌿');
      await page.getByRole('button',{name:'Open daily health routine',exact:true}).click();
      const care = page.getByRole('dialog',{name:'My daily rhythm',exact:true});
      await care.waitFor(); await settle(page);
      const row = care.locator('.health-routine-item').filter({hasText:'A long care routine title for testing'});
      const layout = await row.evaluate(el => {
        const body = el.querySelector('.health-routine-body'), title = body.querySelector('strong');
        const b = body.getBoundingClientRect(), t = title.getBoundingClientRect(), r = el.getBoundingClientRect();
        return {width:b.width, titleWidth:t.width, contained:b.left >= r.left && b.right <= r.right + 1,
          overflow:el.scrollWidth > el.clientWidth, display:getComputedStyle(body).display};
      });
      assert.ok(layout.width >= (width === 320 ? 90 : 120), 'routine text has its own usable column');
      assert.ok(layout.titleWidth >= 80 && layout.contained && !layout.overflow, 'routine title stays inside its row '+JSON.stringify(layout));
      if (theme.startsWith('samsung')) assert.equal(layout.display,'flex','native care keeps its approved vertical text layout');
      if (['otter','samsungao3'].includes(theme) && width === 393) await page.screenshot({path:path.join(output,`${theme}-${mode}-care.png`)});
      // Editing and completion still operate on the existing event, without
      // replacing its recurrence, siblings, or the user's saved notes.
      await row.locator('.health-routine-body').click(); await settle(page);
      await care.getByLabel('Little routine', {exact:true}).fill('Updated care routine');
      await care.getByRole('button',{name:'Save routine',exact:true}).click();
      await care.getByText('Updated care routine',{exact:true}).waitFor();
      await care.getByRole('button',{name:'Mark complete: Updated care routine',exact:true}).click();
      await care.getByRole('button',{name:'Mark incomplete: Updated care routine',exact:true}).waitFor();
      await page.evaluate(() => window.dispatchEvent(new Event('aereaAndroidBack'))); await care.waitFor({state:'detached'});
      assert.equal(await page.locator('.screen-intro h2').textContent(),'Your habits');
      await page.getByRole('button',{name:'Journal',exact:true}).click(); await visibleSticker(page,'🪶');
      await page.getByRole('button',{name:'Spaces',exact:true}).click(); await visibleSticker(page,'✨');
      await page.getByRole('button',{name:'Open calendar',exact:true}).click();
      const cell = page.locator('.month-grid [data-calendar-date="2026-10-06"]');
      await cell.dispatchEvent('pointerdown',{pointerType:'touch',clientX:100,clientY:200});
      await page.getByRole('dialog',{name:/Plans for/}).waitFor(); await cell.dispatchEvent('pointerup');
      const pocket = page.locator('.day-summary-card'); await settle(page);
      assert.equal(await pocket.locator('.day-summary-events').evaluate(el => getComputedStyle(el).overflowY),'visible');
      assert.ok(await pocket.evaluate(el => el.scrollHeight > el.clientHeight + 100));
      const bounds = await pocket.boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= (width < 600 ? 852 : 1100) + 1);
      // Use browser input over a child event: it must scroll the sheet, not get
      // swallowed by an inner scroll container (the reported Android failure).
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + Math.min(bounds.height - 40, 300));
      await page.mouse.wheel(0,500);
      await page.waitForFunction(() => document.querySelector('.day-summary-card').scrollTop > 100);
      await page.mouse.move(bounds.x + bounds.width / 2 + 1, bounds.y + Math.min(bounds.height - 40,300));
      await page.mouse.wheel(0,10000);
      await page.waitForFunction(() => {const el=document.querySelector('.day-summary-card');return el.scrollTop >= el.scrollHeight-el.clientHeight-2;},undefined,{timeout:5000});
      const add = pocket.getByRole('button',{name:'+ Add event',exact:true});
      assert.ok(await add.isVisible());
      assert.ok(await add.evaluate(el => el.getBoundingClientRect().bottom <= el.closest('.day-summary-card').getBoundingClientRect().bottom));
      await pocket.evaluate(el => { el.scrollTop = 0; });
      const touchSession = await context.newCDPSession(page);
      const tx=bounds.x+bounds.width/2, ty=bounds.y+Math.min(bounds.height-40,500);
      await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});
      for(let step=1;step<=12;step++){
        await touchSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx,y:ty-step*18}]});
        await page.waitForTimeout(25);
      }
      await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForFunction(() => document.querySelector('.day-summary-card').scrollTop > 100,undefined,{timeout:3000});
      await touchSession.detach();
      const boca = pocket.locator('.canonical-boca-match');
      await boca.scrollIntoViewIfNeeded();
      const cardBox = await boca.boundingBox(); assert.ok(cardBox.height < 340,'Boca has no oversized empty collage');
      assert.equal(await boca.locator('img').count(),1);
      await boca.getByRole('img',{name:'Boca Juniors crest'}).waitFor();
      if (['otter','samsungao3'].includes(theme) && width === 393) await page.screenshot({path:path.join(output,`${theme}-${mode}-pocket.png`)});
      await boca.click();
      const details = page.getByRole('dialog',{name:'Match details for Boca Juniors versus Talleres',exact:true});
      await details.waitFor(); await settle(page);
      const facts = details.locator('.football-match-facts');
      assert.equal(await facts.locator('strong').count(),4);
      let minimumContrast = Infinity;
      for (const label of await facts.locator('small,strong').all()) {
        const ratio = await label.evaluate(textContrast); minimumContrast = Math.min(minimumContrast,ratio);
        assert.ok(ratio >= 4.5,`${theme}/${mode} match label contrast ${ratio}`);
      }
      assert.equal(await details.evaluate(el => el.scrollWidth > el.clientWidth),false);
      if (['otter','samsungao3'].includes(theme) && width === 393) await page.screenshot({path:path.join(output,`${theme}-${mode}-match.png`)});
      await details.getByRole('button',{name:'Return to Daily Pocket',exact:true}).click(); await pocket.waitFor();
      await page.evaluate(() => window.dispatchEvent(new Event('aereaAndroidBack'))); await pocket.waitFor({state:'detached'});
      assert.equal(await page.evaluate(() => window.qaState.postIts[0].text),'Preserve this note');
      assert.equal(await page.evaluate(() => window.qaState.calendarEvents.length),15);
      assert.ok(await page.evaluate(() => window.qaState.calendarEvents.some(e => e.title==='Updated care routine' && e.healthCompletedDates.length===1)));
      assert.deepEqual(errors,[]);
      results.push({theme,mode,width,minimumContrast});
      await context.close(); await browser.close();
    }
  }
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
  console.log(`Passed ${results.length} care, emoji, pocket scroll and match detail cases.`);
} finally {await browser?.close();}
