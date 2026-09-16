"use client";

import { useEffect } from "react";

const LONG_DAY_LABELS: Record<string, string> = {
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

function formatAgendaTime(value: string, stacked = false) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return value;

  const period = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  const formatted = `${hour}:${String(minutes).padStart(2, "0")}`;
  return stacked ? `${formatted}\n${period}` : `${formatted} ${period}`;
}

function enhanceTimetable(board: HTMLElement) {
  board.classList.add("timetable-agenda-board");

  const headings = Array.from(
    board.querySelectorAll<HTMLElement>(
      ":scope > .timetable-grid-day-label",
    ),
  );
  const days = Array.from(
    board.querySelectorAll<HTMLElement>(
      ":scope > .timetable-grid-day",
    ),
  );

  days.forEach((day, index) => {
    const shortDay =
      headings[index]?.textContent?.trim().toUpperCase() ?? "";
    day.dataset.agendaDay =
      LONG_DAY_LABELS[shortDay] || shortDay || "Class day";

    const classButtons = Array.from(
      day.querySelectorAll<HTMLButtonElement>(
        ":scope > .timetable-class-block",
      ),
    );

    day.dataset.agendaCount =
      classButtons.length === 1
        ? "1 class"
        : `${classButtons.length} classes`;
    day.dataset.agendaEmpty =
      classButtons.length === 0 ? "true" : "false";

    classButtons.forEach((button) => {
      const label = button.getAttribute("aria-label") ?? "";
      const match = label.match(
        /,\s*(SUN|MON|TUE|WED|THU|FRI|SAT)\s*,\s*(\d{1,2}:\d{2})\s+to\s+(\d{1,2}:\d{2})$/i,
      );

      if (!match) return;

      button.dataset.agendaStart = formatAgendaTime(match[2], true);
      button.dataset.agendaUntil =
        `until ${formatAgendaTime(match[3])}`;
    });
  });
}

function enhanceAllTimetables() {
  document
    .querySelectorAll<HTMLElement>(".timetable-board")
    .forEach(enhanceTimetable);
}

export default function TimetableAgendaBridge() {
  useEffect(() => {
    enhanceAllTimetables();

    const observer = new MutationObserver(() => {
      enhanceAllTimetables();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
