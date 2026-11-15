"use client";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { useBackLayer } from './use-back-layer';
import { readerDefaults, normalizeReaderPreferences, readerTapDirection, type ReaderPreferences } from './reader-preferences';
import './styles/reader-experience.css';
const key='aerea-reading-preferences-v2';
export function useReaderExperience(scrollRef:RefObject<HTMLElement|null>, next:()=>void, previous:()=>void, paginatable=true) {
  const [prefs,setPrefs]=useState<ReaderPreferences>(()=>{try { const saved=localStorage.getItem(key);return saved?normalizeReaderPreferences(JSON.parse(saved)):{...readerDefaults,theme:'theme'}; }catch{return {...readerDefaults}}});
  const [settings,setSettings]=useState(false),[tools,setTools]=useState(false),[hidden,setHidden]=useState(false),[running,setRunning]=useState(false);
  const live=useRef({prefs,next,previous,paginatable});useLayoutEffect(()=>{live.current={prefs,next,previous,paginatable}});
  const anchor=useRef<{element:Element;offset:number}|null>(null);
  const patch=(value:Partial<ReaderPreferences>)=>{
    const el=scrollRef.current;
    if(el && prefs.mode==='scroll') {const rect=el.getBoundingClientRect();const node=Array.from(el.querySelectorAll('p,h1,h2,li')).find(n=>n.getBoundingClientRect().bottom>rect.top+30);if(node)anchor.current={element:node,offset:node.getBoundingClientRect().top-rect.top};}
    setPrefs(p=>normalizeReaderPreferences({...p,...value}));
  };
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(prefs));}catch{} const el=scrollRef.current,a=anchor.current;if(el&&a?.element.isConnected&&prefs.mode==='scroll')el.scrollTop+=a.element.getBoundingClientRect().top-el.getBoundingClientRect().top-a.offset;anchor.current=null;},[prefs,scrollRef]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent('aereaReaderColorMode',{detail:{dark:prefs.theme==='night'}}));return()=>{window.dispatchEvent(new CustomEvent('aereaReaderColorMode',{detail:{dark:null}}))}},[prefs.theme]);
  useBackLayer(settings,()=>setSettings(false),160);
  useBackLayer(tools,()=>setTools(false),150);
  useBackLayer(hidden,()=>setHidden(false),140);
  useEffect(()=>{if(settings||tools)setRunning(false)},[settings,tools]);
  const advance=(direction:number)=>{
    const el=scrollRef.current;if(!el)return;
    const {prefs:p,next:n,previous:prev,paginatable:pages}=live.current;
    const horizontal=pages&&p.mode==='pages';const offset=horizontal?el.scrollLeft:el.scrollTop;
    const max=horizontal?el.scrollWidth-el.clientWidth:el.scrollHeight-el.clientHeight;
    if(direction>0&&offset>=max-3){n();return}if(direction<0&&offset<=3){prev();return}
    const distance=horizontal?el.clientWidth:(el.clientHeight*p.tapDistance/100);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({[horizontal?'left':'top']:direction*distance,behavior:p.animation==='none'||reduced?'instant':'smooth'});
    if(p.animation==='turn'&&!reduced)el.animate([{opacity:.65,transform:`perspective(1200px) rotateY(${direction*-2}deg)`},{opacity:1,transform:'none'}],{duration:240});
  };
  const advanceRef=useRef(advance);useLayoutEffect(()=>{advanceRef.current=advance});
  useEffect(()=>{
    const el=scrollRef.current;if(!el)return;
    let start:{x:number;y:number;time:number}|null=null;
    const down=(e:PointerEvent)=>{setRunning(false);start={x:e.clientX,y:e.clientY,time:performance.now()}};
    const up=(e:PointerEvent)=>{
      if(!start)return;const d=start;start=null;
      if((e.target as Element).closest('a,button,input,textarea,select,[data-tool="pen"],[data-tool="highlighter"],[data-tool="eraser"]'))return;
      if(window.getSelection()?.toString()||performance.now()-d.time>500)return;
      const dx=e.clientX-d.x,dy=e.clientY-d.y;
      if(live.current.prefs.mode==='pages'&&Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5){advanceRef.current(dx<0?1:-1);return}
      if(Math.hypot(dx,dy)>10)return;
      const rect=el.getBoundingClientRect(),direction=readerTapDirection(e.clientX-rect.left,e.clientY-rect.top,rect.width,rect.height,live.current.prefs);
      if(direction)advanceRef.current(direction);else setHidden(h=>!h);
    };
    const keyboard=(e:KeyboardEvent)=>{if((e.target as Element).closest('input,textarea,select'))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();advanceRef.current(1)}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();advanceRef.current(-1)}};
    el.addEventListener('pointerdown',down);el.addEventListener('pointerup',up);el.addEventListener('keydown',keyboard);
    return()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('pointerup',up);el.removeEventListener('keydown',keyboard)};
  },[scrollRef]);
  useEffect(()=>{
    if(!running)return;const el=scrollRef.current;if(!el)return;let frame=0,last=0,stopped=false;let position=el.scrollTop;let wake:WakeLockSentinel|undefined;
    navigator.wakeLock?.request('screen').then(lock=>{if(stopped)void lock.release();else wake=lock}).catch(()=>{});
    const tick=(time:number)=>{if(last){position+=Math.min(64,time-last)*live.current.prefs.speed/1000;el.scrollTop=position;if(el.scrollTop>=el.scrollHeight-el.clientHeight-1){setRunning(false);return}}last=time;frame=requestAnimationFrame(tick)};
    const pause=()=>setRunning(false);frame=requestAnimationFrame(tick);document.addEventListener('visibilitychange',pause);el.addEventListener('wheel',pause,{passive:true});
    return()=>{stopped=true;cancelAnimationFrame(frame);void wake?.release();document.removeEventListener('visibilitychange',pause);el.removeEventListener('wheel',pause)};
  },[running,scrollRef]);
  const fonts={serif:'Georgia, serif',classic:'"Times New Roman", serif',sans:'Arial, sans-serif',easy:'Verdana, sans-serif'};
  const shelfTheme=typeof document!=='undefined'?document.querySelector('.private-shelf')?.getAttribute('data-shelf-theme'):null;
  const shelfColors=prefs.theme==='theme'&&shelfTheme&&shelfTheme!=='App theme'?{'--reading-bg':shelfTheme==='Sea Glass'?'#162322':'#1a171e','--reading-ink':'#e7e1e8','--reading-ui':shelfTheme==='Sea Glass'?'#22312e':'#28222c','--reading-muted':'#bab1bf','--reading-border':'#504752'}:{};
  const style={...shelfColors,'--reading-font':fonts[prefs.font],'--reading-size':`${prefs.fontSize}px`,'--reading-line':prefs.lineHeight,'--reading-paragraph':`${prefs.paragraphSpace}em`,'--reading-width':`${prefs.width}px`,'--reading-align':prefs.align} as unknown as CSSProperties;
  return {prefs,patch,settings,setSettings,tools,setTools,hidden,setHidden,running,setRunning,advance,style};
}
export type ReaderExperience=ReturnType<typeof useReaderExperience>;
export function ReadingSettings({reader,pdf=false,text=true}:{reader:ReaderExperience;pdf?:boolean;text?:boolean}) {
 const [tab,setTab]=useState('Text');const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(reader.settings&&!dialog.current?.open)dialog.current?.showModal();if(!reader.settings&&dialog.current?.open)dialog.current.close();},[reader.settings]);
 const p=reader.prefs;
 const choices=<K extends keyof ReaderPreferences>(name:K,values:readonly ReaderPreferences[K][],labels?:string[])=><div className="reading-choices">{values.map((v,i)=><button type="button" key={String(v)} aria-pressed={p[name]===v} onClick={()=>reader.patch({[name]:v})}>{labels?.[i]||String(v)}</button>)}</div>;
 const slider=(name:'fontSize'|'lineHeight'|'paragraphSpace'|'width'|'speed'|'tapDistance',label:string,min:number,max:number,step=1)=><label className="reading-range"><span>{label}<output>{p[name]}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={p[name]} onChange={e=>reader.patch({[name]:Number(e.target.value)})}/></label>;
 const toggle=(name:'plain'|'removeBlank'|'tapBack'|'preservePdfColors',label:string)=><label className="reading-switch"><input type="checkbox" checked={p[name]} onChange={e=>reader.patch({[name]:e.target.checked})}/>{label}</label>;
 return <dialog className="reading-settings" ref={dialog} aria-label="Reading settings" onCancel={e=>{e.preventDefault();reader.setSettings(false)}} onClick={e=>{if(e.target===e.currentTarget)reader.setSettings(false)}}><div className="reading-settings-inner"><header><strong>Reading settings</strong><button onClick={()=>reader.setSettings(false)}>Done</button></header>{text&&slider('fontSize','Size',12,40)}<small>Page colour</small>{choices('theme',['paper','sepia','night','theme'],['Paper','Sepia','Night','Theme'])}<nav aria-label="Settings sections">{['Text','More','Scroll'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</nav>{tab==='Text'&&(text?<><small>Font</small>{choices('font',['serif','classic','sans','easy'],['Serif','Classic','Sans','Easy read'])}<small>Alignment</small>{choices('align',['left','justify','center','right'])}<small>Text colour</small>{choices('textTone',['default','soft','warm','amber'])}{slider('lineHeight','Line spacing',1.2,2.6,.1)}{slider('paragraphSpace','Paragraph spacing',0,2.5,.1)}</>:<p>Switch to Text view to adjust the PDF’s typography.</p>)}{tab==='More'&&<>{slider('width','Page width',320,1200,20)}{text&&<>{toggle('plain','Use simple text formatting')}{toggle('removeBlank','Remove empty lines')}</>}{pdf&&toggle('preservePdfColors','Keep the PDF’s original colours')}<p>Your reading position, bookmarks and notes stay with this file.</p></>}{tab==='Scroll'&&<>{text&&<><small>Reading style</small>{choices('mode',['scroll','pages'],['Scroll','Pages'])}<small>Page animation</small>{choices('animation',['slide','turn','none'],['Slide','Page turn','None'])}</>}<small>Tap to advance</small>{choices('tap',['off','right','left','bottom','anywhere'],['Off','Right','Left','Bottom','Anywhere'])}{slider('tapDistance','Scroll distance (%)',25,100,5)}{toggle('tapBack','Tap near the top to go back')}{p.mode==='scroll'&&<>{slider('speed','Auto-scroll (pixels / second)',5,100,5)}<button className="reading-primary" onClick={()=>{reader.setSettings(false);reader.setRunning(true)}}>Start auto-scroll</button><p>Touch the page to pause. The screen stays awake while scrolling when supported.</p></>}</>}</div></dialog>
}
