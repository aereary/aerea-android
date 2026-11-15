export type EpubChapter = {
  id: string;
  title: string;
  text: string;
  blocks?: string[];
  illustrations?: string[];
};

export type EpubBook = {
  title: string;
  author: string;
  chapters: EpubChapter[];
};

type ZipEntry = {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
};

const textDecoder = new TextDecoder("utf-8");
const MAX_EPUB_BYTES = 50 * 1024 * 1024;
const MAX_EPUB_ENTRY_BYTES = 12 * 1024 * 1024;
const MAX_EPUB_ENTRIES = 20_000;

function normalizeZipPath(path: string) {
  const pieces: string[] = [];
  path
    .replace(/\\/g, "/")
    .split("/")
    .forEach((piece) => {
      if (!piece || piece === ".") return;
      if (piece === "..") pieces.pop();
      else pieces.push(piece);
    });
  return pieces.join("/");
}

function joinZipPath(baseFile: string, relativePath: string) {
  if (/^[a-z]+:/i.test(relativePath)) return relativePath;
  const base = baseFile.includes("/")
    ? baseFile.slice(0, baseFile.lastIndexOf("/") + 1)
    : "";
  return normalizeZipPath(`${base}${decodeURIComponent(relativePath)}`);
}

function readZipEntries(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let end = -1;
  for (let offset = Math.max(0, bytes.length - 65_557); offset <= bytes.length - 22; offset += 1) {
    if (view.getUint32(offset, true) === 0x06054b50) end = offset;
  }
  if (end < 0) throw new Error("This EPUB does not contain a readable ZIP index.");

  const totalEntries = view.getUint16(end + 10, true);
  if (totalEntries > MAX_EPUB_ENTRIES) {
    throw new Error("This EPUB contains too many files to open safely.");
  }
  let offset = view.getUint32(end + 16, true);
  const entries = new Map<string, ZipEntry>();

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = normalizeZipPath(
      textDecoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength)),
    );
    entries.set(name, {
      name,
      method,
      compressedSize,
      uncompressedSize,
      localOffset,
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return { bytes, view, entries };
}

async function inflateEntry(
  archive: ReturnType<typeof readZipEntries>,
  entry: ZipEntry,
) {
  const { bytes, view } = archive;
  if (entry.uncompressedSize > MAX_EPUB_ENTRY_BYTES) {
    throw new Error(`The EPUB entry ${entry.name} is too large to open safely.`);
  }
  if (view.getUint32(entry.localOffset, true) !== 0x04034b50) {
    throw new Error(`The EPUB entry ${entry.name} is damaged.`);
  }
  const nameLength = view.getUint16(entry.localOffset + 26, true);
  const extraLength = view.getUint16(entry.localOffset + 28, true);
  const dataStart = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) {
    if (compressed.byteLength > MAX_EPUB_ENTRY_BYTES) {
      throw new Error(`The EPUB entry ${entry.name} is too large to open safely.`);
    }
    return compressed;
  }
  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("This EPUB uses a compression format this device cannot open.");
  }
  const stream = new Blob([compressed]).stream().pipeThrough(
    new DecompressionStream("deflate-raw"),
  );
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_EPUB_ENTRY_BYTES) {
      await reader.cancel();
      throw new Error(`The EPUB entry ${entry.name} is too large to open safely.`);
    }
    chunks.push(value);
  }

  const inflated = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    inflated.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return inflated;
}

async function entryText(
  archive: ReturnType<typeof readZipEntries>,
  path: string,
) {
  const normalized = normalizeZipPath(path);
  const entry = archive.entries.get(normalized);
  if (!entry) throw new Error(`The EPUB is missing ${normalized}.`);
  return textDecoder.decode(await inflateEntry(archive, entry));
}

function xml(text: string) {
  const document = new DOMParser().parseFromString(text, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error("The EPUB contains invalid book metadata.");
  }
  return document;
}

function xmlElements(document: Document | Element, localName: string) {
  return Array.from(document.getElementsByTagNameNS("*", localName));
}

