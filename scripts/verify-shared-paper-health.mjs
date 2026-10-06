// Isolated browser fixtures; no user account or production writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {setup,checkContrast} from './verify-samsung-sheets.mjs';
const output=process.env.AEREA_QA_OUTPUT || 'outputs/shared-paper-health-qa';
fs.mkdirSync(output,{recursive:true});
const results=[];
const back=async p=>{await p.evaluate(()=>window.dispatchEvent(new Event('aereaAndroidBack')));await p.waitForTimeout(450);};
const styles=async(p,selector,props,pseudo=null)=>p.locator(selector).evaluateAll((els,{props,pseudo})=>els.map(el=>{const s=getComputedStyle(el,pseudo);return Object.fromEntries(props.map(prop=>[prop,s[prop]]));}),{props,pseudo});
const paperProps=['backgroundColor','borderRadius','boxShadow','padding','transform'];
const textProps=['fontFamily','fontWeight','fontSize','lineHeight','letterSpacing','backgroundColor','color'];
const faceProps=['backgroundColor','borderRadius','width','height','fontSize'];
const original={};
for(const mode of ['dark','light'])for(const width of [393,800]){
 const {browser,p}=await setup('otter',mode,width);p.setDefaultTimeout(8000);
 await p.getByRole('button',{name:'Create a movable post-it',exact:true}).click();
 await p.locator('.post-it-editor-preview textarea').fill('Tomorrow:\n• Class at 8:00\n• Hand in report');
 original[mode+width]={focus:await styles(p,'.post-it-editor-preview textarea',['outline','boxShadow','borderRadius']),paper:await styles(p,'.post-it-editor-preview',paperProps),text:await styles(p,'.post-it-editor-preview textarea',textProps),fold:await styles(p,'.post-it-editor-preview',['backgroundImage','clipPath','width','height'],'::after'),tape:await styles(p,'.post-it-editor-preview .post-it-tape',['backgroundColor','width','height','transform','display']),swatches:await styles(p,'.post-it-palette-swatches button span',['backgroundColor','borderRadius','width','height'])};
 await back(p);
 await p.getByRole('button',{name:'Open calendar',exact:true}).click();
 original[mode+width].faces=await styles(p,'.calendar-mood-picker:not(.calendar-sticker-picker) .mood-bubble > span',faceProps);
 original[mode+width].labels=await p.locator('.calendar-mood-picker:not(.calendar-sticker-picker) .mood-bubble').allTextContents();
 await back(p);
 await p.getByRole('button',{name:'Habits',exact:true}).click();await p.getByRole('button',{name:'Open daily health routine',exact:true}).click();
 assert.equal(await p.locator('.health-care-summary').count(),0,'legacy Health stays original');
 assert.equal(await p.locator('.health-routine-delete').count(),3);
 await browser.close();
}
for(const theme of ['samsungminimal','samsungao3'])for(const mode of ['dark','light'])for(const width of [393,800]){
 const label=`${theme}-${mode}-${width}`;
 const {browser,p}=await setup(theme,mode,width);p.setDefaultTimeout(8000);const baseline=original[mode+width];const checks=[];
 try{
 await p.getByRole('button',{name:'Create a movable post-it',exact:true}).click();
 assert.deepEqual(await styles(p,'.post-it-editor-preview',paperProps),baseline.paper,label+' shared paper shape, shadow and angle');
 assert.deepEqual(await styles(p,'.post-it-editor-preview textarea',textProps),baseline.text,label+' shared handwriting');
 assert.deepEqual(await styles(p,'.post-it-editor-preview',['backgroundImage','clipPath','width','height'],'::after'),baseline.fold,label+' shared paper fold');
 assert.deepEqual(await styles(p,'.post-it-editor-preview .post-it-tape',['backgroundColor','width','height','transform','display']),baseline.tape,label+' shared tape');
 assert.deepEqual(await styles(p,'.post-it-palette-swatches button span',['backgroundColor','borderRadius','width','height']),baseline.swatches,label+' shared palette');
 await p.locator('.post-it-editor-preview textarea').fill('Tomorrow:\n• Class at 8:00\n• Hand in report');
 assert.deepEqual(await styles(p,'.post-it-editor-preview textarea',['outline','boxShadow','borderRadius']),baseline.focus,label+' shared paper focus');
 await p.waitForTimeout(450);
 checks.push(await checkContrast(p,'.post-it-editor-options legend',label+' paper legend'));
 checks.push(await checkContrast(p,'.post-it-palette-count',label+' palette caption'));
 await p.screenshot({path:output+'/'+label+'-post-it.png'});
 await p.getByRole('button',{name:'Next paper-color palette',exact:true}).click();
 assert.match(await p.locator('.post-it-palette-count').innerText(),/2/);
 // Real touch events exercise the existing palette swipe handler.
 await p.locator('.post-it-palette-picker').evaluate(el=>{const touch=x=>new Touch({identifier:1,target:el,clientX:x,clientY:100});el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[touch(220)]}));el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[touch(100)]}));});
 assert.match(await p.locator('.post-it-palette-count').innerText(),/3/);
 await p.locator('.post-it-palette-swatches button').last().click();
 assert.ok(await p.locator('.post-it-editor-preview.lavender').count(),label+' swipe suppresses accidental color tap');
 await p.waitForTimeout(370);
 await p.locator('.post-it-palette-swatches button').last().click();
 await p.getByRole('button',{name:'Stick it here',exact:true}).click();
 const note=p.locator('.movable-post-it');await note.waitFor();await p.waitForTimeout(200);
 const before=await note.boundingBox();
 await p.mouse.move(before.x+before.width/2,before.y+before.height/2);await p.mouse.down();await p.mouse.move(before.x+before.width/2+40,before.y+before.height/2+30,{steps:5});await p.mouse.up();
 await p.waitForTimeout(100);const after=await note.boundingBox();assert.ok(Math.abs(after.x-before.x-40)<2&&Math.abs(after.y-before.y-30)<2,label+' center-based drag');
 await p.waitForTimeout(650);
 const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('aerea-private-state-v1')).state);
 assert.equal(stored.postIts.at(-1).color,'cocoa');assert.match(stored.postIts.at(-1).text,/Hand in report/);
 await p.reload();await p.waitForTimeout(650);await p.evaluate(()=>document.documentElement.dataset.native='true');
 assert.match(await p.locator('.movable-post-it').innerText(),/Hand in report/,label+' note reload');
 await p.getByRole('button',{name:'Open calendar',exact:true}).click();
 const faces='.calendar-mood-picker:not(.calendar-sticker-picker) .mood-bubble > span';
 assert.deepEqual(await styles(p,faces,faceProps),baseline.faces,label+' shared colorful mood artwork');
 assert.deepEqual(await p.locator('.calendar-mood-picker:not(.calendar-sticker-picker) .mood-bubble').allTextContents(),baseline.labels);
 await p.locator('.calendar-mood-picker:not(.calendar-sticker-picker) .mood-bubble').first().click();
 assert.ok(await p.locator('.calendar-mood-sticker.mood-pink').count()>0,label+' selected mood displayed on calendar');
 checks.push(await checkContrast(p,faces+' >> nth=0',label+' mood face'));
 checks.push(await checkContrast(p,'.calendar-mood-picker:not(.calendar-sticker-picker) .mood-bubble small >> nth=0',label+' mood label'));
 await p.locator('.day-marker-picker').scrollIntoViewIfNeeded();await p.screenshot({path:output+'/'+label+'-moods.png'});
 await back(p);
 await p.getByRole('button',{name:'Habits',exact:true}).click();await p.getByRole('button',{name:'Open daily health routine',exact:true}).click();await p.waitForTimeout(450);
 assert.equal(await p.locator('.health-routine-emoji').count(),0,label+' no forced plant before user titles');
 assert.equal(await p.locator('.health-routine-delete').count(),0,label+' deletion is inside editor');
 assert.match(await p.locator('.health-care-summary').innerText(),/0 of 3 done/);
 await p.getByRole('button',{name:'Mark complete: Skincare',exact:true}).click();
 assert.equal(await p.locator('.health-routine-editor').count(),0,label+' check only completes');
 assert.match(await p.locator('.health-care-summary').innerText(),/1 of 3 done/);
 checks.push(await checkContrast(p,'.health-routine-body strong >> nth=0',label+' health title'));
 checks.push(await checkContrast(p,'.health-routine-cadence >> nth=0',label+' health cadence'));
 checks.push(await checkContrast(p,'.health-care-state >> nth=0',label+' health state'));
 checks.push(await checkContrast(p,'.health-care-summary strong',label+' health summary'));
 await p.screenshot({path:output+'/'+label+'-health.png'});
 await p.getByRole('button',{name:'Edit Vitamins',exact:true}).click();
 await p.locator('.health-routine-editor input').first().fill('💊 My vitamins with a long personal reminder');
 await p.locator('.health-routine-editor select').selectOption('weekdays');
 // Select only tomorrow, so the check becomes disabled today.
 const day=new Date().getDay();
 await p.locator('.health-routine-weekdays button').nth(day).click();
 await p.locator('.health-routine-weekdays button').nth((day+1)%7).click();
 await p.getByRole('button',{name:'Save routine',exact:true}).click();
 const offDay=p.locator('.health-routine-item').filter({hasText:'💊 My vitamins'});
 assert.ok(await offDay.locator('.health-routine-check').isDisabled());
 assert.match(await offDay.innerText(),/Not today/);assert.match(await p.locator('.health-care-summary').innerText(),/1 of 2 done/);
 await p.getByRole('button',{name:'Add a little routine',exact:true}).click();
 await p.locator('.health-routine-editor input').first().fill('🛁');await p.getByRole('button',{name:'Save routine',exact:true}).click();
 assert.equal(await p.locator('.health-routine-item').count(),4,label+' create');
 await p.getByRole('button',{name:'Edit 🛁',exact:true}).click();
 checks.push(await checkContrast(p,'.health-care-remove',label+' delete action'));
 await p.getByRole('button',{name:'Delete routine',exact:true}).click();
 assert.equal(await p.locator('.health-routine-item').count(),3,label+' delete only selected group');
 await p.getByRole('button',{name:'Edit Skincare',exact:true}).click();await back(p);
 assert.equal(await p.locator('.health-routine-editor').count(),0,label+' Back returns to routine list');
 await p.waitForTimeout(700);await p.reload();await p.waitForTimeout(700);await p.evaluate(()=>document.documentElement.dataset.native='true');
 await p.getByRole('button',{name:'Habits',exact:true}).click();await p.getByRole('button',{name:'Open daily health routine',exact:true}).click();
 assert.match(await p.locator('.health-care-summary').innerText(),/1 of 2 done/,label+' cadence and completion survive reload');
 assert.ok(await p.getByRole('button',{name:'Mark incomplete: Skincare',exact:true}).isVisible());
 const overflow=await p.locator('.health-routine-note').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(overflow,false,label+' no horizontal overflow');
 results.push({label,checks});console.log('PASS',label);
 } finally {await browser.close();}
}
for(const theme of ['samsungminimal','samsungao3'])for(const width of [320,360]){
 const {browser,p}=await setup(theme,'dark',width);p.setDefaultTimeout(8000);
 try{
 await p.getByRole('button',{name:'Create a movable post-it',exact:true}).click();await p.waitForTimeout(450);
 assert.equal(await p.locator('.post-it-editor-modal').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,theme+width+' narrow palette fits');
 await back(p);await p.getByRole('button',{name:'Habits',exact:true}).click();await p.getByRole('button',{name:'Open daily health routine',exact:true}).click();
 await p.getByRole('button',{name:'Edit Skincare',exact:true}).click();await p.locator('.health-routine-editor input').first().fill('🧼 A long routine that should wrap without covering its check');await p.getByRole('button',{name:'Save routine',exact:true}).click();
 const row=p.locator('.health-routine-item').filter({hasText:'🧼'});
 const overlap=await row.evaluate(el=>{const a=el.querySelector('.health-routine-body').getBoundingClientRect(),b=el.querySelector('.health-routine-check').getBoundingClientRect();return b.right>a.left;});
 assert.equal(overlap,false,theme+width+' check and title do not overlap');
 await p.setViewportSize({width,height:480});await p.getByRole('button',{name:'Add a little routine',exact:true}).click();await p.getByRole('button',{name:'Save routine',exact:true}).scrollIntoViewIfNeeded();
 assert.equal(await p.locator('.health-routine-note').evaluate(el=>el.scrollWidth>el.clientWidth+1),false,theme+width+' keyboard layout fits');
 results.push({label:theme+'-dark-'+width+'-narrow-keyboard'});console.log('PASS',theme,width,'narrow and keyboard');
 }finally{await browser.close();}
}
fs.writeFileSync(output+'/shared-paper-health-qa.json' ,JSON.stringify(results,null,2));
