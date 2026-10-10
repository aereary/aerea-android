import { answerQuery, parseFilter, searchRememberedPassages, type AskContext, type AskDocument } from "./core";
self.onmessage = (event: MessageEvent<{ mode?: "passage"; query: string; documents: AskDocument[]; context: AskContext; now: string }>) => {
  try {
    const { mode, query, documents, context, now } = event.data;
    if (mode === "passage") {
      self.postMessage({ hits: searchRememberedPassages(documents, query, parseFilter(query, context.filter, new Date(now))) });
      return;
    }
    self.postMessage({ answer: answerQuery(query, documents, context, new Date(now)) });
  } catch { self.postMessage({ error: "Search could not be completed. Your original data is unchanged." }); }
};
