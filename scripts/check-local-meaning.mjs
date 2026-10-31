// Optional real-model smoke test. Normal CI tests never download model weights.
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env, pipeline } from "@huggingface/transformers";

if (!process.argv.includes("--download-model")) {
  console.log("Run with --download-model to permit the free model download (~140 MB). No API or account is used.");
  process.exit(0);
}
env.cacheDir = process.env.AEREA_MEANING_TEST_CACHE || join(tmpdir(), "aerea-meaning-smoke");
const embed = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2", {
  revision: "2c4055b12046f11709e9df2c122e59ffbdc2f900", dtype: "q8", device: "cpu",
});
try {
  const vectors = (await embed([
    "Quiero una historia donde uno cuide al otro despues de un dia horrible.",
    "After a miserable day at work, he comes home exhausted. His partner comforts him and takes gentle care of him.",
    "Two racing drivers fight for a world championship and improve their qualifying times.",
    "A guide to database security and network encryption.",
  ], { pooling: "mean", normalize: true })).tolist();
  const scores = vectors.slice(1).map(vector => vector.reduce((sum, value, index) => sum + value * vectors[0][index], 0));
  assert.equal(vectors[0].length, 384);
  assert.ok(scores[0] >= 0.25);
  assert.ok(scores[0] > Math.max(...scores.slice(1)) + 0.1);
  console.log("Real multilingual model passed: the English caregiving passage ranks above unrelated racing and database passages for the Spanish request. Scores are similarities, not confidence percentages.");
} finally { await embed.dispose(); }
