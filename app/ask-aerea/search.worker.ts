import { answerQuery, type AskContext, type AskDocument } from "./core";
self.onmessage = (event: MessageEvent<{ query: string; documents: AskDocument[]; context: AskContext; now: string }>) => {
  try {
    const { query, documents, context, now } = event.data;
    self.postMessage({ answer: answerQuery(query, documents, context, new Date(now)) });
  } catch { self.postMessage({ error: "Search could not be completed. Your original data is unchanged." }); }
};
