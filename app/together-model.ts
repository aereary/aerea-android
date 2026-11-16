/* Typed at the app boundary: preserve source records while mapping the reference UI's fields. */
// The adapter handles heterogeneous persisted legacy records; domain setters remain typed in page.tsx.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TogetherRow = Record<string, any>;
export class TogetherIds {
    private next = 1;
    private byKey = new Map<string, number>();
    private originals = new Map<number, {
        kind: string;
        value: TogetherRow;
    }>();
    id(kind: string, value: TogetherRow) { const key = kind + ':' + value.id; let n = this.byKey.get(key); if (!n) {
        n = this.next++;
        this.byKey.set(key, n);
    } this.originals.set(n, { kind, value }); return n; }
    original(kind: string, id: number) { const found = this.originals.get(id); return found?.kind === kind ? found.value : undefined; }
}
export function togetherState(raw: TogetherRow, ids: TogetherIds) {
    const group = (item: TogetherRow) => raw.libraryCollections.find((c: TogetherRow) => item.collectionIds?.includes(c.id))?.name || '';
    const journalDate = (value: string) => { if (/^\d{4}-\d{2}-\d{2}$/.test(value))
        return value; const parsed = new Date(value); return Number.isFinite(parsed.getTime()) ? parsed.getFullYear() + '-' + String(parsed.getMonth() + 1).padStart(2, '0') + '-' + String(parsed.getDate()).padStart(2, '0') : raw.today; };
    const note = (n: TogetherRow) => ({ id: ids.id('note', n), title: n.title, text: n.body, group: group(n), date: n.updatedAt?.slice(0, 10) });
    const files = [...raw.studyFiles.filter((f: TogetherRow) => !f.sourceWorkId).map((f: TogetherRow) => ({ ...f, _source: 'study' })), ...raw.libraryItems.filter((f: TogetherRow) => !raw.studyFiles.some((s: TogetherRow) => s.id === f.id)).map((f: TogetherRow) => ({ ...f, _source: 'library' }))];
    const classes = (raw.classTimetable.classes.length ? raw.classTimetable.classes : (raw.classItems || []).map((c: TogetherRow) => ({ ...c, meetings: [], name: c.name }))).map((c: TogetherRow) => ({ id: ids.id('class', c), title: c.name, code: c.professor || '', days: c.meetings.map((m: TogetherRow) => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(m.day)), start: c.meetings[0]?.start || '09:00', end: c.meetings[0]?.end || '10:00', color: ['sage', 'honey', 'lilac'].includes(c.color) ? c.color : 'lilac' }));
    const routines = raw.routines.map((r: TogetherRow) => ({ ...r, id: ids.id('routine', { ...r, id: r.groupId }) }));
    const done: Record<string, number[]> = {};
    routines.forEach((r: TogetherRow) => Object.entries(r.scheduled).forEach(([day, value]) => { if (value === true)
        (done[day] ||= []).push(r.id); }));
    let stories: TogetherRow[] = [];
    if (raw.privateUnlocked) {
        try {
            const cache = JSON.parse(localStorage.getItem('aerea-ao3-library-cache-v1') || '{}');
            const works = (cache.works || []) as TogetherRow[];
            const versions = cache.epubs || [];
            const dto = (work: TogetherRow) => { const version = versions.find((v: TogetherRow) => v.work_id === work.work_id && v.is_primary) || versions.find((v: TogetherRow) => v.work_id === work.work_id); const row = { ...work, id: work.work_id, version }; return { id: ids.id('story', row), title: work.title, author: work.author || '', type: 'Fic', words: work.words || 0, chapters: work.chapters, status: work.complete ? 'Complete' : 'In progress', download: raw.studyFiles.some((f: TogetherRow) => f.sourceWorkId === work.work_id && (raw.localAo3Ids || []).includes(f.id)), ship: (work.relationships || []).join(' · '), fandom: (work.fandoms || []).join(' · '), text: work.summary || '', tags: work.tags || [], url: /^https:\/\//.test(work.source_url || '') ? work.source_url : '' }; };
            const groups = new Map<string, TogetherRow[]>(), singles: TogetherRow[] = [];
            for (const w of works) {
                const name = w.series?.[0]?.name;
                if (name) {
                    const group = groups.get(name) || [];
                    group.push(w);
                    groups.set(name, group);
                }
                else
                    singles.push(w);
            }
            stories = singles.map(dto);
            for (const [name, items] of groups) {
                if (items.length < 2) {
                    stories.push(...items.map(dto));
                    continue;
                }
                items.sort((a, b) => (a.series?.[0]?.part || 0) - (b.series?.[0]?.part || 0));
                const members = items.map(dto);
                stories.push({ ...members[0], title: name, type: 'Series', works: members, words: members.reduce((n, w) => n + w.words, 0), download: members.some(w => w.download), status: members.every(w => w.status === 'Complete') ? 'Complete' : 'In progress' });
            }
        }
        catch { /* Private catalog remains empty until its authenticated loader finishes. */ }
    }
    return { theme: raw.colorMode === 'light' ? 'light' : 'night', accent: raw.accent || 'rose', tasks: raw.tasks.map((t: TogetherRow) => ({ id: ids.id('task', t), title: t.title, done: t.completed })), routines, done, notes: raw.studyNotes.map(note), journals: raw.entries.map((j: TogetherRow) => ({ ...j, id: ids.id('journal', j), date: journalDate(j.date) })), groups: raw.libraryCollections.map((c: TogetherRow) => c.name), files: files.map((f: TogetherRow) => ({ id: ids.id('file', f), title: f.name, type: (f.kind || 'file').toUpperCase(), group: group(f), meta: f.readerLocation?.page ? `Page ${f.readerLocation.page}` : f.readerLocation?.chapter !== undefined ? `Chapter ${Number(f.readerLocation.chapter) + 1}` : '', percentage: f.readerLocation?.percentage || 0, lastOpenedAt: f.lastOpenedAt || '', text: '' })), events: raw.calendarEvents.map((e: TogetherRow) => ({ id: ids.id('event', e), title: e.title, date: e.date, time: e.allDay ? '' : e.time, category: e.calendar || 'Personal', note: e.detail || '', repeat: e.repeat, repeatUntil: e.repeatUntil, excludedDates: e.excludedDates, customRepeatEvery: e.customRepeatEvery, customRepeatUnit: e.customRepeatUnit, sourceType: e.sourceType, routineId: routines.find((r: TogetherRow) => r.groupId === e.healthRoutineGroupId)?.id, classId: classes.find((c: TogetherRow) => ids.original('class', c.id)?.id === e.timetableClassId)?.id })), moods: raw.moodHistory, tags: raw.tags || {}, dayDone: raw.completedDays, classes, semester: { name: raw.classTimetable.termName, start: raw.classTimetable.termStart, end: raw.classTimetable.termEnd }, courses: raw.courses || [], courseDone: raw.courseDone || [], postit: raw.postIts.find((n: TogetherRow) => !n.archived)?.text || '', inbox: raw.inboxItems.filter((n: TogetherRow) => !n.dismissedAt).map((n: TogetherRow) => ({ id: ids.id('inbox', n), title: n.originalName || n.text.slice(0, 60), text: n.text, date: n.createdAt?.slice(0, 10) })), archive: raw.inboxItems.filter((n: TogetherRow) => n.dismissedAt).map((n: TogetherRow) => ({ id: ids.id('inbox', n), title: n.originalName || n.text.slice(0, 60), text: n.text })), trash: raw.trashItems.map((t: TogetherRow) => ({ id: ids.id('trash', t), title: t.label, text: (t.payload as TogetherRow)?.body || '' })), simple: raw.simplifiedCalendarMode, records: raw.recordings.map((r: TogetherRow) => ({ id: ids.id('record', r), classId: classes.find((c: TogetherRow) => c.title === r.className)?.id || classes[0]?.id || 0, title: r.name || r.className, note: r.notes, duration: String(Math.floor((r.duration || 0) / 60)).padStart(2, '0') + ':' + String(Math.floor((r.duration || 0) % 60)).padStart(2, '0'), url: r.url })), stories, themeOptions: raw.themeOptions || [], isRecording: raw.isRecording, recordingSeconds: raw.recordingSeconds, notice: raw.notice, recordingTitle: raw.recordingTitle, recordingNotes: raw.recordingNotes, today: raw.today };
}
export function togetherChanges(raw: TogetherRow, ids: TogetherIds, action: string, state: TogetherRow): TogetherRow {
    const now = new Date().toISOString(), newId = () => crypto.randomUUID(), groupIds = (name: string, old: TogetherRow | undefined) => { const c = raw.libraryCollections.find((c: TogetherRow) => c.name === name); const previous = raw.libraryCollections.find((c: TogetherRow) => old?.collectionIds?.includes(c.id)); if (previous?.name === name)
        return old?.collectionIds || []; const remaining = (old?.collectionIds || []).filter((id: string) => id !== previous?.id); return c ? [...new Set([...remaining, c.id])] : remaining; };
    if (action === 'task' || action === 'deleteTask' || action === 'form:task')
        return { tasks: state.tasks.map((t: TogetherRow) => { const old = ids.original('task', t.id); return { ...old, id: old?.id || newId(), title: t.title, completed: !!t.done, dueDate: old?.dueDate || raw.today, createdAt: old?.createdAt || now, updatedAt: now }; }) };
    if (['form:note', 'form:inbox', 'journalToNote', 'moveToNotes'].includes(action))
        return { studyNotes: state.notes.map((n: TogetherRow) => { const old = ids.original('note', n.id); return { ...old, id: old?.id || newId(), title: n.title, body: n.text, pinned: old?.pinned || false, collectionIds: groupIds(n.group, old), createdAt: old?.createdAt || now, updatedAt: now }; }), ...(action === 'form:inbox' ? { inboxItems: [...raw.inboxItems, ...state.inbox.filter((n: TogetherRow) => !ids.original('inbox', n.id)).map((n: TogetherRow) => ({ id: newId(), kind: 'text', text: n.text, createdAt: now }))] } : {}) };
    if (['form:event', 'form:exception', 'deleteEvent'].includes(action))
        return { calendarEvents: [...raw.calendarEvents.filter((e: TogetherRow) => e.sourceType), ...state.events.filter((e: TogetherRow) => !e.sourceType).map((e: TogetherRow) => { const old = ids.original('event', e.id); return { ...old, id: old?.id || newId(), title: e.title, date: e.date, time: e.time || '09:00', allDay: !e.time, calendar: e.category, color: old?.color || 'lilac', detail: e.note, repeat: old?.repeat || 'Never', excludedDates: old?.excludedDates || [] }; })] };
    if (action === 'form:collection')
        return { libraryCollections: [...raw.libraryCollections, ...state.groups.filter((name: string) => !raw.libraryCollections.some((c: TogetherRow) => c.name === name)).map((name: string, i: number) => ({ id: newId(), name, order: raw.libraryCollections.length + i, createdAt: now }))] };
    if (action === 'saveJournal')
        return { entries: state.journals.map((j: TogetherRow) => { const old = ids.original('journal', j.id); return { ...old, id: old?.id || Date.now(), date: old?.date || j.date, text: j.text, mood: j.mood }; }) };
    if (action === 'mood')
        return { moodHistory: state.moods };
    if (action === 'dayDone')
        return { completedDays: state.dayDone };
    if (action === 'form:semester')
        return { classTimetable: { ...raw.classTimetable, termName: state.semester.name, termStart: state.semester.start, termEnd: state.semester.end } };
    if (action === 'form:class' && state.classes.some((c: TogetherRow) => c.days.includes(0)))
        throw new Error('Choose a class day from Monday to Saturday.');
    if (action === 'form:class')
        return { classTimetable: { ...raw.classTimetable, classes: state.classes.map((c: TogetherRow) => { const old = ids.original('class', c.id); return { ...old, id: old?.id || newId(), name: c.title, professor: c.code, color: old && !['sage','honey','lilac'].includes(old.color) && c.color==='lilac' ? old.color : c.color, meetings: c.days.filter((d: number) => d >= 1 && d <= 6).map((d: number) => ({ ...old?.meetings?.find((m: TogetherRow) => m.day === ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d]), id: old?.meetings?.find((m: TogetherRow) => m.day === ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d])?.id || newId(), day: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d], start: old?.meetings?.[0]?.start === c.start ? (old?.meetings?.find((m: TogetherRow) => m.day === ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d])?.start || c.start) : c.start, end: old?.meetings?.[0]?.end === c.end ? (old?.meetings?.find((m: TogetherRow) => m.day === ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d])?.end || c.end) : c.end })) }; }) } };
    if (action === 'form:audio')
        return { recordings: raw.recordings.map((r: TogetherRow) => { const match = state.records?.find((n: TogetherRow) => ids.original('record', n.id)?.id === r.id); return match ? { ...r, name: match.title, notes: match.note } : r; }) };
    if (action === 'simple')
        return { simplifiedCalendarMode: state.simple };
    if (action === 'theme' || action === 'toggleTheme')
        return { colorMode: state.theme === 'light' ? 'light' : 'dark' };
    if (action === 'form:routine') {
        const routineSymbols = { ...raw.togetherUi?.routineSymbols };
        const routineRows = state.routines.filter((r: TogetherRow) => r.title?.trim());
        const result = raw.calendarEvents.filter((e: TogetherRow) => e.sourceType !== 'health-routine');
        for (const r of routineRows) {
            const old = ids.original('routine', r.id), groupId = old?.groupId || newId(), events = (old?.events || []) as TogetherRow[], completed = [...new Set(events.flatMap(e => e.healthCompletedDates || []))];
            routineSymbols[groupId] = r.symbol || '✧';
            if (old && r.title === old.title && r.time === old.time && JSON.stringify(r.days) === JSON.stringify(old.days)) {
                result.push(...events);
                continue;
            }
            const parse = (text: string) => { if (!text)
                return '09:00'; const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!match)
                return '09:00'; let hour = Number(match[1]); if (match[3])
                hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0); return String(hour).padStart(2, '0') + ':' + match[2]; };
            if (old && JSON.stringify(r.days) === JSON.stringify(old.days)) {
                result.push(...events.map(e => ({ ...e, title: r.title, time: parse(r.time) })));
                continue;
            }
            const daily = r.days.length === 7;
            for (const day of daily ? [undefined] : r.days) {
                const matching = events.find(e => daily ? e.healthRoutineCadence === 'daily' : e.healthRoutineWeekday === day);
                const date = new Date(raw.today + 'T12:00:00');
                if (day !== undefined)
                    date.setDate(date.getDate() + (day - date.getDay() + 7) % 7);
                const start = matching?.date || date.toLocaleDateString('en-CA');
                result.push({ ...matching, id: matching?.id || newId(), title: r.title, date: start, time: parse(r.time), allDay: false, calendar: 'Health', color: 'cyan', repeat: daily ? 'Daily' : 'Weekly', excludedDates: matching?.excludedDates || [], sourceType: 'health-routine', healthRoutineGroupId: groupId, healthRoutineCadence: daily ? 'daily' : 'weekdays', healthRoutineWeekday: day, healthCompletedDates: completed });
            }
        }
        return { calendarEvents: result, togetherUi: { ...raw.togetherUi, routineSymbols } };
    }
    if (action === 'routine')
        return { calendarEvents: raw.calendarEvents.map((e: TogetherRow) => { if (e.sourceType !== 'health-routine')
                return e; const r = state.routines.find((r: TogetherRow) => ids.original('routine', r.id)?.groupId === (e.healthRoutineGroupId || e.id)); if (!r)
                return e; const completed = (state.done[raw.today] || []).includes(r.id); return { ...e, healthCompletedDates: completed ? [...new Set([...(e.healthCompletedDates || []), raw.today])] : (e.healthCompletedDates || []).filter((day: string) => day !== raw.today) }; }) };
    return {};
}
