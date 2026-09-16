/**
 * Safe, user-editable product defaults.
 *
 * Keep this file limited to presentation and ordinary product defaults. It must
 * never import Supabase, Android plugins, storage, authentication, AO3, or sync
 * code. See docs/MANUAL_CUSTOMIZATION.md before changing functional modules.
 */
export const APP_IDENTITY = {
  name: "aérea",
  pageTitle: "aérea — your gentle little day",
  manifestName: "aérea — gentle calendar & notes",
  pageDescription:
    "A cozy pastel calendar, notes, habits, focus timer, recordings, moods, and sketchbook.",
  manifestDescription:
    "A cozy personal calendar, notes, habits, focus timer, recordings, moods, and sketchbook.",
} as const;

export const APP_APPEARANCE = {
  browserThemeColor: "#bfe7f7",
  manifestBackgroundColor: "#fffdf9",
} as const;

export const UI_DEFAULTS = {
  language: "en",
  hydrationNotificationTimes: ["10:00", "14:00", "18:00"],
} as const;

export const DEFAULT_HYDRATION_NOTIFICATION_TIMES =
  UI_DEFAULTS.hydrationNotificationTimes;
