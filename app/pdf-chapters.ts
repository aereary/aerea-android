// Conservative fallback only: page numbers remain available when no headings exist.
export function pdfChapterHeadings(texts: readonly string[]) {
 const seen=new Set<string>();const result:{title:string;page:number;depth:number}[]=[];
 texts.forEach((text,index)=>{
  for(const paragraph of text.split(/\n+/)) {
   const title=paragraph.trim();
   if(title.length>140||! /^(?:(?:chapter|chapitre|cap[ií]tulo|part|parte|section|secci[oó]n)\s+(?:\d+|[ivxlcdm]+)\b|prologue\b|epilogue\b|pr[oó]logo\b|ep[ií]logo\b)/i.test(title))continue;
   const key=title.toLowerCase();if(seen.has(key))continue;seen.add(key);result.push({title,page:index+1,depth:0});
  }
 });return result;
}
