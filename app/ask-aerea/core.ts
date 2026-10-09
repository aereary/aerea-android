/** Deterministic retrieval. Documents are data; they never produce tool calls. */
export type AskSource = "library" | "calendar" | "notes" | "journal" | "recordings";
export type AskDocument = {
  id: string; source: AskSource; kind: string; title: string; text: string;
  reference: string; author?: string; date?: string; time?: string;
  complete?: boolean | null; words?: number | null; tags?: string[];
  relationships?: string[]; fandoms?: string[]; series?: string[];
  workId?: number; driveId?: string; fileId?: string; chapter?: string;
  versionCount?: number; archived?: boolean; fileNames?: string[];
};
export type AskFilter = { terms: string[]; complete?: boolean; minWords?: number; maxWords?: number; source?: AskSource; day?: string; upcoming?: boolean };
export type AskHit = { document: AskDocument; match: "exact" | "related"; reasons: string[]; excerpt: string };
export type AskContext = { filter?: AskFilter; hits: AskHit[]; topic?: string };
export type AskEventDraft = { title: string; date: string; time: string; allDay: boolean };
export type AskAnswer = { text: string; hits: AskHit[]; total: number; context: AskContext; open?: AskDocument; draft?: AskEventDraft; operation?: "search" };

/** A chapter enriches a known work rather than becoming another copy of it. */
export function mergeEpubHit(hits: AskHit[], chapter: AskHit, alreadyCounted: boolean) {
  const workId = chapter.document.workId;
  const existing = hits.findIndex(hit => workId !== undefined
    ? hit.document.workId === workId
    : hit.document.fileId === chapter.document.fileId);
  if (existing >= 0) {
    if (!hits[existing].document.chapter) hits[existing] = chapter;
    return 0;
  }
  if (!alreadyCounted && hits.length < 40) hits.push(chapter);
  return alreadyCounted ? 0 : 1;
}

export const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const STOP = new Set("busca buscar buscá buscame encuentra encontrar encuentrá muestrame muestra mostrar mis mi el la los las un una unos unas de del en entre todos todas que donde cuando cual cuales tengo tenemos me por para con sin quiero quisiera necesito puedes podria haz hola hay ese esa esto este estos esas algo solamente solo similares parecido parecidos parecido al a y o lo se le sus su es esta estan estaba eran sea sobre relacionada relacionados relacionado relacionado relacionado relacionada related find search show all my me i want need the a an of in for to with and or please books book fanfic fanfics historias historia libros libro obras obra biblioteca library fics fic notas nota apuntes apunte notes note documents documentos archivos archivo document files file calendario calendar schedule horario materias materia clases clase eventos evento event events terminados terminadas terminado terminada completas completo completa completos completed complete finished ongoing incompletos incompleto largas largos larga largo long cortos cortas corta corto short palabras words word pronto proximo proximos proxima proximas next upcoming manana hoy tomorrow today ayer yesterday solamentes have what when which ultima ultimo leido leyendo like those them same only ones ahora ahead recordar recuerdo remember recuerdó scene escena escená capitulos capitulo chapter within inside contenido texto fulltext drive google apuntes estudiar estudiaré examenes exams examen exam cuantos cuanto".split(/\s+/));
const synonyms = [
  ["f1", "formula 1", "formula one"],
  ["final feliz", "happy ending", "happy endings"], ["celos", "jealousy", "jealous"],
  ["fin del mundo", "apocalipsis", "apocalypse", "apocalyptic", "post-apocalyptic"],
  ["hurt/comfort", "hurt comfort", "consuelo"], ["relacion establecida", "established relationship"],
  ["omegaverse", "alpha/beta/omega dynamics", "a/b/o"], ["protector", "protective"],
  ["nido", "nest", "nesting"], ["reconciliacion", "reconcile", "reconciliation"],
  ["viaje", "trip", "travel"], ["hospital", "hospitalization"],
  ["termodinamica", "thermodynamics"], ["energia cinetica", "kinetic energy"],
  ["primera ley", "first law"], ["examen", "exam", "examination", "parcial"],
];
for (const word of "todo algo information informacion material materiales tema temas about related relacion relacionar encuentra muestre dame porfavor please como del donde buscar uno una tienen que quiero seria sera podria puedes finished buscar relacionados everything related".split(/\s+/)) STOP.add(word);

