# Inventario técnico completo de aérea

Base consultada: 98af1cd4334b39914ed8b052283beff1991aee80.

Inventario de código; incluye ramas condicionales y componentes reutilizados. No equivale a verificación visual de cada estado.

579 declaraciones de controles; 912 identificadores de clases; 46 estilos inline. Las declaraciones reutilizadas pueden generar muchos botones reales. Los selectores de color, tamaños de página, tinta, portada y archivos del usuario deben conservar su significado.

## Todos los controles, uno por uno

| ID | Archivo y línea | Elemento | Etiqueta o contenido | Clase | Contexto | Interacción |
|---|---|---|---|---|---|---|
| UI-0001 | app/ao3-library.tsx:481 | button | {`Search tag ${tag}`} | {`ao3-tag ${selected ? "is-searching" : ""}`} | {`ao3-tag ${selected ? "is-searching" : ""}`} | onClick |
| UI-0002 | app/ao3-library.tsx:499 | summary | + more | (sin clase propia: control base) | "ao3-more-tags" → hidden.length > 0 → "ao3-tags" |  |
| UI-0003 | app/ao3-library.tsx:533 | a | ↗ | (sin clase propia: control base) | externalHref → "ao3-actions" |  |
| UI-0004 | app/ao3-library.tsx:538 | button | ↓ Download EPUB | (sin clase propia: control base) | primary → "ao3-actions" | onClick |
| UI-0005 | app/ao3-library.tsx:556 | summary | + Alternate version | (sin clase propia: control base) | "ao3-alternative" → alternatives.length > 0 |  |
| UI-0006 | app/ao3-library.tsx:564 | a | ↗ Open in Drive | (sin clase propia: control base) | "ao3-actions ao3-actions-small" → "ao3-alternative-item" → "ao3-alternative-body" → "ao3-alternative" → alternatives.length > 0 |  |
| UI-0007 | app/ao3-library.tsx:571 | button | ↓ Download alternate EPUB | (sin clase propia: control base) | "ao3-actions ao3-actions-small" → "ao3-alternative-item" → "ao3-alternative-body" → "ao3-alternative" → alternatives.length > 0 | onClick |
| UI-0008 | app/ao3-library.tsx:649 | TagCloud | (contenido dinámico) | (sin clase propia: control base) | "ao3-tag-section" → "ao3-work-details" | onTagSearch |
| UI-0009 | app/ao3-library.tsx:658 | WorkActions | (contenido dinámico) | (sin clase propia: control base) | "ao3-work-details" | onDownload |
| UI-0010 | app/ao3-library.tsx:686 | button | "Tap to copy title" | "ao3-copy-title" | "ao3-copy-title" → "ao3-card-header" → {`ao3-card ${work.archived ? "ao3-card-archive" : ""}`} | onClick |
| UI-0011 | app/ao3-library.tsx:737 | TagCloud | (contenido dinámico) | (sin clase propia: control base) | "ao3-tag-section" → "ao3-card-body" → {`ao3-card ${work.archived ? "ao3-card-archive" : ""}`} | onTagSearch |
| UI-0012 | app/ao3-library.tsx:752 | WorkActions | (contenido dinámico) | (sin clase propia: control base) | "ao3-card-body" → {`ao3-card ${work.archived ? "ao3-card-archive" : ""}`} | onDownload |
| UI-0013 | app/ao3-library.tsx:776 | details | (contenido dinámico) | "ao3-part" | "ao3-part" | onToggle |
| UI-0014 | app/ao3-library.tsx:780 | summary | (contenido dinámico) | (sin clase propia: control base) | "ao3-part" |  |
| UI-0015 | app/ao3-library.tsx:791 | WorkDetails | (contenido dinámico) | (sin clase propia: control base) | expanded → "ao3-part" | onDownload, onTagSearch |
| UI-0016 | app/ao3-library.tsx:832 | button | "Tap to copy title" | "ao3-copy-title" | "ao3-copy-title" → "ao3-card-header" → "ao3-card ao3-card-series" | onClick |
| UI-0017 | app/ao3-library.tsx:888 | TagCloud | (contenido dinámico) | (sin clase propia: control base) | "ao3-tag-section" → "ao3-card-body" → "ao3-card ao3-card-series" | onTagSearch |
| UI-0018 | app/ao3-library.tsx:898 | summary | View works | (sin clase propia: control base) | "ao3-series-parts" → "ao3-card ao3-card-series" |  |
| UI-0019 | app/ao3-library.tsx:902 | SeriesPart | (contenido dinámico) | (sin clase propia: control base) | "ao3-series-parts" → "ao3-card ao3-card-series" | onDownload, onTagSearch |
| UI-0020 | app/ao3-library.tsx:959 | input | "Search title, author, ship, tag…" | "ao3-search" |  | onChange, onFocus |
| UI-0021 | app/ao3-library.tsx:985 | button | ← Library | (sin clase propia: control base) | "ao3-screen-header" → "ao3-library-layer" | onClick |
| UI-0022 | app/ao3-library.tsx:1284 | section | "My AO3 Library" | {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onScroll |
| UI-0023 | app/ao3-library.tsx:1294 | button | ← Library | (sin clase propia: control base) | "ao3-screen-header" → {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onClick |
| UI-0024 | app/ao3-library.tsx:1319 | button | "Refresh AO3 Library" | "ao3-refresh" | "ao3-refresh" → "ao3-library-intro" → "ao3-library-tools" → "ao3-library" → loading && works.length === 0 | onClick |
| UI-0025 | app/ao3-library.tsx:1330 | Ao3SearchInput | (contenido dinámico) | (sin clase propia: control base) | "ao3-library-tools" → "ao3-library" → loading && works.length === 0 → {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onValueChange, onFocus |
| UI-0026 | app/ao3-library.tsx:1340 | select | (contenido dinámico) | (sin clase propia: control base) | "ao3-filter-row" → "ao3-library-tools" → "ao3-library" → loading && works.length === 0 → {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onChange |
| UI-0027 | app/ao3-library.tsx:1357 | select | (contenido dinámico) | (sin clase propia: control base) | "ao3-filter-row" → "ao3-library-tools" → "ao3-library" → loading && works.length === 0 → {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onChange |
| UI-0028 | app/ao3-library.tsx:1368 | select | (contenido dinámico) | (sin clase propia: control base) | "ao3-filter-row" → "ao3-library-tools" → "ao3-library" → loading && works.length === 0 → {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onChange |
| UI-0029 | app/ao3-library.tsx:1406 | FicCard | (contenido dinámico) | (sin clase propia: control base) | entry.kind === "fic" → "ao3-grid" → "ao3-library" → loading && works.length === 0 → {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onCopy, onDownload, onTagSearch |
| UI-0030 | app/ao3-library.tsx:1420 | SeriesCard | (contenido dinámico) | (sin clase propia: control base) | entry.kind === "fic" → "ao3-grid" → "ao3-library" → loading && works.length === 0 → {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onCopy, onDownload, onTagSearch |
| UI-0031 | app/ao3-library.tsx:1448 | div | (contenido dinámico) | "ao3-modal-backdrop" | "ao3-modal-backdrop" → downloadTarget → "ao3-library" → loading && works.length === 0 → {`ao3-library-layer ${searchToolsHidden ? "ao3-search-tools-hidden" : ""}`} | onMouseDown |
| UI-0032 | app/ao3-library.tsx:1465 | button | Cancel | (sin clase propia: control base) | "ao3-modal-actions" → "ao3-modal" → "ao3-modal-backdrop" → downloadTarget → "ao3-library" | onClick |
| UI-0033 | app/ao3-library.tsx:1472 | button | (contenido dinámico) | "ao3-modal-primary" | "ao3-modal-primary" → "ao3-modal-actions" → "ao3-modal" → "ao3-modal-backdrop" → downloadTarget | onClick |
| UI-0034 | app/career-plan-bridge.tsx:218 | button | (contenido dinámico) | {styles.courseRow} | {styles.courseRow} | onClick |
| UI-0035 | app/career-plan-bridge.tsx:302 | section | {`${group.title} professors. Press and hold to add.`} | {styles.professorGroup} | {styles.professorGroup} → {styles.professorGroups} | onPointerDown, onPointerUp, onPointerCancel, onPointerLeave, onPointerMove, onContextMenu |
| UI-0036 | app/career-plan-bridge.tsx:609 | button | "Back to schedule" | (sin clase propia: control base) | {styles.topbar} → {styles.screen} → {styles.overlay} | onClick |
| UI-0037 | app/career-plan-bridge.tsx:616 | button | "Professors" | (sin clase propia: control base) | {styles.topbar} → {styles.screen} → {styles.overlay} | onClick |
| UI-0038 | app/career-plan-bridge.tsx:661 | button | (contenido dinámico) | {view === key ? styles.activeTab : ""} | {view === key ? styles.activeTab : ""} → {styles.tabs} → {styles.screen} → {styles.overlay} | onClick |
| UI-0039 | app/career-plan-bridge.tsx:678 | button | view full plan | (sin clase propia: control base) | {styles.sectionHead} → {styles.section} → view === "summary" → {styles.content} → {styles.screen} | onClick |
| UI-0040 | app/career-plan-bridge.tsx:684 | CourseRow | (contenido dinámico) | (sin clase propia: control base) | {styles.card} → {styles.section} → view === "summary" → {styles.content} → {styles.screen} | onOpen |
| UI-0041 | app/career-plan-bridge.tsx:697 | button | what can I take | (sin clase propia: control base) | {styles.sectionHead} → {styles.section} → view === "summary" → {styles.content} → {styles.screen} | onClick |
| UI-0042 | app/career-plan-bridge.tsx:702 | button | (contenido dinámico) | {styles.summaryRow} | {styles.summaryRow} → {styles.card} → {styles.section} → view === "summary" → {styles.content} | onClick |
| UI-0043 | app/career-plan-bridge.tsx:716 | button | (contenido dinámico) | {styles.summaryRow} | {styles.summaryRow} → {styles.card} → {styles.section} → view === "summary" → {styles.content} | onClick |
| UI-0044 | app/career-plan-bridge.tsx:730 | button | (contenido dinámico) | {styles.summaryRow} | {styles.summaryRow} → {styles.card} → {styles.section} → view === "summary" → {styles.content} | onClick |
| UI-0045 | app/career-plan-bridge.tsx:753 | input | "Search course or code" | (sin clase propia: control base) | {styles.searchBox} → view === "plan" → {styles.content} → {styles.screen} → {styles.overlay} | onChange |
| UI-0046 | app/career-plan-bridge.tsx:790 | button | (contenido dinámico) | {styles.quarterHead} | {styles.quarterHead} → {`${styles.quarter} ${ expanded ? styles.quarterOpen : "" }`} → {styles.quarters} → view === "plan" | onClick |
| UI-0047 | app/career-plan-bridge.tsx:813 | CourseRow | (contenido dinámico) | (sin clase propia: control base) | {styles.quarterBody} → expanded → {`${styles.quarter} ${ expanded ? styles.quarterOpen : "" }`} | onOpen |
| UI-0048 | app/career-plan-bridge.tsx:839 | CourseRow | (contenido dinámico) | (sin clase propia: control base) | {styles.card} → {styles.section} → view === "available" → {styles.content} → {styles.screen} | onOpen |
| UI-0049 | app/career-plan-bridge.tsx:851 | button | view all | (sin clase propia: control base) | {styles.sectionHead} → {styles.section} → view === "available" → {styles.content} → {styles.screen} | onClick |
| UI-0050 | app/career-plan-bridge.tsx:857 | CourseRow | (contenido dinámico) | (sin clase propia: control base) | {styles.card} → {styles.section} → view === "available" → {styles.content} → {styles.screen} | onOpen |
| UI-0051 | app/career-plan-bridge.tsx:872 | div | (contenido dinámico) | {styles.sheetBackdrop} | {styles.sheetBackdrop} → selectedCourse → {styles.overlay} | onMouseDown |
| UI-0052 | app/career-plan-bridge.tsx:917 | button | (contenido dinámico) | { courseState( selectedCourse, profile.courseStates, ) === state ? styles.selectedCourseStatus : "" } | { courseState( selectedCourse, profile.courseStates, ) === state ? styles.selectedCourseStatus : "" } → {styles.courseStatusChoices} → {styles.courseStatusEditor} → {styles.sheet} → {styles.sheetBackdrop} | onClick |
| UI-0053 | app/career-plan-bridge.tsx:1001 | button | (contenido dinámico) | {styles.routeButton} | {styles.routeButton} → {styles.sheet} → {styles.sheetBackdrop} → selectedCourse → {styles.overlay} | onClick |
| UI-0054 | app/career-plan-bridge.tsx:1030 | button | "Back to My degree" | (sin clase propia: control base) | {styles.topbar} → {styles.professorsPanel} → professorsOpen → {styles.overlay} | onClick |
| UI-0055 | app/career-plan-bridge.tsx:1050 | ProfessorGroups | (contenido dinámico) | (sin clase propia: control base) | {styles.professorsPanel} → professorsOpen → {styles.overlay} | onAddProfessor |
| UI-0056 | app/career-plan-bridge.tsx:1062 | div | (contenido dinámico) | {styles.formBackdrop} | {styles.formBackdrop} → addProfessorOpen → {styles.overlay} | onMouseDown |
| UI-0057 | app/career-plan-bridge.tsx:1068 | form | (contenido dinámico) | {styles.professorForm} | {styles.professorForm} → {styles.formBackdrop} → addProfessorOpen → {styles.overlay} | onSubmit |
| UI-0058 | app/career-plan-bridge.tsx:1083 | input | "Professor name" | (sin clase propia: control base) | {styles.professorForm} → {styles.formBackdrop} → addProfessorOpen → {styles.overlay} | onChange |
| UI-0059 | app/career-plan-bridge.tsx:1090 | button | Save professor | {styles.saveProfessorButton} | {styles.saveProfessorButton} → {styles.professorForm} → {styles.formBackdrop} → addProfessorOpen → {styles.overlay} |  |
| UI-0060 | app/career-plan-bridge.tsx:1158 | button | Schedule | {styles.switcherActive} | {styles.switcherActive} → {styles.timetableSwitcher} → slot && !open |  |
| UI-0061 | app/career-plan-bridge.tsx:1161 | button | My degree | (sin clase propia: control base) | {styles.timetableSwitcher} → slot && !open | onClick |
| UI-0062 | app/career-plan-bridge.tsx:1169 | CareerPlanOverlay | (contenido dinámico) | (sin clase propia: control base) | open | onClose |
| UI-0063 | app/generic-library-bridge.tsx:230 | button | "Tap to copy title" | "ao3-copy-title" | "ao3-copy-title" → "ao3-card-header" → "ao3-card aerea-generic-library-card" | onClick |
| UI-0064 | app/generic-library-bridge.tsx:259 | a | ↗ Open in Drive | (sin clase propia: control base) | "ao3-actions aerea-generic-actions" → "ao3-card-body" → "ao3-card aerea-generic-library-card" |  |
| UI-0065 | app/generic-library-bridge.tsx:270 | summary | + Previous version | (sin clase propia: control base) | "ao3-alternative" → historicalVersions.length > 0 → "ao3-card-body" → "ao3-card aerea-generic-library-card" |  |
| UI-0066 | app/generic-library-bridge.tsx:284 | a | ↗ Open preserved version | (sin clase propia: control base) | "ao3-actions aerea-generic-actions ao3-actions-small" → "ao3-alternative-item" → "ao3-alternative-body" → "ao3-alternative" → historicalVersions.length > 0 |  |
| UI-0067 | app/page.tsx:2411 | input | "Search by event, class, place, or note" | (sin clase propia: control base) | "calendar-search-field" | onChange |
| UI-0068 | app/page.tsx:2423 | button | "Clear search" | (sin clase propia: control base) | draft → "calendar-search-field" | onClick |
| UI-0069 | app/page.tsx:9565 | main | (contenido dinámico) | "app-shell" | "app-shell" | onKeyDown |
| UI-0070 | app/page.tsx:9599 | button | "Choose month and year" | "simplified-calendar-title" | "simplified-calendar-title" → "simplified-calendar-heading" → "simplified-calendar-header" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) | onClick |
| UI-0071 | app/page.tsx:9612 | button | "Open settings" | "simplified-theme-shortcut" | "simplified-theme-shortcut" → "simplified-calendar-header" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0072 | app/page.tsx:9633 | button | "Previous year" | (sin clase propia: control base) | "simplified-month-picker" → monthPickerOpen → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0073 | app/page.tsx:9643 | button | "Next year" | (sin clase propia: control base) | "simplified-month-picker" → monthPickerOpen → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0074 | app/page.tsx:9655 | button | (contenido dinámico) | {month === calendarMonth ? "active" : ""} | {month === calendarMonth ? "active" : ""} → "simplified-month-picker" → monthPickerOpen → "simplified-calendar-screen" | onClick |
| UI-0075 | app/page.tsx:9703 | button | (contenido dinámico) | {`source-color-${sourceColor} ${hidden ? "muted" : "active"}`} | {`source-color-${sourceColor} ${hidden ? "muted" : "active"}`} → "simplified-calendar-filters" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) | onClick |
| UI-0076 | app/page.tsx:9725 | button | "Edit calendar categories" | "simplified-filter-menu" | "simplified-filter-menu" → "simplified-calendar-filters" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0077 | app/page.tsx:9738 | div | "Monthly calendar. Swipe left or right to change month." | {[ "simplified-month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} | {[ "simplified-month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onAnimationEnd, onTouchStart, onTouchEnd |
| UI-0078 | app/page.tsx:9780 | div | {`${readableDate(dayKey)}, ${dayEvents.length} events`} | {[ "simplified-calendar-cell", currentMonth ? "" : "outside-month", date.getDay() === 0 ? "sunday" : "", date.getDay() === 6 ? "saturday" : "", selectedCalendarDate === dayKey ? "selected" : "", dayKey === todayKey ? "today" : "", ] .filter(Boolean) .join(" ")} | {[ "simplified-calendar-cell", currentMonth ? "" : "outside-month", date.getDay() === 0 ? "sunday" : "", date.getDay() === 6 ? "saturday" : "", selectedCalendarDate === dayKey ? "selected" : "", dayKey === todayKey ? "today" : "", ] .filter(Boolean) .join(" ")} → {[ "simplified-month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onClick, onKeyDown |
| UI-0079 | app/page.tsx:9824 | button | {`${calendarEvent.title} · ${eventStartTimeLabel(calendarEvent)}`} | {`simplified-event-strip ${eventColor} ${ isFootballVisualEvent(calendarEvent) ? "canonical-boca-match" : "" }`} | {`simplified-event-strip ${eventColor} ${ isFootballVisualEvent(calendarEvent) ? "canonical-boca-match" : "" }`} → "simplified-calendar-events" → {[ "simplified-calendar-cell", currentMonth ? "" : "outside-month", date.getDay() === 0 ? "sunday" : "", date.getDay() === 6 ? "saturday" : "", selectedCalendarDate === dayKey ? "selected" : "", dayKey === todayKey ? "today" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0080 | app/page.tsx:9849 | button | + | "simplified-more-events" | "simplified-more-events" → dayEvents.length > 3 → "simplified-calendar-events" → {[ "simplified-calendar-cell", currentMonth ? "" : "outside-month", date.getDay() === 0 ? "sunday" : "", date.getDay() === 6 ? "saturday" : "", selectedCalendarDate === dayKey ? "selected" : "", dayKey === todayKey ? "today" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0081 | app/page.tsx:9867 | button | {`Add event to ${readableDate(selectedCalendarDate)}`} | "simplified-calendar-add" | "simplified-calendar-add" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0082 | app/page.tsx:9878 | button | "Month calendar" | "active" | "active" → "simplified-calendar-nav" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0083 | app/page.tsx:9890 | button | "Selected day agenda" | (sin clase propia: control base) | "simplified-calendar-nav" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0084 | app/page.tsx:9901 | button | "Today agenda" | (sin clase propia: control base) | "simplified-calendar-nav" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0085 | app/page.tsx:9913 | button | "Open settings" | (sin clase propia: control base) | "simplified-calendar-nav" → "simplified-calendar-screen" → simplifiedCalendarMode && (stateReady \|\| cachedNativeState !== null) → "app-shell" | onClick |
| UI-0086 | app/page.tsx:9972 | button | {brandOpensAo3 ? "Open My AO3 Library" : "Open aérea spaces"} | "brand-wrap" | "brand-wrap" → "topbar" → !sketchFullscreen → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } → "app-shell" | onClick |
| UI-0087 | app/page.tsx:9991 | button | "Create a movable post-it" | "post-it-create-button" | "post-it-create-button" → "header-actions" → "topbar" → !sketchFullscreen → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } | onClick |
| UI-0088 | app/page.tsx:10000 | button | "Open calendar" | "calendar-button" | "calendar-button" → "header-actions" → "topbar" → !sketchFullscreen → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } | onClick |
| UI-0089 | app/page.tsx:10008 | button | "Open appearance settings" | "avatar-button" | "avatar-button" → "header-actions" → "topbar" → !sketchFullscreen → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } | onClick |
| UI-0090 | app/page.tsx:10018 | div | (contenido dinámico) | "main-content primary-swipe-surface" | "main-content primary-swipe-surface" → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } → "app-shell" | onTouchStart, onTouchMove, onTouchEnd, onTouchCancel |
| UI-0091 | app/page.tsx:10027 | TodayScreen | (contenido dinámico) | (sin clase propia: control base) | activeTab === "today" → "main-content primary-swipe-surface" → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } → "app-shell" | onTimetableRequestHandled |
| UI-0092 | app/page.tsx:10062 | ScreenIntro | "Your habits" | (sin clase propia: control base) | "screen-section" → activeTab === "habits" → "main-content primary-swipe-surface" → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } → "app-shell" | onStickerClick |
| UI-0093 | app/page.tsx:10071 | div | (contenido dinámico) | "health-routine-backdrop" | "health-routine-backdrop" → healthRoutineOpen → "screen-section" → activeTab === "habits" → "main-content primary-swipe-surface" | onMouseDown |
| UI-0094 | app/page.tsx:10098 | button | "Close daily rhythm" | "health-routine-close" | "health-routine-close" → "health-routine-header" → "health-routine-note" → "health-routine-backdrop" → healthRoutineOpen | onClick |
| UI-0095 | app/page.tsx:10177 | button | (contenido dinámico) | "health-routine-body" | "health-routine-body" → {`health-routine-item tone-${ routineIndex % 4 } ${ completedToday ? "complete" : "" }`.trim()} → healthRoutineGroups.length === 0 → "health-routine-list" | onClick |
| UI-0096 | app/page.tsx:10199 | button | { todayOccurrence ? `${ completedToday ? "Mark incomplete" : "Mark complete" }: ${first.title}` : `${first.title} is not scheduled today` } | "health-routine-check" | "health-routine-check" → {`health-routine-item tone-${ routineIndex % 4 } ${ completedToday ? "complete" : "" }`.trim()} → healthRoutineGroups.length === 0 → "health-routine-list" | onClick |
| UI-0097 | app/page.tsx:10225 | button | {`Delete ${first.title}`} | "health-routine-delete" | "health-routine-delete" → {`health-routine-item tone-${ routineIndex % 4 } ${ completedToday ? "complete" : "" }`.trim()} → healthRoutineGroups.length === 0 → "health-routine-list" | onClick |
| UI-0098 | app/page.tsx:10241 | button | Add a little routine | "health-routine-add" | "health-routine-add" → !healthRoutineEditorOpen → "health-routine-note" → "health-routine-backdrop" → healthRoutineOpen | onClick |
| UI-0099 | app/page.tsx:10254 | input | "Skincare, wash my hair…" | (sin clase propia: control base) | "health-routine-editor" → !healthRoutineEditorOpen → "health-routine-note" → "health-routine-backdrop" → healthRoutineOpen | onChange |
| UI-0100 | app/page.tsx:10268 | select | (contenido dinámico) | (sin clase propia: control base) | "health-routine-editor" → !healthRoutineEditorOpen → "health-routine-note" → "health-routine-backdrop" → healthRoutineOpen | onChange |
| UI-0101 | app/page.tsx:10299 | button | (contenido dinámico) | { selected ? "selected" : "" } | { selected ? "selected" : "" } → "health-routine-weekdays" → healthRoutineDraft.cadence === "weekdays" → "health-routine-editor" | onClick |
| UI-0102 | app/page.tsx:10335 | input | (contenido dinámico) | (sin clase propia: control base) | "health-routine-editor" → !healthRoutineEditorOpen → "health-routine-note" → "health-routine-backdrop" → healthRoutineOpen | onChange |
| UI-0103 | app/page.tsx:10348 | button | Cancel | "secondary" | "secondary" → "health-routine-editor-actions" → "health-routine-editor" → !healthRoutineEditorOpen → "health-routine-note" | onClick |
| UI-0104 | app/page.tsx:10358 | button | Save routine | "primary" | "primary" → "health-routine-editor-actions" → "health-routine-editor" → !healthRoutineEditorOpen → "health-routine-note" | onClick |
| UI-0105 | app/page.tsx:10399 | button | {`Edit ${habit.title}`} | "habit-icon habit-edit-icon" | "habit-icon habit-edit-icon" → {`habit-row ${habit.color}`} → "habit-list" → "screen-section" → activeTab === "habits" | onClick |
| UI-0106 | app/page.tsx:10414 | button | {`Day ${index + 1}: ${done ? "done" : missed ? "missed" : "empty"}. Tap to change.`} | {`habit-dot ${done ? "done" : missed ? "missed" : ""}`.trim()} | {`habit-dot ${done ? "done" : missed ? "missed" : ""}`.trim()} → "habit-dots" → {`habit-row ${habit.color}`} | onClick |
| UI-0107 | app/page.tsx:10431 | button | ＋ Add a new habit | "primary-soft-button" | "primary-soft-button" → "screen-section" → activeTab === "habits" → "main-content primary-swipe-surface" → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } | onClick |
| UI-0108 | app/page.tsx:10456 | button | (contenido dinámico) | {focusLength === minutes ? "active" : ""} | {focusLength === minutes ? "active" : ""} → "timer-modes" → "timer-card card" → "focus-layout" → "screen-section focus-screen" | onClick |
| UI-0109 | app/page.tsx:10497 | button | (contenido dinámico) | "timer-main" | "timer-main" → "timer-actions" → "timer-card card" → "focus-layout" → "screen-section focus-screen" | onClick |
| UI-0110 | app/page.tsx:10503 | button | ↻ | "timer-reset" | "timer-reset" → "timer-actions" → "timer-card card" → "focus-layout" → "screen-section focus-screen" | onClick |
| UI-0111 | app/page.tsx:10541 | textarea | "Write whatever is sitting with you." | (sin clase propia: control base) | "journal-paper" → "journal-compose card" → "journal-layout" → "screen-section" → activeTab === "journal" | onChange |
| UI-0112 | app/page.tsx:10549 | button | Save this moment | (sin clase propia: control base) | "journal-actions" → "journal-compose card" → "journal-layout" → "screen-section" → activeTab === "journal" | onClick |
| UI-0113 | app/page.tsx:10556 | button | {`Open note from ${entry.date}`} | "entry-card-open" | "entry-card-open" → "entry-card" → "recent-entries" → "journal-layout" → "screen-section" | onClick |
| UI-0114 | app/page.tsx:10569 | button | {`Delete note from ${entry.date}`} | "delete-entry" | "delete-entry" → "entry-card" → "recent-entries" → "journal-layout" → "screen-section" | onClick |
| UI-0115 | app/page.tsx:10595 | SpaceCard | "Library" | (sin clase propia: control base) | "spaces-grid" → space === "menu" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" | onClick |
| UI-0116 | app/page.tsx:10603 | SpaceCard | "Class recordings" | (sin clase propia: control base) | "spaces-grid" → space === "menu" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" | onClick |
| UI-0117 | app/page.tsx:10611 | SpaceCard | "Calendar" | (sin clase propia: control base) | "spaces-grid" → space === "menu" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" | onClick |
| UI-0118 | app/page.tsx:10624 | StudyLibrary | (contenido dinámico) | (sin clase propia: control base) | space === "library" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } | onNotesChange, onDeleteNote, onOpenFile, onDeleteFile, onImportFiles, onPickDocuments, onPickImages, onCollectionsChange, onFilesChange, onRecordingsChange, onRequestedNoteOpened, onBack |
| UI-0119 | app/page.tsx:10718 | InnerHeader | "Inbox" | (sin clase propia: control base) | "feature-space inbox-space" → space === "inbox" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" | onBack |
| UI-0120 | app/page.tsx:10750 | button | { converted ? `Open saved ${destination}` : `Save as ${destination}` } | {converted ? "converted" : ""} | {converted ? "converted" : ""} → "inbox-convert-actions" → "inbox-item" | onClick |
| UI-0121 | app/page.tsx:10766 | button | discard | "inbox-discard" | "inbox-discard" → "inbox-convert-actions" → "inbox-item" → "inbox-list" → "feature-space inbox-space" | onClick |
| UI-0122 | app/page.tsx:10785 | InnerHeader | "Trash" | (sin clase propia: control base) | "feature-space trash-space" → space === "trash" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" | onBack |
| UI-0123 | app/page.tsx:10795 | button | Empty trash | "empty-trash-button" | "empty-trash-button" → "trash-space-toolbar" → "feature-space trash-space" → space === "trash" → "screen-section" | onClick |
| UI-0124 | app/page.tsx:10812 | button | Restore | (sin clase propia: control base) | "trash-list" → "feature-space trash-space" → space === "trash" → "screen-section" | onClick |
| UI-0125 | app/page.tsx:10815 | button | Delete forever | "danger" | "danger" → "trash-list" → "feature-space trash-space" → space === "trash" → "screen-section" | onClick |
| UI-0126 | app/page.tsx:10833 | InnerHeader | "Archived post-its" | (sin clase propia: control base) | "feature-space postit-archive-space" → space === "postit-archive" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" | onBack |
| UI-0127 | app/page.tsx:10850 | button | Restore | (sin clase propia: control base) | "trash-list" → "feature-space postit-archive-space" → space === "postit-archive" → "screen-section" | onClick |
| UI-0128 | app/page.tsx:10856 | button | Trash | "danger" | "danger" → "trash-list" → "feature-space postit-archive-space" → space === "postit-archive" → "screen-section" | onClick |
| UI-0129 | app/page.tsx:10870 | InnerHeader | "Recordings & notes" | (sin clase propia: control base) | space === "classes" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } | onBack |
| UI-0130 | app/page.tsx:10890 | button | { item.sourceType === "timetable" ? `Edit ${item.name} in class schedule` : `Edit ${item.name}` } | "class-icon-edit" | "class-icon-edit" → {`class-row ${ selectedClass === item.name ? "active" : "" }`} → "class-list card" → "classes-layout" → space === "classes" | onClick |
| UI-0131 | app/page.tsx:10913 | button | (contenido dinámico) | { selectedClass === item.name ? "class-item active" : "class-item" } | { selectedClass === item.name ? "class-item active" : "class-item" } → {`class-row ${ selectedClass === item.name ? "active" : "" }`} → "class-list card" → "classes-layout" → space === "classes" | onClick |
| UI-0132 | app/page.tsx:10940 | button | ＋ Add a class | "add-class" | "add-class" → "class-list card" → "classes-layout" → space === "classes" → "screen-section" | onClick |
| UI-0133 | app/page.tsx:10956 | button | Add my first class | (sin clase propia: control base) | "record-card card empty-class-card" → classItems.length === 0 → "recording-area" → "classes-layout" → space === "classes" | onClick |
| UI-0134 | app/page.tsx:10973 | input | "Recording name" | (sin clase propia: control base) | "record-fields" → "record-card card" → classItems.length === 0 → "recording-area" → "classes-layout" | onChange |
| UI-0135 | app/page.tsx:10979 | textarea | "Notes to keep beside this recording…" | (sin clase propia: control base) | "record-fields" → "record-card card" → classItems.length === 0 → "recording-area" → "classes-layout" | onChange |
| UI-0136 | app/page.tsx:10988 | button | (contenido dinámico) | {isRecording ? "record-button active" : "record-button"} | {isRecording ? "record-button active" : "record-button"} → "record-controls" → "record-card card" → classItems.length === 0 → "recording-area" | onClick |
| UI-0137 | app/page.tsx:11035 | button | (contenido dinámico) | (sin clase propia: control base) | "class-attached-items" → "class-materials card" | onClick |
| UI-0138 | app/page.tsx:11045 | button | (contenido dinámico) | (sin clase propia: control base) | "class-attached-items" → "class-materials card" | onClick |
| UI-0139 | app/page.tsx:11055 | button | 📝 | (sin clase propia: control base) | "class-attached-items" → "class-materials card" | onClick |
| UI-0140 | app/page.tsx:11073 | summary | Attach from Library | (sin clase propia: control base) | "class-material-pickers" → "class-materials card" → selectedClassItem → classItems.length === 0 → "recording-area" |  |
| UI-0141 | app/page.tsx:11094 | input | (contenido dinámico) | (sin clase propia: control base) | "entity-attachment-picker" → "class-material-pickers" → "class-materials card" | onChange |
| UI-0142 | app/page.tsx:11119 | summary | Attach a note | (sin clase propia: control base) | "class-material-pickers" → "class-materials card" → selectedClassItem → classItems.length === 0 → "recording-area" |  |
| UI-0143 | app/page.tsx:11131 | input | 📝 | (sin clase propia: control base) | "entity-attachment-picker" → "class-material-pickers" → "class-materials card" | onChange |
| UI-0144 | app/page.tsx:11180 | input | (contenido dinámico) | (sin clase propia: control base) | "recording-edit-fields" → editingRecordingId === recording.id → "audio-copy" → { editingRecordingId === recording.id ? "audio-item editing" : "audio-item" } → "recording-list" | onChange |
| UI-0145 | app/page.tsx:11192 | textarea | (contenido dinámico) | (sin clase propia: control base) | "recording-edit-fields" → editingRecordingId === recording.id → "audio-copy" → { editingRecordingId === recording.id ? "audio-item editing" : "audio-item" } → "recording-list" | onChange |
| UI-0146 | app/page.tsx:11203 | button | Save | (sin clase propia: control base) | "recording-edit-actions" → "recording-edit-fields" → editingRecordingId === recording.id → "audio-copy" → { editingRecordingId === recording.id ? "audio-item editing" : "audio-item" } | onClick |
| UI-0147 | app/page.tsx:11206 | button | Cancel | "recording-cancel" | "recording-cancel" → "recording-edit-actions" → "recording-edit-fields" → editingRecordingId === recording.id → "audio-copy" | onClick |
| UI-0148 | app/page.tsx:11212 | button | Delete | "recording-delete" | "recording-delete" → "recording-edit-actions" → "recording-edit-fields" → editingRecordingId === recording.id → "audio-copy" | onClick |
| UI-0149 | app/page.tsx:11226 | audio | (contenido dinámico) | (sin clase propia: control base) | recording.url → editingRecordingId === recording.id → "audio-copy" → { editingRecordingId === recording.id ? "audio-item editing" : "audio-item" } |  |
| UI-0150 | app/page.tsx:11239 | button | {`Edit ${recording.name}`} | "audio-edit-button" | "audio-edit-button" → editingRecordingId !== recording.id → { editingRecordingId === recording.id ? "audio-item editing" : "audio-item" } → "recording-list" | onClick |
| UI-0151 | app/page.tsx:11259 | InnerHeader | "A page for your ideas" | (sin clase propia: control base) | false && space === "sketchbook" → "screen-section" → activeTab === "spaces" → "main-content primary-swipe-surface" → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } | onBack |
| UI-0152 | app/page.tsx:11290 | button | (contenido dinámico) | {penTool === tool ? "active" : ""} | {penTool === tool ? "active" : ""} → "drawing-tool-toggle sketch-primary-tools" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0153 | app/page.tsx:11312 | button | (contenido dinámico) | {penTool === tool ? "active" : ""} | {penTool === tool ? "active" : ""} → "drawing-tool-toggle sketch-shape-tools" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0154 | app/page.tsx:11327 | button | Duplicate | (sin clase propia: control base) | "sketch-selection-actions" → selectedSketchStrokeIds.length > 0 → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0155 | app/page.tsx:11328 | button | Delete | (sin clase propia: control base) | "sketch-selection-actions" → selectedSketchStrokeIds.length > 0 → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0156 | app/page.tsx:11329 | button | Done | (sin clase propia: control base) | "sketch-selection-actions" → selectedSketchStrokeIds.length > 0 → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0157 | app/page.tsx:11336 | button | "Undo last stroke" | (sin clase propia: control base) | "sketch-history-controls" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onClick |
| UI-0158 | app/page.tsx:11343 | button | "Redo stroke" | (sin clase propia: control base) | "sketch-history-controls" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onClick |
| UI-0159 | app/page.tsx:11355 | button | Hold for straight line | {straightenOnHold ? "active" : ""} | {straightenOnHold ? "active" : ""} → "sketch-smart-tools" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0160 | app/page.tsx:11358 | button | Attach an image | (sin clase propia: control base) | "sketch-smart-tools" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onClick |
| UI-0161 | app/page.tsx:11361 | button | Scratch-out gesture | {scratchToErase ? "active" : ""} | {scratchToErase ? "active" : ""} → "sketch-smart-tools" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0162 | app/page.tsx:11364 | input | (contenido dinámico) | (sin clase propia: control base) | "sketch-smart-tools" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onChange |
| UI-0163 | app/page.tsx:11371 | button | (contenido dinámico) | (sin clase propia: control base) | "sketch-smart-tools" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onClick |
| UI-0164 | app/page.tsx:11399 | button | (contenido dinámico) | {pageStyle === id ? "active" : ""} | {pageStyle === id ? "active" : ""} → "page-style-grid" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0165 | app/page.tsx:11415 | button | {`Use ${color.label} paper`} | {sketchPageColor === color.value ? "active" : ""} | "page-color-grid" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0166 | app/page.tsx:11432 | input | "Choose a custom paper color" | (sin clase propia: control base) | { SKETCH_PAGE_COLORS.some((color) => color.value === sketchPageColor) ? "page-color-custom" : "page-color-custom active" } → "page-color-grid" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onChange |
| UI-0167 | app/page.tsx:11444 | select | (contenido dinámico) | (sin clase propia: control base) | "sketch-page-size" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onChange |
| UI-0168 | app/page.tsx:11468 | button | (contenido dinámico) | { sketchPageOrientation === orientation ? "active" : "" } | { sketchPageOrientation === orientation ? "active" : "" } → "page-orientation-toggle" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0169 | app/page.tsx:11499 | button | {`Use ${color} pen`} | {penColor === color ? "active" : ""} | "pen-colors" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0170 | app/page.tsx:11509 | input | "Choose a custom ink color" | (sin clase propia: control base) | "pen-color-custom" → "pen-colors" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onChange |
| UI-0171 | app/page.tsx:11521 | input | (contenido dinámico) | (sin clase propia: control base) | "pen-size" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onChange |
| UI-0172 | app/page.tsx:11534 | input | (contenido dinámico) | (sin clase propia: control base) | "pen-size stroke-stabilizer" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onChange |
| UI-0173 | app/page.tsx:11564 | button | Clear page | "clear-page" | "clear-page" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onClick |
| UI-0174 | app/page.tsx:11570 | button | (contenido dinámico) | "save-page" | "save-page" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onClick |
| UI-0175 | app/page.tsx:11580 | button | PNG | "download-page" | "download-page" → "sketch-export-card" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0176 | app/page.tsx:11586 | button | PDF | "download-page" | "download-page" → "sketch-export-card" → { sketchFullscreen ? `sketch-tools card floating-tools ${ sketchToolbarOpen ? "open" : "closed" }` : "sketch-tools card" } → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0177 | app/page.tsx:11598 | button | (contenido dinámico) | "sketch-exit-fullscreen" | "sketch-exit-fullscreen" → "sketch-fullscreen-topbar" → sketchFullscreen → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onPointerDown, onClick |
| UI-0178 | app/page.tsx:11611 | button | "Undo last stroke" | (sin clase propia: control base) | "sketch-fullscreen-actions" → "sketch-fullscreen-topbar" → sketchFullscreen → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0179 | app/page.tsx:11618 | button | "Redo stroke" | (sin clase propia: control base) | "sketch-fullscreen-actions" → "sketch-fullscreen-topbar" → sketchFullscreen → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0180 | app/page.tsx:11625 | button | { sketchToolbarOpen ? "Hide drawing tools" : "Show drawing tools" } | { sketchToolbarOpen ? "sketch-toolbar-toggle active" : "sketch-toolbar-toggle" } | { sketchToolbarOpen ? "sketch-toolbar-toggle active" : "sketch-toolbar-toggle" } → "sketch-fullscreen-actions" → "sketch-fullscreen-topbar" → sketchFullscreen → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } | onClick |
| UI-0181 | app/page.tsx:11647 | input | "Page title" | (sin clase propia: control base) | "notebook-top" → "notebook-wrap" → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" → "screen-section" | onChange |
| UI-0182 | app/page.tsx:11656 | button | (contenido dinámico) | "fullscreen-page-button" | "fullscreen-page-button" → "notebook-top" → "notebook-wrap" → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0183 | app/page.tsx:11675 | textarea | "Type something for this spot…" | (sin clase propia: control base) | "sketch-text-sheet" → sketchTextEditor → "notebook-wrap" → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onChange |
| UI-0184 | app/page.tsx:11682 | button | Cancel | (sin clase propia: control base) | "sketch-text-sheet" → sketchTextEditor → "notebook-wrap" → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0185 | app/page.tsx:11683 | button | Add to page | (sin clase propia: control base) | "sketch-text-sheet" → sketchTextEditor → "notebook-wrap" → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } → false && space === "sketchbook" | onClick |
| UI-0186 | app/page.tsx:11729 | canvas | "Drawing and handwriting canvas" | (sin clase propia: control base) | {`drawing-page ${pageStyle}`} → "sketch-zoom-stage" → "sketch-viewport" → "notebook-wrap" → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture |
| UI-0187 | app/page.tsx:11749 | button | "Zoom out" | (sin clase propia: control base) | "sketch-zoom-controls" → "sketch-fullscreen-bottombar" → sketchFullscreen → "notebook-wrap" → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } | onClick |
| UI-0188 | app/page.tsx:11759 | button | "Zoom in" | (sin clase propia: control base) | "sketch-zoom-controls" → "sketch-fullscreen-bottombar" → sketchFullscreen → "notebook-wrap" → { sketchFullscreen ? "sketch-layout sketch-fullscreen" : "sketch-layout" } | onClick |
| UI-0189 | app/page.tsx:11768 | button | Fit | "zoom-fit" | "zoom-fit" → "sketch-zoom-controls" → "sketch-fullscreen-bottombar" → sketchFullscreen → "notebook-wrap" | onClick |
| UI-0190 | app/page.tsx:11789 | button | ＋ New page | "text-button" | "text-button" → "section-heading" → "saved-sketches" → false && space === "sketchbook" → "screen-section" | onClick |
| UI-0191 | app/page.tsx:11824 | button | (contenido dinámico) | {`sketch-thumb ${paper.style}`} | {`sketch-thumb ${paper.style}`} → "sketch-gallery" → savedPages.length === 0 | onClick |
| UI-0192 | app/page.tsx:11835 | button | (contenido dinámico) | (sin clase propia: control base) | "sketch-gallery" → savedPages.length === 0 | onClick |
| UI-0193 | app/page.tsx:11839 | button | {`Delete ${page.title}`} | "delete-sketch" | "delete-sketch" → "sketch-gallery" → savedPages.length === 0 | onClick |
| UI-0194 | app/page.tsx:11866 | article | "Movable post-it. Hold to edit." | {`movable-post-it ${postIt.color} ${ selectedPostItIds.includes(postIt.id) ? "multi-selected" : "" }`} | {`movable-post-it ${postIt.color} ${ selectedPostItIds.includes(postIt.id) ? "multi-selected" : "" }`} → "post-it-layer" → !sketchFullscreen && visiblePostIts.length > 0 → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } → "app-shell" | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onKeyDown |
| UI-0195 | app/page.tsx:11900 | button | "Resize post-it" | "post-it-resize-handle" | {`movable-post-it ${postIt.color} ${ selectedPostItIds.includes(postIt.id) ? "multi-selected" : "" }`} → "post-it-layer" → !sketchFullscreen && visiblePostIts.length > 0 → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } → "app-shell" | onPointerDown, onPointerMove, onPointerUp, onPointerCancel |
| UI-0196 | app/page.tsx:11918 | button | { tab.id === "add" ? "Open Quick Capture" : tab.label } | {[ "nav-item", activeTab === tab.id ? "active" : "", tab.id === "add" ? "quick-capture-nav" : "", ].filter(Boolean).join(" ")} | {[ "nav-item", activeTab === tab.id ? "active" : "", tab.id === "add" ? "quick-capture-nav" : "", ].filter(Boolean).join(" ")} → "bottom-nav" → !sketchFullscreen → { sketchFullscreen ? "phone-canvas sketchbook-fullscreen-active" : "phone-canvas" } → "app-shell" | onClick |
| UI-0197 | app/page.tsx:11950 | Ao3LibraryOpening | (contenido dinámico) | (sin clase propia: control base) | ao3LibraryLaunching && !ao3LibraryOpen → "app-shell" | onBack |
| UI-0198 | app/page.tsx:11957 | Ao3Library | (contenido dinámico) | (sin clase propia: control base) | ao3LibraryOpen → "app-shell" | onBack, onSaveEpub |
| UI-0199 | app/page.tsx:11966 | div | (contenido dinámico) | "modal-backdrop aerea-hub-backdrop" | "modal-backdrop aerea-hub-backdrop" → aereaHubOpen → "app-shell" | onPointerDown |
| UI-0200 | app/page.tsx:11984 | button | "Close aérea spaces" | (sin clase propia: control base) | "aerea-hub-modal" → "modal-backdrop aerea-hub-backdrop" → aereaHubOpen → "app-shell" | onClick |
| UI-0201 | app/page.tsx:11993 | button | (contenido dinámico) | (sin clase propia: control base) | "aerea-hub-links" → "aerea-hub-modal" → "modal-backdrop aerea-hub-backdrop" → aereaHubOpen → "app-shell" | onClick |
| UI-0202 | app/page.tsx:12004 | button | (contenido dinámico) | (sin clase propia: control base) | "aerea-hub-links" → "aerea-hub-modal" → "modal-backdrop aerea-hub-backdrop" → aereaHubOpen → "app-shell" | onClick |
| UI-0203 | app/page.tsx:12015 | button | (contenido dinámico) | (sin clase propia: control base) | "aerea-hub-links" → "aerea-hub-modal" → "modal-backdrop aerea-hub-backdrop" → aereaHubOpen → "app-shell" | onClick |
| UI-0204 | app/page.tsx:12032 | div | (contenido dinámico) | "modal-backdrop quick-capture-backdrop" | "modal-backdrop quick-capture-backdrop" → quickCaptureOpen → "app-shell" | onPointerDown |
| UI-0205 | app/page.tsx:12052 | button | "Close Quick Capture" | (sin clase propia: control base) | "quick-capture-modal" → "modal-backdrop quick-capture-backdrop" → quickCaptureOpen → "app-shell" | onClick |
| UI-0206 | app/page.tsx:12060 | textarea | "Quick Capture text" | (sin clase propia: control base) | "quick-capture-modal" → "modal-backdrop quick-capture-backdrop" → quickCaptureOpen → "app-shell" | onChange, onKeyDown |
| UI-0207 | app/page.tsx:12076 | input | (contenido dinámico) | (sin clase propia: control base) | "quick-capture-file" → "quick-capture-modal" → "modal-backdrop quick-capture-backdrop" → quickCaptureOpen → "app-shell" | onChange |
| UI-0208 | app/page.tsx:12085 | button | × | (sin clase propia: control base) | quickCaptureFile → "quick-capture-file" → "quick-capture-modal" → "modal-backdrop quick-capture-backdrop" → quickCaptureOpen | onClick |
| UI-0209 | app/page.tsx:12092 | button | (contenido dinámico) | (sin clase propia: control base) | "quick-capture-modal" → "modal-backdrop quick-capture-backdrop" → quickCaptureOpen → "app-shell" | onClick |
| UI-0210 | app/page.tsx:12108 | div | (contenido dinámico) | "modal-backdrop task-link-backdrop" | "modal-backdrop task-link-backdrop" → taskLinkEditor → "app-shell" | onPointerDown |
| UI-0211 | app/page.tsx:12126 | button | "Close task editor" | (sin clase propia: control base) | "task-link-modal" → "modal-backdrop task-link-backdrop" → taskLinkEditor → "app-shell" | onClick |
| UI-0212 | app/page.tsx:12132 | input | (contenido dinámico) | (sin clase propia: control base) | "task-editor-basics" → "task-link-modal" → "modal-backdrop task-link-backdrop" → taskLinkEditor → "app-shell" | onChange |
| UI-0213 | app/page.tsx:12145 | input | (contenido dinámico) | (sin clase propia: control base) | "task-editor-basics" → "task-link-modal" → "modal-backdrop task-link-backdrop" → taskLinkEditor → "app-shell" | onChange |
| UI-0214 | app/page.tsx:12158 | textarea | (contenido dinámico) | (sin clase propia: control base) | "task-editor-notes" → "task-editor-basics" → "task-link-modal" → "modal-backdrop task-link-backdrop" → taskLinkEditor | onChange |
| UI-0215 | app/page.tsx:12178 | button | (contenido dinámico) | (sin clase propia: control base) | "task-linked-items" → (taskAttachedFileIds.length > 0 \|\| taskAttachedNoteIds.length > 0) → "task-link-modal" | onClick |
| UI-0216 | app/page.tsx:12195 | button | 📝 | (sin clase propia: control base) | "task-linked-items" → (taskAttachedFileIds.length > 0 \|\| taskAttachedNoteIds.length > 0) → "task-link-modal" | onClick |
| UI-0217 | app/page.tsx:12217 | input | (contenido dinámico) | (sin clase propia: control base) | "task-link-columns" → "task-link-modal" → "modal-backdrop task-link-backdrop" | onChange |
| UI-0218 | app/page.tsx:12229 | input | ＋ Import & attach a file | (sin clase propia: control base) | "task-link-create" → "task-link-columns" → "task-link-modal" → "modal-backdrop task-link-backdrop" → taskLinkEditor | onChange |
| UI-0219 | app/page.tsx:12250 | input | 📝 | (sin clase propia: control base) | "task-link-columns" → "task-link-modal" → "modal-backdrop task-link-backdrop" | onChange |
| UI-0220 | app/page.tsx:12270 | button | ＋ New attached note | "task-link-create" | "task-link-create" → "task-link-columns" → "task-link-modal" → "modal-backdrop task-link-backdrop" → taskLinkEditor | onClick |
| UI-0221 | app/page.tsx:12283 | button | Cancel | (sin clase propia: control base) | "task-editor-footer" → "task-link-modal" → "modal-backdrop task-link-backdrop" → taskLinkEditor → "app-shell" | onClick |
| UI-0222 | app/page.tsx:12284 | button | Save task | "primary" | "primary" → "task-editor-footer" → "task-link-modal" → "modal-backdrop task-link-backdrop" → taskLinkEditor | onClick |
| UI-0223 | app/page.tsx:12312 | button | Resend email | (sin clase propia: control base) | authCallbackStatus.kind === "error" → authCallbackStatus.kind !== "working" → "auth-callback-modal" → "modal-backdrop auth-callback-backdrop" → authCallbackStatus | onClick |
| UI-0224 | app/page.tsx:12322 | button | Continue | (sin clase propia: control base) | authCallbackStatus.kind !== "working" → "auth-callback-modal" → "modal-backdrop auth-callback-backdrop" → authCallbackStatus → "app-shell" | onClick |
| UI-0225 | app/page.tsx:12348 | button | "Close file" | (sin clase propia: control base) | "library-reader-header" → {`library-reader-modal ${ selectedLibraryItem.kind === "image" \|\| selectedLibraryItem.mimeType?.startsWith("image/") ? "library-image-viewer" : "" }`} → "modal-backdrop library-reader-backdrop" → selectedLibraryItem → "app-shell" | onClick |
| UI-0226 | app/page.tsx:12363 | img | (contenido dinámico) | (sin clase propia: control base) | libraryImageFailed → (selectedLibraryItem.nativeContentUri \|\| selectedLibraryItem.dataUrl) && (selectedLibraryI → "library-document-stage" → "library-reader-layout" → {`library-reader-modal ${ selectedLibraryItem.kind === "image" \|\| selectedLibraryItem.mimeType?.startsWith("image/") ? "library-image-viewer" : "" }`} | onLoad, onError |
| UI-0227 | app/page.tsx:12383 | button | (contenido dinámico) | {libraryPanel === panel ? "active" : ""} | {libraryPanel === panel ? "active" : ""} → "library-reader-panel" → "library-reader-layout" → {`library-reader-modal ${ selectedLibraryItem.kind === "image" \|\| selectedLibraryItem.mimeType?.startsWith("image/") ? "library-image-viewer" : "" }`} → "modal-backdrop library-reader-backdrop" | onClick |
| UI-0228 | app/page.tsx:12404 | button | Group it | (sin clase propia: control base) | "postit-multi-toolbar" → selectedPostItIds.length > 0 → "app-shell" | onClick |
| UI-0229 | app/page.tsx:12405 | button | Done | (sin clase propia: control base) | "postit-multi-toolbar" → selectedPostItIds.length > 0 → "app-shell" | onClick |
| UI-0230 | app/page.tsx:12411 | PdfStudyReader | (contenido dinámico) | (sin clase propia: control base) | activeStudyFile?.kind === "pdf" → "app-shell" | onAnnotationsChange, onPageNotesChange, onLocationChange, onClose |
| UI-0231 | app/page.tsx:12497 | EpubStudyReader | (contenido dinámico) | (sin clase propia: control base) | activeStudyFile?.kind === "epub" && activeEpubBook → "app-shell" | onReadingStateChange, onClose |
| UI-0232 | app/page.tsx:12570 | button | (contenido dinámico) | "study-reader-message" | "study-reader-message" → studyReaderMessage → "app-shell" | onClick |
| UI-0233 | app/page.tsx:12619 | button | {editingEventId ? "Close event editor and return home" : "Back to calendar"} | "event-editor-back" | "event-editor-back" → "event-editor-top" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} | onClick |
| UI-0234 | app/page.tsx:12646 | button | Save | "event-save-button" | "event-save-button" → eventDraftIsTimetableClass → "event-editor-top" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0235 | app/page.tsx:12657 | form | (contenido dinámico) | {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} | {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} → calendarOpen | onSubmit |
| UI-0236 | app/page.tsx:12689 | button | Edit class schedule | (sin clase propia: control base) | "timetable-linked-event-card" → eventDraftIsTimetableClass → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0237 | app/page.tsx:12704 | input | "What are you planning?" | (sin clase propia: control base) | "event-title-input" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onChange |
| UI-0238 | app/page.tsx:12722 | button | {`Copy settings from ${suggestion.title}`} | (sin clase propia: control base) | "event-title-suggestions" → eventTitleSuggestions.length > 0 → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} | onClick |
| UI-0239 | app/page.tsx:12752 | select | (contenido dinámico) | (sin clase propia: control base) | "event-row" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0240 | app/page.tsx:12774 | button | Edit event types | "event-category-manage-button" | "event-category-manage-button" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onClick |
| UI-0241 | app/page.tsx:12785 | input | (contenido dinámico) | (sin clase propia: control base) | "event-row switch-row" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0242 | app/page.tsx:12797 | input | (contenido dinámico) | (sin clase propia: control base) | "event-dates" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0243 | app/page.tsx:12813 | input | (contenido dinámico) | (sin clase propia: control base) | !eventDraft.allDay → "event-dates" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} | onChange |
| UI-0244 | app/page.tsx:12824 | input | (contenido dinámico) | (sin clase propia: control base) | "event-dates" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0245 | app/page.tsx:12837 | input | (contenido dinámico) | (sin clase propia: control base) | !eventDraft.allDay → "event-dates" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} | onChange |
| UI-0246 | app/page.tsx:12860 | input | (contenido dinámico) | (sin clase propia: control base) | "event-row switch-row" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0247 | app/page.tsx:12886 | button | {color.label} | { eventDraft.color === color.value ? "active" : "" } | { eventDraft.color === color.value ? "active" : "" } → "event-color-palette" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} | onClick |
| UI-0248 | app/page.tsx:12908 | input | "Add names or emails" | (sin clase propia: control base) | "event-row" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0249 | app/page.tsx:12922 | select | (contenido dinámico) | (sin clase propia: control base) | "event-row" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0250 | app/page.tsx:12943 | select | (contenido dinámico) | (sin clase propia: control base) | "event-option" → "event-editor-card event-options-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0251 | app/page.tsx:12963 | input | (contenido dinámico) | (sin clase propia: control base) | "custom-repeat" → eventDraft.repeat === "Custom" → "event-editor-card event-options-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} | onChange |
| UI-0252 | app/page.tsx:12974 | select | (contenido dinámico) | (sin clase propia: control base) | "custom-repeat" → eventDraft.repeat === "Custom" → "event-editor-card event-options-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} | onChange |
| UI-0253 | app/page.tsx:12995 | input | (contenido dinámico) | (sin clase propia: control base) | "event-option day-counter-option" → "event-editor-card event-options-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0254 | app/page.tsx:13006 | input | "Add a place" | (sin clase propia: control base) | "event-option" → "event-editor-card event-options-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0255 | app/page.tsx:13017 | input | "https://" | (sin clase propia: control base) | "event-option" → "event-editor-card event-options-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0256 | app/page.tsx:13031 | textarea | "Anything you want to remember…" | (sin clase propia: control base) | "event-note-field" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0257 | app/page.tsx:13043 | input | "Add a small step" | (sin clase propia: control base) | "event-todo-field" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0258 | app/page.tsx:13048 | button | Add | (sin clase propia: control base) | "event-todo-field" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onClick |
| UI-0259 | app/page.tsx:13067 | button | (contenido dinámico) | "event-todo-item" | "event-todo-item" → "event-todo-field" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} | onClick |
| UI-0260 | app/page.tsx:13095 | input | (contenido dinámico) | (sin clase propia: control base) | "event-file-field" → "event-editor-card" → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} → eventEditorOpen | onChange |
| UI-0261 | app/page.tsx:13137 | input | (contenido dinámico) | (sin clase propia: control base) | "event-existing-attachments" → libraryItems.length + studyFiles.length > 0 | onChange |
| UI-0262 | app/page.tsx:13174 | input | (contenido dinámico) | (sin clase propia: control base) | "event-existing-attachments related-content-picker" → (entries.length > 0 \|\| studyNotes.length > 0 \|\| recordings.length > 0) | onChange |
| UI-0263 | app/page.tsx:13195 | input | (contenido dinámico) | (sin clase propia: control base) | "event-existing-attachments related-content-picker" → (entries.length > 0 \|\| studyNotes.length > 0 \|\| recordings.length > 0) | onChange |
| UI-0264 | app/page.tsx:13216 | input | (contenido dinámico) | (sin clase propia: control base) | "event-existing-attachments related-content-picker" → (entries.length > 0 \|\| studyNotes.length > 0 \|\| recordings.length > 0) | onChange |
| UI-0265 | app/page.tsx:13240 | button | Save event | "mobile-event-save" | "mobile-event-save" → "mobile-event-actions" → !eventDraftIsTimetableClass → "event-editor-editable-fields" → {`event-editor ${ eventDraftIsTimetableClass ? "timetable-source-event" : "" }`} |  |
| UI-0266 | app/page.tsx:13248 | button | Delete | "mobile-event-delete" | "mobile-event-delete" → editingEventId → "mobile-event-actions" → !eventDraftIsTimetableClass → "event-editor-editable-fields" | onClick |
| UI-0267 | app/page.tsx:13289 | button | {brandOpensAo3 ? "Open My AO3 Library" : "Open aérea spaces"} | "brand-wrap" | "brand-wrap" → "topbar agenda-v2-homebar" → calendarScheduleOpen → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0268 | app/page.tsx:13308 | button | "Back to compact calendar" | "calendar-button" | "calendar-button" → "header-actions" → "topbar agenda-v2-homebar" → calendarScheduleOpen → eventEditorOpen | onClick |
| UI-0269 | app/page.tsx:13320 | button | "Open appearance settings" | "avatar-button" | "avatar-button" → "header-actions" → "topbar agenda-v2-homebar" → calendarScheduleOpen → eventEditorOpen | onClick |
| UI-0270 | app/page.tsx:13355 | button | "Back to compact month" | "extended-compact-button extended-back-button" | "extended-compact-button extended-back-button" → "extended-calendar-header" → "extended-calendar-view" → calendarExpanded → eventEditorOpen | onClick |
| UI-0271 | app/page.tsx:13373 | button | (contenido dinámico) | "extended-calendar-title" | "extended-calendar-title" → "extended-calendar-month" → "extended-calendar-heading-copy" → "extended-calendar-header" → "extended-calendar-view" | onClick |
| UI-0272 | app/page.tsx:13392 | button | "Open day schedule" | "extended-schedule-button" | "extended-schedule-button" → "extended-calendar-header-actions" → "extended-calendar-header" → "extended-calendar-view" → calendarExpanded | onClick |
| UI-0273 | app/page.tsx:13405 | button | "Edit visible event types" | "extended-filter-control" | "extended-filter-control" → "extended-calendar-header-actions" → "extended-calendar-header" → "extended-calendar-view" → calendarExpanded | onClick |
| UI-0274 | app/page.tsx:13425 | button | (contenido dinámico) | {month === calendarMonth ? "active" : ""} | {month === calendarMonth ? "active" : ""} → "extended-calendar-picker" → monthPickerOpen → "extended-calendar-view" → calendarExpanded | onClick |
| UI-0275 | app/page.tsx:13447 | button | (contenido dinámico) | {`source-${index % 4} ${hidden ? "muted" : "active"}`} | {`source-${index % 4} ${hidden ? "muted" : "active"}`} → "extended-filter-list" → "extended-calendar-filters" → "extended-calendar-view" → calendarExpanded | onClick |
| UI-0276 | app/page.tsx:13468 | button | Show all | "extended-filter-show-all" | "extended-filter-show-all" → hiddenCalendarSources.length > 0 → "extended-filter-list" → "extended-calendar-filters" → "extended-calendar-view" | onClick |
| UI-0277 | app/page.tsx:13477 | button | "Edit event types" | "extended-filter-menu" | "extended-filter-menu" → "extended-calendar-filters" → "extended-calendar-view" → calendarExpanded → eventEditorOpen | onClick |
| UI-0278 | app/page.tsx:13488 | div | "Extended calendar month. Swipe left or right to change month." | {[ "extended-month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} | {[ "extended-month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} → "extended-calendar-view" → calendarExpanded → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onAnimationEnd, onTouchStart, onTouchEnd |
| UI-0279 | app/page.tsx:13524 | div | {`${readableDate(dayKey)}, ${dayEvents.length} events`} | {[ "extended-calendar-cell", currentMonth ? "" : "outside-month", previousMonth ? "previous-month month-spillover" : "", nextMonth ? "month-spillover" : "", selectedCalendarDate === dayKey ? "selected" : "", date.getDay() === 0 \|\| date.getDay() === 6 ? "weekend" : "", date.getDay() === 0 ? "sunday" : "", date.getDay() === 6 ? "saturday" : "", dayKey === todayKey ? "today" : "", calendarDragTarget === dayKey ? "drag-target" : "", ] .filter(Boolean) .join(" ")} | {[ "extended-calendar-cell", currentMonth ? "" : "outside-month", previousMonth ? "previous-month month-spillover" : "", nextMonth ? "month-spillover" : "", selectedCalendarDate === dayKey ? "selected" : "", date.getDay() === 0 \|\| date.getDay() === 6 ? "weekend" : "", date.getDay() === 0 ? "sunday" : "", date.getDay() === 6 ? "saturday" : "", dayKey === todayKey ? "today" : "", calendarDragTarget === dayKey ? "drag-target" : "", ] .filter(Boolean) .join(" ")} → {[ "extended-month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} → "extended-calendar-view" → calendarExpanded | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onClick, onKeyDown |
| UI-0280 | app/page.tsx:13559 | button | {`${calendarEvent.title} · ${eventStartTimeLabel(calendarEvent)}`} | {`extended-event-pill ${eventDisplayColor(calendarEvent, dayKey)} ${ isFootballVisualEvent(calendarEvent) ? "canonical-boca-match" : "" }`} | {`extended-event-pill ${eventDisplayColor(calendarEvent, dayKey)} ${ isFootballVisualEvent(calendarEvent) ? "canonical-boca-match" : "" }`} → "extended-calendar-events" → {[ "extended-calendar-cell", currentMonth ? "" : "outside-month", previousMonth ? "previous-month month-spillover" : "", nextMonth ? "month-spillover" : "", selectedCalendarDate === dayKey ? "selected" : "", date.getDay() === 0 \|\| date.getDay() === 6 ? "weekend" : "", date.getDay() === 0 ? "sunday" : "", date.getDay() === 6 ? "saturday" : "", dayKey === todayKey ? "today" : "", calendarDragTarget === dayKey ? "drag-target" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0281 | app/page.tsx:13592 | button | (contenido dinámico) | {tab.id === activeTab ? "active" : ""} | {tab.id === activeTab ? "active" : ""} → "extended-calendar-nav" → "extended-calendar-view" → calendarExpanded | onClick |
| UI-0282 | app/page.tsx:13612 | button | "Previous month" | (sin clase propia: control base) | "calendar-month-heading" → "modal-top" → !calendarExpanded && !calendarScheduleOpen → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0283 | app/page.tsx:13615 | button | "Choose month and year" | "calendar-date-menu-trigger" | "calendar-date-menu-trigger" → "calendar-month-heading" → "modal-top" → !calendarExpanded && !calendarScheduleOpen → eventEditorOpen | onClick |
| UI-0284 | app/page.tsx:13628 | button | "Next month" | (sin clase propia: control base) | "calendar-month-heading" → "modal-top" → !calendarExpanded && !calendarScheduleOpen → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0285 | app/page.tsx:13637 | button | (contenido dinámico) | {month === calendarMonth ? "active" : ""} | {month === calendarMonth ? "active" : ""} → "calendar-date-menu-list" → "calendar-date-menu-columns" → "calendar-date-menu" → monthPickerOpen && !calendarExpanded && !calendarScheduleOpen | onClick |
| UI-0286 | app/page.tsx:13649 | button | (contenido dinámico) | {year === calendarYear ? "active" : ""} | {year === calendarYear ? "active" : ""} → "calendar-date-menu-list years" → "calendar-date-menu-columns" → "calendar-date-menu" → monthPickerOpen && !calendarExpanded && !calendarScheduleOpen | onClick |
| UI-0287 | app/page.tsx:13660 | button | Done | "calendar-date-menu-done" | "calendar-date-menu-done" → "calendar-date-menu" → monthPickerOpen && !calendarExpanded && !calendarScheduleOpen → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0288 | app/page.tsx:13673 | button | Today | "calendar-today-shortcut" | "calendar-today-shortcut" → !calendarScheduleOpen && selectedCalendarDate !== todayKey → "calendar-sources" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0289 | app/page.tsx:13681 | button | "Search calendar events" | "calendar-search-trigger" | "calendar-search-trigger" → "calendar-sources" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} | onClick |
| UI-0290 | app/page.tsx:13695 | section | "Search calendar events" | "calendar-search-screen" | "calendar-search-screen" → calendarSearchOpen && !calendarExpanded && !calendarScheduleOpen → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} | onKeyDown |
| UI-0291 | app/page.tsx:13706 | button | "Back to compact calendar" | "calendar-search-back" | "calendar-search-back" → "calendar-search-header" → "calendar-search-screen" → calendarSearchOpen && !calendarExpanded && !calendarScheduleOpen → eventEditorOpen | onClick |
| UI-0292 | app/page.tsx:13717 | CalendarSearchField | (contenido dinámico) | (sin clase propia: control base) | "calendar-search-header" → "calendar-search-screen" → calendarSearchOpen && !calendarExpanded && !calendarScheduleOpen → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onValueChange |
| UI-0293 | app/page.tsx:13777 | button | (contenido dinámico) | "calendar-search-result" | "calendar-search-result" → "calendar-search-group" → calendarSearchGroups.length === 0 | onClick |
| UI-0294 | app/page.tsx:13830 | div | "Week. Swipe left or right to change week." | "agenda-v2-week" | "agenda-v2-week" → "agenda-v2" → calendarScheduleOpen → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onTouchStart, onTouchEnd |
| UI-0295 | app/page.tsx:13836 | div | (contenido dinámico) | {[ "agenda-v2-week-content", scheduleSlideDirection ? `schedule-slide-${scheduleSlideDirection}` : "", ].filter(Boolean).join(" ")} | {[ "agenda-v2-week-content", scheduleSlideDirection ? `schedule-slide-${scheduleSlideDirection}` : "", ].filter(Boolean).join(" ")} → "agenda-v2-week" → "agenda-v2" → calendarScheduleOpen → eventEditorOpen | onAnimationEnd |
| UI-0296 | app/page.tsx:13846 | button | "Previous week" | "agenda-v2-week-arrow" | "agenda-v2-week-arrow" → {[ "agenda-v2-week-content", scheduleSlideDirection ? `schedule-slide-${scheduleSlideDirection}` : "", ].filter(Boolean).join(" ")} → "agenda-v2-week" → "agenda-v2" → calendarScheduleOpen | onClick |
| UI-0297 | app/page.tsx:13858 | button | (contenido dinámico) | {[ selectedCalendarDate === dateKey ? "selected" : "", todayKey === dateKey ? "today" : "", ].filter(Boolean).join(" ")} | {[ selectedCalendarDate === dateKey ? "selected" : "", todayKey === dateKey ? "today" : "", ].filter(Boolean).join(" ")} → "agenda-v2-days" → {[ "agenda-v2-week-content", scheduleSlideDirection ? `schedule-slide-${scheduleSlideDirection}` : "", ].filter(Boolean).join(" ")} → "agenda-v2-week" → "agenda-v2" | onClick |
| UI-0298 | app/page.tsx:13874 | button | "Next week" | "agenda-v2-week-arrow" | "agenda-v2-week-arrow" → {[ "agenda-v2-week-content", scheduleSlideDirection ? `schedule-slide-${scheduleSlideDirection}` : "", ].filter(Boolean).join(" ")} → "agenda-v2-week" → "agenda-v2" → calendarScheduleOpen | onClick |
| UI-0299 | app/page.tsx:13889 | button | {`Open ${selectedScheduleIsToday ? "today’s" : `${selectedScheduleWeekday}’s`} schedule full screen`} | "agenda-v2-heading-trigger" | "agenda-v2-heading-trigger" → "agenda-v2-heading-copy" → "section-heading agenda-v2-section-heading" → "agenda-v2" → calendarScheduleOpen | onClick |
| UI-0300 | app/page.tsx:13909 | button | Return to today | "text-button agenda-v2-return-today" | "text-button agenda-v2-return-today" → !selectedScheduleIsToday → "agenda-v2-heading-actions" → "section-heading agenda-v2-section-heading" → "agenda-v2" | onClick |
| UI-0301 | app/page.tsx:13917 | button | {`Add an event to ${readableDate(selectedCalendarDate)}`} | "agenda-v2-quick-add" | "agenda-v2-quick-add" → "agenda-v2-heading-actions" → "section-heading agenda-v2-section-heading" → "agenda-v2" → calendarScheduleOpen | onClick |
| UI-0302 | app/page.tsx:13930 | div | (contenido dinámico) | "agenda-v2-focus-backdrop" | scheduleFocusOpen → "agenda-v2" → calendarScheduleOpen → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} | onClick |
| UI-0303 | app/page.tsx:13966 | button | (contenido dinámico) | {`agenda-v2-all-day-event ${eventDisplayColor(event, selectedCalendarDate)} ${isFootballVisualEvent(event) ? "canonical-boca-match" : ""}`.trim()} | {`agenda-v2-all-day-event ${eventDisplayColor(event, selectedCalendarDate)} ${isFootballVisualEvent(event) ? "canonical-boca-match" : ""}`.trim()} → "selected" → "agenda-v2-all-day-list agenda-v2-pending-time-list" → selectedSchedulePendingTimeEvents.length > 0 | onClick |
| UI-0304 | app/page.tsx:13988 | button | (contenido dinámico) | {`agenda-v2-all-day-event ${eventDisplayColor(event, selectedCalendarDate)}`} | {`agenda-v2-all-day-event ${eventDisplayColor(event, selectedCalendarDate)}`} → "selected" → "agenda-v2-all-day-list" → selectedScheduleAllDayEvents.length > 0 | onClick |
| UI-0305 | app/page.tsx:14034 | div | {`Full-day schedule for ${readableDate(selectedCalendarDate)}. Tap an empty time to add an event.`} | {[ "agenda-v2-day", "selected", selectedCalendarDate === todayKey ? "today" : "", ].filter(Boolean).join(" ")} | {[ "agenda-v2-day", "selected", selectedCalendarDate === todayKey ? "today" : "", ].filter(Boolean).join(" ")} → "agenda-v2-day-wrap" → "agenda-v2-timeline" → "agenda-v2-scroll" → selectedScheduleAgendaEvents.length === 0 | onClick |
| UI-0306 | app/page.tsx:14070 | button | (contenido dinámico) | {`agenda-v2-event ${eventDisplayColor(event, selectedCalendarDate)} ${densityClass} ${laneCount > 1 ? "is-overlap" : ""} ${previewMinute !== null ? "is-dragging" : ""} ${isFootballVisualEvent(event) ? "canonical-boca-match" : ""}`.trim()} | {`agenda-v2-event ${eventDisplayColor(event, selectedCalendarDate)} ${densityClass} ${laneCount > 1 ? "is-overlap" : ""} ${previewMinute !== null ? "is-dragging" : ""} ${isFootballVisualEvent(event) ? "canonical-boca-match" : ""}`.trim()} → {[ "agenda-v2-day", "selected", selectedCalendarDate === todayKey ? "today" : "", ].filter(Boolean).join(" ")} → "agenda-v2-day-wrap" → "agenda-v2-timeline" → "agenda-v2-scroll" | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick |
| UI-0307 | app/page.tsx:14152 | button | {tab.id === "add" ? "Open Quick Capture" : tab.label} | {[ "nav-item", tab.id === activeTab ? "active" : "", tab.id === "add" ? "quick-capture-nav" : "", ].filter(Boolean).join(" ")} | {[ "nav-item", tab.id === activeTab ? "active" : "", tab.id === "add" ? "quick-capture-nav" : "", ].filter(Boolean).join(" ")} → "bottom-nav agenda-v2-home-nav" → "agenda-v2" → calendarScheduleOpen | onClick |
| UI-0308 | app/page.tsx:14179 | div | "Calendar month. Swipe left or right to change month." | {[ "month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} | {[ "month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} → "month-grid-viewport" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} | onAnimationEnd, onTouchStart, onTouchEnd |
| UI-0309 | app/page.tsx:14219 | button | (contenido dinámico) | {[ currentMonth ? "" : "outside-month", selectedCalendarDate === dayKey ? "selected" : "", dayEvents.length > 0 ? "has-event" : "", dayMarker ? "has-mood" : "", dayComplete ? "day-complete" : "", date.getDay() === 0 \|\| date.getDay() === 6 ? "weekend" : "", dayKey === todayKey ? "today" : "", calendarDragTarget === dayKey ? "drag-target" : "", ] .filter(Boolean) .join(" ")} | {[ currentMonth ? "" : "outside-month", selectedCalendarDate === dayKey ? "selected" : "", dayEvents.length > 0 ? "has-event" : "", dayMarker ? "has-mood" : "", dayComplete ? "day-complete" : "", date.getDay() === 0 \|\| date.getDay() === 6 ? "weekend" : "", dayKey === todayKey ? "today" : "", calendarDragTarget === dayKey ? "drag-target" : "", ] .filter(Boolean) .join(" ")} → {[ "month-grid", calendarSlideDirection ? `calendar-slide-${calendarSlideDirection}` : "", ] .filter(Boolean) .join(" ")} → "month-grid-viewport" → eventEditorOpen | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onClick |
| UI-0310 | app/page.tsx:14311 | button | ＋ Add event | (sin clase propia: control base) | "selected-day-heading" → "selected-day-panel" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} | onClick |
| UI-0311 | app/page.tsx:14316 | DayMarkerPicker | (contenido dinámico) | (sin clase propia: control base) | "selected-day-panel" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} → calendarOpen | onSelect, onClear |
| UI-0312 | app/page.tsx:14354 | button | (contenido dinámico) | (sin clase propia: control base) | {[ "day-completion-control", selectedDayComplete ? "complete" : "", ] .filter(Boolean) .join(" ")} → "selected-day-panel" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} | onClick |
| UI-0313 | app/page.tsx:14380 | article | (contenido dinámico) | {`event-chip ${eventDisplayColor(calendarEvent, selectedCalendarDate)} ${ calendarEvent.eventType === "sports_event" ? "sports-event" : "" } ${ isFootballVisualEvent(calendarEvent) ? "canonical-boca-match" : "" }`} | {`event-chip ${eventDisplayColor(calendarEvent, selectedCalendarDate)} ${ calendarEvent.eventType === "sports_event" ? "sports-event" : "" } ${ isFootballVisualEvent(calendarEvent) ? "canonical-boca-match" : "" }`} → "selected-day-events" → selectedDateEvents.length === 0 → "selected-day-panel" | onPointerDown, onPointerMove, onPointerUp, onPointerCancel |
| UI-0314 | app/page.tsx:14400 | button | {`Open ${calendarEvent.title}`} | "event-chip-main" | "event-chip-main" → {`event-chip ${eventDisplayColor(calendarEvent, selectedCalendarDate)} ${ calendarEvent.eventType === "sports_event" ? "sports-event" : "" } ${ isFootballVisualEvent(calendarEvent) ? "canonical-boca-match" : "" }`} → "selected-day-events" → selectedDateEvents.length === 0 → "selected-day-panel" | onClick |
| UI-0315 | app/page.tsx:14436 | button | {`Delete ${calendarEvent.title}`} | "event-chip-delete" | "event-chip-delete" → calendarEvent.eventType !== "sports_event" && calendarEvent.sourceType !== "timetable" → {`event-chip ${eventDisplayColor(calendarEvent, selectedCalendarDate)} ${ calendarEvent.eventType === "sports_event" ? "sports-event" : "" } ${ isFootballVisualEvent(calendarEvent) ? "canonical-boca-match" : "" }`} → "selected-day-events" → selectedDateEvents.length === 0 | onClick |
| UI-0316 | app/page.tsx:14455 | button | Add something to | "calendar-add-large" | "calendar-add-large" → eventEditorOpen → {[ "calendar-modal", eventEditorOpen ? "calendar-event-mode" : "", eventEditorOpen ? "event-editor-themed" : "", calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "", calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "", calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "", ] .filter(Boolean) .join(" ")} → {[ "modal-backdrop", "calendar-backdrop", calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "", calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "", ].filter(Boolean).join(" ")} → calendarOpen | onClick |
| UI-0317 | app/page.tsx:14469 | div | (contenido dinámico) | "modal-backdrop category-editor-backdrop" | "modal-backdrop category-editor-backdrop" → categoryEditorOpen → "app-shell" | onPointerDown |
| UI-0318 | app/page.tsx:14488 | button | "Close event type editor" | (sin clase propia: control base) | "category-editor-modal" → "modal-backdrop category-editor-backdrop" → categoryEditorOpen → "app-shell" | onClick |
| UI-0319 | app/page.tsx:14515 | button | Edit | (sin clase propia: control base) | {editingCategoryId === category.id ? "editing" : ""} → "category-editor-list" → "category-editor-modal" → "modal-backdrop category-editor-backdrop" → categoryEditorOpen | onClick |
| UI-0320 | app/page.tsx:14521 | button | {`Delete ${category.name}`} | "category-delete" | "category-delete" → {editingCategoryId === category.id ? "editing" : ""} → "category-editor-list" → "category-editor-modal" → "modal-backdrop category-editor-backdrop" | onClick |
| UI-0321 | app/page.tsx:14533 | form | (contenido dinámico) | "category-editor-form" | "category-editor-form" → "category-editor-modal" → "modal-backdrop category-editor-backdrop" → categoryEditorOpen → "app-shell" | onSubmit |
| UI-0322 | app/page.tsx:14543 | button | ＋ New instead | (sin clase propia: control base) | editingCategoryId → "category-editor-form-heading" → "category-editor-form" → "category-editor-modal" → "modal-backdrop category-editor-backdrop" | onClick |
| UI-0323 | app/page.tsx:14550 | input | "Work, birthdays, appointments…" | (sin clase propia: control base) | "category-editor-form" → "category-editor-modal" → "modal-backdrop category-editor-backdrop" → categoryEditorOpen → "app-shell" | onChange |
| UI-0324 | app/page.tsx:14565 | button | {color.label} | {categoryDraft.color === color.value ? "active" : ""} | "category-editor-form" → "category-editor-modal" → "modal-backdrop category-editor-backdrop" → categoryEditorOpen → "app-shell" | onClick |
| UI-0325 | app/page.tsx:14586 | button | (contenido dinámico) | "category-save" | "category-save" → "category-editor-form" → "category-editor-modal" → "modal-backdrop category-editor-backdrop" → categoryEditorOpen |  |
| UI-0326 | app/page.tsx:14599 | div | (contenido dinámico) | "modal-backdrop day-summary-backdrop" | "modal-backdrop day-summary-backdrop" → daySummaryDate → "app-shell" | onPointerDown |
| UI-0327 | app/page.tsx:14606 | button | "Close day summary" | "day-summary-close" | "day-summary-close" → "day-summary-card" → "modal-backdrop day-summary-backdrop" → daySummaryDate | onClick |
| UI-0328 | app/page.tsx:14622 | article | (contenido dinámico) | {[ "day-summary-event", eventDisplayColor(event, daySummaryDate), hasDetails ? "expanded" : "compact", isHealthCompletionEvent(event) ? "health-completion-card" : "", event.sportsCardStyle ? "match-day-pocket-card" : "", isFootballVisualEvent(event) ? "canonical-boca-match" : "", ].filter(Boolean).join(" ")} | {[ "day-summary-event", eventDisplayColor(event, daySummaryDate), hasDetails ? "expanded" : "compact", isHealthCompletionEvent(event) ? "health-completion-card" : "", event.sportsCardStyle ? "match-day-pocket-card" : "", isFootballVisualEvent(event) ? "canonical-boca-match" : "", ].filter(Boolean).join(" ")} → "day-summary-events" → summaryEvents.length === 0 → "day-summary-card" | onClick, onKeyDown |
| UI-0329 | app/page.tsx:14671 | button | {`${ isHealthCompletedOn(event, daySummaryDate) ? "Mark incomplete" : "Mark complete" }: ${event.title}`} | {`health-completion-toggle ${ isHealthCompletedOn(event, daySummaryDate) ? "active" : "" }`.trim()} | {`health-completion-toggle ${ isHealthCompletedOn(event, daySummaryDate) ? "active" : "" }`.trim()} → "day-summary-health-heading" → isHealthCompletionEvent(event) → isFootballVisualEvent(event) → {[ "day-summary-event", eventDisplayColor(event, daySummaryDate), hasDetails ? "expanded" : "compact", isHealthCompletionEvent(event) ? "health-completion-card" : "", event.sportsCardStyle ? "match-day-pocket-card" : "", isFootballVisualEvent(event) ? "canonical-boca-match" : "", ].filter(Boolean).join(" ")} | onClick |
| UI-0330 | app/page.tsx:14725 | button | (contenido dinámico) | "day-summary-add" | "day-summary-add" → "day-summary-card" → "modal-backdrop day-summary-backdrop" → daySummaryDate → "app-shell" | onClick |
| UI-0331 | app/page.tsx:14743 | NoteDetailDialog | (contenido dinámico) | (sin clase propia: control base) | selectedJournalEntry → "app-shell" | onClose, onSave, onDelete |
| UI-0332 | app/page.tsx:14833 | div | (contenido dinámico) | "modal-backdrop event-detail-backdrop football-match-detail-backdrop" | "modal-backdrop event-detail-backdrop football-match-detail-backdrop" → selectedFootballMatch → "app-shell" | onPointerDown |
| UI-0333 | app/page.tsx:14850 | button | "Close match details" | (sin clase propia: control base) | "event-detail-header" → "event-detail-note football-match-detail little-sheet-detail-card little-sheet-detail-match" → "modal-backdrop event-detail-backdrop football-match-detail-backdrop" → selectedFootballMatch | onClick |
| UI-0334 | app/page.tsx:14858 | button | "Return to Daily Pocket" | "event-detail-back" | "event-detail-back" → eventDetailReturnDayPocket → "event-detail-category-row" → "football-match-detail-heading" → "event-detail-note football-match-detail little-sheet-detail-card little-sheet-detail-match" | onClick |
| UI-0335 | app/page.tsx:14919 | div | (contenido dinámico) | "modal-backdrop event-detail-backdrop" | "modal-backdrop event-detail-backdrop" → selectedEventDetail → "app-shell" | onPointerDown |
| UI-0336 | app/page.tsx:14928 | section | {`Details for ${selectedEventDetail.title}`} | {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} | {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" → selectedEventDetail → "app-shell" | onClickCapture, onKeyDownCapture |
| UI-0337 | app/page.tsx:14973 | button | "Close event details" | (sin clase propia: control base) | "event-detail-header" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" → selectedEventDetail | onClick |
| UI-0338 | app/page.tsx:14986 | button | {`Back to Day Pocket for ${readableDate(eventDetailReturnDayPocket)}`} | "event-detail-back" | "event-detail-back" → eventDetailReturnDayPocket → "event-detail-category-row" → "event-detail-heading-copy" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} | onClick |
| UI-0339 | app/page.tsx:15001 | h2 | (contenido dinámico) | "event-detail-title" | "event-detail-title" → "event-detail-heading-copy" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" → selectedEventDetail |  |
| UI-0340 | app/page.tsx:15035 | button | {`${ isHealthCompletedOn( selectedEventDetail, selectedEventDetail.date, ) ? "Mark incomplete" : "Mark complete" }: ${selectedEventDetail.title}`} | (sin clase propia: control base) | {`event-detail-health-completion ${ isHealthCompletedOn( selectedEventDetail, selectedEventDetail.date, ) ? "complete" : "" }`.trim()} → isHealthCompletionEvent(selectedEventDetail) → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" | onClick |
| UI-0341 | app/page.tsx:15062 | div | (contenido dinámico) | "event-detail-time" | "event-detail-time" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" → selectedEventDetail → "app-shell" |  |
| UI-0342 | app/page.tsx:15079 | div | (contenido dinámico) | "event-detail-reminder" | "event-detail-reminder" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" → selectedEventDetail → "app-shell" |  |
| UI-0343 | app/page.tsx:15101 | div | (contenido dinámico) | (sin clase propia: control base) | selectedEventDetail.location → "event-detail-facts" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" |  |
| UI-0344 | app/page.tsx:15108 | div | (contenido dinámico) | (sin clase propia: control base) | selectedEventDetail.guests → "event-detail-facts" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" |  |
| UI-0345 | app/page.tsx:15115 | div | (contenido dinámico) | (sin clase propia: control base) | (selectedEventDetail.repeat ?? "Never") !== "Never" → "event-detail-facts" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" |  |
| UI-0346 | app/page.tsx:15122 | div | (contenido dinámico) | (sin clase propia: control base) | selectedEventDetail.dayCounter → "event-detail-facts" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" |  |
| UI-0347 | app/page.tsx:15129 | div | (contenido dinámico) | (sin clase propia: control base) | selectedEventDetail.memo → "event-detail-facts" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" |  |
| UI-0348 | app/page.tsx:15160 | button | {`Mark ${todo} as done`} | { selectedEventDetail.todoStates?.[index] === "done" ? "selected done" : "done" } | { selectedEventDetail.todoStates?.[index] === "done" ? "selected done" : "done" } → "event-todo-status-actions" → { selectedEventDetail.todoStates?.[index] ?? "pending" } → "event-detail-todos" → "event-detail-section" | onClick |
| UI-0349 | app/page.tsx:15178 | button | {`Mark ${todo} as not done`} | { selectedEventDetail.todoStates?.[index] === "missed" ? "selected missed" : "missed" } | { selectedEventDetail.todoStates?.[index] === "missed" ? "selected missed" : "missed" } → "event-todo-status-actions" → { selectedEventDetail.todoStates?.[index] ?? "pending" } → "event-detail-todos" → "event-detail-section" | onClick |
| UI-0350 | app/page.tsx:15214 | button | ↗ | (sin clase propia: control base) | "event-detail-files" → "event-detail-section" | onClick |
| UI-0351 | app/page.tsx:15221 | button | ↗ | (sin clase propia: control base) | studyFile → "event-detail-files" → "event-detail-section" → ((selectedEventDetail.files ?? []).length > 0 \|\| (selectedEventDetail.attachmentIds ?? []) | onClick |
| UI-0352 | app/page.tsx:15240 | button | 📝 ↗ | (sin clase propia: control base) | "event-detail-files" → "event-detail-section" | onClick |
| UI-0353 | app/page.tsx:15251 | button | 📝 ↗ | (sin clase propia: control base) | studyNote → "event-detail-files" → "event-detail-section" → ((selectedEventDetail.files ?? []).length > 0 \|\| (selectedEventDetail.attachmentIds ?? []) | onClick |
| UI-0354 | app/page.tsx:15265 | button | 🎙 ↗ | (sin clase propia: control base) | "event-detail-files" → "event-detail-section" → ((selectedEventDetail.files ?? []).length > 0 \|\| (selectedEventDetail.attachmentIds ?? []) | onClick |
| UI-0355 | app/page.tsx:15282 | a | Open attached link ↗ | "event-detail-link" | "event-detail-link" → selectedEventDetail.url → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" |  |
| UI-0356 | app/page.tsx:15294 | button | Edit details | "little-sheet-edit-action" | "little-sheet-edit-action" → appTheme === "littlesheets" → "event-detail-primary-actions" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" |  |
| UI-0357 | app/page.tsx:15303 | button | (contenido dinámico) | "day-summary-add event-detail-add" | "day-summary-add event-detail-add" → selectedEventDetail.eventType !== "sports_event" → "event-detail-primary-actions" → {`event-detail-note ${selectedEventDetail.color} little-sheet-detail-card little-sheet-detail-${littleSheetCardKind(selectedEventDetail)}`} → "modal-backdrop event-detail-backdrop" | onClick |
| UI-0358 | app/page.tsx:15349 | div | (contenido dinámico) | "modal-backdrop event-delete-backdrop" | "modal-backdrop event-delete-backdrop" → eventDeleteRequest → "app-shell" | onPointerDown |
| UI-0359 | app/page.tsx:15372 | button | (contenido dinámico) | (sin clase propia: control base) | "event-delete-series-actions" → isRepeating → "event-delete-dialog" → "modal-backdrop event-delete-backdrop" | onClick |
| UI-0360 | app/page.tsx:15376 | button | (contenido dinámico) | (sin clase propia: control base) | "event-delete-series-actions" → isRepeating → "event-delete-dialog" → "modal-backdrop event-delete-backdrop" | onClick |
| UI-0361 | app/page.tsx:15383 | button | (contenido dinámico) | (sin clase propia: control base) | "event-delete-series-actions" → isRepeating → "event-delete-dialog" → "modal-backdrop event-delete-backdrop" | onClick |
| UI-0362 | app/page.tsx:15388 | button | Cancel | "event-delete-cancel" | "event-delete-cancel" → isRepeating → "event-delete-dialog" → "modal-backdrop event-delete-backdrop" | onClick |
| UI-0363 | app/page.tsx:15404 | button | Cancel | (sin clase propia: control base) | "event-delete-confirm-actions" → isRepeating → "event-delete-dialog" → "modal-backdrop event-delete-backdrop" | onClick |
| UI-0364 | app/page.tsx:15407 | button | Delete | "danger" | "danger" → "event-delete-confirm-actions" → isRepeating → "event-delete-dialog" → "modal-backdrop event-delete-backdrop" | onClick |
| UI-0365 | app/page.tsx:15431 | button | "Back to My Little Day" | "metrics-v2-back" | "metrics-v2-back" → "metrics-v2-topbar" → "metrics-screen metrics-screen-v2" → "metrics-backdrop metrics-v2-backdrop" → false && metricsOpen | onClick |
| UI-0366 | app/page.tsx:15443 | button | "Close metrics" | "metrics-v2-close" | "metrics-v2-close" → "metrics-v2-topbar" → "metrics-screen metrics-screen-v2" → "metrics-backdrop metrics-v2-backdrop" → false && metricsOpen | onClick |
| UI-0367 | app/page.tsx:15477 | button | (contenido dinámico) | {metricsPeriod === period ? "active" : ""} | {metricsPeriod === period ? "active" : ""} → "metrics-period-tabs" → "metrics-controls metrics-v2-controls" → "metrics-screen metrics-screen-v2" → "metrics-backdrop metrics-v2-backdrop" | onClick |
| UI-0368 | app/page.tsx:15492 | button | "Previous metrics period" | (sin clase propia: control base) | "metrics-date-nav" → "metrics-controls metrics-v2-controls" → "metrics-screen metrics-screen-v2" → "metrics-backdrop metrics-v2-backdrop" → false && metricsOpen | onClick |
| UI-0369 | app/page.tsx:15501 | button | "Next metrics period" | (sin clase propia: control base) | "metrics-date-nav" → "metrics-controls metrics-v2-controls" → "metrics-screen metrics-screen-v2" → "metrics-backdrop metrics-v2-backdrop" → false && metricsOpen | onClick |
| UI-0370 | app/page.tsx:15655 | button | "Close post-it editor" | (sin clase propia: control base) | "post-it-editor-modal" → "modal-backdrop post-it-editor-backdrop" → postItEditorOpen → "app-shell" | onClick |
| UI-0371 | app/page.tsx:15669 | textarea | "Post-it text" | (sin clase propia: control base) | {`post-it-editor-preview ${postItDraft.color}`} → "post-it-editor-modal" → "modal-backdrop post-it-editor-backdrop" → postItEditorOpen → "app-shell" | onChange |
| UI-0372 | app/page.tsx:15687 | div | (contenido dinámico) | "post-it-palette-picker" | "post-it-palette-picker" → "post-it-palette-fieldset" → "post-it-editor-options" → "post-it-editor-modal" → "modal-backdrop post-it-editor-backdrop" | onTouchStart, onTouchEnd |
| UI-0373 | app/page.tsx:15692 | button | "Previous paper-color palette" | "post-it-palette-nav" | "post-it-palette-nav" → "post-it-palette-picker" → "post-it-palette-fieldset" → "post-it-editor-options" → "post-it-editor-modal" | onClick |
| UI-0374 | app/page.tsx:15702 | button | {color.label} | {postItDraft.color === color.value ? "active" : ""} | {postItDraft.color === color.value ? "active" : ""} → "post-it-palette-swatches" → "post-it-palette-picker" → "post-it-palette-fieldset" → "post-it-editor-options" | onClick |
| UI-0375 | app/page.tsx:15715 | button | "Next paper-color palette" | "post-it-palette-nav" | "post-it-palette-nav" → "post-it-palette-picker" → "post-it-palette-fieldset" → "post-it-editor-options" → "post-it-editor-modal" | onClick |
| UI-0376 | app/page.tsx:15731 | button | (contenido dinámico) | "post-it-group-action" | "post-it-group-action" → editingPostItId → "post-it-editor-modal" → "modal-backdrop post-it-editor-backdrop" → postItEditorOpen | onClick |
| UI-0377 | app/page.tsx:15744 | button | Delete | "post-it-delete" | "post-it-delete" → editingPostItId → "post-it-editor-modal" → "modal-backdrop post-it-editor-backdrop" → postItEditorOpen | onClick |
| UI-0378 | app/page.tsx:15754 | button | Cancel | "post-it-cancel" | "post-it-cancel" → "post-it-editor-modal" → "modal-backdrop post-it-editor-backdrop" → postItEditorOpen → "app-shell" | onClick |
| UI-0379 | app/page.tsx:15761 | button | (contenido dinámico) | "post-it-save" | "post-it-save" → "post-it-editor-modal" → "modal-backdrop post-it-editor-backdrop" → postItEditorOpen → "app-shell" | onClick |
| UI-0380 | app/page.tsx:15788 | button | "Close settings" | (sin clase propia: control base) | "settings-header" → "settings-modal" → "modal-backdrop settings-backdrop" → settingsOpen → "app-shell" | onClick |
| UI-0381 | app/page.tsx:15812 | input | Choose photo | (sin clase propia: control base) | "profile-actions" → "profile-card" → "settings-modal" → "modal-backdrop settings-backdrop" → settingsOpen | onChange |
| UI-0382 | app/page.tsx:15819 | button | Remove | (sin clase propia: control base) | profilePhoto → "profile-actions" → "profile-card" → "settings-modal" → "modal-backdrop settings-backdrop" | onClick |
| UI-0383 | app/page.tsx:15840 | button | Sign out | (sin clase propia: control base) | "sync-account" → syncEmail → "sync-card" → "settings-modal" → "modal-backdrop settings-backdrop" | onClick |
| UI-0384 | app/page.tsx:15845 | button | Email me a sign-in code | (sin clase propia: control base) | !syncCodeSent → "sync-actions" → syncEmail → "sync-card" → "settings-modal" | onClick |
| UI-0385 | app/page.tsx:15850 | input | "Enter the code" | (sin clase propia: control base) | !syncCodeSent → "sync-actions" → syncEmail → "sync-card" → "settings-modal" | onChange |
| UI-0386 | app/page.tsx:15858 | button | Connect this device | (sin clase propia: control base) | !syncCodeSent → "sync-actions" → syncEmail → "sync-card" → "settings-modal" | onClick |
| UI-0387 | app/page.tsx:15864 | button | Send another code | "sync-resend" | "sync-resend" → !syncCodeSent → "sync-actions" → syncEmail → "sync-card" | onClick |
| UI-0388 | app/page.tsx:15883 | button | ☀ Light | {colorMode === "light" ? "active" : ""} | {colorMode === "light" ? "active" : ""} → "mode-switch" → "mode-card" → "settings-modal" → "modal-backdrop settings-backdrop" | onClick |
| UI-0389 | app/page.tsx:15890 | button | ☾ Dark | {colorMode === "dark" ? "active" : ""} | {colorMode === "dark" ? "active" : ""} → "mode-switch" → "mode-card" → "settings-modal" → "modal-backdrop settings-backdrop" | onClick |
| UI-0390 | app/page.tsx:15913 | button | Full aérea | {!simplifiedCalendarMode ? "active" : ""} | {!simplifiedCalendarMode ? "active" : ""} → "mode-switch simplified-mode-switch" → "mode-card simplified-mode-card" → "settings-modal" → "modal-backdrop settings-backdrop" | onClick |
| UI-0391 | app/page.tsx:15921 | button | Just calendar | {simplifiedCalendarMode ? "active" : ""} | {simplifiedCalendarMode ? "active" : ""} → "mode-switch simplified-mode-switch" → "mode-card simplified-mode-card" → "settings-modal" → "modal-backdrop settings-backdrop" | onClick |
| UI-0392 | app/page.tsx:15942 | button | (contenido dinámico) | {`theme-option ${appTheme === theme.id ? "active" : ""}`} | {`theme-option ${appTheme === theme.id ? "active" : ""}`} → "theme-grid" → "theme-wardrobe" → "settings-modal" → "modal-backdrop settings-backdrop" | onClick |
| UI-0393 | app/page.tsx:15994 | a | OpenMoji | (sin clase propia: control base) | "theme-credit" → "theme-wardrobe" → "settings-modal" → "modal-backdrop settings-backdrop" → settingsOpen |  |
| UI-0394 | app/page.tsx:16031 | button | "Close habit editor" | (sin clase propia: control base) | "class-editor-modal habit-editor-modal" → "modal-backdrop habit-editor-backdrop" → habitEditorOpen → "app-shell" | onClick |
| UI-0395 | app/page.tsx:16041 | input | "Drink a glass of water" | (sin clase propia: control base) | "class-editor-modal habit-editor-modal" → "modal-backdrop habit-editor-backdrop" → habitEditorOpen → "app-shell" | onChange |
| UI-0396 | app/page.tsx:16057 | input | "Habit emoji" | (sin clase propia: control base) | "class-editor-row" → "class-editor-modal habit-editor-modal" → "modal-backdrop habit-editor-backdrop" → habitEditorOpen → "app-shell" | onChange |
| UI-0397 | app/page.tsx:16072 | button | {color.label} | {habitDraft.color === color.value ? "active" : ""} | "class-editor-row" → "class-editor-modal habit-editor-modal" → "modal-backdrop habit-editor-backdrop" → habitEditorOpen → "app-shell" | onClick |
| UI-0398 | app/page.tsx:16091 | button | Delete habit | "delete-class" | "delete-class" → editingHabitId !== null → "class-editor-modal habit-editor-modal" → "modal-backdrop habit-editor-backdrop" → habitEditorOpen | onClick |
| UI-0399 | app/page.tsx:16098 | button | Cancel | "cancel-class" | "cancel-class" → "class-editor-modal habit-editor-modal" → "modal-backdrop habit-editor-backdrop" → habitEditorOpen → "app-shell" | onClick |
| UI-0400 | app/page.tsx:16104 | button | Save habit | "save-class" | "save-class" → "class-editor-modal habit-editor-modal" → "modal-backdrop habit-editor-backdrop" → habitEditorOpen → "app-shell" | onClick |
| UI-0401 | app/page.tsx:16125 | button | "Close class editor" | (sin clase propia: control base) | "class-editor-modal" → "modal-backdrop class-editor-backdrop" → classEditorOpen → "app-shell" | onClick |
| UI-0402 | app/page.tsx:16134 | input | "For example: Network Security" | (sin clase propia: control base) | "class-editor-modal" → "modal-backdrop class-editor-backdrop" → classEditorOpen → "app-shell" | onChange |
| UI-0403 | app/page.tsx:16149 | input | "Class symbol" | (sin clase propia: control base) | "class-editor-row" → "class-editor-modal" → "modal-backdrop class-editor-backdrop" → classEditorOpen → "app-shell" | onChange |
| UI-0404 | app/page.tsx:16165 | button | {`Choose ${color}`} | {classDraft.color === color ? "active" : ""} | "class-editor-row" → "class-editor-modal" → "modal-backdrop class-editor-backdrop" → classEditorOpen → "app-shell" | onClick |
| UI-0405 | app/page.tsx:16182 | button | Delete class | "delete-class" | "delete-class" → editingClassId → "class-editor-modal" → "modal-backdrop class-editor-backdrop" → classEditorOpen | onClick |
| UI-0406 | app/page.tsx:16187 | button | Cancel | "cancel-class" | "cancel-class" → "class-editor-modal" → "modal-backdrop class-editor-backdrop" → classEditorOpen → "app-shell" | onClick |
| UI-0407 | app/page.tsx:16193 | button | Save class | "save-class" | "save-class" → "class-editor-modal" → "modal-backdrop class-editor-backdrop" → classEditorOpen → "app-shell" | onClick |
| UI-0408 | app/page.tsx:16549 | section | { welcomeOpensTimetable ? "Hold to open your interactive class schedule" : undefined } | {`welcome-row ${ welcomeOpensTimetable ? "welcome-row-timetable-trigger" : "" }`.trim()} | {`welcome-row ${ welcomeOpensTimetable ? "welcome-row-timetable-trigger" : "" }`.trim()} | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onKeyDown |
| UI-0409 | app/page.tsx:16636 | button | {`${dayCharmLabel}: ${dayCharmText}. Hold to open your class schedule.`} | {[ "day-charm", dayCharmText === "you may rest" ? "curved-copy" : "", ] .filter(Boolean) .join(" ")} | {[ "day-charm", dayCharmText === "you may rest" ? "curved-copy" : "", ] .filter(Boolean) .join(" ")} → showDayCharm && !welcomeOpensTimetable → {`welcome-row ${ welcomeOpensTimetable ? "welcome-row-timetable-trigger" : "" }`.trim()} | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onClick, onKeyDown |
| UI-0410 | app/page.tsx:16703 | button | See calendar | (sin clase propia: control base) | "noir-week-header" → isNoirRest → "week-strip" | onClick |
| UI-0411 | app/page.tsx:16707 | button | (contenido dinámico) | {[ "day", selectedDate === day.key ? "active" : "", todayKey === day.key ? "today" : "", ] .filter(Boolean) .join(" ")} | {[ "day", selectedDate === day.key ? "active" : "", todayKey === day.key ? "today" : "", ] .filter(Boolean) .join(" ")} → "week-strip" | onClick |
| UI-0412 | app/page.tsx:16733 | button | {`Open details for ${scheduleEventTitle(comingUpEvent)}`} | {[ "schedule-card", `${eventDisplayColor(comingUpEvent, selectedDate)}-card`, comingUpEvent.sportsCardStyle ? "match-day-schedule-card" : "", isFootballVisualEvent(comingUpEvent) ? "canonical-boca-match" : "", isFootballVisualEvent(comingUpEvent) ? "boca-reference-card" : "", "little-sheet-schedule-card", `little-sheet-${littleSheetCardKind(comingUpEvent)}`, ].filter(Boolean).join(" ")} | {[ "schedule-card", `${eventDisplayColor(comingUpEvent, selectedDate)}-card`, comingUpEvent.sportsCardStyle ? "match-day-schedule-card" : "", isFootballVisualEvent(comingUpEvent) ? "canonical-boca-match" : "", isFootballVisualEvent(comingUpEvent) ? "boca-reference-card" : "", "little-sheet-schedule-card", `little-sheet-${littleSheetCardKind(comingUpEvent)}`, ].filter(Boolean).join(" ")} → "coming-up noir-coming-up" → selectedIsToday && comingUpEvent | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onClick |
| UI-0413 | app/page.tsx:16828 | button | See calendar | "text-button" | "text-button" → "section-heading" → "column" → "day-grid" | onClick |
| UI-0414 | app/page.tsx:16839 | button | {`Open details for ${scheduleEventTitle(event)}`} | {[ "schedule-card", `${eventDisplayColor(event, selectedDate)}-card`, event.sportsCardStyle ? "match-day-schedule-card" : "", isFootballVisualEvent(event) ? "canonical-boca-match" : "", isFootballVisualEvent(event) ? "boca-reference-card" : "", "little-sheet-schedule-card", `little-sheet-${littleSheetCardKind(event)}`, ].filter(Boolean).join(" ")} | {[ "schedule-card", `${eventDisplayColor(event, selectedDate)}-card`, event.sportsCardStyle ? "match-day-schedule-card" : "", isFootballVisualEvent(event) ? "canonical-boca-match" : "", isFootballVisualEvent(event) ? "boca-reference-card" : "", "little-sheet-schedule-card", `little-sheet-${littleSheetCardKind(event)}`, ].filter(Boolean).join(" ")} → selectedDateEvents.length === 0 → "column" → "day-grid" | onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onClick |
| UI-0415 | app/page.tsx:16919 | button | Add something to your day | "add-event-button" | "add-event-button" → "column" → "day-grid" | onClick |
| UI-0416 | app/page.tsx:16934 | button | "Add reminder" | "reminder-add-button" | "reminder-add-button" → "reminder-heading-actions" → "section-heading" → "column" → "day-grid" | onClick |
| UI-0417 | app/page.tsx:16971 | button | {`Edit ${item.title}`} | "reminder-icon" | "reminder-icon" → {`reminder-row ${item.tint}`} → pending.length === 0 → "reminder-card" → "column" | onClick |
| UI-0418 | app/page.tsx:16983 | button | {`Complete ${item.title}`} | "check-circle" | "check-circle" → {`reminder-row ${item.tint}`} → pending.length === 0 → "reminder-card" → "column" | onClick |
| UI-0419 | app/page.tsx:17006 | button | (contenido dinámico) | "completed-item" | "completed-item" → completed.length === 0 → "completed-wrap" → "column" → "day-grid" | onClick |
| UI-0420 | app/page.tsx:17020 | div | (contenido dinámico) | "reminder-editor-backdrop" | "reminder-editor-backdrop" → reminderDraft | onMouseDown |
| UI-0421 | app/page.tsx:17046 | input | (contenido dinámico) | "reminder-emoji-input" | "reminder-editor-note" → "reminder-editor-backdrop" → reminderDraft | onChange |
| UI-0422 | app/page.tsx:17059 | input | (contenido dinámico) | (sin clase propia: control base) | "reminder-editor-note" → "reminder-editor-backdrop" → reminderDraft | onChange |
| UI-0423 | app/page.tsx:17073 | select | (contenido dinámico) | (sin clase propia: control base) | isHydrationReminder(reminderDraft) → "reminder-editor-note" → "reminder-editor-backdrop" → reminderDraft | onChange |
| UI-0424 | app/page.tsx:17104 | input | (contenido dinámico) | (sin clase propia: control base) | "class-editor-row" → reminderDraft.notificationsEnabled !== false | onChange |
| UI-0425 | app/page.tsx:17135 | button | Delete | "delete-reminder-button" | "delete-reminder-button" → reminders.some((item) => item.id === reminderDraft.id) → "reminder-editor-note" → "reminder-editor-backdrop" → reminderDraft | onClick |
| UI-0426 | app/page.tsx:17147 | button | Cancel | (sin clase propia: control base) | "reminder-editor-note" → "reminder-editor-backdrop" → reminderDraft | onClick |
| UI-0427 | app/page.tsx:17150 | button | Save | (sin clase propia: control base) | "reminder-editor-note" → "reminder-editor-backdrop" → reminderDraft | onClick |
| UI-0428 | app/page.tsx:17170 | div | (contenido dinámico) | "timetable-backdrop" | "timetable-backdrop" → timetableOpen | onPointerDown |
| UI-0429 | app/page.tsx:17195 | input | "Second semester" | (sin clase propia: control base) | "timetable-term-fields" → timetableEditing → "timetable-heading" → "timetable-card" → "timetable-backdrop" | onChange |
| UI-0430 | app/page.tsx:17208 | input | (contenido dinámico) | (sin clase propia: control base) | "timetable-term-fields" → timetableEditing → "timetable-heading" → "timetable-card" → "timetable-backdrop" | onChange |
| UI-0431 | app/page.tsx:17221 | input | (contenido dinámico) | (sin clase propia: control base) | "timetable-term-fields" → timetableEditing → "timetable-heading" → "timetable-card" → "timetable-backdrop" | onChange |
| UI-0432 | app/page.tsx:17239 | button | Edit semester | "timetable-inline-edit" | "timetable-inline-edit" → "timetable-term-meta" → timetableEditing → "timetable-heading" → "timetable-card" | onClick |
| UI-0433 | app/page.tsx:17258 | button | "Close class schedule" | "timetable-close-button" | "timetable-close-button" → "timetable-heading-actions" → "timetable-heading" → "timetable-card" → "timetable-backdrop" | onClick |
| UI-0434 | app/page.tsx:17276 | button | {`Show ${day.day}'s classes`} | { timetableSelectedDate === day.key ? "active" : "" } | { timetableSelectedDate === day.key ? "active" : "" } → "timetable-week-map-days" → "timetable-week-map" → !timetableEditing → "timetable-card" | onClick |
| UI-0435 | app/page.tsx:17308 | button | {`Edit ${classItem.name}, ${timetableDayNames[meeting.day]}, ${meeting.start} to ${meeting.end}`} | "timetable-week-map-class" | "timetable-week-map-class" → timetableAgenda.length === 0 → "timetable-week-map-list" → "timetable-week-map" | onClick |
| UI-0436 | app/page.tsx:17347 | button | Add class | (sin clase propia: control base) | "timetable-editor-title" → !timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing → "timetable-card" | onClick |
| UI-0437 | app/page.tsx:17354 | button | (contenido dinámico) | "timetable-first-class" | "timetable-first-class" → timetableDraft.classes.length === 0 → "timetable-edit-list" → !timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} | onClick |
| UI-0438 | app/page.tsx:17367 | button | (contenido dinámico) | "timetable-edit-row" | "timetable-edit-row" → timetableDraft.classes.length === 0 → "timetable-edit-list" → !timetableClassDraft | onClick |
| UI-0439 | app/page.tsx:17415 | button | "Close class details" | (sin clase propia: control base) | "timetable-class-form-heading" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing | onClick |
| UI-0440 | app/page.tsx:17425 | input | "For example: Applied Physics" | (sin clase propia: control base) | "timetable-class-name" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing | onChange |
| UI-0441 | app/page.tsx:17438 | input | "Optional" | (sin clase propia: control base) | "timetable-class-name" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing | onChange |
| UI-0442 | app/page.tsx:17453 | select | (contenido dinámico) | (sin clase propia: control base) | "timetable-meeting-row" → "timetable-meeting-list" → "timetable-class-form" → timetableClassDraft | onChange |
| UI-0443 | app/page.tsx:17465 | input | (contenido dinámico) | (sin clase propia: control base) | "timetable-meeting-row" → "timetable-meeting-list" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} | onChange |
| UI-0444 | app/page.tsx:17466 | input | (contenido dinámico) | (sin clase propia: control base) | "timetable-meeting-row" → "timetable-meeting-list" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} | onChange |
| UI-0445 | app/page.tsx:17467 | input | "Optional" | (sin clase propia: control base) | "timetable-meeting-row" → "timetable-meeting-list" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} | onChange |
| UI-0446 | app/page.tsx:17468 | button | {`Remove meeting ${index + 1}`} | (sin clase propia: control base) | "timetable-meeting-row" → "timetable-meeting-list" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} | onClick |
| UI-0447 | app/page.tsx:17471 | button | ＋ Add weekly meeting | (sin clase propia: control base) | "timetable-meeting-list" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing | onClick |
| UI-0448 | app/page.tsx:17476 | button | {`Use color ${color}`} | {timetableClassDraft.color === color ? "active" : ""} | "timetable-color-picker" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing | onClick |
| UI-0449 | app/page.tsx:17495 | button | Delete | "timetable-delete-class" | "timetable-delete-class" → timetableDraft.classes.some( (classItem) => classItem.id === timetableClassDraft.id, ) → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} | onClick |
| UI-0450 | app/page.tsx:17505 | button | Cancel | (sin clase propia: control base) | "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing → "timetable-card" | onClick |
| UI-0451 | app/page.tsx:17511 | button | Save class | "timetable-save-class" | "timetable-save-class" → "timetable-class-form" → timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing | onClick |
| UI-0452 | app/page.tsx:17528 | button | Cancel | (sin clase propia: control base) | "timetable-editor-footer" → !timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing → "timetable-card" | onClick |
| UI-0453 | app/page.tsx:17543 | button | Save semester | (sin clase propia: control base) | "timetable-editor-footer" → !timetableClassDraft → {`timetable-editor ${ timetableClassDraft ? "editing-class" : "" }`.trim()} → !timetableEditing → "timetable-card" | onClick |
| UI-0454 | app/page.tsx:17559 | button | (contenido dinámico) | "timetable-empty-action" | "timetable-empty-action" → !timetableEditing && classTimetable.classes.length === 0 → "timetable-card" → "timetable-backdrop" → timetableOpen | onClick |
| UI-0455 | app/page.tsx:17583 | button | (contenido dinámico) | "calendar-mood-note" | "calendar-mood-note" | onClick |
| UI-0456 | app/page.tsx:17605 | button | (contenido dinámico) | {[ "mood-bubble", mood.color, selectedMood === mood.label ? "active" : "", ] .filter(Boolean) .join(" ")} | {[ "mood-bubble", mood.color, selectedMood === mood.label ? "active" : "", ] .filter(Boolean) .join(" ")} → "mood-bubbles" | onClick |
| UI-0457 | app/page.tsx:17650 | div | "Daily marker picker. Swipe left for stickers or right for moods." | "day-marker-picker" | "day-marker-picker" | onTouchStart, onTouchEnd |
| UI-0458 | app/page.tsx:17668 | button | clear | (sin clase propia: control base) | (selectedMoodOption \|\| selectedStickerOption) → "calendar-mood-picker" → {`day-marker-picker-track ${page === "stickers" ? "show-stickers" : ""}`} → "day-marker-picker" | onClick |
| UI-0459 | app/page.tsx:17670 | MoodBubbles | (contenido dinámico) | (sin clase propia: control base) | "calendar-mood-picker" → {`day-marker-picker-track ${page === "stickers" ? "show-stickers" : ""}`} → "day-marker-picker" | onSelect |
| UI-0460 | app/page.tsx:17682 | button | clear | (sin clase propia: control base) | (selectedMoodOption \|\| selectedStickerOption) → "calendar-mood-picker calendar-sticker-picker" → {`day-marker-picker-track ${page === "stickers" ? "show-stickers" : ""}`} → "day-marker-picker" | onClick |
| UI-0461 | app/page.tsx:17686 | button | (contenido dinámico) | {["mood-bubble", sticker.color, selectedSticker === sticker.label ? "active" : ""].filter(Boolean).join(" ")} | {["mood-bubble", sticker.color, selectedSticker === sticker.label ? "active" : ""].filter(Boolean).join(" ")} → "mood-bubbles" → "calendar-mood-picker calendar-sticker-picker" → {`day-marker-picker-track ${page === "stickers" ? "show-stickers" : ""}`} → "day-marker-picker" | onClick |
| UI-0462 | app/page.tsx:17736 | button | "Close note" | (sin clase propia: control base) | "note-detail-card" → "modal-backdrop note-detail-backdrop" | onClick |
| UI-0463 | app/page.tsx:17741 | textarea | (contenido dinámico) | "note-detail-editor" | editing → "note-detail-card" → "modal-backdrop note-detail-backdrop" | onChange |
| UI-0464 | app/page.tsx:17755 | button | (contenido dinámico) | (sin clase propia: control base) | "note-used-in" → usedIn.length > 0 → "note-detail-card" → "modal-backdrop note-detail-backdrop" | onClick |
| UI-0465 | app/page.tsx:17764 | button | Delete note | (sin clase propia: control base) | "note-detail-card" → "modal-backdrop note-detail-backdrop" | onClick |
| UI-0466 | app/study-library.tsx:425 | button | Spaces | "study-library-back" | "study-library-back" → "study-library-hero" → "study-library-screen" | onClick |
| UI-0467 | app/study-library.tsx:442 | input | "Search your Library" | (sin clase propia: control base) | "study-library-search" → "study-library-actions card" → "study-library-screen" | onChange |
| UI-0468 | app/study-library.tsx:448 | button | "Clear search" | (sin clase propia: control base) | search → "study-library-search" → "study-library-actions card" → "study-library-screen" | onClick |
| UI-0469 | app/study-library.tsx:452 | button | (contenido dinámico) | {filter === item ? "active" : ""} | {filter === item ? "active" : ""} → "study-library-actions card" → "study-library-screen" | onClick |
| UI-0470 | app/study-library.tsx:462 | button | ⇣ Import | "study-library-import" | "study-library-import" → "study-library-actions card" → "study-library-screen" | onClick |
| UI-0471 | app/study-library.tsx:465 | button | ▧ Add image | "study-library-import study-library-add-image" | "study-library-import study-library-add-image" → onPickImages → "study-library-actions card" → "study-library-screen" | onClick |
| UI-0472 | app/study-library.tsx:474 | button | ＋ Collection | (sin clase propia: control base) | "study-library-organize card" → "study-library-screen" | onClick |
| UI-0473 | app/study-library.tsx:477 | button | All items | {collectionFilter === null ? "active" : ""} | {collectionFilter === null ? "active" : ""} → "study-collection-list" → "study-library-organize card" → "study-library-screen" | onClick |
| UI-0474 | app/study-library.tsx:488 | button | (contenido dinámico) | {collectionFilter === collection.id ? "active" : ""} | {collectionFilter === collection.id ? "active" : ""} → "study-collection-list" → "study-library-organize card" → "study-library-screen" | onClick |
| UI-0475 | app/study-library.tsx:495 | button | {`Move ${collection.name} earlier`} | (sin clase propia: control base) | "study-collection-list" → "study-library-organize card" → "study-library-screen" | onClick |
| UI-0476 | app/study-library.tsx:496 | button | {`Move ${collection.name} later`} | (sin clase propia: control base) | "study-collection-list" → "study-library-organize card" → "study-library-screen" | onClick |
| UI-0477 | app/study-library.tsx:497 | button | {`Edit ${collection.name}`} | (sin clase propia: control base) | "study-collection-list" → "study-library-organize card" → "study-library-screen" | onClick |
| UI-0478 | app/study-library.tsx:558 | button | ◆ | (sin clase propia: control base) | (favoriteFiles.length > 0 \|\| favoriteNotes.length > 0 \|\| favoriteRecordings.length > 0) → "study-library-shelves" → (favoriteFiles.length > 0 \|\| favoriteNotes.length > 0 \|\| favoriteRecordings.length > 0 \|\|  | onClick |
| UI-0479 | app/study-library.tsx:563 | button | ◆ | (sin clase propia: control base) | (favoriteFiles.length > 0 \|\| favoriteNotes.length > 0 \|\| favoriteRecordings.length > 0) → "study-library-shelves" → (favoriteFiles.length > 0 \|\| favoriteNotes.length > 0 \|\| favoriteRecordings.length > 0 \|\|  | onClick |
| UI-0480 | app/study-library.tsx:568 | button | ◆ | (sin clase propia: control base) | (favoriteFiles.length > 0 \|\| favoriteNotes.length > 0 \|\| favoriteRecordings.length > 0) → "study-library-shelves" → (favoriteFiles.length > 0 \|\| favoriteNotes.length > 0 \|\| favoriteRecordings.length > 0 \|\|  | onClick |
| UI-0481 | app/study-library.tsx:586 | button | Continue · | (sin clase propia: control base) | recentFiles.length > 0 → "study-library-shelves" → (favoriteFiles.length > 0 \|\| favoriteNotes.length > 0 \|\| favoriteRecordings.length > 0 \|\|  | onClick |
| UI-0482 | app/study-library.tsx:608 | button | (contenido dinámico) | "study-library-new study-new-note" | "study-library-new study-new-note" → "study-note-grid" → "study-library-section" → (filter === "all" \|\| filter === "notes") → "study-library-screen" | onClick |
| UI-0483 | app/study-library.tsx:614 | button | (contenido dinámico) | "study-note-card" | "study-note-card" → "study-note-grid" → "study-library-section" → (filter === "all" \|\| filter === "notes") → "study-library-screen" | onClick |
| UI-0484 | app/study-library.tsx:633 | select | "Add selected files to collection" | (sin clase propia: control base) | collections.length > 0 → "study-file-batch-actions" → selectedFileIds.length > 0 → "study-library-section" → (filter === "all" \|\| filter === "files") | onChange |
| UI-0485 | app/study-library.tsx:648 | button | Remove from this collection | (sin clase propia: control base) | collectionFilter → "study-file-batch-actions" → selectedFileIds.length > 0 → "study-library-section" → (filter === "all" \|\| filter === "files") | onClick |
| UI-0486 | app/study-library.tsx:652 | button | Favorite | (sin clase propia: control base) | "study-file-batch-actions" → selectedFileIds.length > 0 → "study-library-section" → (filter === "all" \|\| filter === "files") → "study-library-screen" | onClick |
| UI-0487 | app/study-library.tsx:666 | button | Done | (sin clase propia: control base) | "study-file-batch-actions" → selectedFileIds.length > 0 → "study-library-section" → (filter === "all" \|\| filter === "files") → "study-library-screen" | onClick |
| UI-0488 | app/study-library.tsx:670 | button | (contenido dinámico) | "study-library-new study-new-file" | "study-library-new study-new-file" → "study-file-grid" → "study-library-section" → (filter === "all" \|\| filter === "files") → "study-library-screen" | onClick |
| UI-0489 | app/study-library.tsx:674 | article | (contenido dinámico) | {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} | {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} → "study-file-grid" → "study-library-section" → (filter === "all" \|\| filter === "files") → "study-library-screen" | onContextMenu |
| UI-0490 | app/study-library.tsx:683 | button | (contenido dinámico) | "study-file-open" | "study-file-open" → {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} → "study-file-grid" → "study-library-section" → (filter === "all" \|\| filter === "files") | onClick |
| UI-0491 | app/study-library.tsx:724 | details | (contenido dinámico) | "study-card-actions" | "study-card-actions" → {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} → "study-file-grid" → "study-library-section" → (filter === "all" \|\| filter === "files") | onToggle |
| UI-0492 | app/study-library.tsx:734 | summary | {`Actions for ${file.name}`} | (sin clase propia: control base) | "study-card-actions" → {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} → "study-file-grid" → "study-library-section" → (filter === "all" \|\| filter === "files") |  |
| UI-0493 | app/study-library.tsx:736 | button | (contenido dinámico) | (sin clase propia: control base) | "study-card-actions" → {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} → "study-file-grid" → "study-library-section" → (filter === "all" \|\| filter === "files") | onClick |
| UI-0494 | app/study-library.tsx:745 | button | (contenido dinámico) | (sin clase propia: control base) | "study-card-actions" → {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} → "study-file-grid" → "study-library-section" → (filter === "all" \|\| filter === "files") | onClick |
| UI-0495 | app/study-library.tsx:759 | input | (contenido dinámico) | (sin clase propia: control base) | collections.length > 0 → "study-card-actions" → {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} | onChange |
| UI-0496 | app/study-library.tsx:769 | button | Move to Trash | "danger" | "danger" → "study-card-actions" → {`study-file-card ${file.kind} ${selectedFileIds.includes(file.id) ? "selected" : ""}`} → "study-file-grid" → "study-library-section" | onClick |
| UI-0497 | app/study-library.tsx:820 | summary | {`Actions for ${recording.name}`} | (sin clase propia: control base) | "study-card-actions recording-actions" → "study-recording-card" → "study-recording-grid" → "study-library-section" → (filter === "all" \|\| filter === "recordings") |  |
| UI-0498 | app/study-library.tsx:822 | button | (contenido dinámico) | (sin clase propia: control base) | "study-card-actions recording-actions" → "study-recording-card" → "study-recording-grid" → "study-library-section" | onClick |
| UI-0499 | app/study-library.tsx:830 | button | Delete recording | (sin clase propia: control base) | "study-card-actions recording-actions" → "study-recording-card" → "study-recording-grid" → "study-library-section" | onClick |
| UI-0500 | app/study-library.tsx:841 | input | (contenido dinámico) | (sin clase propia: control base) | collections.length > 0 → "study-card-actions recording-actions" | onChange |
| UI-0501 | app/study-library.tsx:858 | audio | (contenido dinámico) | (sin clase propia: control base) | recording.url → "study-recording-card" → "study-recording-grid" → "study-library-section" → (filter === "all" \|\| filter === "recordings") | onPlay |
| UI-0502 | app/study-library.tsx:886 | input | (contenido dinámico) | (sin clase propia: control base) | "study-library-screen" | onChange |
| UI-0503 | app/study-library.tsx:896 | button | (contenido dinámico) | "study-library-toast" | "study-library-toast" → message → "study-library-screen" | onClick |
| UI-0504 | app/study-library.tsx:902 | div | (contenido dinámico) | "study-editor-backdrop" | "study-editor-backdrop" → activeNoteEditor → "study-library-screen" | onMouseDown |
| UI-0505 | app/study-library.tsx:906 | button | "Close" | (sin clase propia: control base) | "study-editor-card study-note-editor" → "study-editor-backdrop" → activeNoteEditor → "study-library-screen" | onClick |
| UI-0506 | app/study-library.tsx:908 | input | "Note title" | "study-note-title" | "study-editor-card study-note-editor" → "study-editor-backdrop" → activeNoteEditor → "study-library-screen" | onChange |
| UI-0507 | app/study-library.tsx:909 | textarea | "Write anything…" | (sin clase propia: control base) | "study-editor-card study-note-editor" → "study-editor-backdrop" → activeNoteEditor → "study-library-screen" | onChange |
| UI-0508 | app/study-library.tsx:910 | input | (contenido dinámico) | (sin clase propia: control base) | "study-pin-toggle" → "study-editor-card study-note-editor" → "study-editor-backdrop" → activeNoteEditor → "study-library-screen" | onChange |
| UI-0509 | app/study-library.tsx:911 | input | (contenido dinámico) | (sin clase propia: control base) | "study-pin-toggle" → "study-editor-card study-note-editor" → "study-editor-backdrop" → activeNoteEditor → "study-library-screen" | onChange |
| UI-0510 | app/study-library.tsx:917 | input | (contenido dinámico) | (sin clase propia: control base) | "study-note-collections" → collections.length > 0 → "study-editor-card study-note-editor" → "study-editor-backdrop" | onChange |
| UI-0511 | app/study-library.tsx:943 | button | Delete | "danger" | "danger" → hasNote(activeNoteEditor.id) → "study-editor-card study-note-editor" → "study-editor-backdrop" → activeNoteEditor | onClick |
| UI-0512 | app/study-library.tsx:956 | button | Cancel | (sin clase propia: control base) | "study-editor-card study-note-editor" → "study-editor-backdrop" → activeNoteEditor → "study-library-screen" | onClick |
| UI-0513 | app/study-library.tsx:957 | button | Save note | "primary" | "primary" → "study-editor-card study-note-editor" → "study-editor-backdrop" → activeNoteEditor → "study-library-screen" | onClick |
| UI-0514 | app/study-reader.tsx:207 | button | {`Highlight ${color.name.toLowerCase()}`} | (sin clase propia: control base) | "selection-highlight-menu" | onPointerDown |
| UI-0515 | app/study-reader.tsx:327 | canvas | (contenido dinámico) | (sin clase propia: control base) | "pdf-page-thumbnail" |  |
| UI-0516 | app/study-reader.tsx:862 | button | "Close PDF" | (sin clase propia: control base) | "study-reader-titlebar" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0517 | app/study-reader.tsx:879 | button | (contenido dinámico) | {tool === id ? "active" : ""} | {tool === id ? "active" : ""} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0518 | app/study-reader.tsx:883 | button | (contenido dinámico) | {navigationPanel === "contents" ? "active" : ""} | {navigationPanel === "contents" ? "active" : ""} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0519 | app/study-reader.tsx:888 | button | {readerDark ? "Use light reading mode" : "Use dark reading mode"} | {`reader-dark-toggle${readerDark ? " active" : ""}`} | {`reader-dark-toggle${readerDark ? " active" : ""}`} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0520 | app/study-reader.tsx:900 | input | "Search in this PDF" | (sin clase propia: control base) | "pdf-search-control" → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onChange, onFocus, onKeyDown |
| UI-0521 | app/study-reader.tsx:928 | button | {`Use ${swatch}`} | {color === swatch ? "pdf-color active" : "pdf-color"} | "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0522 | app/study-reader.tsx:938 | input | (contenido dinámico) | (sin clase propia: control base) | "pdf-size-control" → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onChange |
| UI-0523 | app/study-reader.tsx:940 | button | (contenido dinámico) | (sin clase propia: control base) | "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0524 | app/study-reader.tsx:947 | button | (contenido dinámico) | {navigationPanel === "pages" ? "active" : ""} | {navigationPanel === "pages" ? "active" : ""} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0525 | app/study-reader.tsx:952 | button | {bookmarks.includes(page) ? "Remove page bookmark" : "Bookmark page"} | {bookmarks.includes(page) ? "active" : ""} | {bookmarks.includes(page) ? "active" : ""} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0526 | app/study-reader.tsx:972 | button | (contenido dinámico) | {navigationPanel === "bookmarks" ? "active" : ""} | {navigationPanel === "bookmarks" ? "active" : ""} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0527 | app/study-reader.tsx:977 | button | (contenido dinámico) | {navigationPanel === "highlights" ? "active" : ""} | {navigationPanel === "highlights" ? "active" : ""} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0528 | app/study-reader.tsx:982 | button | (contenido dinámico) | {pageNotes[String(page)] ? "active" : ""} | {pageNotes[String(page)] ? "active" : ""} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0529 | app/study-reader.tsx:987 | button | (contenido dinámico) | {navigationPanel === "notes" ? "active" : ""} | {navigationPanel === "notes" ? "active" : ""} → "pdf-tool-ribbon" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0530 | app/study-reader.tsx:997 | button | × | (sin clase propia: control base) | "pdf-navigation-panel" → navigationPanel → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0531 | app/study-reader.tsx:1002 | button | (contenido dinámico) | {item.page === page ? "active pdf-outline-link" : "pdf-outline-link"} | {item.page === page ? "active pdf-outline-link" : "pdf-outline-link"} → navigationPanel === "contents" → "pdf-navigation-panel" → navigationPanel → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0532 | app/study-reader.tsx:1024 | button | (contenido dinámico) | {pageNumber === page ? "active" : ""} | {pageNumber === page ? "active" : ""} → navigationPanel === "pages" → "pdf-navigation-panel" → navigationPanel → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0533 | app/study-reader.tsx:1049 | button | (contenido dinámico) | {pageNumber === page ? "active" : ""} | {pageNumber === page ? "active" : ""} → "pdf-navigation-row" → navigationPanel === "bookmarks" → "pdf-navigation-panel" → navigationPanel | onClick |
| UI-0534 | app/study-reader.tsx:1061 | button | {`Name bookmark on page ${pageNumber}`} | (sin clase propia: control base) | "pdf-navigation-row" → navigationPanel === "bookmarks" → "pdf-navigation-panel" → navigationPanel | onClick |
| UI-0535 | app/study-reader.tsx:1077 | select | (contenido dinámico) | (sin clase propia: control base) | "reader-highlight-filter" → navigationPanel === "highlights" && annotations.some((stroke) => stroke.tool === "highligh → "pdf-navigation-panel" → navigationPanel → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onChange |
| UI-0536 | app/study-reader.tsx:1098 | button | (contenido dinámico) | {stroke.page === page ? "active" : ""} | {stroke.page === page ? "active" : ""} → "pdf-navigation-row pdf-highlight-row" → navigationPanel === "highlights" → "pdf-navigation-panel" → navigationPanel | onClick |
| UI-0537 | app/study-reader.tsx:1113 | button | {`Change color for highlight ${index + 1}`} | (sin clase propia: control base) | "pdf-navigation-row pdf-highlight-row" → navigationPanel === "highlights" → "pdf-navigation-panel" → navigationPanel | onClick |
| UI-0538 | app/study-reader.tsx:1129 | button | {`Delete highlight ${index + 1}`} | (sin clase propia: control base) | "pdf-navigation-row pdf-highlight-row" → navigationPanel === "highlights" → "pdf-navigation-panel" → navigationPanel | onClick |
| UI-0539 | app/study-reader.tsx:1157 | button | (contenido dinámico) | {Number(pageNumber) === page ? "active" : ""} | {Number(pageNumber) === page ? "active" : ""} → "pdf-navigation-row" → navigationPanel === "notes" → "pdf-navigation-panel" → navigationPanel | onClick |
| UI-0540 | app/study-reader.tsx:1169 | button | {`Edit note for page ${pageNumber}`} | (sin clase propia: control base) | "pdf-navigation-row" → navigationPanel === "notes" → "pdf-navigation-panel" → navigationPanel | onClick |
| UI-0541 | app/study-reader.tsx:1185 | div | (contenido dinámico) | "pdf-page-wrap" | "pdf-page-wrap" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onScroll |
| UI-0542 | app/study-reader.tsx:1204 | button | Clear | (sin clase propia: control base) | "pdf-search-results" → pdfSearchOpen && pdfSearch.trim() → "pdf-page-wrap" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0543 | app/study-reader.tsx:1220 | button | (contenido dinámico) | {activePdfSearch?.page === result.page ? "active" : ""} | {activePdfSearch?.page === result.page ? "active" : ""} → "pdf-search-results" → pdfSearchOpen && pdfSearch.trim() → "pdf-page-wrap" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0544 | app/study-reader.tsx:1238 | div | (contenido dinámico) | "pdf-page-stack" | "pdf-page-stack" → "pdf-page-wrap" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onPointerDownCapture |
| UI-0545 | app/study-reader.tsx:1243 | canvas | (contenido dinámico) | "pdf-paper-canvas" | "pdf-page-stack" → "pdf-page-wrap" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} |  |
| UI-0546 | app/study-reader.tsx:1245 | canvas | (contenido dinámico) | "pdf-ink-canvas" | "pdf-page-stack" → "pdf-page-wrap" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onPointerDown, onPointerMove, onPointerUp, onPointerCancel |
| UI-0547 | app/study-reader.tsx:1256 | SelectionHighlightMenu | (contenido dinámico) | (sin clase propia: control base) | selectionMenu → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onChoose |
| UI-0548 | app/study-reader.tsx:1262 | button | ← Previous | (sin clase propia: control base) | "study-reader-footer" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0549 | app/study-reader.tsx:1264 | button | − | (sin clase propia: control base) | "pdf-zoom-controls" → "study-reader-footer" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0550 | app/study-reader.tsx:1266 | button | ＋ | (sin clase propia: control base) | "pdf-zoom-controls" → "study-reader-footer" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0551 | app/study-reader.tsx:1268 | button | Next → | (sin clase propia: control base) | "study-reader-footer" → {`study-reader pdf-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0552 | app/study-reader.tsx:1542 | button | "Close EPUB" | (sin clase propia: control base) | "study-reader-titlebar" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0553 | app/study-reader.tsx:1544 | button | {bookmarked ? "Remove bookmark" : "Bookmark chapter"} | {bookmarked ? "epub-bookmark active" : "epub-bookmark"} | {bookmarked ? "epub-bookmark active" : "epub-bookmark"} → "study-reader-titlebar" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0554 | app/study-reader.tsx:1569 | button | ☰ | (sin clase propia: control base) | "epub-tool-ribbon" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0555 | app/study-reader.tsx:1572 | input | "Search this book" | (sin clase propia: control base) | "epub-tool-ribbon" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onChange, onFocus, onKeyDown |
| UI-0556 | app/study-reader.tsx:1591 | button | A− | (sin clase propia: control base) | "epub-tool-ribbon" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0557 | app/study-reader.tsx:1592 | button | A＋ | (sin clase propia: control base) | "epub-tool-ribbon" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0558 | app/study-reader.tsx:1593 | button | ↕ | (sin clase propia: control base) | "epub-tool-ribbon" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0559 | app/study-reader.tsx:1594 | button | {readerDark ? "Use light reading mode" : "Use dark reading mode"} | {`reader-dark-toggle${readerDark ? " active" : ""}`} | {`reader-dark-toggle${readerDark ? " active" : ""}`} → "epub-tool-ribbon" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0560 | app/study-reader.tsx:1609 | button | (contenido dinámico) | {epubPanel === panel ? "active" : ""} | {epubPanel === panel ? "active" : ""} → "epub-panel-tabs" → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0561 | app/study-reader.tsx:1623 | button | (contenido dinámico) | {index === chapterIndex ? "active" : ""} | {index === chapterIndex ? "active" : ""} → epubPanel === "contents" → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0562 | app/study-reader.tsx:1641 | button | (contenido dinámico) | {index === chapterIndex ? "active" : ""} | {index === chapterIndex ? "active" : ""} → "epub-panel-row epub-bookmark-row" → epubPanel === "bookmarks" → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} | onClick |
| UI-0563 | app/study-reader.tsx:1653 | button | {`Name bookmark ${item.title}`} | (sin clase propia: control base) | "epub-panel-row epub-bookmark-row" → epubPanel === "bookmarks" → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0564 | app/study-reader.tsx:1680 | select | (contenido dinámico) | (sin clase propia: control base) | "reader-highlight-filter" → epubPanel === "highlights" && (readingState.highlights ?? []).length > 0 → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onChange |
| UI-0565 | app/study-reader.tsx:1704 | button | (contenido dinámico) | (sin clase propia: control base) | "epub-panel-row epub-highlight-row" → epubPanel === "highlights" → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0566 | app/study-reader.tsx:1723 | button | {`Change color for highlight ${highlight.text}`} | (sin clase propia: control base) | "epub-panel-row epub-highlight-row" → epubPanel === "highlights" → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0567 | app/study-reader.tsx:1739 | button | {`Delete highlight ${highlight.text}`} | (sin clase propia: control base) | "epub-panel-row epub-highlight-row" → epubPanel === "highlights" → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0568 | app/study-reader.tsx:1771 | button | (contenido dinámico) | (sin clase propia: control base) | epubPanel === "notes" → "epub-outline" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0569 | app/study-reader.tsx:1791 | main | (contenido dinámico) | "epub-paper" | "epub-paper" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onScroll |
| UI-0570 | app/study-reader.tsx:1818 | button | Clear | (sin clase propia: control base) | "epub-search-results" → searchResultsOpen && results.length > 0 → "epub-paper" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0571 | app/study-reader.tsx:1829 | button | (contenido dinámico) | (sin clase propia: control base) | "epub-search-results" → searchResultsOpen && results.length > 0 → "epub-paper" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0572 | app/study-reader.tsx:1848 | article | (contenido dinámico) | (sin clase propia: control base) | "epub-paper" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onPointerDownCapture |
| UI-0573 | app/study-reader.tsx:1863 | textarea | "A thought, question, or quotation to revisit…" | (sin clase propia: control base) | "epub-margin-note" → "epub-paper" → {outlineOpen ? "epub-reading-layout outline-open" : "epub-reading-layout"} → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onChange |
| UI-0574 | app/study-reader.tsx:1874 | SelectionHighlightMenu | (contenido dinámico) | (sin clase propia: control base) | selectionMenu → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onChoose |
| UI-0575 | app/study-reader.tsx:1880 | button | ← Previous chapter | (sin clase propia: control base) | "study-reader-footer" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0576 | app/study-reader.tsx:1882 | button | Next chapter → | (sin clase propia: control base) | "study-reader-footer" → {`study-reader epub-study-reader${readerDark ? " reader-dark" : ""}`} | onClick |
| UI-0577 | app/components/screen-shell.tsx:23 | span | {onStickerClick ? "Open daily health routine" : undefined} | "screen-sticker" | "screen-sticker" → "screen-intro" | onClick, onKeyDown |
| UI-0578 | app/components/screen-shell.tsx:61 | button | (contenido dinámico) | {`space-card ${color}`} | {`space-card ${color}`} | onClick |
| UI-0579 | app/components/screen-shell.tsx:84 | button | ← | (sin clase propia: control base) | "inner-header" | onClick |

## Todos los identificadores visuales

- `accent-1` — app/page.tsx:9957, app/page.tsx:13283
- `accent-2` — app/page.tsx:9962, app/page.tsx:13284
- `active` — app/page.tsx:9878
- `add-class` — app/page.tsx:10940
- `add-event-button` — app/page.tsx:16919
- `aerea-generic-actions` — app/generic-library-bridge.tsx:258, app/generic-library-bridge.tsx:283
- `aerea-generic-library-card` — app/generic-library-bridge.tsx:227
- `aerea-generic-result-count` — app/generic-library-bridge.tsx:547
- `aerea-hub-backdrop` — app/page.tsx:11966
- `aerea-hub-links` — app/page.tsx:11992
- `aerea-hub-modal` — app/page.tsx:11973
- `afternoon` — app/page.tsx:14009
- `agenda-overlay-backdrop` — app/page.tsx:12580
- `agenda-v2` — app/page.tsx:13829
- `agenda-v2-all-day-event` — app/page.tsx:13966, app/page.tsx:13988
- `agenda-v2-all-day-label` — app/page.tsx:13962, app/page.tsx:13984
- `agenda-v2-all-day-list` — app/page.tsx:13963, app/page.tsx:13985
- `agenda-v2-board` — app/page.tsx:13936
- `agenda-v2-day` — app/page.tsx:14034
- `agenda-v2-day-periods` — app/page.tsx:14006
- `agenda-v2-day-wrap` — app/page.tsx:14033
- `agenda-v2-days` — app/page.tsx:13854
- `agenda-v2-drag-time` — app/page.tsx:14100
- `agenda-v2-empty-art` — app/page.tsx:13949
- `agenda-v2-empty-state` — app/page.tsx:13948
- `agenda-v2-event` — app/page.tsx:14070
- `agenda-v2-event-category` — app/page.tsx:14137
- `agenda-v2-event-copy` — app/page.tsx:14112
- `agenda-v2-event-extras` — app/page.tsx:14120
- `agenda-v2-event-icon` — app/page.tsx:14111
- `agenda-v2-event-reminder` — app/page.tsx:14118
- `agenda-v2-event-shortline` — app/page.tsx:14105
- `agenda-v2-focus-backdrop` — app/page.tsx:13930
- `agenda-v2-heading-actions` — app/page.tsx:13907
- `agenda-v2-heading-copy` — app/page.tsx:13886
- `agenda-v2-heading-trigger` — app/page.tsx:13889
- `agenda-v2-home-nav` — app/page.tsx:14150
- `agenda-v2-homebar` — app/page.tsx:13288
- `agenda-v2-list-board` — app/page.tsx:13936
- `agenda-v2-modal` — app/page.tsx:12589
- `agenda-v2-now` — app/page.tsx:14051
- `agenda-v2-pending-time-list` — app/page.tsx:13963
- `agenda-v2-plan-count` — app/page.tsx:13901
- `agenda-v2-quick-add` — app/page.tsx:13917
- `agenda-v2-return-today` — app/page.tsx:13909
- `agenda-v2-scroll` — app/page.tsx:14004
- `agenda-v2-section-heading` — app/page.tsx:13885
- `agenda-v2-time-axis` — app/page.tsx:14013
- `agenda-v2-time-grid` — app/page.tsx:14012
- `agenda-v2-time-label` — app/page.tsx:14024
- `agenda-v2-timeline` — app/page.tsx:14005
- `agenda-v2-timeline-board` — app/page.tsx:13936
- `agenda-v2-week` — app/page.tsx:13830
- `agenda-v2-week-arrow` — app/page.tsx:13846, app/page.tsx:13874
- `agenda-v2-week-content` — app/page.tsx:13836
- `agenda-v3-scene` — app/page.tsx:13270
- `all-done` — app/page.tsx:16954
- `ao3-actions` — app/ao3-library.tsx:531, app/ao3-library.tsx:563, app/generic-library-bridge.tsx:258, app/generic-library-bridge.tsx:283
- `ao3-actions-small` — app/ao3-library.tsx:563, app/generic-library-bridge.tsx:283
- `ao3-alternative` — app/ao3-library.tsx:555, app/generic-library-bridge.tsx:269
- `ao3-alternative-body` — app/ao3-library.tsx:559, app/generic-library-bridge.tsx:274
- `ao3-alternative-item` — app/ao3-library.tsx:561, app/generic-library-bridge.tsx:276
- `ao3-archive-note` — app/ao3-library.tsx:746
- `ao3-card` — app/ao3-library.tsx:681, app/ao3-library.tsx:829, app/generic-library-bridge.tsx:227
- `ao3-card-archive` — app/ao3-library.tsx:681
- `ao3-card-body` — app/ao3-library.tsx:709, app/ao3-library.tsx:857, app/generic-library-bridge.tsx:246
- `ao3-card-header` — app/ao3-library.tsx:682, app/ao3-library.tsx:830, app/generic-library-bridge.tsx:228
- `ao3-card-meta` — app/ao3-library.tsx:696, app/ao3-library.tsx:842, app/generic-library-bridge.tsx:240
- `ao3-card-series` — app/ao3-library.tsx:829
- `ao3-context` — app/ao3-library.tsx:612, app/ao3-library.tsx:710, app/ao3-library.tsx:858, app/generic-library-bridge.tsx:247
- `ao3-copy-title` — app/ao3-library.tsx:686, app/ao3-library.tsx:832, app/generic-library-bridge.tsx:230
- `ao3-empty` — app/ao3-library.tsx:1438
- `ao3-error` — app/ao3-library.tsx:1395
- `ao3-eyebrow` — app/ao3-library.tsx:683, app/ao3-library.tsx:831, app/generic-library-bridge.tsx:229
- `ao3-filter-row` — app/ao3-library.tsx:1339
- `ao3-grid` — app/ao3-library.tsx:1403
- `ao3-highlight` — app/ao3-library.tsx:151
- `ao3-library` — app/ao3-library.tsx:989, app/ao3-library.tsx:1300, app/ao3-library.tsx:1306
- `ao3-library-intro` — app/ao3-library.tsx:1309
- `ao3-library-layer` — app/ao3-library.tsx:976, app/ao3-library.tsx:1284
- `ao3-library-state` — app/ao3-library.tsx:989, app/ao3-library.tsx:1300
- `ao3-library-tools` — app/ao3-library.tsx:1308
- `ao3-loader` — app/ao3-library.tsx:990, app/ao3-library.tsx:1301
- `ao3-modal` — app/ao3-library.tsx:1457
- `ao3-modal-actions` — app/ao3-library.tsx:1464
- `ao3-modal-backdrop` — app/ao3-library.tsx:1448
- `ao3-modal-error` — app/ao3-library.tsx:1463
- `ao3-modal-kicker` — app/ao3-library.tsx:1458
- `ao3-modal-primary` — app/ao3-library.tsx:1472
- `ao3-more-tags` — app/ao3-library.tsx:498
- `ao3-more-tags-list` — app/ao3-library.tsx:500
- `ao3-native-result-count` — app/ao3-library.tsx:1387
- `ao3-part` — app/ao3-library.tsx:776
- `ao3-refresh` — app/ao3-library.tsx:1319
- `ao3-result-count` — app/ao3-library.tsx:1382
- `ao3-screen-header` — app/ao3-library.tsx:984, app/ao3-library.tsx:1293
- `ao3-search` — app/ao3-library.tsx:959
- `ao3-search-tools-hidden` — app/ao3-library.tsx:1284
- `ao3-secondary-series` — app/ao3-library.tsx:631
- `ao3-series-parts` — app/ao3-library.tsx:897
- `ao3-status` — app/ao3-library.tsx:703, app/ao3-library.tsx:852, app/generic-library-bridge.tsx:243
- `ao3-synopsis` — app/ao3-library.tsx:640, app/ao3-library.tsx:728, app/ao3-library.tsx:876
- `ao3-tag` — app/ao3-library.tsx:481
- `ao3-tag-section` — app/ao3-library.tsx:647, app/ao3-library.tsx:735, app/ao3-library.tsx:886
- `ao3-tags` — app/ao3-library.tsx:495
- `ao3-toast` — app/ao3-library.tsx:1445
- `ao3-work-details` — app/ao3-library.tsx:611
- `app-shell` — app/page.tsx:9565
- `audio-copy` — app/page.tsx:11175
- `audio-edit-button` — app/page.tsx:11239
- `audio-icon` — app/page.tsx:11174
- `audio-item` — app/page.tsx:11166
- `auth-callback-backdrop` — app/page.tsx:12298
- `auth-callback-modal` — app/page.tsx:12299
- `avatar-button` — app/page.tsx:10008, app/page.tsx:13320
- `blue` — app/page.tsx:15585
- `boca-pocket-clock` — app/page.tsx:2106
- `boca-pocket-collage` — app/page.tsx:2082
- `boca-pocket-crest` — app/page.tsx:2084
- `boca-pocket-doodles` — app/page.tsx:2074
- `boca-pocket-facts` — app/page.tsx:2133
- `boca-pocket-heart` — app/page.tsx:2067
- `boca-pocket-kicker` — app/page.tsx:2090
- `boca-pocket-main` — app/page.tsx:2083
- `boca-pocket-match-label` — app/page.tsx:2063
- `boca-pocket-opponent` — app/page.tsx:2095
- `boca-pocket-ribbon` — app/page.tsx:2101, app/page.tsx:2126
- `boca-pocket-ribbon-one` — app/page.tsx:2101
- `boca-pocket-ribbon-two` — app/page.tsx:2126
- `boca-pocket-rule` — app/page.tsx:2131
- `boca-pocket-score` — app/page.tsx:2114
- `boca-pocket-stadium` — app/page.tsx:2118
- `boca-pocket-stadium-wrap` — app/page.tsx:2117
- `boca-pocket-teams` — app/page.tsx:2089
- `boca-pocket-ticket` — app/page.tsx:2061
- `boca-pocket-ticket-topline` — app/page.tsx:2062
- `boca-pocket-time-note` — app/page.tsx:2105
- `boca-reference-card` — app/page.tsx:16733, app/page.tsx:16839
- `boca-reference-emblem` — app/page.tsx:16763, app/page.tsx:16870
- `boca-reference-hearts` — app/page.tsx:16771, app/page.tsx:16878
- `boca-reference-timing` — app/page.tsx:16797, app/page.tsx:16902
- `bottom-nav` — app/page.tsx:11916, app/page.tsx:14150
- `brand-mark` — app/page.tsx:9978, app/page.tsx:13295
- `brand-wrap` — app/page.tsx:9972, app/page.tsx:13289
- `calendar-add-large` — app/page.tsx:14455
- `calendar-backdrop` — app/page.tsx:12580
- `calendar-button` — app/page.tsx:10000, app/page.tsx:13308
- `calendar-cell-event` — app/page.tsx:14282
- `calendar-cell-events` — app/page.tsx:14280
- `calendar-compact-event-label` — app/page.tsx:14270
- `calendar-date-menu` — app/page.tsx:13633
- `calendar-date-menu-columns` — app/page.tsx:13634
- `calendar-date-menu-done` — app/page.tsx:13660
- `calendar-date-menu-list` — app/page.tsx:13635, app/page.tsx:13647
- `calendar-date-menu-trigger` — app/page.tsx:13615
- `calendar-day-number` — app/page.tsx:14243
- `calendar-day-status` — app/page.tsx:14253
- `calendar-event-dots` — app/page.tsx:14262
- `calendar-event-mode` — app/page.tsx:12589
- `calendar-expanded` — app/page.tsx:12589
- `calendar-extended-month` — app/page.tsx:12589
- `calendar-glyph` — app/page.tsx:10005, app/page.tsx:13317
- `calendar-modal` — app/page.tsx:12589
- `calendar-month-heading` — app/page.tsx:13611
- `calendar-mood-note` — app/page.tsx:17583
- `calendar-mood-picker` — app/page.tsx:17659, app/page.tsx:17673
- `calendar-mood-sticker` — app/page.tsx:14245
- `calendar-more-events` — app/page.tsx:14296
- `calendar-search-back` — app/page.tsx:13706
- `calendar-search-empty` — app/page.tsx:13738, app/page.tsx:13749
- `calendar-search-empty-icon` — app/page.tsx:13739
- `calendar-search-field` — app/page.tsx:2409
- `calendar-search-footer` — app/page.tsx:13823
- `calendar-search-glyph` — app/page.tsx:2410, app/page.tsx:13691, app/page.tsx:13740
- `calendar-search-group` — app/page.tsx:13756
- `calendar-search-header` — app/page.tsx:13705
- `calendar-search-result` — app/page.tsx:13777
- `calendar-search-result-copy` — app/page.tsx:13797
- `calendar-search-results` — app/page.tsx:13736
- `calendar-search-screen` — app/page.tsx:13695
- `calendar-search-summary` — app/page.tsx:13723
- `calendar-search-trigger` — app/page.tsx:13681
- `calendar-slide` — app/page.tsx:9738, app/page.tsx:13488, app/page.tsx:14179
- `calendar-sources` — app/page.tsx:13663
- `calendar-sticker-picker` — app/page.tsx:17673
- `calendar-today-shortcut` — app/page.tsx:13673
- `cancel-class` — app/page.tsx:16098, app/page.tsx:16187
- `canonical-boca-match` — app/page.tsx:9824, app/page.tsx:13559, app/page.tsx:13966, app/page.tsx:14070, app/page.tsx:14282, app/page.tsx:14380, app/page.tsx:14622, app/page.tsx:16733, app/page.tsx:16839
- `card` — app/page.tsx:10379, app/page.tsx:10449, app/page.tsx:10537, app/page.tsx:10876, app/page.tsx:10949, app/page.tsx:10962, app/page.tsx:11002, app/study-library.tsx:439, app/study-library.tsx:468
- `card-tag` — app/page.tsx:16783, app/page.tsx:16890
- `category-delete` — app/page.tsx:14521
- `category-editor-backdrop` — app/page.tsx:14469
- `category-editor-error` — app/page.tsx:14582
- `category-editor-form` — app/page.tsx:14533
- `category-editor-form-heading` — app/page.tsx:14540
- `category-editor-list` — app/page.tsx:14497
- `category-editor-modal` — app/page.tsx:14476
- `category-save` — app/page.tsx:14586
- `check-circle` — app/page.tsx:16983
- `class-attached-items` — app/page.tsx:11009
- `class-editor-backdrop` — app/page.tsx:16113
- `class-editor-modal` — app/page.tsx:16018, app/page.tsx:16114
- `class-editor-row` — app/page.tsx:16054, app/page.tsx:16146, app/page.tsx:17098
- `class-icon-edit` — app/page.tsx:10890
- `class-item` — app/page.tsx:10913
- `class-item-copy` — app/page.tsx:10921
- `class-list` — app/page.tsx:10876
- `class-material-pickers` — app/page.tsx:11071
- `class-materials` — app/page.tsx:11002
- `class-row` — app/page.tsx:10879
- `classes-layout` — app/page.tsx:10875
- `clear-page` — app/page.tsx:11564
- `cloud-one` — app/page.tsx:9945, app/page.tsx:13271
- `cloud-two` — app/page.tsx:9946, app/page.tsx:13272
- `column` — app/page.tsx:16818, app/page.tsx:16924
- `coming-up` — app/page.tsx:16727
- `coming-up-label` — app/page.tsx:16732
- `complete` — app/page.tsx:14253
- `completed-history-line` — app/page.tsx:16996
- `completed-item` — app/page.tsx:17006
- `completed-title` — app/page.tsx:16997
- `completed-wrap` — app/page.tsx:16995
- `curved-copy` — app/page.tsx:16636
- `custom-repeat` — app/page.tsx:12961
- `danger` — app/page.tsx:10815, app/page.tsx:10856, app/page.tsx:15407, app/study-library.tsx:769, app/study-library.tsx:943
- `date-label` — app/page.tsx:16589
- `day-charm` — app/page.tsx:16636
- `day-charm-curve` — app/page.tsx:16667
- `day-complete` — app/page.tsx:14219
- `day-completion-control` — app/page.tsx:14329
- `day-counter-option` — app/page.tsx:12992
- `day-grid` — app/page.tsx:16817
- `day-marker-picker` — app/page.tsx:17650
- `day-marker-picker-track` — app/page.tsx:17658
- `day-summary-add` — app/page.tsx:14725, app/page.tsx:15303
- `day-summary-add-icon` — app/page.tsx:14726, app/page.tsx:15322
- `day-summary-add-spacer` — app/page.tsx:14734, app/page.tsx:15330
- `day-summary-backdrop` — app/page.tsx:14599
- `day-summary-card` — app/page.tsx:14600
- `day-summary-category` — app/page.tsx:14603
- `day-summary-close` — app/page.tsx:14606
- `day-summary-divider` — app/page.tsx:14612
- `day-summary-empty` — app/page.tsx:14614
- `day-summary-event` — app/page.tsx:14622
- `day-summary-event-heading` — app/page.tsx:14690
- `day-summary-event-heart` — app/page.tsx:14691
- `day-summary-event-time` — app/page.tsx:14703
- `day-summary-events` — app/page.tsx:14616
- `day-summary-heading` — app/page.tsx:14602
- `day-summary-health-heading` — app/page.tsx:14665
- `day-summary-health-icon` — app/page.tsx:14666
- `day-summary-hint` — app/page.tsx:14736
- `day-summary-match-label` — app/page.tsx:14698
- `day-summary-memo` — app/page.tsx:14715
- `delete-class` — app/page.tsx:16091, app/page.tsx:16182
- `delete-entry` — app/page.tsx:10569
- `delete-reminder-button` — app/page.tsx:17135
- `delete-sketch` — app/page.tsx:11839
- `download-page` — app/page.tsx:11580, app/page.tsx:11586
- `drag-target` — app/page.tsx:13524, app/page.tsx:14219
- `drawing-page` — app/page.tsx:11721
- `drawing-tool-toggle` — app/page.tsx:11282, app/page.tsx:11303
- `editing-class` — app/page.tsx:17335
- `empty` — app/study-reader.tsx:1846
- `empty-class-card` — app/page.tsx:10949
- `empty-classes` — app/page.tsx:10936
- `empty-completed` — app/page.tsx:17001
- `empty-day` — app/page.tsx:14374
- `empty-feature-space` — app/page.tsx:10777, app/page.tsx:10825, app/page.tsx:10862
- `empty-schedule` — app/page.tsx:16833
- `empty-sketch-gallery` — app/page.tsx:11802
- `empty-trash-button` — app/page.tsx:10795
- `entity-attachment-picker` — app/page.tsx:11074, app/page.tsx:11120
- `entry-card` — app/page.tsx:10555
- `entry-card-open` — app/page.tsx:10556
- `entry-card-top` — app/page.tsx:10561
- `entry-face` — app/page.tsx:10562
- `epub-bookmark` — app/study-reader.tsx:1544
- `epub-bookmark-row` — app/study-reader.tsx:1640
- `epub-chapter-number` — app/study-reader.tsx:1853
- `epub-highlight-row` — app/study-reader.tsx:1703
- `epub-highlight-swatch` — app/study-reader.tsx:1716
- `epub-margin-note` — app/study-reader.tsx:1861
- `epub-outline` — app/study-reader.tsx:1605
- `epub-panel-row` — app/study-reader.tsx:1640, app/study-reader.tsx:1703
- `epub-panel-tabs` — app/study-reader.tsx:1606
- `epub-paper` — app/study-reader.tsx:1791
- `epub-reading-layout` — app/study-reader.tsx:1604
- `epub-saved-highlight` — app/study-reader.tsx:1523
- `epub-search-match` — app/study-reader.tsx:1513
- `epub-search-results` — app/study-reader.tsx:1815, app/study-reader.tsx:1846
- `epub-study-reader` — app/study-reader.tsx:1537
- `epub-tool-ribbon` — app/study-reader.tsx:1568
- `evening` — app/page.tsx:14010
- `event-category-manage-button` — app/page.tsx:12774
- `event-chip` — app/page.tsx:14380
- `event-chip-delete` — app/page.tsx:14436
- `event-chip-main` — app/page.tsx:14400
- `event-color-palette` — app/page.tsx:12884
- `event-date-error` — app/page.tsx:12852
- `event-dates` — app/page.tsx:12794
- `event-delete-backdrop` — app/page.tsx:15349
- `event-delete-cancel` — app/page.tsx:15388
- `event-delete-confirm-actions` — app/page.tsx:15403
- `event-delete-dialog` — app/page.tsx:15358
- `event-delete-series-actions` — app/page.tsx:15371
- `event-detail-add` — app/page.tsx:15303
- `event-detail-back` — app/page.tsx:14858, app/page.tsx:14986
- `event-detail-backdrop` — app/page.tsx:14833, app/page.tsx:14919
- `event-detail-category` — app/page.tsx:14867, app/page.tsx:14997
- `event-detail-category-row` — app/page.tsx:14856, app/page.tsx:14984
- `event-detail-date-eyebrow` — app/page.tsx:14847, app/page.tsx:14970
- `event-detail-divider` — app/page.tsx:14882, app/page.tsx:15011
- `event-detail-facts` — app/page.tsx:15099
- `event-detail-files` — app/page.tsx:15209
- `event-detail-header` — app/page.tsx:14846, app/page.tsx:14969
- `event-detail-heading-copy` — app/page.tsx:14983
- `event-detail-health-completion` — app/page.tsx:15014
- `event-detail-link` — app/page.tsx:15282
- `event-detail-note` — app/page.tsx:14840, app/page.tsx:14928
- `event-detail-primary-actions` — app/page.tsx:15292
- `event-detail-reminder` — app/page.tsx:15079
- `event-detail-reminder-icon` — app/page.tsx:15085
- `event-detail-section` — app/page.tsx:15138, app/page.tsx:15145, app/page.tsx:15207
- `event-detail-time` — app/page.tsx:15062
- `event-detail-time-icon` — app/page.tsx:15068
- `event-detail-title` — app/page.tsx:14870, app/page.tsx:15001
- `event-detail-todos` — app/page.tsx:15147
- `event-dot` — app/page.tsx:14264
- `event-editor` — app/page.tsx:12657
- `event-editor-back` — app/page.tsx:12619
- `event-editor-card` — app/page.tsx:12747, app/page.tsx:12870, app/page.tsx:12939, app/page.tsx:13028
- `event-editor-editable-fields` — app/page.tsx:12698
- `event-editor-themed` — app/page.tsx:12589
- `event-editor-top` — app/page.tsx:12618
- `event-existing-attachments` — app/page.tsx:13121, app/page.tsx:13167
- `event-file-field` — app/page.tsx:13093
- `event-linked-badge` — app/page.tsx:12644
- `event-note-field` — app/page.tsx:13029
- `event-option` — app/page.tsx:12940, app/page.tsx:12992, app/page.tsx:13003, app/page.tsx:13014
- `event-options-card` — app/page.tsx:12939
- `event-row` — app/page.tsx:12748, app/page.tsx:12782, app/page.tsx:12857, app/page.tsx:12904, app/page.tsx:12918
- `event-row-icon` — app/page.tsx:12749, app/page.tsx:12783, app/page.tsx:12858, app/page.tsx:12872, app/page.tsx:12905, app/page.tsx:12919
- `event-save-button` — app/page.tsx:12646
- `event-setting-heading` — app/page.tsx:12871
- `event-template-history` — app/page.tsx:12728
- `event-title-input` — app/page.tsx:12702
- `event-title-suggestions` — app/page.tsx:12716
- `event-todo-field` — app/page.tsx:13040
- `event-todo-item` — app/page.tsx:13067
- `event-todo-status-actions` — app/page.tsx:15156
- `extended-back-button` — app/page.tsx:13355
- `extended-calendar-cell` — app/page.tsx:13524
- `extended-calendar-date` — app/page.tsx:13556
- `extended-calendar-events` — app/page.tsx:13557
- `extended-calendar-filters` — app/page.tsx:13442
- `extended-calendar-header` — app/page.tsx:13337
- `extended-calendar-header-actions` — app/page.tsx:13388
- `extended-calendar-heading-copy` — app/page.tsx:13371
- `extended-calendar-month` — app/page.tsx:13372
- `extended-calendar-nav` — app/page.tsx:13590
- `extended-calendar-picker` — app/page.tsx:13423
- `extended-calendar-sky` — app/page.tsx:13338
- `extended-calendar-title` — app/page.tsx:13373
- `extended-calendar-view` — app/page.tsx:13333
- `extended-compact-button` — app/page.tsx:13355
- `extended-compact-glyph` — app/page.tsx:13365
- `extended-event-pill` — app/page.tsx:13559
- `extended-filter-control` — app/page.tsx:13405
- `extended-filter-list` — app/page.tsx:13443
- `extended-filter-menu` — app/page.tsx:13477
- `extended-filter-show-all` — app/page.tsx:13468
- `extended-month-backdrop` — app/page.tsx:12580
- `extended-month-chevron` — app/page.tsx:13383
- `extended-month-grid` — app/page.tsx:13488
- `extended-schedule-button` — app/page.tsx:13392
- `extended-schedule-glyph` — app/page.tsx:13403
- `extended-sky-cloud` — app/page.tsx:13339, app/page.tsx:13344
- `extended-sky-cloud-left` — app/page.tsx:13339
- `extended-sky-cloud-right` — app/page.tsx:13344
- `extended-sky-moon` — app/page.tsx:13349
- `eyebrow` — app/page.tsx:9986, app/page.tsx:13303
- `feature-space` — app/page.tsx:10717, app/page.tsx:10784, app/page.tsx:10832
- `feature-space-toolbar` — app/page.tsx:10723
- `floating-tools` — app/page.tsx:11271
- `focus-layout` — app/page.tsx:10448
- `focus-screen` — app/page.tsx:10441
- `focus-side` — app/page.tsx:10514
- `focus-sticker` — app/page.tsx:10515
- `football-match-detail` — app/page.tsx:14840
- `football-match-detail-backdrop` — app/page.tsx:14833
- `football-match-detail-heading` — app/page.tsx:14855
- `football-match-facts` — app/page.tsx:14884
- `football-match-read-only` — app/page.tsx:14907
- `football-match-scoreboard` — app/page.tsx:14876
- `fullscreen-page-button` — app/page.tsx:11656
- `greeting-lovely` — app/page.tsx:16621
- `habit-dot` — app/page.tsx:10414
- `habit-dots` — app/page.tsx:10410
- `habit-edit-icon` — app/page.tsx:10399
- `habit-editor-backdrop` — app/page.tsx:16017
- `habit-editor-modal` — app/page.tsx:16018
- `habit-icon` — app/page.tsx:10399
- `habit-list` — app/page.tsx:10396
- `habit-name` — app/page.tsx:10406
- `habit-ring` — app/page.tsx:10380
- `habit-row` — app/page.tsx:10398
- `habit-summary` — app/page.tsx:10379
- `half-hour` — app/page.tsx:14019
- `has-all-day` — app/page.tsx:13936
- `has-event` — app/page.tsx:14219
- `has-mood` — app/page.tsx:14219
- `header-actions` — app/page.tsx:9990, app/page.tsx:13307
- `health-completion-card` — app/page.tsx:14622
- `health-completion-toggle` — app/page.tsx:14671
- `health-routine-add` — app/page.tsx:10241
- `health-routine-backdrop` — app/page.tsx:10071
- `health-routine-body` — app/page.tsx:10177
- `health-routine-cadence` — app/page.tsx:10191
- `health-routine-check` — app/page.tsx:10199
- `health-routine-close` — app/page.tsx:10098
- `health-routine-delete` — app/page.tsx:10225
- `health-routine-editor` — app/page.tsx:10251
- `health-routine-editor-actions` — app/page.tsx:10347
- `health-routine-emoji` — app/page.tsx:10184
- `health-routine-empty` — app/page.tsx:10115
- `health-routine-header` — app/page.tsx:10086
- `health-routine-item` — app/page.tsx:10169
- `health-routine-list` — app/page.tsx:10113
- `health-routine-note` — app/page.tsx:10080
- `health-routine-weekdays` — app/page.tsx:10290
- `hill-one` — app/page.tsx:9947, app/page.tsx:13273
- `hill-two` — app/page.tsx:9948, app/page.tsx:13274
- `inbox-convert-actions` — app/page.tsx:10745
- `inbox-discard` — app/page.tsx:10766
- `inbox-item` — app/page.tsx:10731
- `inbox-item-copy` — app/page.tsx:10733
- `inbox-item-icon` — app/page.tsx:10732
- `inbox-list` — app/page.tsx:10729
- `inbox-space` — app/page.tsx:10717
- `inner-header` — app/components/screen-shell.tsx:83
- `is-dragging` — app/page.tsx:14070
- `is-empty` — app/page.tsx:13936
- `is-focus-open` — app/page.tsx:13936
- `is-overlap` — app/page.tsx:14070
- `is-searching` — app/ao3-library.tsx:481
- `journal-actions` — app/page.tsx:10547
- `journal-compose` — app/page.tsx:10537
- `journal-layout` — app/page.tsx:10536
- `journal-paper` — app/page.tsx:10539
- `keepsake-four` — app/page.tsx:10483
- `keepsake-one` — app/page.tsx:10474
- `keepsake-three` — app/page.tsx:10480
- `keepsake-two` — app/page.tsx:10477
- `library-document-stage` — app/page.tsx:12352
- `library-image-error` — app/page.tsx:12357
- `library-image-viewer` — app/page.tsx:12333
- `library-reader-backdrop` — app/page.tsx:12332
- `library-reader-header` — app/page.tsx:12343
- `library-reader-layout` — app/page.tsx:12351
- `library-reader-modal` — app/page.tsx:12333
- `library-reader-panel` — app/page.tsx:12380
- `lilac` — app/page.tsx:15599
- `little-sheet` — app/page.tsx:16733, app/page.tsx:16839
- `little-sheet-card-details` — app/page.tsx:849
- `little-sheet-card-facts` — app/page.tsx:850
- `little-sheet-card-location` — app/page.tsx:860
- `little-sheet-card-open` — app/page.tsx:881
- `little-sheet-card-tools` — app/page.tsx:864
- `little-sheet-detail` — app/page.tsx:14928
- `little-sheet-detail-card` — app/page.tsx:14840, app/page.tsx:14928
- `little-sheet-detail-match` — app/page.tsx:14840
- `little-sheet-edit-action` — app/page.tsx:15294
- `little-sheet-schedule-card` — app/page.tsx:16733, app/page.tsx:16839
- `live-dot` — app/page.tsx:10968
- `main-content` — app/page.tsx:10018
- `match-countdown` — app/page.tsx:16804, app/page.tsx:16909
- `match-day-pocket-card` — app/page.tsx:14622
- `match-day-schedule-card` — app/page.tsx:16733, app/page.tsx:16839
- `metrics-backdrop` — app/page.tsx:15423
- `metrics-chart-card` — app/page.tsx:15582, app/page.tsx:15596, app/page.tsx:15610
- `metrics-controls` — app/page.tsx:15469
- `metrics-date-nav` — app/page.tsx:15491
- `metrics-donut` — app/page.tsx:15585, app/page.tsx:15599
- `metrics-donut-row` — app/page.tsx:15584, app/page.tsx:15598
- `metrics-insights-card` — app/page.tsx:15627
- `metrics-mood-chart` — app/page.tsx:15612
- `metrics-overview-card` — app/page.tsx:15536
- `metrics-overview-grid` — app/page.tsx:15544
- `metrics-period-tabs` — app/page.tsx:15470
- `metrics-screen` — app/page.tsx:15424
- `metrics-screen-v2` — app/page.tsx:15424
- `metrics-summary-card` — app/page.tsx:15519
- `metrics-summary-grid` — app/page.tsx:15512
- `metrics-v2-back` — app/page.tsx:15431
- `metrics-v2-backdrop` — app/page.tsx:15423
- `metrics-v2-close` — app/page.tsx:15443
- `metrics-v2-controls` — app/page.tsx:15469
- `metrics-v2-detail-grid` — app/page.tsx:15581
- `metrics-v2-hero` — app/page.tsx:15453
- `metrics-v2-insight-card` — app/page.tsx:15627
- `metrics-v2-keepsake` — app/page.tsx:15462
- `metrics-v2-mood-card` — app/page.tsx:15610
- `metrics-v2-progress` — app/page.tsx:15527
- `metrics-v2-progress-card` — app/page.tsx:15582, app/page.tsx:15596
- `metrics-v2-summary` — app/page.tsx:15512
- `metrics-v2-topbar` — app/page.tsx:15430
- `metrics-v2-week` — app/page.tsx:15536
- `metrics-v2-week-grid` — app/page.tsx:15544
- `mini-people` — app/page.tsx:16810, app/page.tsx:16913
- `mobile-event-actions` — app/page.tsx:13239
- `mobile-event-delete` — app/page.tsx:13248
- `mobile-event-save` — app/page.tsx:13240
- `modal-backdrop` — app/page.tsx:11966, app/page.tsx:12032, app/page.tsx:12108, app/page.tsx:12298, app/page.tsx:12332, app/page.tsx:12580, app/page.tsx:14469, app/page.tsx:14599, app/page.tsx:14833, app/page.tsx:14919, app/page.tsx:15349, app/page.tsx:15642, app/page.tsx:15775, app/page.tsx:16017, app/page.tsx:16113, app/page.tsx:17723
- `modal-top` — app/page.tsx:13610
- `mode-card` — app/page.tsx:15876, app/page.tsx:15900
- `mode-switch` — app/page.tsx:15882, app/page.tsx:15912
- `month-grid` — app/page.tsx:14179
- `month-grid-viewport` — app/page.tsx:14178
- `month-spillover` — app/page.tsx:13524
- `mood-bubble` — app/page.tsx:17605, app/page.tsx:17686
- `mood-bubbles` — app/page.tsx:17603, app/page.tsx:17684
- `mood-chart-card` — app/page.tsx:15610
- `mood-source` — app/page.tsx:13670
- `morning` — app/page.tsx:14008
- `movable-post-it` — app/page.tsx:11866
- `multi-selected` — app/page.tsx:11866
- `nav-item` — app/page.tsx:11918, app/page.tsx:14152
- `night` — app/page.tsx:14007
- `no-match` — app/page.tsx:13749
- `noir-coming-up` — app/page.tsx:16727
- `noir-greeting-kicker` — app/page.tsx:16611
- `noir-greeting-name` — app/page.tsx:16614
- `noir-section-label` — app/page.tsx:16732
- `noir-week-header` — app/page.tsx:16697
- `note-detail-backdrop` — app/page.tsx:17723
- `note-detail-card` — app/page.tsx:17724
- `note-detail-editor` — app/page.tsx:17741
- `note-detail-text` — app/page.tsx:17748
- `note-used-in` — app/page.tsx:17751
- `notebook-top` — app/page.tsx:11646
- `notebook-wrap` — app/page.tsx:11645
- `outline-open` — app/study-reader.tsx:1604
- `outside-month` — app/page.tsx:9780, app/page.tsx:13524, app/page.tsx:14219
- `page-color-custom` — app/page.tsx:11424
- `page-color-grid` — app/page.tsx:11413
- `page-orientation-toggle` — app/page.tsx:11462
- `page-style-grid` — app/page.tsx:11390
- `paper-grain` — app/page.tsx:9928
- `pdf-color` — app/study-reader.tsx:928
- `pdf-highlight-row` — app/study-reader.tsx:1097
- `pdf-highlight-swatch` — app/study-reader.tsx:1106
- `pdf-ink-canvas` — app/study-reader.tsx:1245
- `pdf-navigation-panel` — app/study-reader.tsx:994
- `pdf-navigation-row` — app/study-reader.tsx:1048, app/study-reader.tsx:1097, app/study-reader.tsx:1156
- `pdf-outline-link` — app/study-reader.tsx:1002
- `pdf-page-stack` — app/study-reader.tsx:1238
- `pdf-page-thumbnail` — app/study-reader.tsx:326
- `pdf-page-wrap` — app/study-reader.tsx:1185
- `pdf-paper-canvas` — app/study-reader.tsx:1243
- `pdf-search-control` — app/study-reader.tsx:898
- `pdf-search-results` — app/study-reader.tsx:1199
- `pdf-size-control` — app/study-reader.tsx:936
- `pdf-study-reader` — app/study-reader.tsx:857
- `pdf-text-layer` — app/study-reader.tsx:1244
- `pdf-tool-ribbon` — app/study-reader.tsx:872
- `pdf-tools-separator` — app/study-reader.tsx:926
- `pdf-zoom-controls` — app/study-reader.tsx:1263
- `pen-color-custom` — app/page.tsx:11508
- `pen-colors` — app/page.tsx:11485
- `pen-size` — app/page.tsx:11519, app/page.tsx:11529
- `phone-canvas` — app/page.tsx:9929
- `post-it-cancel` — app/page.tsx:15754
- `post-it-create-button` — app/page.tsx:9991
- `post-it-delete` — app/page.tsx:15744
- `post-it-editor-backdrop` — app/page.tsx:15642
- `post-it-editor-modal` — app/page.tsx:15643
- `post-it-editor-options` — app/page.tsx:15684
- `post-it-editor-preview` — app/page.tsx:15664
- `post-it-group-action` — app/page.tsx:15731
- `post-it-layer` — app/page.tsx:11860
- `post-it-palette-count` — app/page.tsx:15724
- `post-it-palette-fieldset` — app/page.tsx:15685
- `post-it-palette-nav` — app/page.tsx:15692, app/page.tsx:15715
- `post-it-palette-picker` — app/page.tsx:15687
- `post-it-palette-swatches` — app/page.tsx:15700
- `post-it-resize-handle` — app/page.tsx:11900
- `post-it-save` — app/page.tsx:15761
- `post-it-tape` — app/page.tsx:11898, app/page.tsx:15668
- `postit-archive-space` — app/page.tsx:10832
- `postit-multi-toolbar` — app/page.tsx:12402
- `previous-month` — app/page.tsx:13524
- `primary` — app/page.tsx:10358, app/page.tsx:12284, app/study-library.tsx:957
- `primary-soft-button` — app/page.tsx:10431
- `primary-swipe-surface` — app/page.tsx:10018
- `profile-actions` — app/page.tsx:15809
- `profile-card` — app/page.tsx:15796
- `profile-mark` — app/page.tsx:9978, app/page.tsx:13295
- `profile-preview` — app/page.tsx:15797
- `progress-pill` — app/page.tsx:16931
- `quick-capture-backdrop` — app/page.tsx:12032
- `quick-capture-file` — app/page.tsx:12073
- `quick-capture-modal` — app/page.tsx:12041
- `quick-capture-nav` — app/page.tsx:11918, app/page.tsx:14152
- `reader-dark` — app/study-reader.tsx:857, app/study-reader.tsx:1537
- `reader-dark-toggle` — app/study-reader.tsx:888, app/study-reader.tsx:1594
- `reader-highlight-filter` — app/study-reader.tsx:1075, app/study-reader.tsx:1678
- `reader-used-in` — app/study-reader.tsx:867, app/study-reader.tsx:1563
- `recent-entries` — app/page.tsx:10552
- `record-button` — app/page.tsx:10988
- `record-card` — app/page.tsx:10949, app/page.tsx:10962
- `record-controls` — app/page.tsx:10987
- `record-error` — app/page.tsx:10998
- `record-fields` — app/page.tsx:10972
- `record-heading` — app/page.tsx:10963
- `recording-actions` — app/study-library.tsx:819
- `recording-area` — app/page.tsx:10947
- `recording-cancel` — app/page.tsx:11206
- `recording-delete` — app/page.tsx:11212
- `recording-edit-actions` — app/page.tsx:11202
- `recording-edit-fields` — app/page.tsx:11177
- `recording-list` — app/page.tsx:11158
- `reference-icon` — app/components/reference-icon.tsx:14
- `reference-welcome-scene` — app/page.tsx:16587
- `related-content-picker` — app/page.tsx:13167
- `reminder-add-button` — app/page.tsx:16934
- `reminder-card` — app/page.tsx:16952
- `reminder-copy` — app/page.tsx:16979
- `reminder-editor-backdrop` — app/page.tsx:17020
- `reminder-editor-note` — app/page.tsx:17027
- `reminder-editor-preview` — app/page.tsx:17036
- `reminder-editor-sparkles` — app/page.tsx:17033
- `reminder-editor-subtitle` — app/page.tsx:17041
- `reminder-emoji-input` — app/page.tsx:17046
- `reminder-heading-actions` — app/page.tsx:16930
- `reminder-icon` — app/page.tsx:16971
- `reminder-row` — app/page.tsx:16967
- `save-class` — app/page.tsx:16104, app/page.tsx:16193
- `save-page` — app/page.tsx:11570
- `saved-sketches` — app/page.tsx:11783
- `schedule-card` — app/page.tsx:16733, app/page.tsx:16839
- `schedule-copy` — app/page.tsx:16782, app/page.tsx:16889
- `schedule-line` — app/page.tsx:16781, app/page.tsx:16888
- `schedule-slide` — app/page.tsx:13836
- `screen-intro` — app/components/screen-shell.tsx:17
- `screen-section` — app/page.tsx:10061, app/page.tsx:10441, app/page.tsx:10529, app/page.tsx:10585
- `screen-sticker` — app/components/screen-shell.tsx:23
- `secondary` — app/page.tsx:10348
- `section-heading` — app/page.tsx:11003, app/page.tsx:11159, app/page.tsx:11784, app/page.tsx:13885, app/page.tsx:16819, app/page.tsx:16925
- `selected` — app/page.tsx:13964, app/page.tsx:13986
- `selected-day-events` — app/page.tsx:14378
- `selected-day-heading` — app/page.tsx:14306
- `selected-day-panel` — app/page.tsx:14305
- `selected-mood-sticker` — app/page.tsx:17661, app/page.tsx:17675
- `selection-highlight-menu` — app/study-reader.tsx:199
- `session-count` — app/page.tsx:10518
- `settings-backdrop` — app/page.tsx:15775
- `settings-footnote` — app/page.tsx:16005
- `settings-header` — app/page.tsx:15782
- `settings-modal` — app/page.tsx:15776
- `show-stickers` — app/page.tsx:17658
- `simplified-calendar-add` — app/page.tsx:9867
- `simplified-calendar-cell` — app/page.tsx:9780
- `simplified-calendar-date` — app/page.tsx:9813
- `simplified-calendar-events` — app/page.tsx:9816
- `simplified-calendar-eyebrow` — app/page.tsx:9598
- `simplified-calendar-filters` — app/page.tsx:9681
- `simplified-calendar-header` — app/page.tsx:9596
- `simplified-calendar-heading` — app/page.tsx:9597
- `simplified-calendar-nav` — app/page.tsx:9877
- `simplified-calendar-screen` — app/page.tsx:9592
- `simplified-calendar-title` — app/page.tsx:9599
- `simplified-event-strip` — app/page.tsx:9824
- `simplified-filter-menu` — app/page.tsx:9725
- `simplified-mode-card` — app/page.tsx:15900
- `simplified-mode-switch` — app/page.tsx:15912
- `simplified-month-grid` — app/page.tsx:9738
- `simplified-month-picker` — app/page.tsx:9627
- `simplified-more-events` — app/page.tsx:9849
- `simplified-theme-shortcut` — app/page.tsx:9612
- `sketch-exit-fullscreen` — app/page.tsx:11598
- `sketch-exit-label` — app/page.tsx:11608
- `sketch-export-card` — app/page.tsx:11577
- `sketch-extra-copy` — app/page.tsx:11381
- `sketch-fullscreen` — app/page.tsx:11264
- `sketch-fullscreen-actions` — app/page.tsx:11610
- `sketch-fullscreen-bottombar` — app/page.tsx:11744
- `sketch-fullscreen-topbar` — app/page.tsx:11597
- `sketch-gallery` — app/page.tsx:11807
- `sketch-history-controls` — app/page.tsx:11335
- `sketch-layout` — app/page.tsx:11264
- `sketch-message` — app/page.tsx:11779
- `sketch-page-meta` — app/page.tsx:11653
- `sketch-page-size` — app/page.tsx:11442
- `sketch-primary-tools` — app/page.tsx:11282
- `sketch-selection-actions` — app/page.tsx:11324
- `sketch-shape-tools` — app/page.tsx:11303
- `sketch-smart-tools` — app/page.tsx:11354, app/page.tsx:11370
- `sketch-text-sheet` — app/page.tsx:11670
- `sketch-thumb` — app/page.tsx:11824
- `sketch-toolbar-toggle` — app/page.tsx:11625
- `sketch-tools` — app/page.tsx:11271
- `sketch-viewport` — app/page.tsx:11705
- `sketch-zoom-controls` — app/page.tsx:11745
- `sketch-zoom-stage` — app/page.tsx:11709
- `sketchbook-fullscreen-active` — app/page.tsx:9929
- `smart-paper-note` — app/page.tsx:11366
- `soft-copy` — app/page.tsx:16627
- `source-aerea` — app/page.tsx:13668
- `source-android` — app/page.tsx:13665
- `source-color` — app/page.tsx:9703
- `space-arrow` — app/components/screen-shell.tsx:68
- `space-card` — app/components/screen-shell.tsx:61
- `space-copy` — app/components/screen-shell.tsx:63
- `space-icon` — app/components/screen-shell.tsx:62
- `spaces-grid` — app/page.tsx:10594
- `sparkle-one` — app/page.tsx:9951, app/page.tsx:13277
- `sparkle-three` — app/page.tsx:9953, app/page.tsx:13279
- `sparkle-two` — app/page.tsx:9952, app/page.tsx:13278
- `sports-event` — app/page.tsx:14380
- `storybook-cloud` — app/page.tsx:9945, app/page.tsx:9946, app/page.tsx:13271, app/page.tsx:13272
- `storybook-hill` — app/page.tsx:9947, app/page.tsx:9948, app/page.tsx:13273, app/page.tsx:13274
- `storybook-scene` — app/page.tsx:9940, app/page.tsx:13270
- `stroke-stabilizer` — app/page.tsx:11529
- `study-card-actions` — app/study-library.tsx:724, app/study-library.tsx:819
- `study-collection-list` — app/study-library.tsx:476
- `study-editor-backdrop` — app/study-library.tsx:902
- `study-editor-card` — app/study-library.tsx:903
- `study-file-batch-actions` — app/study-library.tsx:630
- `study-file-card` — app/study-library.tsx:674
- `study-file-cover` — app/study-library.tsx:684
- `study-file-grid` — app/study-library.tsx:669
- `study-file-open` — app/study-library.tsx:683
- `study-file-used-in` — app/study-library.tsx:782
- `study-library-actions` — app/study-library.tsx:439
- `study-library-add-image` — app/study-library.tsx:465
- `study-library-back` — app/study-library.tsx:425
- `study-library-empty` — app/study-library.tsx:622, app/study-library.tsx:792, app/study-library.tsx:879
- `study-library-hero` — app/study-library.tsx:423
- `study-library-import` — app/study-library.tsx:462, app/study-library.tsx:465
- `study-library-new` — app/study-library.tsx:608, app/study-library.tsx:670
- `study-library-organize` — app/study-library.tsx:468
- `study-library-screen` — app/study-library.tsx:422
- `study-library-search` — app/study-library.tsx:440
- `study-library-section` — app/study-library.tsx:605, app/study-library.tsx:627, app/study-library.tsx:797
- `study-library-shelves` — app/study-library.tsx:553
- `study-library-stats` — app/study-library.tsx:432
- `study-library-toast` — app/study-library.tsx:896
- `study-new-file` — app/study-library.tsx:670
- `study-new-note` — app/study-library.tsx:608
- `study-note-card` — app/study-library.tsx:614
- `study-note-collections` — app/study-library.tsx:913
- `study-note-editor` — app/study-library.tsx:903
- `study-note-grid` — app/study-library.tsx:607
- `study-note-title` — app/study-library.tsx:908
- `study-pin-toggle` — app/study-library.tsx:910, app/study-library.tsx:911
- `study-reader` — app/study-reader.tsx:857, app/study-reader.tsx:1537
- `study-reader-footer` — app/study-reader.tsx:1261, app/study-reader.tsx:1879
- `study-reader-loading` — app/study-reader.tsx:1197
- `study-reader-message` — app/page.tsx:12570
- `study-reader-titlebar` — app/study-reader.tsx:861, app/study-reader.tsx:1541
- `study-recording-card` — app/study-library.tsx:806
- `study-recording-grid` — app/study-library.tsx:804
- `styles.activeTab` — app/career-plan-bridge.tsx:661
- `styles.approved` — app/career-plan-bridge.tsx:707, app/career-plan-bridge.tsx:712
- `styles.available` — app/career-plan-bridge.tsx:721, app/career-plan-bridge.tsx:726
- `styles.badge` — app/career-plan-bridge.tsx:230, app/career-plan-bridge.tsx:712, app/career-plan-bridge.tsx:726, app/career-plan-bridge.tsx:740
- `styles.card` — app/career-plan-bridge.tsx:682, app/career-plan-bridge.tsx:701, app/career-plan-bridge.tsx:837, app/career-plan-bridge.tsx:855
- `styles.content` — app/career-plan-bridge.tsx:672
- `styles.courseMain` — app/career-plan-bridge.tsx:224
- `styles.courseRow` — app/career-plan-bridge.tsx:218
- `styles.courseStatusChoices` — app/career-plan-bridge.tsx:908
- `styles.courseStatusEditor` — app/career-plan-bridge.tsx:906
- `styles.detailBadge` — app/career-plan-bridge.tsx:890
- `styles.detailGrid` — app/career-plan-bridge.tsx:938
- `styles.details` — app/career-plan-bridge.tsx:956
- `styles.dot` — app/career-plan-bridge.tsx:223, app/career-plan-bridge.tsx:707, app/career-plan-bridge.tsx:721, app/career-plan-bridge.tsx:735
- `styles.emptyProfessorGroup` — app/career-plan-bridge.tsx:352
- `styles.formBackdrop` — app/career-plan-bridge.tsx:1062
- `styles.handle` — app/career-plan-bridge.tsx:887, app/career-plan-bridge.tsx:1069
- `styles.hero` — app/career-plan-bridge.tsx:625
- `styles.legendDot` — app/career-plan-bridge.tsx:329, app/career-plan-bridge.tsx:1076
- `styles.locked` — app/career-plan-bridge.tsx:735, app/career-plan-bridge.tsx:740
- `styles.overlay` — app/career-plan-bridge.tsx:601
- `styles.professorChip` — app/career-plan-bridge.tsx:342
- `styles.professorChips` — app/career-plan-bridge.tsx:339
- `styles.professorForm` — app/career-plan-bridge.tsx:1068
- `styles.professorGroup` — app/career-plan-bridge.tsx:302
- `styles.professorGroupHead` — app/career-plan-bridge.tsx:326
- `styles.professorGroups` — app/career-plan-bridge.tsx:295
- `styles.professorGroupTitle` — app/career-plan-bridge.tsx:328
- `styles.professorIntro` — app/career-plan-bridge.tsx:1043
- `styles.professorsPanel` — app/career-plan-bridge.tsx:1028
- `styles.professorTarget` — app/career-plan-bridge.tsx:1071
- `styles.progressHead` — app/career-plan-bridge.tsx:628
- `styles.progressTrack` — app/career-plan-bridge.tsx:634
- `styles.quarter` — app/career-plan-bridge.tsx:784
- `styles.quarterBody` — app/career-plan-bridge.tsx:811
- `styles.quarterHead` — app/career-plan-bridge.tsx:790
- `styles.quarterNumber` — app/career-plan-bridge.tsx:799
- `styles.quarterOpen` — app/career-plan-bridge.tsx:784
- `styles.quarters` — app/career-plan-bridge.tsx:760
- `styles.routeBox` — app/career-plan-bridge.tsx:1009
- `styles.routeButton` — app/career-plan-bridge.tsx:1001
- `styles.saveProfessorButton` — app/career-plan-bridge.tsx:1090
- `styles.screen` — app/career-plan-bridge.tsx:607
- `styles.searchBox` — app/career-plan-bridge.tsx:751
- `styles.section` — app/career-plan-bridge.tsx:675, app/career-plan-bridge.tsx:694, app/career-plan-bridge.tsx:832, app/career-plan-bridge.tsx:848
- `styles.sectionHead` — app/career-plan-bridge.tsx:676, app/career-plan-bridge.tsx:695, app/career-plan-bridge.tsx:833, app/career-plan-bridge.tsx:849
- `styles.selectedCourseStatus` — app/career-plan-bridge.tsx:917
- `styles.sheet` — app/career-plan-bridge.tsx:881
- `styles.sheetBackdrop` — app/career-plan-bridge.tsx:872
- `styles.stats` — app/career-plan-bridge.tsx:637
- `styles.summaryRow` — app/career-plan-bridge.tsx:702, app/career-plan-bridge.tsx:716, app/career-plan-bridge.tsx:730
- `styles.switcherActive` — app/career-plan-bridge.tsx:1158
- `styles.tabs` — app/career-plan-bridge.tsx:653
- `styles.timetableSwitcher` — app/career-plan-bridge.tsx:1157
- `styles.topbar` — app/career-plan-bridge.tsx:608, app/career-plan-bridge.tsx:1029
- `stylus-status` — app/page.tsx:11545
- `swipe-source` — app/page.tsx:13671
- `switch-row` — app/page.tsx:12782, app/page.tsx:12857
- `sync-account` — app/page.tsx:15838
- `sync-actions` — app/page.tsx:15843
- `sync-card` — app/page.tsx:15831
- `sync-resend` — app/page.tsx:15864
- `tape` — app/page.tsx:11727, app/page.tsx:11728
- `tape-one` — app/page.tsx:11727
- `tape-two` — app/page.tsx:11728
- `task-editor-basics` — app/page.tsx:12129
- `task-editor-footer` — app/page.tsx:12282
- `task-editor-notes` — app/page.tsx:12156
- `task-link-backdrop` — app/page.tsx:12108
- `task-link-columns` — app/page.tsx:12210
- `task-link-create` — app/page.tsx:12227, app/page.tsx:12270
- `task-link-hint` — app/page.tsx:12279
- `task-link-modal` — app/page.tsx:12115
- `task-linked-items` — app/page.tsx:12171
- `text-button` — app/page.tsx:11789, app/page.tsx:13909, app/page.tsx:16828
- `textLayer` — app/study-reader.tsx:1244
- `theme-credit` — app/page.tsx:15992
- `theme-grid` — app/page.tsx:15940
- `theme-interface-chip` — app/page.tsx:15975
- `theme-mini-ground` — app/page.tsx:15959
- `theme-option` — app/page.tsx:15942
- `theme-option-accent-art` — app/page.tsx:15965
- `theme-option-art` — app/page.tsx:15958
- `theme-option-copy` — app/page.tsx:15971
- `theme-option-main-art` — app/page.tsx:15960
- `theme-scene-accent` — app/page.tsx:9957, app/page.tsx:9962, app/page.tsx:13283, app/page.tsx:13284
- `theme-scene-dots` — app/page.tsx:9956, app/page.tsx:13282
- `theme-scene-frame` — app/page.tsx:9954, app/page.tsx:13280
- `theme-scene-ribbon` — app/page.tsx:9955, app/page.tsx:13281
- `theme-scene-sparkle` — app/page.tsx:9951, app/page.tsx:9952, app/page.tsx:9953, app/page.tsx:13277, app/page.tsx:13278, app/page.tsx:13279
- `theme-selected` — app/page.tsx:15986
- `theme-wardrobe` — app/page.tsx:15932
- `theme-wardrobe-heading` — app/page.tsx:15933
- `time-block` — app/page.tsx:16763, app/page.tsx:16870
- `timer-actions` — app/page.tsx:10496
- `timer-bloom` — app/page.tsx:10465
- `timer-bloom-face` — app/page.tsx:10486
- `timer-card` — app/page.tsx:10449
- `timer-color-well` — app/page.tsx:10473
- `timer-keepsake` — app/page.tsx:10474, app/page.tsx:10477, app/page.tsx:10480, app/page.tsx:10483
- `timer-main` — app/page.tsx:10497
- `timer-modes` — app/page.tsx:10450
- `timer-reset` — app/page.tsx:10503
- `timetable-backdrop` — app/page.tsx:17170
- `timetable-card` — app/page.tsx:17177
- `timetable-class-form` — app/page.tsx:17394
- `timetable-class-form-heading` — app/page.tsx:17404
- `timetable-class-name` — app/page.tsx:17423, app/page.tsx:17436
- `timetable-close-button` — app/page.tsx:17258
- `timetable-color-picker` — app/page.tsx:17473
- `timetable-delete-class` — app/page.tsx:17495
- `timetable-edit-list` — app/page.tsx:17352
- `timetable-edit-row` — app/page.tsx:17367
- `timetable-editor` — app/page.tsx:17335
- `timetable-editor-footer` — app/page.tsx:17527
- `timetable-editor-title` — app/page.tsx:17342
- `timetable-empty-action` — app/page.tsx:17559
- `timetable-first-class` — app/page.tsx:17354
- `timetable-heading` — app/page.tsx:17183
- `timetable-heading-actions` — app/page.tsx:17257
- `timetable-inline-edit` — app/page.tsx:17239
- `timetable-linked-event-card` — app/page.tsx:12667
- `timetable-linked-event-icon` — app/page.tsx:12671
- `timetable-linked-range` — app/page.tsx:12685
- `timetable-meeting-list` — app/page.tsx:17448
- `timetable-meeting-row` — app/page.tsx:17450
- `timetable-note` — app/page.tsx:17574
- `timetable-save-class` — app/page.tsx:17511
- `timetable-source-event` — app/page.tsx:12657
- `timetable-term-fields` — app/page.tsx:17192
- `timetable-term-meta` — app/page.tsx:17235
- `timetable-week-map` — app/page.tsx:17270
- `timetable-week-map-class` — app/page.tsx:17308
- `timetable-week-map-days` — app/page.tsx:17271
- `timetable-week-map-empty` — app/page.tsx:17299
- `timetable-week-map-list` — app/page.tsx:17292
- `tiny-label` — app/page.tsx:10088, app/page.tsx:10385, app/page.tsx:10487, app/page.tsx:10538, app/page.tsx:10553, app/page.tsx:10877, app/page.tsx:10965, app/page.tsx:11005, app/page.tsx:11161, app/page.tsx:11281, app/page.tsx:11302, app/page.tsx:11334, app/page.tsx:11353, app/page.tsx:11369, app/page.tsx:11389, app/page.tsx:11412, app/page.tsx:11443, app/page.tsx:11461, app/page.tsx:11484, app/page.tsx:11520, app/page.tsx:11530, app/page.tsx:11578, app/page.tsx:11672, app/page.tsx:11786, app/page.tsx:11981, app/page.tsx:12049, app/page.tsx:12123, app/page.tsx:12345, app/page.tsx:12393, app/page.tsx:12628, app/page.tsx:13614, app/page.tsx:13887, app/page.tsx:14308, app/page.tsx:14484, app/page.tsx:15139, app/page.tsx:15146, app/page.tsx:15208, app/page.tsx:15366, app/page.tsx:15398, app/page.tsx:15651, app/page.tsx:15784, app/page.tsx:15805, app/page.tsx:15833, app/page.tsx:15878, app/page.tsx:15905, app/page.tsx:15935, app/page.tsx:16026, app/page.tsx:16122, app/page.tsx:16821, app/page.tsx:16927, app/page.tsx:17039, app/page.tsx:17185, app/page.tsx:17344, app/page.tsx:17406, app/page.tsx:17733, app/page.tsx:17752, app/study-library.tsx:428, app/study-library.tsx:471, app/study-library.tsx:606, app/study-library.tsx:628, app/study-library.tsx:800, app/study-library.tsx:905, app/components/screen-shell.tsx:19, app/components/screen-shell.tsx:86
- `topbar` — app/page.tsx:9971, app/page.tsx:13288
- `trash-explainer` — app/page.tsx:10791, app/page.tsx:10838
- `trash-list` — app/page.tsx:10804, app/page.tsx:10842
- `trash-space` — app/page.tsx:10784
- `trash-space-toolbar` — app/page.tsx:10790
- `visually-hidden` — app/page.tsx:9588
- `week-strip` — app/page.tsx:16695
- `welcome-row` — app/page.tsx:16549
- `welcome-row-timetable-trigger` — app/page.tsx:16549
- `wordmark` — app/page.tsx:9987, app/page.tsx:13304
- `years` — app/page.tsx:13647
- `zoom-fit` — app/page.tsx:11768

## Estilos inline que requieren revisión

- app/career-plan-bridge.tsx:635 — `{{ width: '${progress}%' }}`
- app/page.tsx:9565 — `{customThemeStyle}`
- app/page.tsx:9703 — `{ { "--simplified-source-color": sourceAccent } as CSSProperties }`
- app/page.tsx:9738 — `{ { "--simplified-calendar-weeks": simplifiedCalendarWeekCount, } as CSSProperties }`
- app/page.tsx:9824 — `{ { "--simplified-event-color": eventAccent } as CSSProperties }`
- app/page.tsx:10465 — `{ { "--timer-progress": '${focusProgress}%', } as CSSProperties }`
- app/page.tsx:10879 — `{ { "--class-color": item.color, } as CSSProperties }`
- app/page.tsx:11415 — `{{ backgroundColor: color.value }}`
- app/page.tsx:11499 — `{{ backgroundColor: color }}`
- app/page.tsx:11709 — `{ { ...sketchPaperStyle, "--sketch-zoom": sketchZoom, "--sketch-stage-size": '${sketchZoom * 100}%', "--sketch-inverse-zoom": 1 / sketchZoom, } as CSSProperties }`
- app/page.tsx:11721 — `{sketchPaperStyle}`
- app/page.tsx:11824 — `{paperStyle}`
- app/page.tsx:11866 — `{ { ...postItVisualStyle(postIt.text), "--post-it-x": '${postIt.x}%', "--post-it-y": '${postIt.y}%', "--post-it-rotation": '${postIt.rotation}deg', "--post-it-width": '${postIt.width ?? 184}px', "--post-it-height": '${postIt.height ?? 174}px', zIndex: postIt.zIndex ?? 1, } as CSSProperties }`
- app/page.tsx:12589 — `{ eventEditorOpen ? ({ "--event-editor-accent": eventColors.find( (color) => color.value === eventDraft.color, )?.hex ?? "#ae96d8", } as CSSProperties) : undefined }`
- app/page.tsx:12886 — `{{ "--event-color": color.hex } as CSSProperties}`
- app/page.tsx:13488 — `{ { "--extended-calendar-weeks": extendedCalendarWeekCount, } as CSSProperties }`
- app/page.tsx:13777 — `{ { "--search-accent": eventColors.find( (color) => color.value === eventDisplayColor(event, date), )?.hex ?? "#ae96d8", } as CSSProperties }`
- app/page.tsx:14019 — `{{ top: '${((minute - SCHEDULE_START_MINUTE) / SCHEDULE_TOTAL_MINUTES) * 100}%' }}`
- app/page.tsx:14051 — `{{ top: '${((currentScheduleMinute - SCHEDULE_START_MINUTE) / SCHEDULE_TOTAL_MINUTES) * 100}%' }}`
- app/page.tsx:14070 — `{{ top: '${((visibleStart - SCHEDULE_START_MINUTE) / SCHEDULE_TOTAL_MINUTES) * 100}%', height: '${(duration / SCHEDULE_TOTAL_MINUTES) * 100}%', left: 'calc(${(lane / laneCount) * 100}% + 6px)', width: 'calc(${100 / laneCount}% - 12px)', }}`
- app/page.tsx:14503 — `{ { "--category-color": eventColors.find((color) => color.value === category.color) ?.hex ?? "#ae96d8", } as CSSProperties }`
- app/page.tsx:14565 — `{{ "--category-color": color.hex } as CSSProperties}`
- app/page.tsx:14622 — `{ event.sportsCardStyle ? ({ "--sports-primary": event.sportsPrimary, "--sports-secondary": event.sportsSecondary, } as CSSProperties) : undefined }`
- app/page.tsx:15528 — `{{ width: '${metric.progress}%' }}`
- app/page.tsx:15585 — `{{ "--metric-progress": '${metricProgress.hydration}%' } as CSSProperties}`
- app/page.tsx:15599 — `{{ "--metric-progress": '${metricProgress.classes}%' } as CSSProperties}`
- app/page.tsx:15664 — `{postItVisualStyle(postItDraft.text)}`
- app/page.tsx:15702 — `{{ "--post-it-swatch": color.hex } as CSSProperties}`
- app/page.tsx:15942 — `{ { "--theme-one": theme.colors[0], "--theme-two": theme.colors[1], "--theme-three": theme.colors[2], } as CSSProperties }`
- app/page.tsx:15982 — `{{ background: color }}`
- app/page.tsx:16072 — `{{ background: color.hex }}`
- app/page.tsx:16165 — `{{ background: color }}`
- app/page.tsx:16733 — `{ comingUpEvent.sportsCardStyle ? ({ "--sports-primary": comingUpEvent.sportsPrimary, "--sports-secondary": comingUpEvent.sportsSecondary, } as CSSProperties) : undefined }`
- app/page.tsx:16839 — `{ event.sportsCardStyle ? ({ "--sports-primary": event.sportsPrimary, "--sports-secondary": event.sportsSecondary, } as CSSProperties) : undefined }`
- app/page.tsx:17308 — `{{ background: classItem.color }}`
- app/page.tsx:17373 — `{{ background: classItem.color }}`
- app/page.tsx:17476 — `{{ background: color }}`
- app/study-library.tsx:686 — `{ { "--study-cover-image": 'url("${file.dataUrl}")' } as CSSProperties }`
- app/study-reader.tsx:199 — `{{ left: position.left, top: position.top } as CSSProperties}`
- app/study-reader.tsx:207 — `{{ "--selection-color": color.value } as CSSProperties}`
- app/study-reader.tsx:928 — `{{ backgroundColor: swatch }}`
- app/study-reader.tsx:1002 — `{{ "--outline-depth": item.depth } as CSSProperties}`
- app/study-reader.tsx:1106 — `{{ backgroundColor: stroke.color }}`
- app/study-reader.tsx:1523 — `{{ "--saved-highlight": savedHighlight.color } as CSSProperties}`
- app/study-reader.tsx:1716 — `{{ backgroundColor: highlight.color }}`
- app/study-reader.tsx:1848 — `{{ fontSize: readingState.fontSize, lineHeight: readingState.lineHeight }}`
