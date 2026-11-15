"use client";
import{useEffect,useRef,type ComponentProps}from'react';
import type{LegacyEpubStudyReader}from'./study-reader';
import{approvedReaderDocument}from'./approved-reader-document';
import{useBackLayer}from'./use-back-layer';
type Props=ComponentProps<typeof LegacyEpubStudyReader>;
export function ApprovedEpubReader(props:Props){
 const frame=useRef<HTMLIFrameElement>(null),latest=useRef(props);
 useEffect(()=>{latest.current=props},[props]);
 useBackLayer(true,props.onClose,130);
 useEffect(()=>{const handle=(event:MessageEvent)=>{if(event.source!==frame.current?.contentWindow)return;const data=event.data,p=latest.current;if(data?.type==='aerea-ready')frame.current?.contentWindow?.postMessage({type:'aerea-book',book:{title:p.book.title,author:p.book.author,chapters:p.book.chapters.map(c=>({title:c.title,html:[...(c.illustrations||[]),...(c.blocks||c.text.split(/\n\n/).map(t=>'<p>'+t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]!))+'</p>'))].join('')}))},state:p.readingState},'*');
 if(data?.type==='aerea-close')p.onClose();
 if(data?.type==='aerea-location'&&Number.isInteger(data.chapter)&&data.chapter>=0&&data.chapter<p.book.chapters.length){const bookmarks=Array.isArray(data.bookmarks)?data.bookmarks.filter((n:unknown)=>Number.isInteger(n)&&Number(n)>=0&&Number(n)<p.book.chapters.length):p.readingState.bookmarks;p.onReadingStateChange({...p.readingState,chapter:data.chapter,fontSize:Math.min(32,Math.max(14,Number(data.fontSize)||20)),scrollOffset:Math.min(1,Math.max(0,Number(data.scrollOffset)||0)),bookmarks},JSON.stringify(bookmarks)===JSON.stringify(p.readingState.bookmarks)?'location':'content')}
 };window.addEventListener('message',handle);return()=>window.removeEventListener('message',handle)},[]);
 return <iframe ref={frame} title="aérea reader" srcDoc={approvedReaderDocument} style={{position:'fixed',inset:0,width:'100%',height:'100dvh',border:0,zIndex:23000,background:'#19191b'}}/>;
}
