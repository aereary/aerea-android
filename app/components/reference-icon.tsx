/** Consistent chrome icons for the four reference themes; user emojis stay intact. */
export function ReferenceIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    today: "M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10",
    habits: "M5 6h14M5 12h14M5 18h14M9 3v18",
    add: "M12 5v14M5 12h14",
    focus: "M12 8v5l3 2M9 3h6M12 3v3M18 5l2 2M21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    journal: "M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V3ZM5 17h14M9 7h6M9 11h6",
    spaces: "M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h6v6h-6Z",
    calendar: "M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1ZM8 3v4M16 3v4M4 10h16M8 14h2M14 14h2",
    settings: "M12 4v2M12 18v2M4 12h2M18 12h2M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    note: "M5 3h14v13l-5 5H5ZM14 21v-5h5M9 8h6M9 12h4",
  };
  return <svg className="reference-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.spaces} /></svg>;
}
