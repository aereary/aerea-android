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
};

export type CampEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  allDay?: boolean;
  calendar?: string;
  color: string;
  note?: string;
  location?: string;
};

type CampView = "home" | "planner" | "library" | "tasks" | "more";
type LibraryFilter = "all" | "notebooks" | "notes" | "files";

const notebookColors = ["#ec8f72", "#91b36e", "#7da7cf", "#c799b7", "#d4ad5c"];

function prettyDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function shortDate(dateKey: string) {
  if (!dateKey) return "No date";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(year, month - 1, day),
  );
}

function fileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function weekFrom(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const anchor = new Date(year, month - 1, day);
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      key,
      day: date.toLocaleDateString("en", { weekday: "short" }).slice(0, 2).toUpperCase(),
      date: date.getDate(),
    };
  });
}

function calendarColor(name: string) {
  const values: Record<string, string> = {
    lilac: "#a992d3",
    yellow: "#d8b85c",
    blue: "#75a9d2",
    pink: "#dd9ab2",
    emerald: "#72a98c",
    cyan: "#72b9be",
    brown: "#a38b7f",
    black: "#716e74",
    red: "#db7777",
    rose: "#d887a7",
    coral: "#e59288",
    orange: "#dcae5f",
  };
  return values[name] || "#91b36e";
}

