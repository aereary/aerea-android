/** Independent, bounded text extraction for Ask. Never touches the existing reader. */
export type TextChapter = { id: string; title: string; text: string };
const MAX_FILE = 40 * 1024 * 1024, MAX_ENTRY = 8 * 1024 * 1024, MAX_TEXT = 20 * 1024 * 1024;
const decoder = new TextDecoder();
export function decodeEntities(text: string): string {
  return text.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, value: string) => {
    const code = value[0].toLowerCase() === "x" ? parseInt(value.slice(1), 16) : Number(value);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "�";
  }).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, v => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&nbsp;": " " })[v] ?? v);
}
export function plainText(markup: string): string {
  return decodeEntities(markup.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|noscript|svg|nav)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ").replace(/<\/(?:p|h[1-6]|li|blockquote|div|tr)\s*>/gi, "\n").replace(/<[^>]*>/g, " ")).replace(/[\t \r]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}
const attr = (tag: string, name: string) => decodeEntities(tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? "");
function pathOf(base: string, relative: string) {
  if (/^[a-z]+:|^[/\\]/i.test(relative)) throw new Error("External EPUB resources cannot be searched.");
  const parts = base.split("/").slice(0, -1);
  for (const piece of decodeURIComponent(relative.split("#")[0]).split("/")) {
    if (piece === "..") { if (!parts.length) throw new Error("Invalid EPUB path."); parts.pop(); }
    else if (piece && piece !== ".") parts.push(piece);
  }
  return parts.join("/");
}
export async function extractEpubText(buffer: ArrayBuffer): Promise<TextChapter[]> {
  if (buffer.byteLength > MAX_FILE || buffer.byteLength < 22) throw new Error("Search supports EPUB files up to 40 MB.");
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  let end = -1;
  for (let i = Math.max(0, bytes.length - 65557); i <= bytes.length - 22; i++) if (view.getUint32(i, true) === 0x06054b50) end = i;
  if (end < 0) throw new Error("This EPUB has no readable ZIP index.");
  const count = view.getUint16(end + 10, true);
  if (count > 20000 || count === 0xffff) throw new Error("This EPUB is too large to index safely.");
  const entries = new Map<string, { method: number; size: number; compressed: number; offset: number; flags: number }>();
  let offset = view.getUint32(end + 16, true);
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new Error("Invalid EPUB ZIP index.");
    const length = view.getUint16(offset + 28, true), extra = view.getUint16(offset + 30, true), comment = view.getUint16(offset + 32, true);
    if (offset + 46 + length + extra + comment > end) throw new Error("Invalid EPUB ZIP entry.");
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + length));
    if (entries.has(name)) throw new Error("Ambiguous duplicate EPUB paths.");
    entries.set(name, { flags: view.getUint16(offset + 8, true), method: view.getUint16(offset + 10, true), compressed: view.getUint32(offset + 20, true), size: view.getUint32(offset + 24, true), offset: view.getUint32(offset + 42, true) });
    offset += 46 + length + extra + comment;
  }
  let total = 0;
  const read = async (name: string) => {
    const e = entries.get(name);
    if (!e || e.offset + 30 > bytes.length || view.getUint32(e.offset, true) !== 0x04034b50) throw new Error("A required EPUB resource is missing.");
    if (e.flags & 1 || e.size > MAX_ENTRY) throw new Error("Encrypted or oversized EPUB resources cannot be searched.");
    const start = e.offset + 30 + view.getUint16(e.offset + 26, true) + view.getUint16(e.offset + 28, true);
    if (start + e.compressed > bytes.length) throw new Error("Invalid EPUB resource size.");
    const input = bytes.slice(start, start + e.compressed);
    let output: Uint8Array;
    if (e.method === 0) output = input;
    else if (e.method === 8) {
      const stream = new Blob([input]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const reader = stream.getReader(), chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const chunk = await reader.read(); if (chunk.done) break;
          size += chunk.value.length;
          if (size > MAX_ENTRY || size + total > MAX_TEXT) { await reader.cancel(); throw new Error("EPUB text exceeds the safe search limit."); }
          chunks.push(chunk.value);
        }
      } finally { reader.releaseLock(); }
      output = new Uint8Array(size); let at = 0;
      for (const chunk of chunks) { output.set(chunk, at); at += chunk.length; }
    } else throw new Error("Unsupported EPUB compression.");
    if (output.byteLength !== e.size || output.byteLength > MAX_ENTRY || total + output.byteLength > MAX_TEXT) throw new Error("Invalid or oversized EPUB text.");
    total += output.byteLength;
    return decoder.decode(output);
  };
  const container = await read("META-INF/container.xml");
  const root = container.match(/<(?:[\w-]+:)?rootfile\b[^>]*>/i)?.[0];
  const packagePath = root && attr(root, "full-path");
  if (!packagePath) throw new Error("This EPUB has no declared reading package.");
  const pkg = await read(pathOf("", packagePath));
  const manifest = new Map<string, string>();
  const manifestXml = pkg.match(/<(?:[\w-]+:)?manifest\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?manifest\s*>/i)?.[1] ?? "";
  for (const item of manifestXml.matchAll(/<(?:[\w-]+:)?item\b[^>]*>/gi)) {
    const id = attr(item[0], "id"), href = attr(item[0], "href");
    if (id && href) manifest.set(id, pathOf(packagePath, href));
  }
  const spine = pkg.match(/<(?:[\w-]+:)?spine\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?spine\s*>/i)?.[1] ?? "";
  const chapters: TextChapter[] = [];
  for (const ref of spine.matchAll(/<(?:[\w-]+:)?itemref\b[^>]*>/gi)) {
    const id = attr(ref[0], "idref"), path = manifest.get(id);
    if (!path) throw new Error("A declared EPUB chapter is missing.");
    const html = await read(path), text = plainText(html);
    const heading = html.match(/<(?:h[1-3]|title)\b[^>]*>([\s\S]*?)<\/(?:h[1-3]|title)\s*>/i)?.[1];
    if (text) chapters.push({ id, title: heading ? plainText(heading) : `Chapter ${chapters.length + 1}`, text });
  }
  if (!chapters.length) throw new Error("No readable chapters were found.");
  return chapters;
}
