type TextItem = {str?:string;hasEOL?:boolean;transform?:number[];height?:number};
/** Recover paragraphs from PDF text geometry; images/scans intentionally stay empty. */
export function pdfReadingText(items:TextItem[]) {
 const paragraphs:string[]=[],lines:string[]=[];let line='',lastY:number|undefined,lastHeight=12;
 const flushLine=()=>{if(line.trim())lines.push(line.trim());line=''};
 const flushParagraph=()=>{flushLine();if(lines.length)paragraphs.push(lines.join(' ').replace(/-\s+(?=[a-z])/g,''));lines.length=0};
 for(const item of items){if(typeof item.str!=='string')continue;
  const y=item.transform?.[5],height=Math.abs(item.height||item.transform?.[3]||12);
  if(y!==undefined&&lastY!==undefined&&Math.abs(y-lastY)>Math.max(lastHeight,height)*1.6)flushParagraph();
  else if(y!==undefined&&lastY!==undefined&&Math.abs(y-lastY)>Math.max(lastHeight,height)*.5)flushLine();
  line+=item.str+' ';if(item.hasEOL)flushLine();if(y!==undefined)lastY=y;lastHeight=height;
 }
 flushParagraph();return paragraphs.join('\n\n');
}
