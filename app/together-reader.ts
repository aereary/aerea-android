import type { TogetherRow } from './together-model';
import { pdfReadingText } from './pdf-reading-text';
import { pdfChapterHeadings } from './pdf-chapters';
const escape = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
export async function prepareTogetherReader(reader: TogetherRow, onPdf: (document: import('pdfjs-dist').PDFDocumentProxy, destroy: () => Promise<void>) => void) {
    if (reader.kind === 'epub' && reader.book) {
        return { type: 'together-reader', fileId: reader.file.id, kind: 'epub', title: reader.book.title, author: reader.book.author, chapters: reader.book.chapters.map((c: TogetherRow) => ({ title: c.title, html: [...(c.illustrations || []), ...(c.blocks || c.text.split(/\n\n/).map((p: string) => '<p>' + escape(p) + '</p>'))].join('') })), state: reader.state || { chapter: reader.location?.chapter || 0, scrollOffset: reader.location?.offset || 0, bookmarks: [] } };
    }
    if (reader.kind === 'pdf') {
        const lib = await import('pdfjs-dist');
        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const task = lib.getDocument({ url: reader.source });
        const document = await task.promise;
        onPdf(document, () => task.destroy());
        const texts: string[] = [], sections: string[] = [];
        for (let i = 1; i <= document.numPages; i++) {
            const page = await document.getPage(i);
            const content = await page.getTextContent();
            const text = pdfReadingText(content.items.filter(item => 'str' in item));
            texts.push(text);
            sections.push(`<section data-pdf-page="${i}" ${text ? '' : 'data-scanned="true" style="min-height:65vh"'}>${text ? text.split(/\n\n/).map(p => '<p>' + escape(p) + '</p>').join('') : '<p>Preparing original page…</p>'}</section>`);
            if (i % 8 === 0)
                await new Promise(r => setTimeout(r, 0));
        }
        const outline: {
            title: string;
            page: number;
        }[] = [];
        const walk = async (items: Awaited<ReturnType<typeof document.getOutline>>) => { for (const item of items || []) {
            try {
                const dest = typeof item.dest === 'string' ? await document.getDestination(item.dest) : item.dest;
                const ref = dest?.[0];
                const page = typeof ref === 'number' ? ref + 1 : ref ? (await document.getPageIndex(ref)) + 1 : 0;
                if (page)
                    outline.push({ title: item.title, page });
            }
            catch { }
            await walk(item.items);
        } };
        await walk(await document.getOutline());
        if (!outline.length)
            outline.push(...pdfChapterHeadings(texts));
        if (!outline.length)
            for (let i = 1; i <= document.numPages; i++)
                outline.push({ title: `Page ${i}`, page: i });
        return { type: 'together-reader', fileId: reader.file.id, kind: 'pdf', title: reader.file.name, author: 'PDF', chapters: [{ title: reader.file.name, html: sections.join('') }], outline, pages: document.numPages, state: { chapter: 0, scrollOffset: reader.location?.offset || 0, page: reader.location?.page || 1, bookmarks: reader.location?.bookmarks || [] } };
    }
    return null;
}
