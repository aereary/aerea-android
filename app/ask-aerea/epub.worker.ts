import { extractEpubText } from "./epub-text";
self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  try { self.postMessage({ chapters: await extractEpubText(event.data) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : "This EPUB could not be searched." }); }
};
