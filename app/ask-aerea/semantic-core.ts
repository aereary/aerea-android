import { normalize, searchDocuments, isMoreRequest, type AskAnswer, type AskContext, type AskDocument, type AskFilter, type AskHit } from "./core";

export const SEMANTIC_MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
export const SEMANTIC_REVISION = "2c4055b12046f11709e9df2c122e59ffbdc2f900";
export const MODEL_CACHE = "aerea-ask-meaning-model-v1";
export const VECTOR_DB = "aerea-ask-meaning-v1";
export const MIN_MEANING_SCORE = 0.25;

export function semanticChunks(document: AskDocument): string[] {
  // Short passages fit MiniLM's input window. Do not silently index only a title.
  const identity = [document.title, document.author, ...(document.relationships ?? []), ...(document.fandoms ?? [])].filter(Boolean).join(" · ");
  const tags = (document.tags ?? []).join(", ");
  const summary = document.text.replace(/\s+/g, " ").trim();
  return [...new Set([
    `${identity}. ${tags}`.slice(0, 650),
    ...(summary ? [summary.slice(0, 600), summary.slice(600, 1200)] : []),
  ].filter(Boolean))];
}

export function meaningQuery(request: string, filter: AskFilter, context: AskContext) {
  const follow = isMoreRequest(request) || /\b(only|solo|solamente|filter|filtra)\b/.test(normalize(request));
  if (isMoreRequest(request) && context.meaningQuery) return context.meaningQuery;
  if (follow && context.meaningQuery) {
    const additions = filter.terms.filter(term => !context.filter?.terms.includes(term));
    return `${context.meaningQuery} ${additions.join(" ")}`.trim();
  }
  return request.replace(/^(?:please\s+)?(?:find|search(?: for)?|look for|show me|busca(?:me)?|encuentra(?:me)?|muestra(?:me)?)\s+/i, "").trim();
}

export function meaningCandidates(documents: AskDocument[], filter: AskFilter, request: string, now: Date) {
  // Keep explicit dates, lengths, completion, exclusions, ship and named people/
  // fandoms as hard constraints. Similarity must never override those filters.
  const identities = documents.flatMap(document => [...(document.relationships ?? []), ...(document.fandoms ?? [])]).map(normalize);
  const quoted = [...request.matchAll(/["“]([^"”]+)["”]/g)].map(match => normalize(match[1]));
  const hardTerms = filter.terms.filter(term => quoted.includes(term)
    || filter.pureFluff && term === "fluff"
    || identities.some(identity => identity.includes(term)));
  const allowed = new Set(searchDocuments(documents, { ...filter, terms: hardTerms }, now).map(hit => hit.document.id));
  return documents.filter(document => allowed.has(document.id));
}

export function cosine(left: number[], right: number[]) {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0, a = 0, b = 0;
  for (let i = 0; i < left.length; i++) { dot += left[i] * right[i]; a += left[i] ** 2; b += right[i] ** 2; }
  const score = dot / Math.sqrt(a * b);
  return Number.isFinite(score) ? score : 0;
}

export function combineMeaningResults(base: AskAnswer, exact: AskHit[], related: AskHit[], query: string): AskAnswer {
  const seen = new Set<string>();
  const all = [...exact, ...related].filter(hit => {
    const key = hit.document.workId ? `work:${hit.document.workId}` : hit.document.id;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  const offset = base.offset ?? 0;
  const hits = all.slice(offset, offset + 40);
  return { ...base, total: all.length, hits,
    text: all.length ? `${all.length} results. Exact matches come first; meaning matches are suggestions to check in the original source.` : "No reliable matches in the selected sources. Try describing another detail.",
    context: { ...base.context, hits, meaningQuery: query },
  };
}