export function CampStudyShell({
  todayKey,
  isNight,
  notebooks,
  notes,
  tasks,
  memos,
  files,
  events,
  calendarNames,
  habits,
  reminders,
  doneReminderIds,
  onNotebooksChange,
  onNotesChange,
  onTasksChange,
  onMemosChange,
  onOpenNotebook,
  onOpenFile,
  onDeleteFile,
  onImportFiles,
  onImportIcs,
  onOpenCalendar,
  onOpenEvent,
  onNewEvent,
  onCompleteReminder,
  onRestoreReminder,
  onToggleHabit,
  onOpenLegacy,
  onOpenSettings,
  onOpenMetrics,
}: {
  todayKey: string;
  isNight: boolean;
  notebooks: StudyNotebook[];
  notes: StudyNote[];
  tasks: StudyTask[];
  memos: CalendarMemo[];
  files: StudyFileItem[];
  events: CampEvent[];
  calendarNames: string[];
  habits: { id: number; title: string; icon: string; done: boolean }[];
  reminders: { id: number; title: string; detail: string; icon: string }[];
  doneReminderIds: number[];
  onNotebooksChange: (notebooks: StudyNotebook[]) => void;
  onNotesChange: (notes: StudyNote[]) => void;
  onTasksChange: (tasks: StudyTask[]) => void;
  onMemosChange: (memos: CalendarMemo[]) => void;
  onOpenNotebook: (notebook: StudyNotebook) => void;
  onOpenFile: (file: StudyFileItem) => void;
  onDeleteFile: (file: StudyFileItem) => void;
  onImportFiles: (files: File[]) => Promise<void>;
  onImportIcs: (file: File) => Promise<number>;
  onOpenCalendar: () => void;
  onOpenEvent: (event: CampEvent) => void;
  onNewEvent: (dateKey?: string) => void;
  onCompleteReminder: (id: number) => void;
  onRestoreReminder: (id: number) => void;
  onToggleHabit: (id: number) => void;
  onOpenLegacy: (module: "focus" | "journal" | "classes" | "sketchbook" | "habits") => void;
  onOpenSettings: () => void;
  onOpenMetrics: () => void;
}) {
  const [view, setView] = useState<CampView>("home");
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [notebookEditor, setNotebookEditor] = useState<StudyNotebook | null>(null);
  const [noteEditor, setNoteEditor] = useState<StudyNote | null>(null);
  const [taskEditor, setTaskEditor] = useState<StudyTask | null>(null);
  const [memoEditor, setMemoEditor] = useState<CalendarMemo | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const icsInputRef = useRef<HTMLInputElement | null>(null);
  const week = weekFrom(selectedDate);

  const todayEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDate],
  );
  const openTasks = tasks.filter((task) => !task.completed);
  const dueToday = openTasks.filter((task) => task.dueDate === selectedDate);
  const query = search.trim().toLowerCase();
  const matches = (value: string) => !query || value.toLowerCase().includes(query);
  const visibleNotebooks = notebooks.filter((item) => matches(`${item.title} ${item.subject}`));
  const visibleNotes = notes.filter((item) => matches(`${item.title} ${item.body}`));
  const visibleFiles = files.filter((item) => matches(item.name));
  const visibleTasks = tasks.filter((item) => matches(`${item.title} ${item.detail} ${item.calendar}`));
  const visibleEvents = events.filter((item) => matches(`${item.title} ${item.calendar || ""} ${item.note || ""}`));

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

  const makeTask = () => {
    setTaskEditor({
      id: crypto.randomUUID(),
      title: "",
      detail: "",
      dueDate: selectedDate,
      dueTime: "09:00",
      priority: "gentle",
      calendar: calendarNames[0] || "Personal",
      reminder: "10 minutes before",
      repeat: "Never",
      completed: false,
      createdAt: new Date().toISOString(),
    });
  };

  const makeMemo = () => {
    setMemoEditor({
      id: crypto.randomUUID(),
      title: "",
      body: "",
      calendar: calendarNames[0] || "Personal",
      pinned: false,
      checklist: [],
      checked: [],
      createdAt: new Date().toISOString(),
    });
  };

  const importDocuments = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    setImportBusy(true);
    setImportMessage(`Importing ${selected.length} file${selected.length === 1 ? "" : "s"}…`);
    try {
      await onImportFiles(selected);
      setImportMessage(`${selected.length} file${selected.length === 1 ? " is" : "s are"} now in your library.`);
      setView("library");
      setLibraryFilter("files");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Those files could not be imported.");
    } finally {
      setImportBusy(false);
    }
  };

  const importCalendar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImportBusy(true);
    setImportMessage("Reading calendar file…");
    try {
      const count = await onImportIcs(file);
      setImportMessage(`${count} calendar event${count === 1 ? "" : "s"} imported.`);
      setView("planner");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "That calendar could not be imported.");
    } finally {
      setImportBusy(false);
    }
  };

  const shareAvailability = async () => {
    const lines = week.map((day) => {
      const dayEvents = events.filter((event) => event.date === day.key);
      return `${day.day} ${day.date}: ${dayEvents.length ? dayEvents.map((event) => event.allDay ? event.title : `${event.time} ${event.title}`).join(", ") : "available"}`;
    });
    const text = `My availability this week\n${lines.join("\n")}`;
    const canShare = "share" in navigator && typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title: "My availability", text });
      else await navigator.clipboard.writeText(text);
      setImportMessage(canShare ? "Availability shared." : "Availability copied.");
    } catch {
      setImportMessage("Sharing was cancelled.");
    }
  };

  const openSearchResult = (kind: "notebook" | "note" | "file" | "task" | "event", id: string) => {
    setSearch("");
    if (kind === "notebook") {
      const notebook = notebooks.find((item) => item.id === id);
      if (notebook) onOpenNotebook(notebook);
    }
    if (kind === "note") {
      const note = notes.find((item) => item.id === id);
      if (note) setNoteEditor({ ...note });
    }
    if (kind === "file") {
      const file = files.find((item) => item.id === id);
      if (file) onOpenFile(file);
    }
    if (kind === "task") {
      const task = tasks.find((item) => item.id === id);
      if (task) setTaskEditor({ ...task });
    }
    if (kind === "event") {
      const event = events.find((item) => item.id === id);
      if (event) onOpenEvent(event);
    }
  };

  return (
    <div className="camp-study-shell">
      <header className="camp-system-bar">
        <button className="camp-brand" onClick={onOpenMetrics} aria-label="Open aérea metrics">
          <span>á</span><strong>aérea</strong><small>CAMP STUDY</small>
        </button>
        <div className="camp-system-actions">
          <time>{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
          <button onClick={() => setSearch((value) => value ? "" : " ")} aria-label="Search everything">⌕</button>
          <button onClick={onOpenSettings} aria-label="Open settings">⚙</button>
        </div>
      </header>

      {search !== "" && (
        <section className="camp-global-search" aria-label="Search aérea">
          <label><span>⌕</span><input autoFocus value={search.trimStart()} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes, books, files, tasks, and plans" /><button onClick={() => setSearch("")}>×</button></label>
          {query && (
            <div className="camp-search-results">
              {visibleNotebooks.slice(0, 3).map((item) => <button key={item.id} onClick={() => openSearchResult("notebook", item.id)}><span>▥</span><strong>{item.title}</strong><small>Notebook</small></button>)}
              {visibleNotes.slice(0, 3).map((item) => <button key={item.id} onClick={() => openSearchResult("note", item.id)}><span>≡</span><strong>{item.title}</strong><small>Note</small></button>)}
              {visibleFiles.slice(0, 3).map((item) => <button key={item.id} onClick={() => openSearchResult("file", item.id)}><span>{item.kind === "pdf" ? "PDF" : item.kind === "epub" ? "EP" : "↥"}</span><strong>{item.name}</strong><small>File</small></button>)}
              {visibleTasks.slice(0, 3).map((item) => <button key={item.id} onClick={() => openSearchResult("task", item.id)}><span>✓</span><strong>{item.title}</strong><small>Task · {shortDate(item.dueDate)}</small></button>)}
              {visibleEvents.slice(0, 3).map((item) => <button key={item.id} onClick={() => openSearchResult("event", item.id)}><span>◫</span><strong>{item.title}</strong><small>Event · {shortDate(item.date)}</small></button>)}
              {!visibleNotebooks.length && !visibleNotes.length && !visibleFiles.length && !visibleTasks.length && !visibleEvents.length && <p>No matches in your aérea yet.</p>}
            </div>
          )}
        </section>
      )}

      <div className="camp-workspace">
        {view === "home" && (
          <>
            <section className="camp-hero">
              <div className="camp-hero-sky" aria-hidden="true">
                <i className="camp-sun" /><i className="camp-cloud one" /><i className="camp-cloud two" />
                <i className="camp-mountain back" /><i className="camp-mountain front" />
                <i className="camp-tree tree-one" /><i className="camp-tree tree-two" /><i className="camp-tree tree-three" />
                <i className="camp-tent" /><i className="camp-ground" />
              </div>
              <div className="camp-hero-copy">
                <p>{prettyDate(todayKey).toUpperCase()}</p>
                <h1>{isNight ? "A quiet evening," : "Hello,"} <span>Rhea.</span></h1>
                <small>{isNight ? "Your desk is warm and everything can wait its turn." : "Your whole day, study desk, and little plans are here."}</small>
              </div>
              <button className="camp-hero-search" onClick={() => setSearch(" ")}><span>⌕</span> Search your whole aérea <i>⌘ K</i></button>
            </section>

            <section className="camp-home-grid">
              <article className="camp-today-panel camp-panel">
                <header><div><small>TODAY AT A GLANCE</small><h2>Your little route</h2></div><button onClick={() => setView("planner")}>Full planner →</button></header>
                <div className="camp-route-list">
                  {todayEvents.slice(0, 3).map((event) => (
                    <button key={event.id} onClick={() => onOpenEvent(event)}>
                      <time>{event.allDay ? "ALL" : event.time}</time><i style={{ backgroundColor: calendarColor(event.color) }} /><span><small>{event.calendar || "AÉREA"}</small><strong>{event.title}</strong><em>{event.location || event.note || "Saved in your calendar"}</em></span><b>›</b>
                    </button>
                  ))}
                  {dueToday.slice(0, Math.max(1, 3 - todayEvents.length)).map((task) => (
                    <button key={task.id} onClick={() => setTaskEditor({ ...task })}>
                      <time>{task.dueTime || "TASK"}</time><i className={`task-${task.priority}`} /><span><small>{task.calendar}</small><strong>{task.title}</strong><em>{task.detail || "A task for today"}</em></span><b>›</b>
                    </button>
                  ))}
                  {!todayEvents.length && !dueToday.length && <div className="camp-empty-route"><span>☁</span><p>No route yet. Add a plan when you want one.</p><button onClick={() => onNewEvent(todayKey)}>Add a plan</button></div>}
                </div>
              </article>

              <article className="camp-care-panel camp-panel">
                <header><div><small>LITTLE CARE LIST</small><h2>Keep close</h2></div><span>{doneReminderIds.length}/{reminders.length}</span></header>
                <div className="camp-care-list">
                  {reminders.slice(0, 4).map((reminder) => {
                    const done = doneReminderIds.includes(reminder.id);
                    return <button key={reminder.id} className={done ? "done" : ""} onClick={() => done ? onRestoreReminder(reminder.id) : onCompleteReminder(reminder.id)}><i>{reminder.icon}</i><span><strong>{reminder.title}</strong><small>{reminder.detail}</small></span><b>{done ? "✓" : ""}</b></button>;
                  })}
                </div>
              </article>
            </section>

            <section className="camp-shelf-section">
              <header><div><small>YOUR STUDY SHELF</small><h2>Pick up where you left off</h2></div><button onClick={() => setView("library")}>Open library →</button></header>
              <div className="camp-shelf-row">
                <button className="camp-new-notebook" onClick={makeNotebook}><span>＋</span><strong>New notebook</strong><small>Choose its paper</small></button>
                {notebooks.slice(0, 4).map((notebook) => (
                  <article className="camp-notebook-card" key={notebook.id} style={{ "--notebook-color": notebook.color } as React.CSSProperties}>
                    <button className="camp-notebook-cover" onClick={() => onOpenNotebook(notebook)}><i /><span>{notebook.subject || "MY NOTEBOOK"}</span><strong>{notebook.title}</strong><small>{notebook.pageCount} pages · {notebook.paper}</small></button>
                    <button className="camp-card-menu" onClick={() => setNotebookEditor({ ...notebook })}>•••</button>
                  </article>
                ))}
                {files.slice(0, 2).map((file) => (
                  <article className={`camp-file-card ${file.kind}`} key={file.id}>
                    <button onClick={() => onOpenFile(file)}><span>{file.kind === "pdf" ? "PDF" : file.kind === "epub" ? "EPUB" : "FILE"}</span><strong>{file.name}</strong><small>{fileSize(file.size)}</small></button>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {view === "planner" && (
          <section className="camp-view camp-planner-view">
            <header className="camp-view-header"><div><small>PLANS TOGETHER</small><h1>Your shared-style planner</h1><p>Calendars, memos, activity, tasks, and available time in one place.</p></div><div><button onClick={shareAvailability}>Share availability</button><button className="primary" onClick={() => onNewEvent(selectedDate)}>＋ Event</button></div></header>
            <div className="camp-week-switcher">
              <button onClick={() => { const date = new Date(`${selectedDate}T12:00:00`); date.setDate(date.getDate() - 7); setSelectedDate(date.toISOString().slice(0, 10)); }}>‹</button>
              <div>{week.map((day) => <button key={day.key} className={selectedDate === day.key ? "active" : day.key === todayKey ? "today" : ""} onClick={() => setSelectedDate(day.key)}><small>{day.day}</small><strong>{day.date}</strong><i>{events.filter((event) => event.date === day.key).length || ""}</i></button>)}</div>
              <button onClick={() => { const date = new Date(`${selectedDate}T12:00:00`); date.setDate(date.getDate() + 7); setSelectedDate(date.toISOString().slice(0, 10)); }}>›</button>
            </div>
            <div className="camp-planner-grid">
              <article className="camp-panel camp-calendar-stream">
                <header><div><small>{prettyDate(selectedDate).toUpperCase()}</small><h2>Day stream</h2></div><button onClick={onOpenCalendar}>Month & schedule →</button></header>
                {todayEvents.map((event) => <button className="camp-stream-event" key={event.id} onClick={() => onOpenEvent(event)} style={{ "--event-color": calendarColor(event.color) } as React.CSSProperties}><time>{event.allDay ? "All day" : event.time}</time><i /><span><small>{event.calendar || "AÉREA"}</small><strong>{event.title}</strong><em>{event.location || event.note || "No extra note"}</em></span><b>›</b></button>)}
                {!todayEvents.length && <div className="camp-planner-empty"><span>☀</span><strong>This day is open.</strong><button onClick={() => onNewEvent(selectedDate)}>Add an event</button></div>}
                <footer><button onClick={() => icsInputRef.current?.click()}>⇣ Import .ics</button><button onClick={onOpenCalendar}>▦ Calendar filters</button></footer>
              </article>
              <aside className="camp-planner-side">
                <article className="camp-panel camp-memo-board"><header><div><small>TIMETREE-STYLE MEMOS</small><h2>Plans without a date</h2></div><button onClick={makeMemo}>＋</button></header>{memos.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned)).map((memo) => <button key={memo.id} onClick={() => setMemoEditor({ ...memo })}><i>{memo.pinned ? "◆" : "◇"}</i><span><strong>{memo.title}</strong><small>{memo.calendar} · {memo.body || `${memo.checklist.length} checklist items`}</small></span></button>)}{!memos.length && <p>Save ideas here before they have a date.</p>}</article>
                <article className="camp-panel camp-activity"><header><small>RECENT ACTIVITY</small><h2>What changed</h2></header>{[...events.slice(-3).reverse().map((event) => ({ id: `event-${event.id}`, icon: "◫", title: event.title, copy: `${event.calendar || "Aérea"} · ${shortDate(event.date)}` })), ...memos.slice(-2).reverse().map((memo) => ({ id: `memo-${memo.id}`, icon: "≡", title: memo.title, copy: `Memo in ${memo.calendar}` }))].slice(0, 4).map((item) => <div key={item.id}><i>{item.icon}</i><span><strong>{item.title}</strong><small>{item.copy}</small></span></div>)}{!events.length && !memos.length && <p>Your calendar activity will gather here.</p>}</article>
              </aside>
            </div>
          </section>
        )}

        {view === "library" && (
          <section className="camp-view camp-library-view">
            <header className="camp-view-header"><div><small>EVERY PAGE HAS A HOME</small><h1>Library & study desk</h1><p>Notebooks, typed notes, PDFs, EPUBs, and other class files.</p></div><div><button onClick={() => fileInputRef.current?.click()} disabled={importBusy}>⇣ Import</button><button className="primary" onClick={makeNotebook}>＋ Notebook</button></div></header>
            <div className="camp-library-toolbar"><label><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this library" /></label><nav>{(["all", "notebooks", "notes", "files"] as LibraryFilter[]).map((filter) => <button key={filter} className={libraryFilter === filter ? "active" : ""} onClick={() => setLibraryFilter(filter)}>{filter}</button>)}</nav><button onClick={makeNote}>＋ Quick note</button></div>
            {(libraryFilter === "all" || libraryFilter === "notebooks") && <section className="camp-library-group"><header><h2>Notebooks</h2><span>{visibleNotebooks.length}</span></header><div className="camp-library-grid">{visibleNotebooks.map((notebook) => <article className="camp-notebook-card large" key={notebook.id} style={{ "--notebook-color": notebook.color } as React.CSSProperties}><button className="camp-notebook-cover" onClick={() => onOpenNotebook(notebook)}><i /><span>{notebook.subject || "MY NOTEBOOK"}</span><strong>{notebook.title}</strong><small>{notebook.pageCount} pages · {notebook.paper}</small></button><button className="camp-card-menu" onClick={() => setNotebookEditor({ ...notebook })}>•••</button></article>)}<button className="camp-library-add" onClick={makeNotebook}><span>＋</span><strong>Create notebook</strong></button></div>{!visibleNotebooks.length && <p className="camp-library-empty">No notebooks yet. Make one for a class, project, or any passing thought.</p>}</section>}
            {(libraryFilter === "all" || libraryFilter === "notes") && <section className="camp-library-group"><header><h2>Notes</h2><span>{visibleNotes.length}</span></header><div className="camp-note-grid">{visibleNotes.sort((a, b) => Number(b.pinned) - Number(a.pinned)).map((note) => <button key={note.id} onClick={() => setNoteEditor({ ...note })}><i>{note.pinned ? "◆" : "≡"}</i><strong>{note.title}</strong><p>{note.body || "An empty note"}</p><small>{new Date(note.updatedAt).toLocaleDateString()}</small></button>)}<button className="camp-library-add" onClick={makeNote}><span>＋</span><strong>New typed note</strong></button></div></section>}
            {(libraryFilter === "all" || libraryFilter === "files") && <section className="camp-library-group"><header><h2>Files & books</h2><span>{visibleFiles.length}</span></header><div className="camp-file-grid">{visibleFiles.map((file) => <article className={`camp-file-card large ${file.kind}`} key={file.id}><button onClick={() => onOpenFile(file)}><span>{file.kind === "pdf" ? "PDF" : file.kind === "epub" ? "EPUB" : "FILE"}</span><strong>{file.name}</strong><small>{fileSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}</small></button><button className="camp-card-menu" onClick={() => onDeleteFile(file)} aria-label={`Delete ${file.name}`}>×</button></article>)}<button className="camp-library-add" onClick={() => fileInputRef.current?.click()}><span>⇣</span><strong>Import PDF, EPUB, or file</strong></button></div>{!visibleFiles.length && <p className="camp-library-empty">Imported files stay private in aérea and are ready for your study desk.</p>}</section>}
          </section>
        )}

        {view === "tasks" && (
          <section className="camp-view camp-tasks-view">
            <header className="camp-view-header"><div><small>TO-DOS & LITTLE RHYTHMS</small><h1>Tasks, reminders & habits</h1><p>Fixed plans, repeating care, and small promises without crowding your calendar.</p></div><button className="primary" onClick={makeTask}>＋ Task</button></header>
            <div className="camp-task-summary"><article><span>{openTasks.length}</span><small>open tasks</small></article><article><span>{dueToday.length}</span><small>due on selected day</small></article><article><span>{habits.filter((habit) => habit.done).length}/{habits.length}</span><small>habits today</small></article></div>
            <div className="camp-task-layout">
              <article className="camp-panel camp-task-list"><header><div><small>MY TASKS</small><h2>Everything actionable</h2></div><select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} aria-label="Task date"><option value={todayKey}>Today</option><option value="">All dates</option></select></header>{tasks.filter((task) => !selectedDate || task.dueDate === selectedDate).sort((a, b) => Number(a.completed) - Number(b.completed)).map((task) => <div className={`camp-task-row ${task.completed ? "done" : ""}`} key={task.id}><button className="camp-task-check" onClick={() => onTasksChange(tasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item))}>{task.completed ? "✓" : ""}</button><button className="camp-task-copy" onClick={() => setTaskEditor({ ...task })}><small>{task.calendar} · {shortDate(task.dueDate)} {task.dueTime}</small><strong>{task.title}</strong><span>{task.detail || task.reminder}</span></button><i className={`priority-${task.priority}`}>{task.priority}</i></div>)}{!tasks.filter((task) => !selectedDate || task.dueDate === selectedDate).length && <div className="camp-task-empty"><span>✓</span><p>No tasks here.</p><button onClick={makeTask}>Add one</button></div>}</article>
              <aside className="camp-task-side"><article className="camp-panel camp-habit-compact"><header><small>HABITS TODAY</small><h2>Tap when done</h2></header>{habits.map((habit) => <button key={habit.id} className={habit.done ? "done" : ""} onClick={() => onToggleHabit(habit.id)}><i>{habit.icon}</i><strong>{habit.title}</strong><span>{habit.done ? "✓" : ""}</span></button>)}<button className="camp-manage-link" onClick={() => onOpenLegacy("habits")}>Manage habits →</button></article><article className="camp-panel camp-reminder-compact"><header><small>REMINDERS</small><h2>Gentle care</h2></header>{reminders.map((reminder) => { const done = doneReminderIds.includes(reminder.id); return <button key={reminder.id} className={done ? "done" : ""} onClick={() => done ? onRestoreReminder(reminder.id) : onCompleteReminder(reminder.id)}><i>{reminder.icon}</i><strong>{reminder.title}</strong><span>{done ? "✓" : ""}</span></button>; })}</article></aside>
            </div>
          </section>
        )}

        {view === "more" && (
          <section className="camp-view camp-more-view">
            <header className="camp-view-header"><div><small>THE REST OF YOUR AÉREA</small><h1>Tools & quiet corners</h1><p>Every function you already had is still here.</p></div></header>
            <div className="camp-tool-grid">
              <button onClick={() => onOpenLegacy("focus")}><span>◷</span><strong>Focus timer</strong><small>Start a quiet session</small></button>
              <button onClick={() => onOpenLegacy("journal")}><span>✎</span><strong>Quick journal</strong><small>Your dated private notes</small></button>
              <button onClick={() => onOpenLegacy("classes")}><span>♫</span><strong>Class recordings</strong><small>Audio arranged by class</small></button>
              <button onClick={() => onOpenLegacy("sketchbook")}><span>▦</span><strong>Open sketchbook</strong><small>Full canvas and pencil case</small></button>
              <button onClick={onOpenMetrics}><span>⌁</span><strong>aérea metrics</strong><small>Your rhythms over time</small></button>
              <button onClick={onOpenSettings}><span>⚙</span><strong>Appearance & sync</strong><small>Themes, dark mode, backup</small></button>
            </div>
          </section>
        )}
      </div>

      {quickMenuOpen && <div className="camp-quick-menu" role="menu"><button onClick={() => { setQuickMenuOpen(false); onNewEvent(selectedDate); }}><span>◫</span><strong>Event</strong><small>Add to calendar</small></button><button onClick={() => { setQuickMenuOpen(false); makeTask(); }}><span>✓</span><strong>Task</strong><small>With due date</small></button><button onClick={() => { setQuickMenuOpen(false); makeNotebook(); }}><span>▥</span><strong>Notebook</strong><small>Handwritten pages</small></button><button onClick={() => { setQuickMenuOpen(false); makeNote(); }}><span>≡</span><strong>Note</strong><small>Quick typed thought</small></button><button onClick={() => { setQuickMenuOpen(false); fileInputRef.current?.click(); }}><span>⇣</span><strong>Import</strong><small>PDF, EPUB, file</small></button><button onClick={() => { setQuickMenuOpen(false); makeMemo(); }}><span>◇</span><strong>Memo</strong><small>Plan without a date</small></button></div>}

      <nav className="camp-dock" aria-label="Camp Study navigation">
        <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}><span>⌂</span><small>Home</small></button>
        <button className={view === "planner" ? "active" : ""} onClick={() => setView("planner")}><span>▦</span><small>Planner</small></button>
        <button className={quickMenuOpen ? "camp-add active" : "camp-add"} onClick={() => setQuickMenuOpen((value) => !value)} aria-label="Create or import"><span>{quickMenuOpen ? "×" : "+"}</span></button>
        <button className={view === "library" ? "active" : ""} onClick={() => setView("library")}><span>▥</span><small>Library</small></button>
        <button className={view === "tasks" ? "active" : view === "more" ? "active" : ""} onClick={() => setView(view === "tasks" ? "more" : "tasks")}><span>{view === "tasks" ? "•••" : "✓"}</span><small>{view === "tasks" ? "More" : "Tasks"}</small></button>
      </nav>

      <input ref={fileInputRef} type="file" accept=".pdf,.epub,application/pdf,application/epub+zip,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" multiple hidden onChange={importDocuments} />
      <input ref={icsInputRef} type="file" accept=".ics,text/calendar" hidden onChange={importCalendar} />
      {importMessage && <button className="camp-toast" onClick={() => setImportMessage("")}>{importBusy && <i />}<span>{importMessage}</span><b>×</b></button>}

      {notebookEditor && <div className="camp-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNotebookEditor(null); }}><section className="camp-editor-card" role="dialog" aria-modal="true" aria-label="Notebook editor"><header><div><small>NOTEBOOK</small><h2>{notebooks.some((item) => item.id === notebookEditor.id) ? "Edit its cover" : "A new notebook"}</h2></div><button onClick={() => setNotebookEditor(null)}>×</button></header><label><span>Name</span><input autoFocus value={notebookEditor.title} onChange={(event) => setNotebookEditor({ ...notebookEditor, title: event.target.value })} placeholder="e.g. Differential Equations" /></label><label><span>Subject label</span><input value={notebookEditor.subject} onChange={(event) => setNotebookEditor({ ...notebookEditor, subject: event.target.value })} placeholder="COURSE · PROJECT · PERSONAL" /></label><fieldset><legend>Cover</legend><div className="camp-cover-swatches">{notebookColors.map((color) => <button key={color} className={notebookEditor.color === color ? "active" : ""} style={{ backgroundColor: color }} onClick={() => setNotebookEditor({ ...notebookEditor, color })} aria-label={`Use ${color} cover`} />)}</div></fieldset><fieldset><legend>Paper</legend><div className="camp-paper-choices">{(["grid", "lined", "dotted", "plain"] as StudyNotebook["paper"][]).map((paper) => <button key={paper} className={notebookEditor.paper === paper ? "active" : ""} onClick={() => setNotebookEditor({ ...notebookEditor, paper })}>{paper}</button>)}</div></fieldset><footer>{notebooks.some((item) => item.id === notebookEditor.id) && <button className="danger" onClick={() => { onNotebooksChange(notebooks.filter((item) => item.id !== notebookEditor.id)); setNotebookEditor(null); }}>Delete</button>}<span /><button onClick={() => setNotebookEditor(null)}>Cancel</button><button className="primary" disabled={!notebookEditor.title.trim()} onClick={() => { const saved = { ...notebookEditor, title: notebookEditor.title.trim(), subject: notebookEditor.subject.trim(), updatedAt: new Date().toISOString() }; onNotebooksChange(notebooks.some((item) => item.id === saved.id) ? notebooks.map((item) => item.id === saved.id ? saved : item) : [saved, ...notebooks]); setNotebookEditor(null); if (!notebooks.some((item) => item.id === saved.id)) onOpenNotebook(saved); }}>Save & open</button></footer></section></div>}

      {noteEditor && <div className="camp-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNoteEditor(null); }}><section className="camp-editor-card camp-note-editor" role="dialog" aria-modal="true" aria-label="Note editor"><header><div><small>QUICK NOTE</small><h2>{notes.some((item) => item.id === noteEditor.id) ? "Keep writing" : "Catch the thought"}</h2></div><button onClick={() => setNoteEditor(null)}>×</button></header><input className="camp-note-title" autoFocus value={noteEditor.title} onChange={(event) => setNoteEditor({ ...noteEditor, title: event.target.value })} placeholder="Note title" /><textarea value={noteEditor.body} onChange={(event) => setNoteEditor({ ...noteEditor, body: event.target.value })} placeholder="Write anything…" /><label className="camp-pin-toggle"><input type="checkbox" checked={noteEditor.pinned} onChange={(event) => setNoteEditor({ ...noteEditor, pinned: event.target.checked })} /><span>◆ Pin this note</span></label><footer>{notes.some((item) => item.id === noteEditor.id) && <button className="danger" onClick={() => { onNotesChange(notes.filter((item) => item.id !== noteEditor.id)); setNoteEditor(null); }}>Delete</button>}<span /><button onClick={() => setNoteEditor(null)}>Cancel</button><button className="primary" disabled={!noteEditor.title.trim() && !noteEditor.body.trim()} onClick={() => { const saved = { ...noteEditor, title: noteEditor.title.trim() || "Untitled note", updatedAt: new Date().toISOString() }; onNotesChange(notes.some((item) => item.id === saved.id) ? notes.map((item) => item.id === saved.id ? saved : item) : [saved, ...notes]); setNoteEditor(null); }}>Save note</button></footer></section></div>}

      {taskEditor && <div className="camp-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTaskEditor(null); }}><section className="camp-editor-card camp-task-editor" role="dialog" aria-modal="true" aria-label="Task editor"><header><div><small>TASK</small><h2>{tasks.some((item) => item.id === taskEditor.id) ? "Edit task" : "Something to do"}</h2></div><button onClick={() => setTaskEditor(null)}>×</button></header><label><span>Task</span><input autoFocus value={taskEditor.title} onChange={(event) => setTaskEditor({ ...taskEditor, title: event.target.value })} placeholder="What needs doing?" /></label><label><span>Details</span><textarea value={taskEditor.detail} onChange={(event) => setTaskEditor({ ...taskEditor, detail: event.target.value })} placeholder="Optional notes or checklist context" /></label><div className="camp-editor-two"><label><span>Due date</span><input type="date" value={taskEditor.dueDate} onChange={(event) => setTaskEditor({ ...taskEditor, dueDate: event.target.value })} /></label><label><span>Time</span><input type="time" value={taskEditor.dueTime} onChange={(event) => setTaskEditor({ ...taskEditor, dueTime: event.target.value })} /></label></div><div className="camp-editor-two"><label><span>Calendar</span><select value={taskEditor.calendar} onChange={(event) => setTaskEditor({ ...taskEditor, calendar: event.target.value })}>{calendarNames.map((name) => <option key={name}>{name}</option>)}</select></label><label><span>Priority</span><select value={taskEditor.priority} onChange={(event) => setTaskEditor({ ...taskEditor, priority: event.target.value as StudyTask["priority"] })}><option value="gentle">Gentle</option><option value="important">Important</option><option value="urgent">Urgent</option></select></label></div><div className="camp-editor-two"><label><span>Reminder</span><select value={taskEditor.reminder} onChange={(event) => setTaskEditor({ ...taskEditor, reminder: event.target.value })}><option>No reminder</option><option>At time of task</option><option>10 minutes before</option><option>30 minutes before</option><option>1 hour before</option><option>1 day before</option></select></label><label><span>Repeat</span><select value={taskEditor.repeat} onChange={(event) => setTaskEditor({ ...taskEditor, repeat: event.target.value as StudyTask["repeat"] })}><option>Never</option><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label></div><footer>{tasks.some((item) => item.id === taskEditor.id) && <button className="danger" onClick={() => { onTasksChange(tasks.filter((item) => item.id !== taskEditor.id)); setTaskEditor(null); }}>Delete</button>}<span /><button onClick={() => setTaskEditor(null)}>Cancel</button><button className="primary" disabled={!taskEditor.title.trim()} onClick={() => { const saved = { ...taskEditor, title: taskEditor.title.trim() }; onTasksChange(tasks.some((item) => item.id === saved.id) ? tasks.map((item) => item.id === saved.id ? saved : item) : [saved, ...tasks]); setTaskEditor(null); }}>Save task</button></footer></section></div>}

      {memoEditor && <div className="camp-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMemoEditor(null); }}><section className="camp-editor-card camp-memo-editor" role="dialog" aria-modal="true" aria-label="Memo editor"><header><div><small>PLAN WITHOUT A DATE</small><h2>Calendar memo</h2></div><button onClick={() => setMemoEditor(null)}>×</button></header><label><span>Title</span><input autoFocus value={memoEditor.title} onChange={(event) => setMemoEditor({ ...memoEditor, title: event.target.value })} placeholder="A maybe-plan, list, or idea" /></label><label><span>Memo</span><textarea value={memoEditor.body} onChange={(event) => setMemoEditor({ ...memoEditor, body: event.target.value })} placeholder="Keep it here until the date is decided…" /></label><label><span>Calendar</span><select value={memoEditor.calendar} onChange={(event) => setMemoEditor({ ...memoEditor, calendar: event.target.value })}>{calendarNames.map((name) => <option key={name}>{name}</option>)}</select></label><label className="camp-pin-toggle"><input type="checkbox" checked={memoEditor.pinned} onChange={(event) => setMemoEditor({ ...memoEditor, pinned: event.target.checked })} /><span>◆ Pin memo</span></label><footer>{memos.some((item) => item.id === memoEditor.id) && <button className="danger" onClick={() => { onMemosChange(memos.filter((item) => item.id !== memoEditor.id)); setMemoEditor(null); }}>Delete</button>}<span /><button onClick={() => setMemoEditor(null)}>Cancel</button><button className="primary" disabled={!memoEditor.title.trim()} onClick={() => { const saved = { ...memoEditor, title: memoEditor.title.trim() }; onMemosChange(memos.some((item) => item.id === saved.id) ? memos.map((item) => item.id === saved.id ? saved : item) : [saved, ...memos]); setMemoEditor(null); }}>Save memo</button></footer></section></div>}
    </div>
  );
}
