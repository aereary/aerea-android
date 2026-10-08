export type HealthCompletionEvent<Color extends string = string> = {
  calendar?: string;
  color: Color;
  healthCompletedDates?: string[];
};

export type HabitCompletionState = {
  days: boolean[];
  missedDays?: boolean[];
};

export type TimetableRangeItem = {
  start: string;
  end: string;
};

export function formatTimeBlock(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return { primary: time, secondary: "TIME" };

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return { primary: time, secondary: "TIME" };
  }

  return {
    primary: `${hours % 12 || 12}:${String(minutes).padStart(2, "0")}`,
    secondary: hours >= 12 ? "PM" : "AM",
  };
}

export function isHealthCompletionEvent(event: { calendar?: string }) {
  return event.calendar?.trim().toLowerCase() === "health";
}

export function isHealthCompletedOn(
  event: { healthCompletedDates?: string[] },
  dateKey: string,
) {
  return event.healthCompletedDates?.includes(dateKey) === true;
}

export function eventDisplayColor<Color extends string>(
  event: HealthCompletionEvent<Color>,
  dateKey: string,
): Color | "emerald" {
  return isHealthCompletionEvent(event) && isHealthCompletedOn(event, dateKey)
    ? "emerald"
    : event.color;
}

export function toggleHealthCompletedOn<
  Event extends HealthCompletionEvent,
>(event: Event, dateKey: string): Event {
  if (!isHealthCompletionEvent(event)) return event;
  const completedDates = new Set(event.healthCompletedDates ?? []);
  if (completedDates.has(dateKey)) completedDates.delete(dateKey);
  else completedDates.add(dateKey);
  return {
    ...event,
    healthCompletedDates: Array.from(completedDates).sort(),
  };
}

export function cycleHabitDay<Habit extends HabitCompletionState>(
  habit: Habit,
  dayIndex: number,
): Habit {
  if (dayIndex < 0 || dayIndex >= habit.days.length) return habit;
  const days = [...habit.days];
  const missedDays = Array.from(
    { length: habit.days.length },
    (_, index) => habit.missedDays?.[index] === true,
  );

  if (days[dayIndex]) {
    days[dayIndex] = false;
    missedDays[dayIndex] = true;
  } else if (missedDays[dayIndex]) {
    missedDays[dayIndex] = false;
  } else {
    days[dayIndex] = true;
    missedDays[dayIndex] = false;
  }

  return { ...habit, days, missedDays };
}

function timeToMinutes(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function timetableGridWindow(classes: TimetableRangeItem[]) {
  const starts = classes.flatMap((item) => {
    const value = timeToMinutes(item.start);
    return value === null ? [] : [value];
  });
  const ends = classes.flatMap((item) => {
    const value = timeToMinutes(item.end);
    return value === null ? [] : [value];
  });
  const first = starts.length ? Math.min(...starts) : 8 * 60;
  const last = ends.length ? Math.max(...ends) : 18 * 60;
  const start = Math.max(0, Math.floor(first / 60) * 60);
  const requestedEnd = Math.min(24 * 60, Math.ceil(last / 60) * 60);
  const end = Math.min(24 * 60, Math.max(requestedEnd, start + 6 * 60));
  return { start, end, hours: Math.max(1, (end - start) / 60) };
}

export function timetableClassPosition(
  item: TimetableRangeItem,
  gridStart: number,
  gridEnd: number,
) {
  const start = timeToMinutes(item.start) ?? gridStart;
  const end = timeToMinutes(item.end) ?? start + 60;
  const duration = Math.max(1, gridEnd - gridStart);
  const visibleStart = Math.max(gridStart, Math.min(gridEnd, start));
  const visibleEnd = Math.max(
    visibleStart + 15,
    Math.min(gridEnd, Math.max(end, start + 15)),
  );
  return {
    top: `${((visibleStart - gridStart) / duration) * 100}%`,
    height: `${((Math.min(gridEnd, visibleEnd) - visibleStart) / duration) * 100}%`,
  };
}


export type TimedCalendarEvent = {
  date: string;
  time: string;
  endDate?: string;
  endTime?: string;
  allDay?: boolean;
  timePending?: boolean;
};

function localEventTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || timeToMinutes(time) === null) return null;
  const [year, month, day] = date.split("-").map(Number);
  const minutes = timeToMinutes(time)!;
  const value = new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
  if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day) return null;
  return value;
}

/** Local occurrence dates, including midnight crossings. Unknown times stay unknown. */
export function eventTimeWindow(event: TimedCalendarEvent) {
  if (event.allDay || event.timePending) return null;
  const start = localEventTime(event.date, event.time);
  if (!start) return null;
  const end = event.endTime
    ? localEventTime(event.endDate || event.date, event.endTime)
    : new Date(start.getTime() + 60 * 60_000);
  if (!end) return null;
  if (end.getTime() < start.getTime() && (!event.endDate || event.endDate === event.date)) {
    end.setDate(end.getDate() + 1);
  }
  if (end.getTime() <= start.getTime()) return null;
  return { start: start.getTime(), end: end.getTime() };
}

export function eventCountdown(event: TimedCalendarEvent, now: Date) {
  const window = eventTimeWindow(event);
  if (!window || !Number.isFinite(now.getTime()) || now.getTime() >= window.end) return null;
  if (now.getTime() >= window.start) {
    return { active: true, label: "now", description: "Happening now" };
  }
  const minutes = Math.ceil((window.start - now.getTime()) / 60_000);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return {
    active: false,
    label: `in ${hours}:${String(remainder).padStart(2, "0")}`,
    description: `Starts in ${hours} hours and ${remainder} minutes`,
  };
}
