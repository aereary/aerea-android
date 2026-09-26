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
import { supabase } from "./supabase-client";
import styles from "./career-plan.module.css";

const LOCAL_KEY = "aerea-academic-profile-v1";

type CareerView = "summary" | "plan" | "available";

type CourseProgressState =
  | "completed"
  | "inProgress"
  | "withdrawn"
  | "pending";

type StoredAcademicProfile = {
  customProfessors: CareerProfessor[];
  courseStates: Record<string, CourseProgressState>;
  updatedAt: number;
};

const EMPTY_PROFILE: StoredAcademicProfile = {
  customProfessors: [],
  courseStates: {},
  updatedAt: 0,
};

function normalizeCourseStates(
  value: unknown,
): Record<string, CourseProgressState> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const validCodes = new Set(CAREER_COURSES.map((course) => course.code));
  const validStates = new Set<CourseProgressState>([
    "completed",
    "inProgress",
    "withdrawn",
    "pending",
  ]);

  return Object.fromEntries(
    Object.entries(value).filter(
      ([code, state]) =>
        validCodes.has(code) &&
        typeof state === "string" &&
        validStates.has(state as CourseProgressState),
    ),
  ) as Record<string, CourseProgressState>;
}

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
      courseStates: normalizeCourseStates(parsed?.courseStates),
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
      state: {
        customProfessors: profile.customProfessors,
        courseStates: profile.courseStates,
      },
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

function baselineCourseState(
  course: CareerCourse,
): CourseProgressState {
  if (course.status === "APROBADO") return "completed";
  if (course.status === "CURSANDO") return "inProgress";
  return "pending";
}

function courseState(
  course: CareerCourse,
  states: Record<string, CourseProgressState>,
): CourseProgressState {
  return states[course.code] ?? baselineCourseState(course);
}

function statusMeta(
  state: CourseProgressState,
  available: boolean,
) {
  if (state === "completed")
    return { key: "approved", label: "Completed" } as const;
  if (state === "inProgress")
    return { key: "current", label: "In progress" } as const;
  if (state === "withdrawn")
    return { key: "withdrawn", label: "Withdrawn" } as const;
  if (available)
    return { key: "available", label: "Available" } as const;
  return { key: "locked", label: "Locked" } as const;
}

function courseByCode(code: string) {
  return CAREER_COURSES.find((course) => course.code === code) ?? null;
}

function isCourseAvailable(
  course: CareerCourse,
  states: Record<string, CourseProgressState>,
) {
  if (!course.prereq) return course.available;

  const prerequisite = courseByCode(course.prereq);
  if (!prerequisite) return course.available;

  return courseState(prerequisite, states) === "completed";
}

