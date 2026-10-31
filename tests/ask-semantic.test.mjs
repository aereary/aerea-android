import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

function compiled(file) {
  return ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
}
const coreUrl = `data:text/javascript;base64,${Buffer.from(compiled("app/ask-aerea/core.ts")).toString("base64")}`;
const source = compiled("app/ask-aerea/semantic-core.ts").replace('"./core"', JSON.stringify(coreUrl));
const { cosine, semanticChunks, meaningCandidates, meaningQuery, combineMeaningResults } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const { answerQuery } = await import(coreUrl);
const now = new Date("2026-10-31T17:00:00Z");
const doc = (id, extra = {}) => ({ id, source: "library", kind: "AO3 work", title: id, text: "Comfort after a difficult day.", reference: id, tags: ["Fluff"], relationships: ["Lando Norris/Oscar Piastri"], complete: true, words: 60000, ...extra });
const hit = document => ({ document: { ...document, text: "" }, match: "semantic", reasons: ["Similar meaning"], excerpt: document.text });

test("meaning retrieval cannot relax ship, completion, word count or explicit exclusions", () => {
  const docs = [doc("yes"), doc("wrong-ship", { relationships: ["Charles Leclerc/Max Verstappen"] }), doc("ongoing", { complete: false }), doc("short", { words: 5000 }), doc("angst", { tags: ["Fluff", "Angst"] })];
  const base = answerQuery("Find only complete long landoscar pure fluff", docs, undefined, now);
  const found = meaningCandidates(docs, base.context.filter, "Find only complete long landoscar pure fluff", now);
  assert.deepEqual(found.map(document => document.id), ["yes"]);
});

test("named people and quoted titles remain hard constraints for meaning suggestions", () => {
  const docs = [doc("Oscar's evening"), doc("Other", { relationships: ["Charles Leclerc/Max Verstappen"] })];
  const base = answerQuery("Oscar care after a hard day", docs, undefined, now);
  assert.deepEqual(meaningCandidates(docs, base.context.filter, "Oscar care after a hard day", now).map(document => document.id), ["Oscar's evening"]);
  const quoted = answerQuery('Find "Other"', docs, undefined, now);
  assert.deepEqual(meaningCandidates(docs, quoted.context.filter, 'Find "Other"', now).map(document => document.id), ["Other"]);
});

test("real excerpts, exact-first order and distinct works survive semantic pagination", () => {
  const docs = Array.from({ length: 45 }, (_, i) => doc(`work-${i}`));
  const base = answerQuery("something unrelated", docs, undefined, now);
  const exact = [{ ...hit(docs[0]), match: "exact" }];
  const answer = combineMeaningResults(base, exact, docs.map(hit), "care after a hard day");
  assert.equal(answer.total, 45); assert.equal(answer.hits.length, 40);
  assert.equal(answer.hits[0].match, "exact");
  const more = answerQuery("Show more", docs, answer.context, now);
  const page = combineMeaningResults(more, exact, docs.map(hit), answer.context.meaningQuery);
  assert.equal(page.hits.length, 5); assert.equal(page.offset, 40);
  assert.equal(page.hits[0].excerpt, docs[40].text);
  assert.equal("probability" in page.hits[0], false);
  assert.equal(meaningQuery("Show more", page.context.filter, page.context), "care after a hard day");
});

test("short metadata passages are bounded and similarity is not a probability", () => {
  const chunks = semanticChunks(doc("A real title", { text: "Long summary ".repeat(1000) }));
  assert.equal(chunks.length, 3);
  assert.ok(chunks.every(chunk => chunk.length <= 650));
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [-1, 0]), -1);
  assert.equal(cosine([0, 0], [1, 1]), 0);
  assert.equal(cosine([1], [1, 2]), 0);
});

test("local inference is opt-in, cancellable, cached separately and never uploads documents", () => {
  const worker = readFileSync("app/ask-aerea/semantic.worker.ts", "utf8");
  const client = readFileSync("app/ask-aerea/semantic-client.ts", "utf8");
  const panel = readFileSync("app/ask-aerea/ask-panel.tsx", "utf8");
  assert.match(worker, /device: "wasm"/);
  assert.match(worker, /dtype: "q8"/);
  assert.match(worker, /document.source === "library"\) await writeIndex/);
  assert.doesNotMatch(worker, /supabase|\.insert\(|\.upload\(|fetch\(/);
  assert.match(client, /this.worker\?\.terminate\(\)/);
  assert.match(client, /caches.delete\(MODEL_CACHE\)/);
  assert.match(client, /indexedDB.deleteDatabase\(VECTOR_DB\)/);
  assert.match(panel, /meaningEnabled, setMeaningEnabled\] = useState\(false\)/);
  assert.match(panel, /await import\("\.\/semantic-client"\)/);
  assert.match(panel, /Showing exact and dictionary matches instead/);
});
