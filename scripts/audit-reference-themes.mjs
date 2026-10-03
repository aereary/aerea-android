import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
const sources = fs.readdirSync('app', { recursive: true }).filter(p => /\.tsx$/.test(p) && !p.startsWith('api/'));
const controls = [], classes = new Map(), inlineStyles = [];
const flatten = s => s.replace(/\s+/g, ' ').trim();
for (const file of sources) {
 const full = path.join('app', file), text = fs.readFileSync(full, 'utf8');
 const source = ts.createSourceFile(full, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
 function visit(n) {
  if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
   const tag = n.tagName.getText(source), attrs = n.attributes.properties;
   const get = name => attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(source) === name)?.initializer;
   const classAttr = get('className');
   if (classAttr) {
    const raw = classAttr.getText(source);
    const tokens = raw.match(/[a-z][a-z0-9]*(?:-[a-z0-9]+)+|styles\.[A-Za-z]+/g) || [];
    if (ts.isStringLiteral(classAttr)) tokens.push(...classAttr.text.split(/\s+/));
    for (const c of new Set(tokens.filter(c=>!['aria-hidden','aria-label'].includes(c)))) {
     if (!classes.has(c)) classes.set(c, []);
     classes.get(c).push({ file: full, line: source.getLineAndCharacterOfPosition(n.getStart(source)).line + 1 });
    }
   }
   const style = get('style');
   if (style) inlineStyles.push({file: full, line: source.getLineAndCharacterOfPosition(n.getStart(source)).line+1, style: flatten(style.getText(source))});
   const events = attrs.filter(a=>ts.isJsxAttribute(a) && /^on[A-Z]/.test(a.name.getText(source))).map(a=>a.name.getText(source));
   if (['button','input','textarea','select','summary','a','audio','canvas'].includes(tag) || events.length || get('role')?.getText(source)==='"button"') {
    const label = get('aria-label') || get('title') || get('placeholder');
    const labelText = label ? flatten(label.getText(source)) : ts.isJsxElement(n.parent) ? flatten(n.parent.children.filter(c=>ts.isJsxText(c)).map(c=>c.getText(source)).join(' ')) : '';
    let context = n.parent;
    const ancestors=[];
    for(let j=0;context&&j<12;j++,context=context.parent) {
     if(ts.isJsxElement(context)) {
      const c=context.openingElement.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(source)==='className');
      if(c?.initializer) ancestors.push(flatten(c.initializer.getText(source)));
     }
     if(ts.isConditionalExpression(context)||ts.isBinaryExpression(context)&&context.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken) ancestors.push(flatten((context.condition||context.left).getText(source)).slice(0,90));
    }
    controls.push({id:`UI-${String(controls.length+1).padStart(4,'0')}`, file:full,line:source.getLineAndCharacterOfPosition(n.getStart(source)).line+1,tag,label:labelText||'(contenido dinámico)',className:classAttr?flatten(classAttr.getText(source)):'(sin clase propia: control base)',events,context:ancestors.slice(0,5)});
   }
  }
  ts.forEachChild(n, visit);
 }
 visit(source);
}
const result={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),note:'Inventario de código; incluye ramas condicionales y componentes reutilizados. No equivale a verificación visual de cada estado.',counts:{controls:controls.length,classes:classes.size,inlineStyles:inlineStyles.length},controls,classes:[...classes].sort(([a],[b])=>a.localeCompare(b)).map(([name,locations])=>({name,locations})),inlineStyles};
fs.mkdirSync('docs/design',{recursive:true});
fs.writeFileSync('docs/design/reference-ui-inventory.json',JSON.stringify(result,null,2)+'\n');
const escape=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
let md=`# Inventario técnico completo de aérea\n\nBase consultada: ${result.baseCommit}.\n\n${result.note}\n\n${controls.length} declaraciones de controles; ${classes.size} identificadores de clases; ${inlineStyles.length} estilos inline. Las declaraciones reutilizadas pueden generar muchos botones reales. Los selectores de color, tamaños de página, tinta, portada y archivos del usuario deben conservar su significado.\n\n## Todos los controles, uno por uno\n\n| ID | Archivo y línea | Elemento | Etiqueta o contenido | Clase | Contexto | Interacción |\n|---|---|---|---|---|---|---|\n`;
for(const c of controls) md+=`| ${c.id} | ${c.file}:${c.line} | ${c.tag} | ${escape(c.label)} | ${escape(c.className)} | ${escape(c.context.join(' → '))} | ${c.events.join(', ')} |\n`;
md+='\n## Todos los identificadores visuales\n\n';
for(const c of result.classes) md+=`- \`${c.name}\` — ${c.locations.map(l=>`${l.file}:${l.line}`).join(', ')}\n`;
md+='\n## Estilos inline que requieren revisión\n\n';
for(const i of inlineStyles) md+=`- ${i.file}:${i.line} — \`${i.style.replaceAll('`',"'")}\`\n`;
fs.writeFileSync('docs/design/reference-ui-inventory.md',md);
console.log(JSON.stringify(result.counts));
