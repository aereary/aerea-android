"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";

export type StudyNotebook = {
  id: string;
  title: string;
  subject: string;
  color: string;
  paper: "grid" | "lined" | "dotted" | "plain";
  pageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type StudyNote = {
  id: string;
  title: string;
  body: string;
  notebookId?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudyTask = {
  id: string;
  title: string;
  detail: string;
  dueDate: string;
  dueTime: string;
  priority: "gentle" | "important" | "urgent";
  calendar: string;
  reminder: string;
  repeat: "Never" | "Daily" | "Weekly" | "Monthly";
  completed: boolean;
  createdAt: string;
};

export type CalendarMemo = {
  id: string;
  title: string;
  body: string;
  calendar: string;
  pinned: boolean;
  checklist: string[];
  checked: boolean[];
  createdAt: string;
};

export type StudyFileItem = {
  id: string;
  name: string;
  mediaType: string;
  kind: "pdf" | "epub" | "file";
  size: number;
  createdAt: string;
  updatedAt: string;
  dataUrl?: string;
  favorite?: boolean;
  collectionIds?: string[];
  lastOpenedAt?: string;
  readerLocation?: {
    page?: number;
    offset?: number;
    zoom?: number;
    chapter?: number;
    percentage?: number;
    bookmarks?: number[];
  };
};

export type StudyCollection = {
  id: string;
  name: string;
  order: number;
  createdAt: string;
};

type LibraryFilter = "all" | "notes" | "files";

function readableFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function notePreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length > 132 ? `${normalized.slice(0, 132).trimEnd()}…` : normalized;
}

export function StudyLibrary({
  notes,
  files,
  onNotesChange,
  onDeleteNote,
  onOpenFile,
  onDeleteFile,
  onImportFiles,
  collections,
  onCollectionsChange,
  onFilesChange,
  usedInForFile,
  onBack,
}: {
  notes: StudyNote[];
  files: StudyFileItem[];
  onNotesChange: (notes: StudyNote[]) => void;
  onDeleteNote: (note: StudyNote) => void;
  onOpenFile: (file: StudyFileItem) => void;
  onDeleteFile: (file: StudyFileItem) => void;
  onImportFiles: (files: File[]) => Promise<void>;
  collections: StudyCollection[];
  onCollectionsChange: (collections: StudyCollection[]) => void;
  onFilesChange: (files: StudyFileItem[]) => void;
  usedInForFile: (fileId: string) => string[];
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState("");
  const [noteEditor, setNoteEditor] = useState<StudyNote | null>(null);
  const [message, setMessage] = useState("");
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const query = search.trim().toLowerCase();
  const visibleNotes = useMemo(
    () => notes.filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(query)),
    [notes, query],
  );
  const visibleFiles = useMemo(
    () =>
      files.filter(
        (item) =>
          item.name.toLowerCase().includes(query) &&
          (!collectionFilter || item.collectionIds?.includes(collectionFilter)),
      ),
    [collectionFilter, files, query],
  );
  const favoriteFiles = files.filter((item) => item.favorite);
  const recentFiles = [...files]
    .filter((item) => item.lastOpenedAt)
    .sort((first, second) =>
      (second.lastOpenedAt ?? "").localeCompare(first.lastOpenedAt ?? ""),
    )
    .slice(0, 6);

  const createCollection = () => {
    const name = window.prompt("Collection name", "University")?.trim();
    if (!name) return;
    onCollectionsChange([
      ...collections,
      {
        id: crypto.randomUUID(),
        name,
        order: collections.length,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const moveCollection = (collectionId: string, direction: -1 | 1) => {
    const ordered = [...collections].sort(
      (first, second) => first.order - second.order,
    );
    const index = ordered.findIndex((item) => item.id === collectionId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= ordered.length) return;
    [ordered[index], ordered[destination]] = [
      ordered[destination],
      ordered[index],
    ];
    onCollectionsChange(
      ordered.map((item, order) => ({ ...item, order })),
    );
  };

  const toggleFavorite = (file: StudyFileItem) => {
    onFilesChange(
      files.map((item) =>
        item.id === file.id ? { ...item, favorite: !item.favorite } : item,
      ),
    );
  };

  const toggleCollection = (file: StudyFileItem, collectionId: string) => {
    const attached = file.collectionIds?.includes(collectionId) ?? false;
    onFilesChange(
      files.map((item) =>
        item.id === file.id
          ? {
              ...item,
              collectionIds: attached
                ? (item.collectionIds ?? []).filter((id) => id !== collectionId)
                : Array.from(new Set([...(item.collectionIds ?? []), collectionId])),
            }
          : item,
      ),
    );
  };

  const addSelectedToCollection = (collectionId: string) => {
    if (!collectionId || selectedFileIds.length === 0) return;
    onFilesChange(
      files.map((item) =>
        selectedFileIds.includes(item.id)
          ? {
              ...item,
              collectionIds: Array.from(
                new Set([...(item.collectionIds ?? []), collectionId]),
              ),
            }
          : item,
      ),
    );
  };

  const removeSelectedFromCollection = () => {
    if (!collectionFilter || selectedFileIds.length === 0) return;
    onFilesChange(
      files.map((item) =>
        selectedFileIds.includes(item.id)
          ? {
              ...item,
              collectionIds: (item.collectionIds ?? []).filter(
                (id) => id !== collectionFilter,
              ),
            }
          : item,
      ),
    );
    setSelectedFileIds([]);
  };

  const openFile = (file: StudyFileItem) => {
    onFilesChange(
      files.map((item) =>
        item.id === file.id
          ? { ...item, lastOpenedAt: new Date().toISOString() }
          : item,
      ),
    );
    onOpenFile(file);
  };

  const makeNote = () => {
    const now = new Date().toISOString();
    setNoteEditor({
      id: crypto.randomUUID(),
      title: "",
      body: "",
      pinned: false,
      createdAt: now,
      updatedAt: now,
    });
  };

  const importDocuments = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    setImportBusy(true);
    setMessage(`Importing ${selected.length} file${selected.length === 1 ? "" : "s"}…`);
    try {
      await onImportFiles(selected);
      setFilter("files");
      setMessage(`${selected.length} file${selected.length === 1 ? " is" : "s are"} now in Library.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Those files could not be imported.");
    } finally {
      setImportBusy(false);
    }
  };

  const hasNote = (id: string) => notes.some((item) => item.id === id);

  return (
    <section className="study-library-screen" aria-label="Library">
      <header className="study-library-hero">
        <div>
          <button className="study-library-back" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> Spaces
          </button>
          <p className="tiny-label">NOTES · READING · FILES</p>
          <h1>Your Library</h1>
          <p>Quick notes, PDFs, EPUB books, and private files—kept together inside Spaces.</p>
        </div>
        <div className="study-library-stats" aria-label="Library totals">
          <span><strong>{notes.length}</strong><small>notes</small></span>
          <span><strong>{files.length}</strong><small>files</small></span>
        </div>
      </header>

      <div className="study-library-actions card">
        <label className="study-library-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your Library"
            aria-label="Search your Library"
          />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
        </label>
        <nav aria-label="Library filters">
          {(["all", "notes", "files"] as LibraryFilter[]).map((item) => (
            <button
              type="button"
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="study-library-import" type="button" onClick={() => fileInputRef.current?.click()}>
          ⇣ Import
        </button>
      </div>

      {(filter === "all" || filter === "files") && (
        <section className="study-library-organize card">
          <header>
            <div>
              <p className="tiny-label">COLLECTIONS</p>
              <h2>One file can live in many places</h2>
            </div>
            <button type="button" onClick={createCollection}>＋ Collection</button>
          </header>
          <div className="study-collection-list">
            <button
              type="button"
              className={collectionFilter === null ? "active" : ""}
              onClick={() => setCollectionFilter(null)}
            >
              All files
            </button>
            {[...collections]
              .sort((first, second) => first.order - second.order)
              .map((collection) => (
                <span key={collection.id}>
                  <button
                    type="button"
                    className={collectionFilter === collection.id ? "active" : ""}
                    onClick={() => setCollectionFilter(collection.id)}
                  >
                    {collection.name}
                  </button>
                  <button type="button" onClick={() => moveCollection(collection.id, -1)} aria-label={`Move ${collection.name} earlier`}>↑</button>
                  <button type="button" onClick={() => moveCollection(collection.id, 1)} aria-label={`Move ${collection.name} later`}>↓</button>
                  <button
                    type="button"
                    aria-label={`Edit ${collection.name}`}
                    onClick={() => {
                      const response = window.prompt(
                        "Rename collection. Leave empty to delete it.",
                        collection.name,
                      );
                      if (response === null) return;
                      const nextName = response.trim();
                      if (nextName) {
                        onCollectionsChange(
                          collections.map((item) =>
                            item.id === collection.id ? { ...item, name: nextName } : item,
                          ),
                        );
                        return;
                      }
                      if (window.confirm(`Delete “${collection.name}”? Files will stay in Library.`)) {
                        onCollectionsChange(
                          collections.filter((item) => item.id !== collection.id),
                        );
                        onFilesChange(
                          files.map((file) => ({
                            ...file,
                            collectionIds: (file.collectionIds ?? []).filter(
                              (id) => id !== collection.id,
                            ),
                          })),
                        );
                        if (collectionFilter === collection.id) setCollectionFilter(null);
                      }
                    }}
                  >
                    ···
                  </button>
                </span>
              ))}
          </div>
          {(favoriteFiles.length > 0 || recentFiles.length > 0) && (
            <div className="study-library-shelves">
              {favoriteFiles.length > 0 && (
                <div>
                  <strong>Favorites</strong>
                  {favoriteFiles.slice(0, 5).map((file) => (
                    <button type="button" key={file.id} onClick={() => openFile(file)}>
                      ◆ {file.name}
                    </button>
                  ))}
                </div>
              )}
              {recentFiles.length > 0 && (
                <div>
                  <strong>Recently opened</strong>
                  {recentFiles.map((file) => (
                    <button type="button" key={file.id} onClick={() => openFile(file)}>
                      Continue · {file.readerLocation?.page
                        ? `page ${file.readerLocation.page}`
                        : file.readerLocation?.chapter !== undefined
                          ? `Chapter ${file.readerLocation.chapter + 1}${
                              typeof file.readerLocation.percentage === "number"
                                ? ` · ${Math.round(file.readerLocation.percentage * 100)}%`
                                : ""
                            }`
                          : file.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {(filter === "all" || filter === "notes") && (
        <section className="study-library-section">
          <header><div><p className="tiny-label">QUICK THOUGHTS</p><h2>Notes</h2></div></header>
          <div className="study-note-grid">
            <button type="button" className="study-library-new study-new-note" onClick={makeNote}>
              <span>＋</span><strong>Quick note</strong><small>Catch a thought before it floats away</small>
            </button>
            {[...visibleNotes]
              .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
              .map((note) => (
                <button type="button" className="study-note-card" key={note.id} onClick={() => setNoteEditor({ ...note })}>
                  <small>{note.pinned ? "◆ PINNED NOTE" : new Date(note.updatedAt).toLocaleDateString()}</small>
                  <strong>{note.title}</strong>
                  <p>{notePreview(note.body) || "An empty page, ready when you are."}</p>
                  <span>Open note →</span>
                </button>
              ))}
          </div>
          {!visibleNotes.length && query && <p className="study-library-empty">No notes match “{search}”.</p>}
        </section>
      )}

      {(filter === "all" || filter === "files") && (
        <section className="study-library-section">
          <header><div><p className="tiny-label">READ & ANNOTATE</p><h2>Files</h2></div></header>
          {selectedFileIds.length > 0 && (
            <div className="study-file-batch-actions" aria-label="Selected file actions">
              <strong>{selectedFileIds.length} selected</strong>
              {collections.length > 0 && (
                <select
                  defaultValue=""
                  aria-label="Add selected files to collection"
                  onChange={(event) => {
                    addSelectedToCollection(event.target.value);
                    event.target.value = "";
                  }}
                >
                  <option value="" disabled>Add to collection…</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>{collection.name}</option>
                  ))}
                </select>
              )}
              {collectionFilter && (
                <button type="button" onClick={removeSelectedFromCollection}>
                  Remove from this collection
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onFilesChange(
                    files.map((file) =>
                      selectedFileIds.includes(file.id)
                        ? { ...file, favorite: true }
                        : file,
                    ),
                  );
                }}
              >
                Favorite
              </button>
              <button type="button" onClick={() => setSelectedFileIds([])}>Done</button>
            </div>
          )}
          <div className="study-file-grid">
            <button type="button" className="study-library-new study-new-file" onClick={() => fileInputRef.current?.click()}>
              <span>⇣</span><strong>Import a file</strong><small>PDF · EPUB · images · documents</small>
            </button>
            {visibleFiles.map((file) => (
              <article
                className={`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`}
                key={file.id}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setSelectedFileIds((current) =>
                    current.includes(file.id)
                      ? current
                      : [...current, file.id],
                  );
                }}
              >
                <button
                  type="button"
                  className="study-file-select"
                  onClick={() =>
                    setSelectedFileIds((current) =>
                      current.includes(file.id)
                        ? current.filter((id) => id !== file.id)
                        : [...current, file.id],
                    )
                  }
                  aria-label={selectedFileIds.includes(file.id) ? `Unselect ${file.name}` : `Select ${file.name}`}
                >
                  {selectedFileIds.includes(file.id) ? "✓" : "○"}
                </button>
                <button type="button" className="study-file-open" onClick={() => openFile(file)}>
                  <span>{file.kind === "pdf" ? "PDF" : file.kind === "epub" ? "EPUB" : "FILE"}</span>
                  <strong>{file.name}</strong>
                  <small>{readableFileSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}</small>
                  <em>
                    {file.readerLocation?.page
                      ? `Continue · page ${file.readerLocation.page}`
                      : file.readerLocation?.chapter !== undefined
                        ? `Continue · Chapter ${file.readerLocation.chapter + 1}${
                            typeof file.readerLocation.percentage === "number"
                              ? ` · ${Math.round(file.readerLocation.percentage * 100)}%`
                              : ""
                          }`
                        : file.kind === "pdf"
                          ? "Open & annotate"
                          : file.kind === "epub"
                            ? "Open reader"
                            : "Open file"} →
                  </em>
                </button>
                <button
                  type="button"
                  className={file.favorite ? "study-file-favorite active" : "study-file-favorite"}
                  onClick={() => toggleFavorite(file)}
                  aria-label={file.favorite ? `Remove ${file.name} from favorites` : `Favorite ${file.name}`}
                >
                  {file.favorite ? "◆" : "◇"}
                </button>
                {collections.length > 0 && (
                  <details className="study-file-collections">
                    <summary>Collections</summary>
                    {collections.map((collection) => (
                      <label key={collection.id}>
                        <input
                          type="checkbox"
                          checked={file.collectionIds?.includes(collection.id) ?? false}
                          onChange={() => toggleCollection(file, collection.id)}
                        />
                        {collection.name}
                      </label>
                    ))}
                  </details>
                )}
                {usedInForFile(file.id).length > 0 && (
                  <div className="study-file-used-in">
                    <small>Used in:</small>
                    {usedInForFile(file.id).map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="study-card-menu"
                  onClick={() => onDeleteFile(file)}
                  aria-label={`Delete ${file.name}`}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
          {!visibleFiles.length && query && <p className="study-library-empty">No files match “{search}”.</p>}
        </section>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.epub,application/pdf,application/epub+zip,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
        multiple
        hidden
        onChange={importDocuments}
      />

      {message && (
        <button type="button" className="study-library-toast" onClick={() => !importBusy && setMessage("")}>
          {importBusy && <i aria-hidden="true" />}<span>{message}</span><b>×</b>
        </button>
      )}

      {noteEditor && (
        <div className="study-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNoteEditor(null); }}>
          <section className="study-editor-card study-note-editor" role="dialog" aria-modal="true" aria-label="Note editor">
            <header>
              <div><p className="tiny-label">QUICK NOTE</p><h2>{hasNote(noteEditor.id) ? "Keep writing" : "Catch the thought"}</h2></div>
              <button type="button" onClick={() => setNoteEditor(null)} aria-label="Close">×</button>
            </header>
            <input className="study-note-title" autoFocus value={noteEditor.title} onChange={(event) => setNoteEditor({ ...noteEditor, title: event.target.value })} placeholder="Note title" />
            <textarea value={noteEditor.body} onChange={(event) => setNoteEditor({ ...noteEditor, body: event.target.value })} placeholder="Write anything…" />
            <label className="study-pin-toggle"><input type="checkbox" checked={noteEditor.pinned} onChange={(event) => setNoteEditor({ ...noteEditor, pinned: event.target.checked })} /><span>◆ Pin this note</span></label>
            <footer>
              {hasNote(noteEditor.id) ? (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (!window.confirm(`Move “${noteEditor.title || "Untitled note"}” to Trash for 30 days?`)) return;
                    onDeleteNote(noteEditor);
                    setNoteEditor(null);
                  }}
                >
                  Delete
                </button>
              ) : <span />}
              <span />
              <button type="button" onClick={() => setNoteEditor(null)}>Cancel</button>
              <button
                type="button"
                className="primary"
                disabled={!noteEditor.title.trim() && !noteEditor.body.trim()}
                onClick={() => {
                  const saved = { ...noteEditor, title: noteEditor.title.trim() || "Untitled note", updatedAt: new Date().toISOString() };
                  onNotesChange(hasNote(saved.id) ? notes.map((item) => item.id === saved.id ? saved : item) : [saved, ...notes]);
                  setNoteEditor(null);
                }}
              >
                Save note
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
