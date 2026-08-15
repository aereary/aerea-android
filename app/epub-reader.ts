export type EpubChapter = {
  id: string;
  title: string;
  text: string;
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
  localOffset: number;
};

const textDecoder = new TextDecoder("utf-8");

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
  let offset = view.getUint32(end + 16, true);
  const entries = new Map<string, ZipEntry>();

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = normalizeZipPath(
      textDecoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength)),
    );
    entries.set(name, { name, method, compressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return { bytes, view, entries };
}

async function inflateEntry(
  archive: ReturnType<typeof readZipEntries>,
  entry: ZipEntry,
) {
  const { bytes, view } = archive;
  if (view.getUint32(entry.localOffset, true) !== 0x04034b50) {
    throw new Error(`The EPUB entry ${entry.name} is damaged.`);
  }
  const nameLength = view.getUint16(entry.localOffset + 26, true);
  const extraLength = view.getUint16(entry.localOffset + 28, true);
  const dataStart = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) return compressed;
  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("This EPUB uses a compression format this device cannot open.");
  }
  const stream = new Blob([compressed]).stream().pipeThrough(
    new DecompressionStream("deflate-raw"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
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

function chapterText(markup: string) {
  let document = new DOMParser().parseFromString(markup, "application/xhtml+xml");
  if (document.querySelector("parsererror")) {
    document = new DOMParser().parseFromString(markup, "text/html");
  }
  document.querySelectorAll("script,style,noscript,svg,nav").forEach((node) => node.remove());
  const blocks = Array.from(
    document.querySelectorAll("h1,h2,h3,h4,p,li,blockquote,figcaption,td,th"),
  )
    .map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "")
    .filter(Boolean);
  const fallback = document.body?.textContent?.replace(/\s+/g, " ").trim() || "";
  return {
    title:
      document.querySelector("h1,h2,h3,title")?.textContent?.replace(/\s+/g, " ").trim() ||
      "Untitled chapter",
    text: blocks.length ? blocks.join("\n\n") : fallback,
  };
}

export async function readEpub(file: Blob): Promise<EpubBook> {
  const archive = readZipEntries(await file.arrayBuffer());
  const container = xml(await entryText(archive, "META-INF/container.xml"));
  const packagePath = container.querySelector("rootfile")?.getAttribute("full-path");
  if (!packagePath) throw new Error("This EPUB does not declare its book package.");

  const packageDocument = xml(await entryText(archive, packagePath));
  const manifest = new Map<string, string>();
  packageDocument.querySelectorAll("manifest > item").forEach((item) => {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) manifest.set(id, joinZipPath(packagePath, href.split("#")[0]));
  });

  const spineIds = Array.from(packageDocument.querySelectorAll("spine > itemref"))
    .map((item) => item.getAttribute("idref"))
    .filter((value): value is string => Boolean(value));
  const chapters: EpubChapter[] = [];
  for (const id of spineIds) {
    const path = manifest.get(id);
    if (!path) continue;
    try {
      const content = chapterText(await entryText(archive, path));
      if (!content.text) continue;
      chapters.push({ id, title: content.title, text: content.text });
    } catch {
      // A malformed non-essential chapter should not make the whole book unreadable.
    }
  }

  if (!chapters.length) throw new Error("No readable chapters were found in this EPUB.");
  const metadata = packageDocument.querySelector("metadata");
  const title =
    metadata?.querySelector("title")?.textContent?.trim() || "Imported book";
  const author =
    metadata?.querySelector("creator")?.textContent?.trim() || "Unknown author";
  return { title, author, chapters };
}