// Build safe semantic markup rather than importing book scripts or global styles.
function safeChapterNode(node: Node, images:Map<string,string>): string {
  const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  if(node.nodeType===3)return escape(node.textContent||'');
  if(node.nodeType!==1)return '';
  const el=node as Element,tag=el.localName.toLowerCase();
  if(['script','style','iframe','object','embed','form','input','button','svg','math'].includes(tag))return '';
  const inner=Array.from(el.childNodes).map(child=>safeChapterNode(child,images)).join('');
  if(tag==='img'){const data=images.get(el.getAttribute('src')||'');return data?`<img src="${data}" alt="${escape(el.getAttribute('alt')||'')}" loading="lazy">`:'';}
  if(tag==='br')return '<br>';
  if(tag==='hr')return '<hr>';
  if(!['p','h1','h2','h3','h4','b','strong','em','i','u','s','sub','sup','blockquote','ul','ol','li','pre','code','span','div','figcaption','td','th','a'].includes(tag))return inner;
  if(tag==='a'){const href=el.getAttribute('href')||'';return /^https?:\/\//i.test(href)?`<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`:inner;}
  return `<${tag}>${inner}</${tag}>`;
}

function chapterText(markup: string, images:Map<string,string>) {
  let document = new DOMParser().parseFromString(markup, "application/xhtml+xml");
  if (document.querySelector("parsererror")) {
    document = new DOMParser().parseFromString(markup, "text/html");
  }
  document.querySelectorAll("script,style,noscript,svg,nav").forEach((node) => node.remove());
  const nodes = Array.from(document.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,figcaption,td,th"))
    .filter(node=>node.textContent?.replace(/\s+/g," ").trim());
  const blocks = nodes
    .map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "")
    .filter(Boolean);
  const fallback = document.body?.textContent?.replace(/\s+/g, " ").trim() || "";
  return {
    title:
      document.querySelector("h1,h2,h3,title")?.textContent?.replace(/\s+/g, " ").trim() ||
      "Untitled chapter",
    text: blocks.length ? blocks.join("\n\n") : fallback,
    blocks: nodes.map(node=>safeChapterNode(node,images)),
    illustrations: Array.from(document.querySelectorAll("img")).filter(img=>!nodes.some(node=>node.contains(img))).map(img=>safeChapterNode(img,images)).filter(Boolean),
  };
}

export async function readEpub(file: Blob): Promise<EpubBook> {
  if (file.size > MAX_EPUB_BYTES) {
    throw new Error("This EPUB is larger than 50 MB.");
  }
  const archive = readZipEntries(await file.arrayBuffer());
  const container = xml(await entryText(archive, "META-INF/container.xml"));
  const packagePath = xmlElements(container, "rootfile")[0]?.getAttribute("full-path");
  if (!packagePath) throw new Error("This EPUB does not declare its book package.");

  const packageDocument = xml(await entryText(archive, packagePath));
  const manifest = new Map<string, string>();
  xmlElements(packageDocument, "item")
    .filter((item) => item.parentElement?.localName === "manifest")
    .forEach((item) => {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) manifest.set(id, joinZipPath(packagePath, href.split("#")[0]));
  });

  const spineIds = xmlElements(packageDocument, "itemref")
    .filter((item) => item.parentElement?.localName === "spine")
    .map((item) => item.getAttribute("idref"))
    .filter((value): value is string => Boolean(value));
  const chapters: EpubChapter[] = [];
  for (const id of spineIds) {
    const path = manifest.get(id);
    if (!path) continue;
    try {
      const markup=await entryText(archive,path);
      const imageDocument=new DOMParser().parseFromString(markup,'text/html');
      const images=new Map<string,string>();
      let imageBytes=0;
      for(const image of Array.from(imageDocument.querySelectorAll('img'))) {
        const src=image.getAttribute('src')||'';
        if(!src || images.has(src) || /^[a-z]+:|^\/\//i.test(src))continue;
        const imagePath=joinZipPath(path,src.split('#')[0]);
        const ext=imagePath.split('.').pop()?.toLowerCase();
        const mime=({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'} as Record<string,string>)[ext||''];
        const entry=archive.entries.get(imagePath);
        if(!mime||!entry||entry.uncompressedSize>4*1024*1024||imageBytes+entry.uncompressedSize>12*1024*1024)continue;
        try {const bytes=await inflateEntry(archive,entry);imageBytes+=bytes.length;let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));images.set(src,`data:${mime};base64,${btoa(binary)}`);}catch{/* Text remains readable if an image is damaged. */}
      }
      const content = chapterText(markup,images);
      if (!content.text && !content.illustrations.length) continue;
      chapters.push({ id, title: content.title, text: content.text, blocks:content.blocks, illustrations:content.illustrations });
      // Yield between chapters so closing/navigation remains responsive.
      if(chapters.length%4===0) await new Promise(resolve=>setTimeout(resolve,0));
    } catch {
      // A malformed non-essential chapter should not make the whole book unreadable.
    }
  }

  if (!chapters.length) throw new Error("No readable chapters were found in this EPUB.");
  const metadata = xmlElements(packageDocument, "metadata")[0];
  const title =
    (metadata && xmlElements(metadata, "title")[0]?.textContent?.trim()) || "Imported book";
  const author =
    (metadata && xmlElements(metadata, "creator")[0]?.textContent?.trim()) || "Unknown author";
  return { title, author, chapters };
}
