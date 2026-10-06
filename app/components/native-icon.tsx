/** App chrome only. Imported emojis, covers and user drawings are content. */
export function NativeIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    today: "M4 5h16v15H4ZM8 3v4M16 3v4M4 10h16M8 14h3M8 17h6",
    habits: "M10 6h10M10 12h10M10 18h10M3 5l2 2 3-3M3 11l2 2 3-3M3 17l2 2 3-3",
    check: "M5 12l4 4L19 6",
    add: "M12 5v14M5 12h14",
    focus: "M9 3h6M12 3v3M18 5l2 2M12 10v5l3 2M21 15a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    journal: "M6 3h12a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM4 17h16M9 7h6M9 11h6",
    spaces: "M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h6v6h-6Z",
    calendar: "M4 5h16v15H4ZM8 3v4M16 3v4M4 10h16M8 14h2M14 14h2",
    settings: "M9 3h6l1 3 3 1 2 4-2 3v3l-4 3-3-1-3 1-4-3v-3l-2-3 2-4 3-1ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    note: "M5 3h14v13l-5 5H5ZM14 21v-5h5M9 8h6M9 12h6",
    back: "M15 5l-7 7 7 7",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    menu: "M4 6h16M4 12h16M4 18h16",
  };
  return <svg className="native-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.list} /></svg>;
}
