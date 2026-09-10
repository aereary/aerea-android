"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  CAREER_COURSES,
  CAREER_PROFESSORS,
  type CareerCourse,
  type CareerProfessor,
  type ProfessorRating,
} from "./career-plan-data";
import { supabase } from "./supabase-sync";
import styles from "./career-plan.module.css";

const LOCAL_KEY = "aerea-academic-profile-v1";

type CareerView = "summary" | "plan" | "available";

type StoredAcademicProfile = {
  customProfessors: CareerProfessor[];
  updatedAt: number;
};

const EMPTY_PROFILE: StoredAcademicProfile = {
  customProfessors: [],
  updatedAt: 0,
};

function readLocalProfile(): StoredAcademicProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "null") as
      | Partial<StoredAcademicProfile>
      | null;
    const customProfessors = Array.isArray(parsed?.customProfessors)
      ? parsed.customProfessors.filter(
          (item): item is CareerProfessor =>
            Boolean(
              item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                ["recommended", "maybe", "avoid"].includes(item.rating),
            ),
        )
      : [];
    return {
      customProfessors,
      updatedAt:
        typeof parsed?.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : 0,
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

function writeLocalProfile(profile: StoredAcademicProfile) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  } catch {
    // The career planner remains usable even if the browser storage is unavailable.
  }
}

async function pushAcademicProfile(profile: StoredAcademicProfile) {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  await supabase.from("aerea_academic_profile").upsert(
    {
      user_id: userId,
      state: { customProfessors: profile.customProfessors },
      client_updated_at: profile.updatedAt,
      updated_at: new Date(profile.updatedAt || Date.now()).toISOString(),
    },
    { onConflict: "user_id" },
  );
}

function normalizeRemoteProfessors(value: unknown): CareerProfessor[] {
  if (!value || typeof value !== "object") return [];
  const raw = (value as { customProfessors?: unknown }).customProfessors;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is CareerProfessor =>
      Boolean(
        item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          ["recommended", "maybe", "avoid"].includes(item.rating),
      ),
  );
}

function statusMeta(course: CareerCourse) {
  if (course.status === "APROBADO")
    return { key: "approved", label: "Aprobada" } as const;
  if (course.status === "CURSANDO")
    return { key: "current", label: "Cursando" } as const;
  if (course.available)
    return { key: "available", label: "Disponible" } as const;
  return { key: "locked", label: "Bloqueada" } as const;
}

function courseByCode(code: string) {
  return CAREER_COURSES.find((course) => course.code === code) ?? null;
}

function prerequisiteRoute(course: CareerCourse) {
  const route: CareerCourse[] = [];
  const seen = new Set<string>();
  let cursor: CareerCourse | null = course;

  while (cursor && !seen.has(cursor.code)) {
    seen.add(cursor.code);
    route.unshift(cursor);
    cursor = cursor.prereq ? courseByCode(cursor.prereq) : null;
  }
  return route;
}

function CourseRow({
  course,
  onOpen,
}: {
  course: CareerCourse;
  onOpen: (course: CareerCourse) => void;
}) {
  const meta = statusMeta(course);
  return (
    <button
      className={styles.courseRow}
      type="button"
      onClick={() => onOpen(course)}
    >
      <span className={`${styles.dot} ${styles[meta.key]}`} />
      <span className={styles.courseMain}>
        <strong>{course.name}</strong>
        <small>
          {course.code} · {course.credits} créd. · Cuatri {course.quarter}
        </small>
      </span>
      <span className={`${styles.badge} ${styles[meta.key]}`}>
        {meta.label}
      </span>
    </button>
  );
}

