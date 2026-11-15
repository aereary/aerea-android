"use client";
import {useEffect,useRef,useState,type RefObject} from 'react';
import type {PDFDocumentProxy,RenderTask} from 'pdfjs-dist';

function ContinuousPage({document,page,width,text,content}:{document:PDFDocumentProxy;page:number;width:number;text:boolean;content:string}) {
 const host=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [near,setNear]=useState(false),[ratio,setRatio]=useState(1.414),[error,setError]=useState('');
 useEffect(()=>{const el=host.current;if(!el)return;const observer=new IntersectionObserver(entries=>setNear(entries[0].isIntersecting),{root:el.closest('.pdf-page-wrap'),rootMargin:'1000px'});observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{
  if(!near||text)return;let cancelled=false,task:RenderTask|undefined;const target=canvas.current;
  void (async()=>{const pdfPage=await document.getPage(page);if(cancelled||!target)return;const base=pdfPage.getViewport({scale:1});setRatio(base.height/base.width);const viewport=pdfPage.getViewport({scale:width/base.width});const density=Math.min(2,window.devicePixelRatio||1,Math.sqrt(3_000_000/(viewport.width*viewport.height)));target.width=Math.floor(viewport.width*density);target.height=Math.floor(viewport.height*density);const context=target.getContext('2d');if(!context)return;task=pdfPage.render({canvas:target,canvasContext:context,viewport,transform:[density,0,0,density,0,0]});await task.promise;})().catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Page unavailable')});
  return()=>{cancelled=true;task?.cancel();if(target){target.width=1;target.height=1}};
 },[document,page,width,near,text]);
 return <section ref={host} data-continuous-page={page} aria-label={`Page ${page}`} style={{width:'100%',minHeight:text?undefined:width*ratio,margin:'0 auto 20px',overflowAnchor:'auto'}}>{text?<div className="pdf-reflow"><small>Page {page}</small>{content?content.split(/\n\n/).map((p,i)=><p key={i}>{p}</p>):<p>No extracted text yet. Use Page view for scanned pages.</p>}</div>:<canvas className="pdf-paper-canvas" ref={canvas} style={{width:'100%',height:width*ratio,display:'block',background:'#fff'}}/>}{error&&<p role="status">{error}</p>}</section>;
}
export function PdfContinuous({document,scrollRef,page,text,texts,onLocation,initialOffset=0}:{document:PDFDocumentProxy;scrollRef:RefObject<HTMLDivElement|null>;page:number;text:boolean;texts:string[];onLocation:(page:number,offset:number)=>void;initialOffset?:number}) {
 const host=useRef<HTMLDivElement>(null),visible=useRef(0),location=useRef(onLocation),restored=useRef(false);
 const [width,setWidth]=useState(300);
 useEffect(()=>{location.current=onLocation},[onLocation]);
 useEffect(()=>{const el=host.current;if(!el)return;const observer=new ResizeObserver(()=>setWidth(Math.max(120,el.clientWidth)));observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{if(page===visible.current)return;const root=scrollRef.current,target=host.current?.querySelector<HTMLElement>(`[data-continuous-page="${page}"]`);if(!root||!target)return;visible.current=page;const offset=restored.current?0:initialOffset;restored.current=true;root.scrollTop+=target.getBoundingClientRect().top-root.getBoundingClientRect().top+offset*Math.max(0,target.offsetHeight-root.clientHeight);},[page,scrollRef,text,width,initialOffset]);
 useEffect(()=>{const root=scrollRef.current;if(!root)return;let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const top=root.getBoundingClientRect().top;const nodes=Array.from(host.current?.querySelectorAll<HTMLElement>('[data-continuous-page]')||[]);const node=nodes.find(el=>el.getBoundingClientRect().bottom>top+40);if(!node)return;const number=Number(node.dataset.continuousPage);visible.current=number;const offset=Math.max(0,Math.min(1,(top-node.getBoundingClientRect().top)/Math.max(1,node.offsetHeight-root.clientHeight)));location.current(number,offset)})};root.addEventListener('scroll',update,{passive:true});return()=>{cancelAnimationFrame(frame);root.removeEventListener('scroll',update)}},[scrollRef]);
 return <div ref={host} className="pdf-continuous">{Array.from({length:document.numPages},(_,i)=><ContinuousPage key={i} document={document} page={i+1} width={width} text={text} content={texts[i]||''}/>)}</div>;
}
