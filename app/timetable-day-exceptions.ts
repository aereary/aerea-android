export type TimetableDayException = {
  date: string;
  kind: "no-classes" | "day-off" | "exam-day" | "vacation";
  // An empty list means every class on this date is skipped.
  meetingIds?: string[];
};

export const timetableExceptionLabels: Record<TimetableDayException["kind"], string> = {
  "no-classes": "No classes",
  "day-off": "Day off",
  "exam-day": "Exam day",
  vacation: "Vacation",
};

export function timetableMeetingSkipped(
  exception: TimetableDayException,
  classId: string,
  meetingId: string,
) {
  if (exception.kind === "exam-day") return false;
  if (exception.kind !== "no-classes") return true;
  return !exception.meetingIds?.length ||
    exception.meetingIds.includes(`${classId}:${meetingId}`);
}