function ProfessorGroups({
  professors,
}: {
  professors: readonly CareerProfessor[];
}) {
  const groups: {
    rating: ProfessorRating;
    title: string;
    note: string;
  }[] = [
    {
      rating: "recommended",
      title: "Recomendados",
      note: "Los que sí volverías a tomar",
    },
    { rating: "maybe", title: "Más o menos", note: "Con cautela" },
    { rating: "avoid", title: "Nunca más", note: "Qué miedo 😭" },
  ];

  return (
    <div className={styles.professorGroups}>
      {groups.map((group) => {
        const items = professors.filter(
          (professor) => professor.rating === group.rating,
        );
        if (!items.length) return null;
        return (
          <section className={styles.professorGroup} key={group.rating}>
            <div className={styles.professorGroupHead}>
              <div>
                <div className={styles.professorGroupTitle}>
                  <span
                    className={`${styles.legendDot} ${styles[group.rating]}`}
                  />
                  {group.title}
                </div>
                <small>{group.note}</small>
              </div>
              <span>{items.length}</span>
            </div>
            <div className={styles.professorChips}>
              {items.map((professor) => (
                <span
                  className={`${styles.professorChip} ${
                    styles[professor.rating]
                  }`}
                  key={professor.id}
                >
                  {professor.name}
                </span>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CareerPlanOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  const [view, setView] = useState<CareerView>("summary");
  const [search, setSearch] = useState("");
  const [openQuarter, setOpenQuarter] = useState<number | null>(9);
  const [selectedCourse, setSelectedCourse] = useState<CareerCourse | null>(
    null,
  );
  const [showRoute, setShowRoute] = useState(false);
  const [professorsOpen, setProfessorsOpen] = useState(false);
  const [addProfessorOpen, setAddProfessorOpen] = useState(false);
  const [newProfessorName, setNewProfessorName] = useState("");
  const [newProfessorRating, setNewProfessorRating] =
    useState<ProfessorRating>("recommended");
  const [profile, setProfile] = useState<StoredAcademicProfile>(EMPTY_PROFILE);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const approved = useMemo(
    () => CAREER_COURSES.filter((course) => course.status === "APROBADO"),
    [],
  );
  const current = useMemo(
    () => CAREER_COURSES.filter((course) => course.status === "CURSANDO"),
    [],
  );
  const available = useMemo(
    () =>
      CAREER_COURSES.filter(
        (course) => course.status === "PENDIENTE" && course.available,
      ),
    [],
  );
  const locked = useMemo(
    () =>
      CAREER_COURSES.filter(
        (course) => course.status === "PENDIENTE" && !course.available,
      ),
    [],
  );
  const approvedCredits = approved.reduce(
    (total, course) => total + course.credits,
    0,
  );
  const progress = Math.round((approved.length / CAREER_COURSES.length) * 1000) / 10;
  const allProfessors = useMemo(
    () => [...CAREER_PROFESSORS, ...profile.customProfessors],
    [profile.customProfessors],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const local = readLocalProfile();
    setProfile(local);

    let cancelled = false;
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId || cancelled) return;

      const { data, error } = await supabase
        .from("aerea_academic_profile")
        .select("state,client_updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled || error) return;

      if (!data) {
        if (local.updatedAt > 0) void pushAcademicProfile(local);
        return;
      }

      const remote: StoredAcademicProfile = {
        customProfessors: normalizeRemoteProfessors(data.state),
        updatedAt:
          typeof data.client_updated_at === "number"
            ? data.client_updated_at
            : 0,
      };

      if (remote.updatedAt > local.updatedAt) {
        writeLocalProfile(remote);
        setProfile(remote);
      } else if (local.updatedAt > remote.updatedAt) {
        void pushAcademicProfile(local);
      } else if (remote.customProfessors.length && !local.customProfessors.length) {
        writeLocalProfile(remote);
        setProfile(remote);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const closeTopLayer = (event: Event) => {
      if (addProfessorOpen) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setAddProfessorOpen(false);
        return;
      }
      if (professorsOpen) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setProfessorsOpen(false);
        return;
      }
      if (selectedCourse) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setSelectedCourse(null);
        setShowRoute(false);
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTopLayer(event);
    };

    window.addEventListener("aereaAndroidBack", closeTopLayer, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("aereaAndroidBack", closeTopLayer, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [addProfessorOpen, onClose, professorsOpen, selectedCourse]);

  const saveProfessor = (event: FormEvent) => {
    event.preventDefault();
    const name = newProfessorName.trim();
    if (!name) return;

    const nextProfessor: CareerProfessor = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `custom-${Date.now()}`,
      name,
      rating: newProfessorRating,
    };
    const next: StoredAcademicProfile = {
      customProfessors: [...profileRef.current.customProfessors, nextProfessor],
      updatedAt: Date.now(),
    };

    writeLocalProfile(next);
    setProfile(next);
    setNewProfessorName("");
    setNewProfessorRating("recommended");
    setAddProfessorOpen(false);
    void pushAcademicProfile(next);
  };

  const filteredCourses = CAREER_COURSES.filter((course) => {
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return true;
    return `${course.name} ${course.code}`.toLocaleLowerCase("es").includes(query);
  });

  const route = selectedCourse ? prerequisiteRoute(selectedCourse) : [];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Mi carrera"
    >
      <div className={styles.screen}>
        <header className={styles.topbar}>
          <button type="button" onClick={onClose} aria-label="Volver al horario">
            ‹
          </button>
          <div>
            <strong>Mi carrera</strong>
            <small>Little day aérea</small>
          </div>
          <button
            type="button"
            onClick={() => setProfessorsOpen(true)}
            aria-label="Profesores"
          >
            ⋯
          </button>
        </header>

        <section className={styles.hero}>
          <small>Plan académico</small>
          <h1>Ingeniería Mecatrónica</h1>
          <div className={styles.progressHead}>
            <strong>{progress}%</strong>
            <span>
              {approved.length} de {CAREER_COURSES.length} materias
            </span>
          </div>
          <div className={styles.progressTrack}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.stats}>
            <div>
              <strong>{approvedCredits}</strong>
              <small>créditos aprobados</small>
            </div>
            <div>
              <strong>{current.length}</strong>
              <small>cursando ahora</small>
            </div>
            <div>
              <strong>{available.length}</strong>
              <small>disponibles</small>
            </div>
          </div>
        </section>

        <nav className={styles.tabs} aria-label="Vistas de Mi carrera">
          {(
            [
              ["summary", "Resumen"],
              ["plan", "Plan"],
              ["available", "Disponibles"],
            ] as const
          ).map(([key, label]) => (
            <button
              type="button"
              className={view === key ? styles.activeTab : ""}
              onClick={() => setView(key)}
              key={key}
            >
              {label}
            </button>
          ))}
        </nav>

        <main className={styles.content}>
          {view === "summary" && (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2>Cursando ahora</h2>
                  <button type="button" onClick={() => setView("plan")}>
                    ver plan completo
                  </button>
                </div>
                <div className={styles.card}>
                  {current.map((course) => (
                    <CourseRow
                      course={course}
                      onOpen={setSelectedCourse}
                      key={course.code}
                    />
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2>Tu avance</h2>
                  <button type="button" onClick={() => setView("available")}>
                    qué puedo cursar
                  </button>
                </div>
                <div className={styles.card}>
                  <button
                    type="button"
                    className={styles.summaryRow}
                    onClick={() => setView("plan")}
                  >
                    <span className={`${styles.dot} ${styles.approved}`} />
                    <span>
                      <strong>{approved.length} materias completadas</strong>
                      <small>{approvedCredits} créditos acumulados</small>
                    </span>
                    <em className={`${styles.badge} ${styles.approved}`}>
                      Aprobadas
                    </em>
                  </button>
                  <button
                    type="button"
                    className={styles.summaryRow}
                    onClick={() => setView("available")}
                  >
                    <span className={`${styles.dot} ${styles.available}`} />
                    <span>
                      <strong>{available.length} materias listas para tomar</strong>
                      <small>No requieren desbloqueos adicionales</small>
                    </span>
                    <em className={`${styles.badge} ${styles.available}`}>
                      Disponibles
                    </em>
                  </button>
                  <button
                    type="button"
                    className={styles.summaryRow}
                    onClick={() => setView("plan")}
                  >
                    <span className={`${styles.dot} ${styles.locked}`} />
                    <span>
                      <strong>{locked.length} materias todavía bloqueadas</strong>
                      <small>Toca una materia para ver qué le falta</small>
                    </span>
                    <em className={`${styles.badge} ${styles.locked}`}>
                      Bloqueadas
                    </em>
                  </button>
                </div>
              </section>
            </>
          )}

          {view === "plan" && (
            <>
              <label className={styles.searchBox}>
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar materia o código"
                  aria-label="Buscar materia o código"
                />
              </label>
              <div className={styles.quarters}>
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (quarter) => {
                    const allQuarter = CAREER_COURSES.filter(
                      (course) => course.quarter === quarter,
                    );
                    const items = filteredCourses.filter(
                      (course) => course.quarter === quarter,
                    );
                    if (!items.length) return null;
                    const done = allQuarter.filter(
                      (course) => course.status === "APROBADO",
                    ).length;
                    const taking = allQuarter.filter(
                      (course) => course.status === "CURSANDO",
                    ).length;
                    const expanded =
                      Boolean(search.trim()) || openQuarter === quarter;

                    return (
                      <section
                        className={`${styles.quarter} ${
                          expanded ? styles.quarterOpen : ""
                        }`}
                        key={quarter}
                      >
                        <button
                          type="button"
                          className={styles.quarterHead}
                          onClick={() =>
                            setOpenQuarter((value) =>
                              value === quarter ? null : quarter,
                            )
                          }
                        >
                          <span className={styles.quarterNumber}>{quarter}</span>
                          <span>
                            <strong>Cuatrimestre {quarter}</strong>
                            <small>
                              {done} aprobadas
                              {taking ? ` · ${taking} cursando` : ""} ·{" "}
                              {allQuarter.length} materias
                            </small>
                          </span>
                          <em>›</em>
                        </button>
                        {expanded && (
                          <div className={styles.quarterBody}>
                            {items.map((course) => (
                              <CourseRow
                                course={course}
                                onOpen={setSelectedCourse}
                                key={course.code}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  },
                )}
              </div>
            </>
          )}

          {view === "available" && (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2>Puedes cursar ahora</h2>
                  <span>{available.length} materias</span>
                </div>
                <div className={styles.card}>
                  {available.map((course) => (
                    <CourseRow
                      course={course}
                      onOpen={setSelectedCourse}
                      key={course.code}
                    />
                  ))}
                </div>
              </section>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2>Próximas por desbloquear</h2>
                  <button type="button" onClick={() => setView("plan")}>
                    ver todas
                  </button>
                </div>
                <div className={styles.card}>
                  {locked.slice(0, 5).map((course) => (
                    <CourseRow
                      course={course}
                      onOpen={setSelectedCourse}
                      key={course.code}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {selectedCourse && (
        <div
          className={styles.sheetBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCourse(null);
              setShowRoute(false);
            }
          }}
        >
          <section
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={selectedCourse.name}
          >
            <div className={styles.handle} />
            <h2>{selectedCourse.name}</h2>
            <p>{selectedCourse.code}</p>
            <span
              className={`${styles.detailBadge} ${
                styles[statusMeta(selectedCourse).key]
              }`}
            >
              {statusMeta(selectedCourse).label}
            </span>
            <div className={styles.detailGrid}>
              <div>
                <strong>{selectedCourse.credits}</strong>
                <small>créditos</small>
              </div>
              <div>
                <strong>{selectedCourse.theory}</strong>
                <small>teoría</small>
              </div>
              <div>
                <strong>{selectedCourse.practice}</strong>
                <small>práctica</small>
              </div>
              <div>
                <strong>{selectedCourse.lab}</strong>
                <small>lab</small>
              </div>
            </div>
            <dl className={styles.details}>
              <div>
                <dt>Cuatrimestre</dt>
                <dd>Cuatrimestre {selectedCourse.quarter}</dd>
              </div>
              <div>
                <dt>Horas totales</dt>
                <dd>{selectedCourse.hours} h</dd>
              </div>
              <div>
                <dt>Prerrequisito</dt>
                <dd>
                  {selectedCourse.prereq
                    ? courseByCode(selectedCourse.prereq)?.name ??
                      selectedCourse.prereq
                    : "No tiene"}
                </dd>
              </div>
              <div>
                <dt>Disponibilidad</dt>
                <dd>
                  {selectedCourse.status === "APROBADO"
                    ? "Completada"
                    : selectedCourse.available
                      ? "Sí"
                      : "Bloqueada"}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className={styles.routeButton}
              onClick={() => setShowRoute((value) => !value)}
            >
              {showRoute ? "Ocultar ruta" : "Ver ruta"}
            </button>
            {showRoute && (
              <div className={styles.routeBox}>
                {route.length <= 1 ? (
                  <span>Esta materia no tiene prerrequisitos.</span>
                ) : (
                  route.map((course, index) => (
                    <span key={course.code}>
                      <strong>{course.name}</strong>
                      <small>{course.code}</small>
                      {index < route.length - 1 && <i>↓</i>}
                    </span>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {professorsOpen && (
        <div className={styles.professorsPanel}>
          <header className={styles.topbar}>
            <button
              type="button"
              onClick={() => setProfessorsOpen(false)}
              aria-label="Volver a Mi carrera"
            >
              ‹
            </button>
            <div>
              <strong>Profesores</strong>
              <small>Recomendaciones guardadas</small>
            </div>
            <span />
          </header>
          <section className={styles.professorIntro}>
            <small>Tu lista</small>
            <h2>Profesores</h2>
            <p>
              Verde recomendado, amarillo más o menos y rojo para no volver a
              tomar.
            </p>
          </section>
          <ProfessorGroups professors={allProfessors} />
          <button
            type="button"
            className={styles.addProfessorButton}
            onClick={() => setAddProfessorOpen(true)}
          >
            ＋ Agregar profesor
          </button>
        </div>
      )}

      {addProfessorOpen && (
        <div
          className={styles.formBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddProfessorOpen(false);
          }}
        >
          <form className={styles.professorForm} onSubmit={saveProfessor}>
            <div className={styles.handle} />
            <h2>Agregar profesor</h2>
            <input
              autoFocus
              value={newProfessorName}
              onChange={(event) => setNewProfessorName(event.target.value)}
              placeholder="Nombre del profesor"
              aria-label="Nombre del profesor"
            />
            <div className={styles.ratingChoices}>
              {(
                [
                  ["recommended", "Recomendado"],
                  ["maybe", "Más o menos"],
                  ["avoid", "Nunca más 😭"],
                ] as const
              ).map(([rating, label]) => (
                <button
                  type="button"
                  className={
                    newProfessorRating === rating ? styles.selectedRating : ""
                  }
                  onClick={() => setNewProfessorRating(rating)}
                  key={rating}
                >
                  <span
                    className={`${styles.legendDot} ${styles[rating]}`}
                  />
                  {label}
                </button>
              ))}
            </div>
            <button type="submit" className={styles.saveProfessorButton}>
              Guardar profesor
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CareerPlanBridge() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ensureSlot = () => {
      const card = document.querySelector<HTMLElement>(".timetable-card");
      if (!card) {
        setSlot((current) => {
          current?.remove();
          return null;
        });
        return;
      }

      const editing = Boolean(
        card.querySelector(
          ".timetable-term-fields, .timetable-class-form-card, .timetable-edit-form",
        ),
      );
      let mount = card.querySelector<HTMLElement>(
        "[data-aerea-career-plan-slot]",
      );

      if (editing) {
        mount?.remove();
        setSlot(null);
        return;
      }

      if (!mount) {
        const heading = card.querySelector<HTMLElement>(".timetable-heading");
        if (!heading) return;
        mount = document.createElement("div");
        mount.dataset.aereaCareerPlanSlot = "true";
        heading.insertAdjacentElement("afterend", mount);
      }
      setSlot((current) => (current === mount ? current : mount));
    };

    ensureSlot();
    const observer = new MutationObserver(ensureSlot);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document
        .querySelector<HTMLElement>("[data-aerea-career-plan-slot]")
        ?.remove();
    };
  }, []);

  return (
    <>
      {slot &&
        !open &&
        createPortal(
          <div className={styles.timetableSwitcher} aria-label="Sección académica">
            <button type="button" className={styles.switcherActive}>
              Horario
            </button>
            <button type="button" onClick={() => setOpen(true)}>
              Mi carrera
            </button>
          </div>,
          slot,
        )}
      {open &&
        createPortal(
          <CareerPlanOverlay onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}
