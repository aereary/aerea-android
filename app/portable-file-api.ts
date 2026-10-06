// This adapter is loaded only by the downloadable HTML edition. Its files stay
// in this browser's IndexedDB; the hosted app and Android use their usual APIs.
type PortableFile = {
  id: string; name: string; kind: string; mediaType: string; size: number;
  createdAt: string; updatedAt: string; blob: Blob;
};

export function installPortableFileApi() {
  const originalFetch = window.fetch.bind(window);
  const urls = new Map<string, string>();
  const database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("aerea-html-files-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function transact<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
    const db = await database;
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("files", mode);
      const request = action(transaction.objectStore("files"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
  function metadata(file: PortableFile) {
    if (!urls.has(file.id)) urls.set(file.id, URL.createObjectURL(file.blob));
    const { blob: _blob, ...details } = file;
    return { ...details, dataUrl: urls.get(file.id) };
  }
  window.fetch = async (input, init) => {
    const address = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    // Never intercept remote services or weaken the hosted application's auth.
    if (!/^\/api\/files(?:\/[^/?#]+)?(?:\?.*)?$/.test(address)) return originalFetch(input, init);
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const id = address.split("?")[0].split("/")[3];
    try {
      if (method === "GET" && !id) {
        const files = await transact<PortableFile[]>("readonly", store => store.getAll());
        return Response.json({ files: files.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map(metadata) });
      }
      if (method === "GET" && id) {
        const file = await transact<PortableFile | undefined>("readonly", store => store.get(id));
        return file ? new Response(file.blob, { headers: { "Content-Type": file.mediaType } }) : Response.json({ error: "File not found." }, { status: 404 });
      }
      if (method === "POST" && !id) {
        const form = init?.body instanceof FormData ? init.body : input instanceof Request ? await input.formData() : null;
        const file = form?.get("file");
        if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose a file to import." }, { status: 400 });
        if (file.size > 40 * 1024 * 1024) return Response.json({ error: "This file is larger than 40 MB." }, { status: 413 });
        const kind = /\.pdf$/i.test(file.name) || file.type === "application/pdf" ? "pdf" : /\.epub$/i.test(file.name) ? "epub" : "file";
        const now = new Date().toISOString();
        const stored: PortableFile = { id: crypto.randomUUID(), name: file.name, kind, mediaType: file.type || (kind === "pdf" ? "application/pdf" : kind === "epub" ? "application/epub+zip" : "application/octet-stream"), size: file.size, createdAt: now, updatedAt: now, blob: file };
        await transact("readwrite", store => store.put(stored));
        return Response.json({ file: metadata(stored) }, { status: 201 });
      }
      if (method === "DELETE" && id) {
        await transact("readwrite", store => store.delete(id));
        const url = urls.get(id); if (url) URL.revokeObjectURL(url);
        urls.delete(id);
        return Response.json({ ok: true });
      }
      return Response.json({ error: "Unsupported file operation." }, { status: 405 });
    } catch {
      return Response.json({ error: "Could not save files in this browser. Check its storage permissions and available space." }, { status: 503 });
    }
  };
}
