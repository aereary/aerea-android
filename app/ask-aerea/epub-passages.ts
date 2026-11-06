import type { AskDocument, AskFilter } from "./core";
import type { TextChapter } from "./epub-text";

/** Streaming windows cover every character, including scenes near a chapter's end.
 * Only these original excerpts reach the local embedding worker; never a provider. */
export function* epubPassageBatches(chapters: AskDocument[], batchSize = 24): Generator<AskDocument[]> {
  let batch: AskDocument[] = [];
  for (const chapter of chapters) {
    const text = chapter.text;
    for (let start = 0; start < text.length; start += 480) {
      const passage = text.slice(start, start + 600);
      if (passage.trim()) batch.push({ ...chapter, id: `${chapter.id}:passage:${start}`, kind: "EPUB passage", text: passage });
      if (batch.length >= batchSize) { yield batch; batch = []; }
      if (start + 600 >= text.length) break;
    }
  }
  if (batch.length) yield batch;
}
export function chapterDocuments(file: { id: string; name: string }, chapters: TextChapter[], book?: AskDocument): AskDocument[] {
  return chapters.map(chapter => ({ ...book, id: `epub:${file.id}:${chapter.id}`, source: "library", kind: "EPUB chapter", title: book?.title ?? file.name, text: chapter.text, reference: `${file.name} · ${chapter.title}`, fileId: file.id, chapter: chapter.title }));
}
export function eligibleEpubFile(file: { id: string; name: string }, filter: AskFilter | undefined, catalog: AskDocument[]) {
  if (filter?.source && filter.source !== "library") return false;
  if (filter?.fileId) return file.id === filter.fileId;
  if (filter?.workId !== undefined) return catalog.some(book => book.workId === filter.workId && book.fileNames?.includes(file.name));
  if (filter?.bookTitle) return catalog.some(book => book.title === filter.bookTitle && book.fileNames?.includes(file.name)) || file.name === filter.bookTitle;
  return true;
}
