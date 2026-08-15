"use client";

import { ChangeEvent, CSSProperties, useMemo, useRef, useState } from "react";

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
};

type LibraryFilter = "all" | "notebooks" | "notes" | "files";

const notebookColors = ["#ec8f72", "#91b36e", "#7da7cf", "#c799b7", "#d4ad5c"];

function readableFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function notePreview(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length > 132 ? `${normalized.slice(0, 132).trimEnd()}…` : normalized;
}

export function StudyLibrary({
  notebooks,
  notes,
  files,
  onNotebooksChange,
  onNotesChange,
  onOpenNotebook,
  onOpenFile,
  onDeleteFile,
  onImportFiles,
  onOpenSketchbook,
}: {
  notebooks: StudyNotebook[];
  notes: StudyNote[];
  files: StudyFileItem[];
  onNotebooksChange: (notebooks: StudyNotebook[]) => void;
  onNotesChange: (notes: StudyNote[]) => void;
  onOpenNotebook: (notebook: StudyNotebook) => void;
  onOpenFile: (file: StudyFileItem) => void;
  onDeleteFile: (file: StudyFileItem) => void;
  onImportFiles: (files: File[]) => Promise<void>;
  onOpenSketchbook: () => void;
}) {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState("");
  const [notebookEditor, setNotebookEditor] = useState<StudyNotebook | null>(null);
  const [noteEditor, setNoteEditor] = useState<StudyNote | null>(null);
  const [message, setMessage] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const query = search.trim().toLowerCase();
  const visibleNotebooks = useMemo(
    () => notebooks.filter((item) => `${item.title} ${item.subject}`.toLowerCase().includes(query)),
    [notebooks, query],
  );
  const visibleNotes = useMemo(
    () => notes.filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(query)),
    [notes, query],
  );
  const visibleFiles = useMemo(
    () => files.filter((item) => item.name.toLowerCase().includes(query)),
    [files, query],
  );

  const makeNotebook = () => {
    const now = new Date().toISOString();
    setNotebookEditor({
      id: crypto.randomUUID(),
      title: "",
      subject: "",
      color: notebookColors[notebooks.length % notebookColors.length],
      paper: "grid",
      pageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
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

  const hasNotebook = (id: string) => notebooks.some((item) => item.id === id);
  const hasNote = (id: string) => notes.some((item) => item.id === id);

  return (
    <section className="study-library-screen" aria-label="Library">
      <header className="study-library-hero">
        <div>
          <p className="tiny-label">NOTEBOOKS · NOTES · READING</p>
          <h1>Your Library</h1>
          <p>Handwritten pages, quick notes, PDFs, EPUB books, and files—private and together.</p>
        </div>
        <div className="study-library-stats" aria-label="Library totals">
          <span><strong>{notebooks.length}</strong><small>notebooks</small></span>
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
          {(["all", "notebooks", "notes", "files"] as LibraryFilter[]).map((item) => (
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

      {(filter === "all" || filter === "notebooks") && (
        <section className="study-library-section">
          <header>
            <div><p className="tiny-label">HANDWRITING</p><h2>Notebooks</h2></div>
            <button type="button" onClick={onOpenSketchbook}>Open Sketchbook →</button>
          </header>
          <div className="study-notebook-grid">
            <button type="button" className="study-library-new study-new-notebook" onClick={makeNotebook}>
              <span>＋</span><strong>New notebook</strong><small>Choose paper and start writing</small>
            </button>
            {visibleNotebooks.map((notebook) => (
              <article
                className="study-notebook-card"
                key={notebook.id}
                style={{ "--notebook-color": notebook.color } as CSSProperties}
              >
                <button type="button" className="study-notebook-open" onClick={() => onOpenNotebook(notebook)}>
                  <i aria-hidden="true" />
                  <small>{notebook.subject || "MY NOTEBOOK"}</small>
                  <strong>{notebook.title}</strong>
                  <span>{notebook.pageCount} pages · {notebook.paper}</span>
                </button>
                <button
                  type="button"
                  className="study-card-menu"
                  onClick={() => setNotebookEditor({ ...notebook })}
                  aria-label={`Edit ${notebook.title}`}
                >
                  •••
                </button>
              </article>
            ))}
          </div>
          {!visibleNotebooks.length && query && <p className="study-library-empty">No notebooks match “{search}”.</p>}
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
          <div className="study-file-grid">
            <button type="button" className="study-library-new study-new-file" onClick={() => fileInputRef.current?.click()}>
              <span>⇣</span><strong>Import a file</strong><small>PDF · EPUB · images · documents</small>
            </button>
            {visibleFiles.map((file) => (
              <article className={`study-file-card ${file.kind}`} key={file.id}>
                <button type="button" className="study-file-open" onClick={() => onOpenFile(file)}>
                  <span>{file.kind === "pdf" ? "PDF" : file.kind === "epub" ? "EPUB" : "FILE"}</span>
                  <strong>{file.name}</strong>
                  <small>{readableFileSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}</small>
                  <em>{file.kind === "pdf" ? "Open & annotate" : file.kind === "epub" ? "Open reader" : "Open file"} →</em>
                </button>
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

      {notebookEditor && (
        <div className="study-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNotebookEditor(null); }}>
          <section className="study-editor-card" role="dialog" aria-modal="true" aria-label="Notebook editor">
            <header>
              <div><p className="tiny-label">NOTEBOOK</p><h2>{hasNotebook(notebookEditor.id) ? "Edit its cover" : "A new notebook"}</h2></div>
              <button type="button" onClick={() => setNotebookEditor(null)} aria-label="Close">×</button>
            </header>
            <label><span>Name</span><input autoFocus value={notebookEditor.title} onChange={(event) => setNotebookEditor({ ...notebookEditor, title: event.target.value })} placeholder="e.g. Differential Equations" /></label>
            <label><span>Subject label</span><input value={notebookEditor.subject} onChange={(event) => setNotebookEditor({ ...notebookEditor, subject: event.target.value })} placeholder="COURSE · PROJECT · PERSONAL" /></label>
            <fieldset><legend>Cover</legend><div className="study-cover-swatches">{notebookColors.map((color) => <button type="button" key={color} className={notebookEditor.color === color ? "active" : ""} style={{ backgroundColor: color }} onClick={() => setNotebookEditor({ ...notebookEditor, color })} aria-label={`Use ${color} cover`} />)}</div></fieldset>
            <fieldset><legend>Paper</legend><div className="study-paper-choices">{(["grid", "lined", "dotted", "plain"] as StudyNotebook["paper"][]).map((paper) => <button type="button" key={paper} className={notebookEditor.paper === paper ? "active" : ""} onClick={() => setNotebookEditor({ ...notebookEditor, paper })}>{paper}</button>)}</div></fieldset>
            <footer>
              {hasNotebook(notebookEditor.id) ? <button type="button" className="danger" onClick={() => { onNotebooksChange(notebooks.filter((item) => item.id !== notebookEditor.id)); setNotebookEditor(null); }}>Delete</button> : <span />}
              <span />
              <button type="button" onClick={() => setNotebookEditor(null)}>Cancel</button>
              <button
                type="button"
                className="primary"
                disabled={!notebookEditor.title.trim()}
                onClick={() => {
                  const isExisting = hasNotebook(notebookEditor.id);
                  const saved = { ...notebookEditor, title: notebookEditor.title.trim(), subject: notebookEditor.subject.trim(), updatedAt: new Date().toISOString() };
                  onNotebooksChange(isExisting ? notebooks.map((item) => item.id === saved.id ? saved : item) : [saved, ...notebooks]);
                  setNotebookEditor(null);
                  onOpenNotebook(saved);
                }}
              >
                Save & write
              </button>
            </footer>
          </section>
        </div>
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
              {hasNote(noteEditor.id) ? <button type="button" className="danger" onClick={() => { onNotesChange(notes.filter((item) => item.id !== noteEditor.id)); setNoteEditor(null); }}>Delete</button> : <span />}
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
