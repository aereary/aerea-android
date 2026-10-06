// UI regression: dispatch the same event as Android's native Back callback.
// Uses the isolated fixture and file-only routing from the Samsung sheet gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setup, checkContrast } from './verify-samsung-sheets.mjs';

const output=process.env.AEREA_QA_OUTPUT || 'outputs/back-calendar-qa';
fs.mkdirSync(output,{recursive:true});
async function back(p){
  await p.evaluate(()=>window.dispatchEvent(new Event('aereaAndroidBack')));
  await p.waitForTimeout(120);
}
async function origin(p){
  return p.evaluate(()=>({tab:document.querySelector('.bottom-nav button.active')?.textContent,day:document.querySelector('.week-strip .day.active')?.textContent,scroll:window.scrollY}));
}
async function sameOrigin(p,previous,label){
  const current=await origin(p);
  assert.equal(current.tab,previous.tab,label+' tab');
  assert.equal(current.day,previous.day,label+' selected home date');
  assert.ok(Math.abs(current.scroll-previous.scroll)<=1,label+' scroll: '+JSON.stringify({previous,current}));
}

try {
const results=[];
for(const theme of ['samsungminimal','samsungao3'])for(const mode of ['dark','light'])for(const width of [393,800]){
  const {browser,p}=await setup(theme,mode,width);
  const label=theme+'-'+mode+'-'+width, checks=[];
  try {
    // Build real tab history; selecting another Home day must survive sheets.
    await p.getByRole('button',{name:'Spaces',exact:true}).click();
    await p.getByRole('button',{name:'Today',exact:true}).click();
    await p.locator('.week-strip .day:not(.today)').first().click();
    await p.getByRole('button',{name:'Add reminder',exact:true}).scrollIntoViewIfNeeded();
    const reminderOrigin=await origin(p);
    await p.getByRole('button',{name:'Add reminder',exact:true}).click();
    await back(p);
    assert.equal(await p.locator('.reminder-editor-note').count(),0,label+' reminder closes');
    await sameOrigin(p,reminderOrigin,label+' reminder');
    await back(p);
    assert.ok(await p.getByRole('button',{name:'Spaces',exact:true}).evaluate(el=>el.classList.contains('active')),label+' next Back uses untouched tab history');
    await p.getByRole('button',{name:'Today',exact:true}).click();
    await p.locator('.week-strip .day:not(.today)').first().click();
    await p.locator('.add-event-button').scrollIntoViewIfNeeded();
    const composerOrigin=await origin(p);
    await p.locator('.add-event-button').click();
    await back(p);
    assert.equal(await p.locator('.calendar-backdrop').count(),0,label+' Home composer returns directly');
    await sameOrigin(p,composerOrigin,label+' composer');

    await p.locator('.welcome-row').scrollIntoViewIfNeeded();
    const timetableOrigin=await origin(p);
    await p.locator('.welcome-row').focus(); await p.keyboard.press('Enter');
    await p.getByRole('button',{name:'Edit semester',exact:true}).click();
    checks.push(await checkContrast(p,'.timetable-editor-title h3',label+' subjects heading'));
    await p.locator('.timetable-edit-row').first().click();
    const swatches=await p.locator('.timetable-color-picker button').evaluateAll(els=>els.map(el=>({target:el.getBoundingClientRect().width,w:getComputedStyle(el,'::before').width,h:getComputedStyle(el,'::before').height})));
    assert.ok(swatches.every(s=>s.target>=44&&s.w===s.h&&s.w==='22px'),label+' circular class colors with 44px targets');
    await back(p);
    assert.equal(await p.locator('.timetable-meeting-list').count(),0,label+' class draft closes first');
    assert.ok(await p.locator('.timetable-term-fields').isVisible(),label+' semester remains');
    await back(p);
    assert.equal(await p.locator('.timetable-term-fields').count(),0,label+' semester editor closes');
    assert.ok(await p.locator('.timetable-card').isVisible(),label+' week map remains');

    await p.getByRole('button',{name:'My degree',exact:true}).click();
    checks.push(await checkContrast(p,'[data-native-surface="career"] [class*="stats"] strong >> nth=0',label+' degree stat'));
    checks.push(await checkContrast(p,'[data-native-surface="career"] [class*="stats"] small >> nth=0',label+' degree stat caption'));
    await p.getByRole('button',{name:'Plan',exact:true}).click(); await p.waitForTimeout(180);
    checks.push(await checkContrast(p,'[data-native-surface="career"] [class*="activeTab"]',label+' degree selected tab'));
    checks.push(await checkContrast(p,'[data-native-surface="career"] [class*="quarterNumber"] >> nth=0',label+' term number'));
    checks.push(await checkContrast(p,'[data-native-surface="career"] [class*="quarterHead"] small >> nth=0',label+' term caption'));
    await p.screenshot({path:output+'/'+label+'-degree.png'});
    await back(p);
    assert.equal(await p.locator('[data-native-surface="career"]').count(),0,label+' degree closes before timetable');
    assert.ok(await p.locator('.timetable-card').isVisible(),label+' timetable preserved under degree');
    await back(p);
    await sameOrigin(p,timetableOrigin,label+' timetable');

    await p.getByRole('button',{name:'Create a movable post-it',exact:true}).click();
    await p.locator('.post-it-editor-preview textarea').fill('A readable thought');
    for(let palette=0;palette<3;palette++){
      for(const swatch of await p.locator('.post-it-palette-swatches button').all()){
        await swatch.click(); await p.waitForTimeout(120);
        assert.equal(await p.locator('.post-it-editor-preview textarea').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)',label+' paper text uses selected paper');
        checks.push(await checkContrast(p,'.post-it-editor-preview textarea',label+' paper '+await swatch.getAttribute('aria-label')));
        checks.push(await checkContrast(p,'.post-it-editor-preview textarea',label+' paper placeholder '+await swatch.getAttribute('aria-label'),'::placeholder'));
      }
      if(palette<2)await p.getByRole('button',{name:'Next paper-color palette',exact:true}).click();
    }
    await p.screenshot({path:output+'/'+label+'-post-it.png'});
    await back(p);
    assert.equal(await p.locator('.post-it-editor-modal').count(),0);
    await p.getByRole('button',{name:'Habits',exact:true}).click();
    await p.getByRole('button',{name:'Open daily health routine',exact:true}).click();
    await p.getByRole('button',{name:'Add a little routine',exact:true}).click();
    await back(p);
    assert.equal(await p.locator('.health-routine-editor').count(),0,label+' routine editor closes first');
    assert.ok(await p.locator('.health-routine-note').isVisible(),label+' routine list preserved');
    await back(p);
    assert.equal(await p.locator('.health-routine-note').count(),0,label+' routine list closes');
    assert.ok(await p.getByRole('button',{name:'Habits',exact:true}).evaluate(el=>el.classList.contains('active')),label+' Habits remains');
    await p.getByRole('button',{name:'Today',exact:true}).click();
    await p.getByRole('button',{name:'Open calendar',exact:true}).click();
    await p.locator('.month-grid button.has-event:not(.today)').last().click();
    const date=await p.locator('.month-grid button.selected').getAttribute('data-calendar-date');
    assert.equal(await p.locator('.calendar-date-menu-trigger').evaluate(el=>getComputedStyle(el).justifyContent),'center',label+' month title is centered');
    checks.push(await checkContrast(p,'.calendar-date-menu-trigger',label+' month title'));
    checks.push(await checkContrast(p,'.calendar-sources > span >> nth=0',label+' calendar source'));
    await p.screenshot({path:output+'/'+label+'-calendar.png'});
    // Editing from the month must return to this month, not to Home.
    await p.getByRole('button',{name:'Open Skincare',exact:true}).focus();
    const calendarScroll=await p.locator('.calendar-modal').evaluate(el=>el.scrollTop);
    await p.keyboard.press('Enter');
    await p.locator('.calendar-event-mode').waitFor();
    await back(p);
    assert.ok(await p.locator('.month-grid').isVisible(),label+' calendar edit preserves month');
    assert.equal(await p.locator('.month-grid button.selected').getAttribute('data-calendar-date'),date,label+' calendar selection preserved');
    assert.ok(Math.abs(await p.locator('.calendar-modal').evaluate(el=>el.scrollTop)-calendarScroll)<=1,label+' calendar scroll preserved');
    await p.getByRole('button',{name:'Search calendar events',exact:true}).click();
    await p.locator('.calendar-search-field input').fill('Skincare');
    await p.locator('.calendar-search-result').first().focus(); await p.keyboard.press('Enter');
    await p.locator('.calendar-event-mode').waitFor(); await back(p);
    assert.ok(await p.locator('.calendar-search-screen').isVisible(),label+' editor returns to search');
    assert.equal(await p.locator('.calendar-search-field input').inputValue(),'Skincare',label+' search query retained');
    await back(p);
    await p.locator('.month-grid button.selected').scrollIntoViewIfNeeded();
    const cell=await p.locator('.month-grid button.selected').boundingBox();
    await p.mouse.move(cell.x+cell.width/2,cell.y+cell.height/2);
    await p.mouse.down(); await p.waitForTimeout(650); await p.mouse.up();
    await p.locator('.day-summary-card').waitFor();
    await p.locator('.day-summary-event').first().click();
    await p.locator('.event-detail-note').waitFor();
    await back(p);
    assert.ok(await p.locator('.day-summary-card').isVisible(),label+' event details return to Day Pocket');
    await p.locator('.day-summary-add').click();
    await p.locator('.calendar-event-mode').waitFor();
    await back(p);
    assert.ok(await p.locator('.day-summary-card').isVisible(),label+' Day Pocket composer returns to its summary');
    await back(p); await back(p);
    await p.getByRole('button',{name:'Spaces',exact:true}).click();
    await p.locator('.spaces-grid button').filter({hasText:'Library'}).click();
    await p.locator('.study-new-note').click();
    await p.locator('.study-note-editor').waitFor();
    await back(p);
    assert.equal(await p.locator('.study-note-editor').count(),0,label+' note editor closes');
    assert.ok(await p.locator('.study-library-screen').isVisible(),label+' Library remains');
    results.push({label,checks}); console.log('PASS',label);
  } finally {await browser.close();}
}
fs.writeFileSync(output+'/back-calendar-qa.json',JSON.stringify(results,null,2));
} catch(error){console.error(error);process.exit(1);}
