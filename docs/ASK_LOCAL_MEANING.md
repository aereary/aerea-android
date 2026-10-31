# Free local meaning search

Ask can optionally run a multilingual embedding model in a dedicated worker.
There is no inference API, API key, subscription, server deployment or billable
resource. A user must choose **Enable local AI** before loading it. The public
model files download from Hugging Face; queries and documents stay on device.

## Model and runtime

- Model: Xenova/paraphrase-multilingual-MiniLM-L12-v2, q8.
- Immutable revision: `2c4055b12046f11709e9df2c122e59ffbdc2f900`.
- Upstream Sentence Transformers model: Apache-2.0, 384 dimensions, 50 languages.
- Transformers.js 3.8.1, Apache-2.0; ONNX Runtime, MIT.
- Browser/Android: WASM, one thread; the matching runtime assets ship in the app.
- Optional download: approximately 140 MB including tokenizer/configuration.
- No model download or indexing occurs at app startup. CPU/model work is off the
  UI thread. Stop and Close terminate the worker; the rest of the app remains usable.

Sources:
- https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2
- https://huggingface.co/docs/transformers.js/v3.8.1/en/api/env

## Scope and guarantees

The existing read-only connector supplies the catalog; no AO3 module, original
file, metadata record, reader or Drive integration is changed by this feature.
An auxiliary IndexedDB store keeps only document IDs, text fingerprints and
derived library vectors, overwriting changed entries and pruning removed IDs.
Notes, journal and calendar vectors are not persisted. The separate Cache API
store holds fixed model assets. **Remove local AI & index** deletes both stores.
Disabling the feature retains its cache; clearing a conversation removes its
messages, not the model. Android/browser cache eviction may require a new download.

Exact matches precede meaning suggestions. Ship, named people/fandoms, dates,
length, completion and exclusions remain hard filters. Similarity is not shown
as a probability and never authorizes actions. Source text is never executed.
Cached vectors cannot introduce a document outside the current authorized snapshot.

This is retrieval, not a generative chatbot. It considers a short metadata
passage plus at most the first 1,200 characters of each supplied entry. It does
not semantically index every chapter or download all remote EPUBs. Existing
optional EPUB text search remains available separately. Source coverage is shown
in each answer. If inference fails, exact/dictionary search remains available.

## Validation

Unit tests cover mandatory constraints, pagination, deduplication, original
excerpts, opt-in loading, cancellation and cache deletion. Normal CI tests do
not require network access or a large model download.

Optional real-model test:

```
node scripts/check-local-meaning.mjs --download-model
```

Development verification on 2026-10-31 ran the actual q8 model on CPU and on
the shipped ONNX WASM runtime. A Spanish caregiving request ranked the English
caregiving passage above unrelated racing and database passages (WASM cosine
similarities approximately 0.269, -0.089 and 0.004). This is one smoke test, not
a benchmark of all queries. Device speed, memory, cache persistence and the
complete APK flow still require verification on the user's Samsung devices.
