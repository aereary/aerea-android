export type ReaderPreferences = {
  font: 'serif' | 'classic' | 'sans' | 'easy'; fontSize: number; lineHeight: number;
  paragraphSpace: number; width: number; align: 'left' | 'justify' | 'center' | 'right';
  theme: 'paper' | 'sepia' | 'night' | 'theme'; textTone: 'default' | 'soft' | 'warm' | 'amber';
  mode: 'scroll' | 'pages'; animation: 'slide' | 'turn' | 'none';
  tap: 'off' | 'right' | 'left' | 'bottom' | 'anywhere'; tapDistance: number; tapBack: boolean;
  speed: number; preservePdfColors: boolean; plain: boolean; removeBlank: boolean;
};
export const readerDefaults: ReaderPreferences = { font:'serif',fontSize:19,lineHeight:1.7,paragraphSpace:1,width:760,align:'left',theme:'paper',textTone:'default',mode:'scroll',animation:'slide',tap:'off',tapDistance:85,tapBack:true,speed:30,preservePdfColors:true,plain:false,removeBlank:false };
export function normalizeReaderPreferences(value: unknown): ReaderPreferences {
  const out = {...readerDefaults};
  if (!value || typeof value !== 'object') return out;
  const input=value as Record<string,unknown>;
  const options={font:['serif','classic','sans','easy'],align:['left','justify','center','right'],theme:['paper','sepia','night','theme'],textTone:['default','soft','warm','amber'],mode:['scroll','pages'],animation:['slide','turn','none'],tap:['off','right','left','bottom','anywhere']};
  for(const [key,allowed] of Object.entries(options)) if(allowed.includes(String(input[key]))) Object.assign(out,{[key]:input[key]});
  const limits={fontSize:[12,40],lineHeight:[1.2,2.6],paragraphSpace:[0,2.5],width:[320,1200],tapDistance:[25,100],speed:[5,100]};
  for(const [key,[min,max]] of Object.entries(limits)) if(typeof input[key]==='number' && Number.isFinite(input[key])) Object.assign(out,{[key]:Math.max(min,Math.min(max,input[key] as number))});
  for(const key of ['tapBack','preservePdfColors','plain','removeBlank']) if(typeof input[key]==='boolean') Object.assign(out,{[key]:input[key]});
  return out;
}
export function readerFraction(scroll: number, total: number, viewport: number) { return Math.max(0,Math.min(1,scroll/Math.max(1,total-viewport))); }
export function readerTapDirection(x:number,y:number,width:number,height:number,p:ReaderPreferences) {
  if(p.mode==='pages') return x<width*.3?-1:x>width*.7?1:0;
  const active=p.tap==='anywhere'||p.tap==='right'&&x>width*.7||p.tap==='left'&&x<width*.3||p.tap==='bottom'&&y>height*.75;
  return active?(p.tapBack && y<height*.2?-1:1):0;
}