export function dateKey(now = new Date(), zone = "America/Panama") {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function shiftDay(day: string, count: number) {
  const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + count); return d.toISOString().slice(0, 10);
}
export function queryDate(query: string, now = new Date()): string | undefined {
  const q = normalize(query), today = dateKey(now);
  const explicit = q.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (explicit) {
    const d = new Date(`${explicit[1]}T12:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === explicit[1] ? explicit[1] : undefined;
  }
  if (/\b(pasado manana|day after tomorrow)\b/.test(q)) return shiftDay(today, 2);
  if (/\b(manana|tomorrow)\b/.test(q)) return shiftDay(today, 1);
  if (/\b(hoy|today)\b/.test(q)) return today;
  if (/\b(ayer|yesterday)\b/.test(q)) return shiftDay(today, -1);
  const weekdays = ["domingo|sunday", "lunes|monday", "martes|tuesday", "miercoles|wednesday", "jueves|thursday", "viernes|friday", "sabado|saturday"];
  const day = weekdays.findIndex(names => new RegExp(`\\b(${names})\\b`).test(q));
  if (day < 0) return undefined;
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  let delta = (day - weekday + 7) % 7;
  if (delta === 0) delta = 7;
  if (/\b(semana que viene|proxima semana|next week)\b/.test(q)) delta = 7 - (weekday + 6) % 7 + (day + 6) % 7;
  return shiftDay(today, delta);
}
function termsOf(query: string) {
  let q = normalize(query);
  const terms: string[] = [];
  q = q.replace(/["“”]([^"“”]+)["“”]/g, (_, phrase: string) => { terms.push(phrase.trim()); return " "; });
  for (const group of synonyms) {
    const phrase = group.find(p => p.includes(" ") && q.includes(p));
    if (phrase) { terms.push(phrase); q = q.replaceAll(phrase, " "); }
  }
  q.match(/[\p{L}\p{N}_/+-]+/gu)?.forEach(word => {
    if (word.length > 1 && !STOP.has(word) && !/^\d+$/.test(word)) terms.push(word);
  });
  return [...new Set(terms)];
}
export function parseFilter(query: string, previous?: AskFilter, now = new Date()): AskFilter {
  const q = normalize(query);
  const follow = /\b(solo|solamente|only|filtra|filter)\b/.test(q) && previous;
  const filter: AskFilter = follow ? { ...previous, terms: [...previous.terms] } : { terms: [] };
  const date = queryDate(query, now);
  if (date) filter.day = date;
  if (/\b(proxim[oa]s?|next|upcoming)\b/.test(q)) filter.upcoming = true;
  if (/\b(terminad[oa]s?|complet[oa]s?|completed|complete|finished)\b/.test(q)) filter.complete = true;
  if (/\b(incomplet[oa]s?|ongoing|en curso)\b/.test(q)) filter.complete = false;
  if (/\b(larg[oa]s?|long)\b/.test(q)) filter.minWords = 50000;
  if (/\b(cort[oa]s?|short)\b/.test(q)) filter.maxWords = 20000;
  const more = q.match(/(?:mas de|at least|more than)\s*(\d[\d.,]*)\s*(?:palabras|words)/);
  const less = q.match(/(?:menos de|less than)\s*(\d[\d.,]*)\s*(?:palabras|words)/);
  if (more) filter.minWords = Number(more[1].replace(/[.,]/g, ""));
  if (less) filter.maxWords = Number(less[1].replace(/[.,]/g, ""));
  if (/\b(fanfics?|libros?|books?|fics?|biblioteca|library)\b/.test(q)) filter.source = "library";
  else if (/\b(journal|diario)\b/.test(q)) filter.source = "journal";
  else if (/\b(grabaciones?|recordings?)\b/.test(q)) filter.source = "recordings";
  else if (/\b(calendario|calendar|eventos?|events?|materias?|clases?|schedule)\b/.test(q) || date || /\b(proximos examenes|next exam)\b/.test(q)) filter.source = "calendar";
  else if (/\b(notas?|notes?|apuntes?)\b/.test(q) && !/\b(todo|all|relacion|examen|exam)\b/.test(q)) filter.source = "notes";
  if (/\b(todo lo relacionado|todo.*examen|all.*related|para estudiar|to study)\b/.test(q)) { delete filter.source; delete filter.day; }
  const stripped = q.replace(/\b20\d{2}-\d{2}-\d{2}\b/g, " ").replace(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo|monday|tuesday|wednesday|thursday|friday|saturday|sunday|pasado manana|proxima semana|next week|mas de|menos de|at least|more than|less than)\b/g, " ");
  const newTerms = termsOf(stripped);
  // Examinations are a searchable category even when other search verbs are discarded.
  if (/\b(examenes?|exams?|parcial)\b/.test(q) && !/para estudiar|to study/.test(q)) newTerms.push("examen");
  filter.terms = [...new Set([...filter.terms, ...newTerms])];
  return filter;
}
const aliases = (term: string) => synonyms.find(g => g.includes(term)) ?? [term];
function excerptOf(text: string, terms: string[]) {
  const index = terms.flatMap(aliases).map(term => normalize(text).indexOf(term)).filter(i => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const from = Math.max(0, index - 80);
  return `${from ? "…" : ""}${text.slice(from, from + 300).replace(/\s+/g, " ")}${text.length > from + 300 ? "…" : ""}`;
}
export function searchDocuments(documents: AskDocument[], filter: AskFilter, now = new Date()): AskHit[] {
  const today = dateKey(now);
  const found: Array<AskHit & { rank: number }> = [];
  for (const document of documents) {
    if (filter.source && document.source !== filter.source) continue;
    if (filter.complete !== undefined && document.complete !== filter.complete) continue;
    if (filter.minWords !== undefined && (document.words == null || document.words < filter.minWords)) continue;
    if (filter.maxWords !== undefined && (document.words == null || document.words > filter.maxWords)) continue;
    if (filter.day && document.date !== filter.day) continue;
    if (filter.upcoming && (!document.date || document.date < today)) continue;
    const haystack = normalize([document.title, document.text, document.author, ...(document.tags ?? []), ...(document.relationships ?? []), ...(document.fandoms ?? []), ...(document.series ?? [])].join(" "));
    const matched = filter.terms.map(term => ({ term, alias: aliases(term).find(alias => haystack.includes(alias)) })).filter(t => t.alias);
    if (filter.terms.length && matched.length < filter.terms.length) continue;
    // Respect every explicit term. Related wording only broadens each term, never drops a constraint.
    const related = matched.some(t => t.alias !== t.term);
    const reasons = matched.map(t => t.alias === t.term ? `Contains “${t.term}”` : `Related wording: “${t.term}” → “${t.alias}”`);
    if (filter.complete !== undefined) reasons.push(filter.complete ? "Recorded as complete" : "Recorded as ongoing");
    if (filter.minWords !== undefined) reasons.push(`${document.words?.toLocaleString("en-US")} words · minimum ${filter.minWords.toLocaleString("en-US")}`);
    if (filter.maxWords !== undefined) reasons.push(`${document.words?.toLocaleString("en-US")} words · maximum ${filter.maxWords.toLocaleString("en-US")}`);
    if (!reasons.length) reasons.push("In the selected source");
    found.push({ document: { ...document, text: "" }, match: related ? "related" : "exact", reasons, excerpt: excerptOf(document.text, filter.terms), rank: matched.reduce((score, t) => score + (normalize(document.title).includes(t.alias!) ? 3 : 1), 0) });
  }
  found.sort((a, b) => filter.upcoming || filter.day ? (a.document.date ?? "").localeCompare(b.document.date ?? "") || (a.document.time ?? "").localeCompare(b.document.time ?? "") : b.rank - a.rank || a.document.title.localeCompare(b.document.title));
  return found.map(hit => ({ document: hit.document, match: hit.match, reasons: hit.reasons, excerpt: hit.excerpt }));
}

export function parseEventRequest(query: string, now = new Date()): { draft?: AskEventDraft; clarification?: string } | undefined {
  const q = normalize(query);
  if (!/\b(crea|crear|agrega|agregar|ponme|create|add|schedule)\b/.test(q) || !/\b(evento|event|examen|exam|recordatorio|reminder|cita|appointment)\b/.test(q)) return;
  const date = queryDate(query, now);
  if (!date) return { clarification: "Which date? Use tomorrow, a weekday, or YYYY-MM-DD." };
  const allDay = /todo el dia|all day/.test(q);
  const timeMatch = q.match(/(?:a las|at)\s*(\d{1,2})(?::(\d{2}))?\s*([ap])\s*\.?\s*m\.?/);
  const time24 = q.match(/(?:a las|at)\s*([01]\d|2[0-3]):([0-5]\d)\b(?!\s*[ap])/);
  if (!allDay && !timeMatch && !time24) return { clarification: "What time? Include AM or PM, for example 5:45 PM; or say all day." };
  let time = "";
  if (timeMatch) {
    const h = Number(timeMatch[1]), m = Number(timeMatch[2] ?? "0");
    if (h < 1 || h > 12 || m > 59) return { clarification: "Use a valid 12-hour time, such as 5:45 PM." };
    time = `${String(h % 12 + (timeMatch[3] === "p" ? 12 : 0)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } else if (time24) time = `${time24[1]}:${time24[2]}`;
  const quoted = query.match(/["“]([^"”]+)["”]/)?.[1];
  const title = quoted ?? query.replace(/^(?:crea(?:me)?|crear|agrega(?:me)?|agregar|ponme|create|add|schedule)\s+(?:(?:un|una|an?|me)\s+)?(?:(?:evento|event|recordatorio|reminder)\s+(?:para\s+)?)?/i, "").split(/\s+(?:el|para|on|tomorrow|mañana|at|a las)\s*/i)[0].trim();
  if (!title || title.length > 240) return { clarification: "What should the event be called? You can put its title in quotation marks." };
  return { draft: { title, date, time, allDay } };
}

export function answerQuery(query: string, documents: AskDocument[], context: AskContext = { hits: [] }, now = new Date()): AskAnswer {
  const q = normalize(query);
  const action = parseEventRequest(query, now);
  if (action) return { text: action.clarification ?? "Event draft ready. Review its details and choose an end time in Calendar, then save. Nothing has been created yet.", draft: action.draft, hits: [], total: 0, context };
  if (/\b(el primero|the first|cual es el primero)\b/.test(q) && context.hits.length) {
    const hit = context.hits[0];
    return { text: "First result from your last search.", hits: [hit], total: 1, context: { ...context, topic: hit.document.title } };
  }
  if (/\b(abre|abrir|open)\b/.test(q)) {
    const number = q.match(/\b(\d+)\b/)?.[1];
    const ordinal = /segundo|second/.test(q) ? 2 : /tercero|third/.test(q) ? 3 : /primero|first/.test(q) ? 1 : undefined;
    const selected = context.hits[(Number(number) || ordinal || 0) - 1];
    return { text: selected ? "Opening the selected result." : "Which result? Say open 1, or use an Open button.", hits: [], total: 0, context, open: selected?.document };
  }
  // No silent modifications; this stage hands off edits/deletions to existing editors.
  if (/^(cambia|modifica|elimina|borra|delete|remove|edit|change)\b/.test(q)) return { text: "Open the matching result to edit it using the existing controls. Ask does not change or delete records in this stage.", hits: [], total: 0, context };
  const filter = parseFilter(query, context.filter, now);
  if (/\b(para estudiar|to study|relacionado con ese|related to that)\b/.test(q) && context.topic && !filter.terms.length) filter.terms = termsOf(context.topic).filter(t => !aliases("examen").includes(t));
  const found = searchDocuments(documents, filter, now);
  const hits = found.slice(0, 40);
  const constraints = filter.minWords === 50000 ? " Long means at least 50,000 words." : filter.maxWords === 20000 ? " Short means at most 20,000 words." : "";
  return {
    operation: "search",
    text: found.length ? `${found.length} matching ${found.length === 1 ? "result" : "results"} in the selected sources.${constraints} Related wording uses a small bilingual dictionary; semantic AI is not enabled.` : "No matching results in the selected sources. Try a name, tag, shorter phrase, or enable another source. This is a local search, not a semantic AI answer.",
    hits, total: found.length, context: { filter, hits, topic: hits.length === 1 ? hits[0].document.title : context.topic },
  };
}
