import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

// Rebuild from current source; no old screenshots, sample data or user state.
const root = process.cwd();
const destination = path.resolve(process.argv[2] || "outputs/aerea.html");
const result = await build({
  configFile: false, plugins: [react()], publicDir: false,
  build: {
    write: false, assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    rollupOptions: {
      input: path.join(root, "app/portable-entry.tsx"),
      output: { inlineDynamicImports: true, entryFileNames: "aerea.js" },
    },
  },
});
const output = (Array.isArray(result) ? result[0] : result).output;
let javascript = output.find(file => file.type === "chunk" && file.isEntry).code;
let css = output.filter(file => file.type === "asset" && file.fileName.endsWith(".css")).map(file => file.source).join("\n");
const assets = {};
const mimeTypes = { ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".mjs": "text/javascript", ".mp3": "audio/mpeg", ".ogg": "audio/ogg" };
async function embed(file, url) {
  const bytes = await readFile(file);
  assets[url] = `data:${mimeTypes[path.extname(file)] || "application/octet-stream"};base64,${bytes.toString("base64")}`;
}
async function walk(directory, prefix) {
  for (const file of await readdir(directory, { withFileTypes: true })) {
    const location = path.join(directory, file.name), url = `${prefix}/${file.name}`;
    if (file.isDirectory()) await walk(location, url);
    else if (mimeTypes[path.extname(file.name)]) await embed(location, url);
  }
}
await walk(path.join(root, "public/assets"), "/assets");
await embed(path.join(root, "public/pdf.worker.min.mjs"), "/pdf.worker.min.mjs");
// Every bundled static path becomes an embedded asset. PDF.js receives a blob
// worker URL because module workers cannot resolve a file:// server endpoint.
javascript = javascript.replace(/(["'`])(\/(?:assets\/[^"'`]+|pdf\.worker\.min\.mjs))\1/g, (original, _quote, url) => assets[url] ? `__aereaAsset(${JSON.stringify(url)})` : original);
css = css.replace(/url\(["']?(\/assets\/[^)"']+)["']?\)/g, (original, url) => assets[url] ? `url("${assets[url]}")` : original);
const assetBootstrap = `const __aereaAssets=${JSON.stringify(assets)};const __aereaWorker=URL.createObjectURL(new Blob([Uint8Array.from(atob(__aereaAssets['/pdf.worker.min.mjs'].split(',')[1]),c=>c.charCodeAt(0))],{type:'text/javascript'}));const __aereaAsset=url=>url==='/pdf.worker.min.mjs'?__aereaWorker:(__aereaAssets[url]||url);`;
const safeScript = code => code.replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>\n<html lang="en" data-native="true" data-portable="true" class="startup-pending"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f5f6f8"><title>aérea · HTML edition</title><style>html.startup-pending #root{visibility:hidden}${css.replace(/<\/style/gi, "<\\/style")}</style></head><body><div id="root"></div><noscript>Enable JavaScript to open aérea.</noscript><script type="module">${safeScript(assetBootstrap + javascript)}</script></body></html>`;
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, html);
console.log(`HTML edition: ${destination} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