function professorRatingLabel(rating: ProfessorRating) {
  if (rating === "recommended") return "Recommended";
  if (rating === "maybe") return "Maybe";
  return "Never again";
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
  courseStates,
}: {
  course: CareerCourse;
  onOpen: (course: CareerCourse) => void;
  courseStates: Record<string, CourseProgressState>;
}) {
  const state = courseState(course, courseStates);
  const meta = statusMeta(
    state,
    isCourseAvailable(course, courseStates),
  );
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
          {course.code} · {course.credits} credits · Term {course.quarter}
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
  onAddProfessor,
}: {
  professors: readonly CareerProfessor[];
  onAddProfessor: (rating: ProfessorRating) => void;
}) {
  const longPressRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPress = () => {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    longPressStartRef.current = null;
  };

  const beginLongPress = (
    rating: ProfessorRating,
    x: number,
    y: number,
  ) => {
    clearLongPress();
    longPressStartRef.current = { x, y };

    longPressRef.current = window.setTimeout(() => {
      longPressRef.current = null;
      longPressStartRef.current = null;
      navigator.vibrate?.(18);
      onAddProfessor(rating);
    }, 520);
  };

  const moveLongPress = (x: number, y: number) => {
    const start = longPressStartRef.current;
    if (!start) return;

    if (Math.hypot(x - start.x, y - start.y) > 12) {
      clearLongPress();
    }
  };

  const groups: {
    rating: ProfessorRating;
    title: string;
    note: string;
  }[] = [
    {
      rating: "recommended",
      title: "Recommended",
      note: "Would take again",
    },
    { rating: "maybe", title: "Maybe", note: "Proceed with caution" },
    { rating: "avoid", title: "Never again", note: "Absolutely not 😭" },
  ];

  return (
    <div className={styles.professorGroups}>
      {groups.map((group) => {
        const items = professors.filter(
          (professor) => professor.rating === group.rating,
        );

        return (
          <section
            className={styles.professorGroup}
            key={group.rating}
            role="group"
            aria-label={`${group.title} professors. Press and hold to add.`}
            onPointerDown={(event) =>
              beginLongPress(
                group.rating,
                event.clientX,
                event.clientY,
              )
            }
            onPointerUp={clearLongPress}
            onPointerCancel={clearLongPress}
            onPointerLeave={clearLongPress}
            onPointerMove={(event) =>
              moveLongPress(event.clientX, event.clientY)
            }
            onContextMenu={(event) => {
              event.preventDefault();
              clearLongPress();
              onAddProfessor(group.rating);
            }}
          >
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
              {items.length ? (
                items.map((professor) => (
                  <span
                    className={`${styles.professorChip} ${
                      styles[professor.rating]
                    }`}
                    key={professor.id}
                  >
                    {professor.name}
                  </span>
                ))
              ) : (
                <span className={styles.emptyProfessorGroup}>
                  Press and hold here to add one
                </span>
              )}
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
    () =>
      CAREER_COURSES.filter(
        (course) =>
          courseState(course, profile.courseStates) === "completed",
      ),
    [profile.courseStates],
  );

  const current = useMemo(
    () =>
      CAREER_COURSES.filter(
        (course) =>
          courseState(course, profile.courseStates) === "inProgress",
      ),
    [profile.courseStates],
  );

  const available = useMemo(
    () =>
      CAREER_COURSES.filter((course) => {
        const state = courseState(course, profile.courseStates);
        return (
          (state === "pending" || state === "withdrawn") &&
          isCourseAvailable(course, profile.courseStates)
        );
      }),
    [profile.courseStates],
  );

  const locked = useMemo(
    () =>
      CAREER_COURSES.filter((course) => {
        const state = courseState(course, profile.courseStates);
        return (
          (state === "pending" || state === "withdrawn") &&
          !isCourseAvailable(course, profile.courseStates)
        );
      }),
    [profile.courseStates],
  );

  const approvedCredits = approved.reduce(
    (total, course) => total + course.credits,
    0,
  );

  const progress =
    Math.round(
      (approved.length / CAREER_COURSES.length) * 1000,
    ) / 10;

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
        courseStates: normalizeCourseStates(
          data.state && typeof data.state === "object"
            ? (data.state as { courseStates?: unknown }).courseStates
            : undefined,
        ),
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
      } else if (
        (
          remote.customProfessors.length > 0 ||
          Object.keys(remote.courseStates).length > 0
        ) &&
        local.customProfessors.length === 0 &&
        Object.keys(local.courseStates).length === 0
      ) {
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
      courseStates: profileRef.current.courseStates,
      updatedAt: Date.now(),
    };

    writeLocalProfile(next);
    setProfile(next);
    setNewProfessorName("");
    setNewProfessorRating("recommended");
    setAddProfessorOpen(false);
    void pushAcademicProfile(next);
  };

  const updateCourseState = (
    course: CareerCourse,
    state: CourseProgressState,
  ) => {
    const next: StoredAcademicProfile = {
      customProfessors: profileRef.current.customProfessors,
      courseStates: {
        ...profileRef.current.courseStates,
        [course.code]: state,
      },
      updatedAt: Date.now(),
    };

    writeLocalProfile(next);
    setProfile(next);
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
      aria-label="My degree"
    >
      <div className={styles.screen}>
        <header className={styles.topbar}>
          <button type="button" onClick={onClose} aria-label="Back to schedule">
            ‹
          </button>
          <div>
            <strong>My degree</strong>
            <small>Little day aérea</small>
          </div>
          <button
            type="button"
            onClick={() => setProfessorsOpen(true)}
            aria-label="Professors"
          >
            ⋯
          </button>
        </header>

        <section className={styles.hero}>
          <small>Degree plan</small>
          <h1>Ingeniería Mecatrónica</h1>
          <div className={styles.progressHead}>
            <strong>{progress}%</strong>
            <span>
              {approved.length} of {CAREER_COURSES.length} courses
            </span>
          </div>
          <div className={styles.progressTrack}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.stats}>
            <div>
              <strong>{approvedCredits}</strong>
              <small>credits completed</small>
            </div>
            <div>
              <strong>{current.length}</strong>
              <small>in progress now</small>
            </div>
            <div>
              <strong>{available.length}</strong>
              <small>available</small>
            </div>
          </div>
        </section>

        <nav className={styles.tabs} aria-label="My degree views">
          {(
            [
              ["summary", "Overview"],
              ["plan", "Plan"],
              ["available", "Available"],
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
                  <h2>In progress</h2>
                  <button type="button" onClick={() => setView("plan")}>
                    view full plan
                  </button>
                </div>
                <div className={styles.card}>
                  {current.map((course) => (
                    <CourseRow
                      course={course}
                      onOpen={setSelectedCourse}
                      courseStates={profile.courseStates}
                      key={course.code}
                    />
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2>Your progress</h2>
                  <button type="button" onClick={() => setView("available")}>
                    what can I take
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
                      <strong>{approved.length} courses completed</strong>
                      <small>{approvedCredits} credits earned</small>
                    </span>
                    <em className={`${styles.badge} ${styles.approved}`}>
                      Completed
                    </em>
                  </button>
                  <button
                    type="button"
                    className={styles.summaryRow}
                    onClick={() => setView("available")}
                  >
                    <span className={`${styles.dot} ${styles.available}`} />
                    <span>
                      <strong>{available.length} courses ready to take</strong>
                      <small>No additional prerequisites needed</small>
                    </span>
                    <em className={`${styles.badge} ${styles.available}`}>
                      Available
                    </em>
                  </button>
                  <button
                    type="button"
                    className={styles.summaryRow}
                    onClick={() => setView("plan")}
                  >
                    <span className={`${styles.dot} ${styles.locked}`} />
                    <span>
                      <strong>{locked.length} courses still locked</strong>
                      <small>Tap a course to see what it needs</small>
                    </span>
                    <em className={`${styles.badge} ${styles.locked}`}>
                      Locked
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
                  placeholder="Search course or code"
                  aria-label="Search course or code"
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
                      (course) =>
                        courseState(course, profile.courseStates) ===
                        "completed",
                    ).length;
                    const taking = allQuarter.filter(
                      (course) =>
                        courseState(course, profile.courseStates) ===
                        "inProgress",
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
                            <strong>Term {quarter}</strong>
                            <small>
                              {done} completed
                              {taking ? ` · ${taking} in progress` : ""} ·{" "}
                              {allQuarter.length} courses
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
                      courseStates={profile.courseStates}
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
                  <h2>Available now</h2>
                  <span>{available.length} courses</span>
                </div>
                <div className={styles.card}>
                  {available.map((course) => (
                    <CourseRow
                      course={course}
                      onOpen={setSelectedCourse}
                      courseStates={profile.courseStates}
                      key={course.code}
                    />
                  ))}
                </div>
              </section>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2>Next to unlock</h2>
                  <button type="button" onClick={() => setView("plan")}>
                    view all
                  </button>
                </div>
                <div className={styles.card}>
                  {locked.slice(0, 5).map((course) => (
                    <CourseRow
                      course={course}
                      onOpen={setSelectedCourse}
                      courseStates={profile.courseStates}
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
                styles[
                  statusMeta(
                    courseState(selectedCourse, profile.courseStates),
                    isCourseAvailable(selectedCourse, profile.courseStates),
                  ).key
                ]
              }`}
            >
              {statusMeta(
                courseState(selectedCourse, profile.courseStates),
                isCourseAvailable(selectedCourse, profile.courseStates),
              ).label}
            </span>

            <div className={styles.courseStatusEditor}>
              <small>Update course status</small>
              <div className={styles.courseStatusChoices}>
                {(
                  [
                    ["pending", "Pending"],
                    ["inProgress", "In progress"],
                    ["completed", "Completed"],
                    ["withdrawn", "Withdrawn"],
                  ] as const
                ).map(([state, label]) => (
                  <button
                    type="button"
                    className={
                      courseState(
                        selectedCourse,
                        profile.courseStates,
                      ) === state
                        ? styles.selectedCourseStatus
                        : ""
                    }
                    onClick={() =>
                      updateCourseState(selectedCourse, state)
                    }
                    key={state}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.detailGrid}>
              <div>
                <strong>{selectedCourse.credits}</strong>
                <small>credits</small>
              </div>
              <div>
                <strong>{selectedCourse.theory}</strong>
                <small>theory</small>
              </div>
              <div>
                <strong>{selectedCourse.practice}</strong>
                <small>practice</small>
              </div>
              <div>
                <strong>{selectedCourse.lab}</strong>
                <small>lab</small>
              </div>
            </div>
            <dl className={styles.details}>
              <div>
                <dt>Term</dt>
                <dd>Term {selectedCourse.quarter}</dd>
              </div>
              <div>
                <dt>Total hours</dt>
                <dd>{selectedCourse.hours} h</dd>
              </div>
              <div>
                <dt>Prerequisite</dt>
                <dd>
                  {selectedCourse.prereq
                    ? courseByCode(selectedCourse.prereq)?.name ??
                      selectedCourse.prereq
                    : "None"}
                </dd>
              </div>
              <div>
                <dt>Availability</dt>
                <dd>
                  {courseState(
                    selectedCourse,
                    profile.courseStates,
                  ) === "completed"
                    ? "Completed"
                    : courseState(
                          selectedCourse,
                          profile.courseStates,
                        ) === "inProgress"
                      ? "In progress"
                      : courseState(
                            selectedCourse,
                            profile.courseStates,
                          ) === "withdrawn"
                        ? "Withdrawn"
                        : isCourseAvailable(
                              selectedCourse,
                              profile.courseStates,
                            )
                          ? "Yes"
                          : "Locked"}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className={styles.routeButton}
              onClick={() => setShowRoute((value) => !value)}
            >
              {showRoute ? "Hide route" : "View route"}
            </button>
            {showRoute && (
              <div className={styles.routeBox}>
                {route.length <= 1 ? (
                  <span>This course has no prerequisites.</span>
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
              aria-label="Back to My degree"
            >
              ‹
            </button>
            <div>
              <strong>Professors</strong>
              <small>Saved recommendations</small>
            </div>
            <span />
          </header>
          <section className={styles.professorIntro}>
            <small>Your list</small>
            <h2>Professors</h2>
            <p>
              Green is recommended, yellow is maybe, and red is never again. Press and hold a color section to add a professor there.
            </p>
          </section>
          <ProfessorGroups
            professors={allProfessors}
            onAddProfessor={(rating) => {
              setNewProfessorName("");
              setNewProfessorRating(rating);
              setAddProfessorOpen(true);
            }}
          />
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
            <h2>Add to {professorRatingLabel(newProfessorRating)}</h2>
            <div
              className={`${styles.professorTarget} ${
                styles[newProfessorRating]
              }`}
            >
              <span
                className={`${styles.legendDot} ${
                  styles[newProfessorRating]
                }`}
              />
              {professorRatingLabel(newProfessorRating)}
            </div>
            <input
              autoFocus
              value={newProfessorName}
              onChange={(event) => setNewProfessorName(event.target.value)}
              placeholder="Professor name"
              aria-label="Professor name"
            />
            <button type="submit" className={styles.saveProfessorButton}>
              Save professor
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
          <div className={styles.timetableSwitcher} aria-label="Academic section">
            <button type="button" className={styles.switcherActive}>
              Schedule
            </button>
            <button type="button" onClick={() => setOpen(true)}>
              My degree
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
