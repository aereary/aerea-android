"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";
import {
  AEREA_ACCOUNT,
  currentAereaEmail,
  deleteAereaLibraryFile,
  downloadAereaLibraryFile,
  fetchSportsFixtures,
  handleAereaAuthCallback,
  pushCloudState,
  readBrowserSketches,
  readBrowserState,
  reconcileCloudState,
  requestAereaCode,
  supabase,
  syncFollowedSportsTeams,
  uploadAereaLibraryFile,
  verifyAereaCode,
  writeBrowserSketches,
  writeBrowserState,
} from "./supabase-sync";
import {
  DEFAULT_RESET_PREFERENCES,
  DEFAULT_SPORTS_SETTINGS,
  INITIAL_SPORTS_TEAMS,
  addDays,
  createTrashItem,
  fileKind,
  inferInboxKind,
  rangesOverlap,
  trashDaysRemaining,
  type EntityLink,
  type InboxItem,
  type LibraryCollection,
  type LibraryItem,
  type PostIt,
  type PostItGroup,
  type ResetPreferences,
  type SportsEvent,
  type SportsSettings,
  type TaskItem,
  type TrashItem,
} from "./aerea-features";
import {
  ChangeEvent,
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Tab = "today" | "habits" | "focus" | "journal" | "spaces";
type Space =
  | "menu"
  | "inbox"
  | "classes"
  | "library"
  | "postits"
  | "sketchbook"
  | "trash";
type PageStyle = "grid" | "lined" | "dotted" | "plain";
type AppTheme =
  | "storybook"
  | "otter"
  | "strawberry"
  | "duckpond"
  | "bunnybakery"
  | "mooncat"
  | "whalesong"
  | "ribbonpromise"
  | "gentlekitten"
  | "softguidance"
  | "velvetrest"
  | "peachparlor"
  | "mintletter"
  | "blueberrynight"
  | "sunsetsea"
  | "duckmail"
  | "calicotea"
  | "moonquilt"
  | "custom";
type ColorMode = "light" | "dark";
type SafePlaceMode = "home" | "hold" | "praise" | "cry" | "little";

type AereaWidgetPlugin = {
  sync(options: {
    date: string;
    eventTitle: string;
    eventTime: string;
    temperature: string;
    progress: string;
    theme: "storybook" | "otter";
    daysJson: string;
  }): Promise<void>;
};

const AereaWidget = registerPlugin<AereaWidgetPlugin>("AereaWidget");

type AereaAuthPlugin = {
  getPendingLink(): Promise<{ url: string | null }>;
};

type SystemBarsPlugin = {
  setStyle(options: {
    style: "LIGHT" | "DARK";
    bar?: "StatusBar" | "NavigationBar";
  }): Promise<void>;
};

type AereaSportsNotificationsPlugin = {
  requestPermissions(): Promise<{ notifications?: string }>;
  sync(options: {
    eventsJson: string;
    enabled: boolean;
    leadMinutes: number;
  }): Promise<void>;
};

const AereaAuth = registerPlugin<AereaAuthPlugin>("AereaAuth");
const SystemBars = registerPlugin<SystemBarsPlugin>("SystemBars");
const AereaSportsNotifications =
  registerPlugin<AereaSportsNotificationsPlugin>("AereaSportsNotifications");

type AereaStoragePlugin = {
  getState(): Promise<{ state: string | null }>;
  putState(options: { state: string }): Promise<void>;
  listSketches(): Promise<{ pages: SketchPage[] }>;
  saveSketch(options: {
    title: string;
    pageStyle: PageStyle;
    dataUrl: string;
  }): Promise<void>;
  deleteSketch(options: { id: string }): Promise<void>;
  saveFile(options: {
    name: string;
    mimeType: string;
    dataUrl: string;
  }): Promise<{ id: string }>;
  readFile(options: { id: string }): Promise<{
    name: string;
    mimeType: string;
    dataUrl: string;
  }>;
  deleteFile(options: { id: string }): Promise<void>;
};

const AereaStorage = registerPlugin<AereaStoragePlugin>("AereaStorage");
const isNative = () => Capacitor.isNativePlatform();

async function blobAsDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

type CustomTheme = {
  accent: string;
  background: string;
  highlight: string;
  art: string;
};

type Reminder = {
  id: number;
  title: string;
  detail: string;
  icon: string;
  tint: string;
};

type Habit = {
  id: number;
  title: string;
  icon: string;
  color: string;
  days: boolean[];
  streak: number;
};

type JournalEntry = {
  id: number;
  date: string;
  mood: string;
  text: string;
};

type SecretDiaryEntry = {
  id: number;
  date: string;
  feeling: string;
  text: string;
};

type Recording = {
  id: number;
  className: string;
  name: string;
  notes: string;
  duration: number;
  url?: string;
};

type ClassItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  time: string;
  endDate?: string;
  endTime?: string;
  allDay?: boolean;
  calendar?: string;
  memo?: boolean;
  color: EventColor;
  guests?: string;
  reminder?: string;
  repeat?: RepeatOption;
  customRepeatEvery?: number;
  customRepeatUnit?: "days" | "weeks" | "months";
  dayCounter?: boolean;
  location?: string;
  url?: string;
  note?: string;
  todos?: string[];
  todoStates?: ("pending" | "done" | "missed")[];
  files?: string[];
  attachmentIds?: string[];
  attachedNoteIds?: number[];
  attachedRecordingIds?: number[];
  tags?: string[];
  priority?: "gentle" | "important" | "urgent";
  eventType?: "personal" | "sports_event";
  sportsEventId?: string;
  sportsCardStyle?: boolean;
  sportsPrimary?: string;
  sportsSecondary?: string;
  sportsIcon?: string;
  sourceInboxId?: string;
};

type EventColor =
  | "lilac"
  | "yellow"
  | "blue"
  | "pink"
  | "emerald"
  | "cyan"
  | "brown"
  | "black"
  | "red"
  | "rose"
  | "coral"
  | "orange";

type RepeatOption =
  | "Never"
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Yearly"
  | "Custom";

type EventDraft = Omit<CalendarEvent, "id">;

type SketchPage = {
  id: string;
  title: string;
  pageStyle: PageStyle;
  createdAt: string;
  updatedAt: string;
  dataUrl?: string;
};

type SketchPoint = {
  x: number;
  y: number;
  pressure: number;
};

type SketchStroke = {
  tool: "pen" | "eraser";
  color: string;
  size: number;
  points: SketchPoint[];
};

type AereaHistorySnapshot = {
  reminders: Reminder[];
  reminderHistory: Record<string, number[]>;
  calendarEvents: CalendarEvent[];
  entries: JournalEntry[];
  tasks: TaskItem[];
  inboxItems: InboxItem[];
  postIts: PostIt[];
  postItGroups: PostItGroup[];
  libraryItems: LibraryItem[];
  libraryCollections: LibraryCollection[];
  entityLinks: EntityLink[];
  trashItems: TrashItem[];
  classItems: ClassItem[];
  recordings: Recording[];
  selectedClass: string;
};

type AereaHistoryEntry = {
  label: string;
  snapshot: AereaHistorySnapshot;
};

const themeOptions: {
  id: Exclude<AppTheme, "custom">;
  name: string;
  description: string;
  colors: [string, string, string];
  icon: string;
  art: string;
  accents: [string, string];
  charm: string;
  showCharm?: boolean;
  decoratedScene?: boolean;
}[] = [
  {
    id: "storybook",
    name: "Cloudberry meadow",
    description: "Blueberry baskets, soft clouds, tiny flowers, and grassy hills.",
    colors: ["#bdeaff", "#f8fff5", "#9bd66f"],
    icon: "🫐",
    art: "/assets/openmoji/blueberries.svg",
    accents: [
      "/assets/openmoji/cloud.svg",
      "/assets/openmoji/blossom.svg",
    ],
    charm: "tiny progress",
  },
  {
    id: "otter",
    name: "Lavender otter",
    description: "A sleepy little sea otter floating in lilac bubbles and peach stars.",
    colors: ["#aaa4f5", "#f7f5ff", "#f4b5a8"],
    icon: "🦦",
    art: "/assets/openmoji/otter.svg",
    accents: [
      "/assets/openmoji/star.svg",
      "/assets/openmoji/blossom.svg",
    ],
    charm: "you may rest",
  },
  {
    id: "strawberry",
    name: "Strawberry picnic",
    description: "Strawberries, picnic baskets, pink gingham, and little blossoms.",
    colors: ["#ffd7df", "#fffaf2", "#9fcf85"],
    icon: "🍓",
    art: "/assets/openmoji/strawberry.svg",
    accents: [
      "/assets/openmoji/basket.svg",
      "/assets/openmoji/blossom.svg",
    ],
    charm: "sweet effort",
  },
  {
    id: "duckpond",
    name: "Duckling pond",
    description: "A tiny duck, blue water, butter-yellow light, and spring tulips.",
    colors: ["#cceeff", "#fff8cf", "#a8d98d"],
    icon: "🦆",
    art: "/assets/openmoji/duck.svg",
    accents: [
      "/assets/openmoji/tulip.svg",
      "/assets/openmoji/cloud.svg",
    ],
    charm: "one soft step",
  },
  {
    id: "bunnybakery",
    name: "Bunny bakery",
    description: "Warm bread, vanilla cream, rosy cheeks, and a very polite bunny.",
    colors: ["#f7dec7", "#fffaf0", "#efb7c8"],
    icon: "🐇",
    art: "/assets/openmoji/bunny.svg",
    accents: [
      "/assets/openmoji/croissant.svg",
      "/assets/openmoji/blossom.svg",
    ],
    charm: "good job",
  },
  {
    id: "mooncat",
    name: "Moonlit calico",
    description: "A dreamy blue night with one curious cat, moonlight, and soft stars.",
    colors: ["#8fa9ef", "#eef0ff", "#ffd27d"],
    icon: "🐈",
    art: "/assets/openmoji/cat.svg",
    accents: [
      "/assets/openmoji/moon.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "stay close",
  },
  {
    id: "whalesong",
    name: "Little whale song",
    description: "Sea-glass blues, foamy clouds, lavender water, and a gentle whale.",
    colors: ["#9ee3ef", "#f8fdff", "#b9a9ef"],
    icon: "🐋",
    art: "/assets/openmoji/whale.svg",
    accents: [
      "/assets/openmoji/cloud.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "breathe softly",
  },
  {
    id: "ribbonpromise",
    name: "Ribbon promise",
    description: "Blush ribbons, cream stationery, tiny hearts, and gentle praise.",
    colors: ["#f6cddd", "#fff9f0", "#c8b8ec"],
    icon: "🎀",
    art: "/assets/openmoji/blossom.svg",
    accents: [
      "/assets/openmoji/strawberry.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "good little star",
  },
  {
    id: "gentlekitten",
    name: "Gentle kitten",
    description: "A sleepy kitten, lavender dusk, soft rules, and warm approval.",
    colors: ["#c8c2f4", "#fbf7ff", "#f2b8ac"],
    icon: "🐈",
    art: "/assets/openmoji/cat.svg",
    accents: [
      "/assets/openmoji/moon.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "good kitten",
  },
  {
    id: "softguidance",
    name: "Soft guidance",
    description: "Powder-blue skies, quiet steps, little check-ins, and calm direction.",
    colors: ["#c9ebf5", "#fffdf6", "#b9d7a4"],
    icon: "☁️",
    art: "/assets/openmoji/bunny.svg",
    accents: [
      "/assets/openmoji/cloud.svg",
      "/assets/openmoji/blossom.svg",
    ],
    charm: "follow softly",
  },
  {
    id: "velvetrest",
    name: "Velvet permission",
    description: "Moonlit lilac, sleepy stars, cozy boundaries, and permission to rest.",
    colors: ["#9796d8", "#f7f4ff", "#efb8c5"],
    icon: "🌙",
    art: "/assets/openmoji/moon.svg",
    accents: [
      "/assets/openmoji/otter.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "you may rest",
  },
  {
    id: "peachparlor",
    name: "Peach ribbon parlor",
    description: "Peach cream, satin bows, tiny berries, and warm golden details.",
    colors: ["#f7b9ad", "#fff6ef", "#f4d27e"],
    icon: "🎀",
    art: "/assets/openmoji/strawberry.svg",
    accents: [
      "/assets/openmoji/blossom.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "soft & cherished",
  },
  {
    id: "mintletter",
    name: "Mint letter garden",
    description: "Fresh mint stationery, pressed flowers, cloudy blue, and soft ink.",
    colors: ["#bfe4d1", "#fbfff8", "#bcdcf2"],
    icon: "💌",
    art: "/assets/openmoji/tulip.svg",
    accents: [
      "/assets/openmoji/cloud.svg",
      "/assets/openmoji/blossom.svg",
    ],
    charm: "held with care",
  },
  {
    id: "blueberrynight",
    name: "Blueberry starglow",
    description: "Deep blueberry dusk, glowing lilac, silver clouds, and small stars.",
    colors: ["#626ab7", "#f3f2ff", "#c9b8ef"],
    icon: "🫐",
    art: "/assets/openmoji/blueberries.svg",
    accents: [
      "/assets/openmoji/moon.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "safe in the quiet",
  },
  {
    id: "sunsetsea",
    name: "Apricot sunset sea",
    description: "Apricot light, rose water, sleepy waves, and one gentle whale.",
    colors: ["#f4ae86", "#fff8f2", "#9ecfe1"],
    icon: "🌅",
    art: "/assets/openmoji/whale.svg",
    accents: [
      "/assets/openmoji/cloud.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "drift, then return",
  },
  {
    id: "duckmail",
    name: "Duckling happy mail",
    description: "Blue stationery, scalloped stamps, cloud stickers, and a tiny duck.",
    colors: ["#bfe8f7", "#fffdf5", "#f4d777"],
    icon: "💌",
    art: "/assets/openmoji/duck.svg",
    accents: [
      "/assets/openmoji/cloud.svg",
      "/assets/openmoji/tulip.svg",
    ],
    charm: "a note for you",
    showCharm: false,
    decoratedScene: true,
  },
  {
    id: "calicotea",
    name: "Calico tea nook",
    description: "Peach gingham, warm tea-table colors, a calico, and tiny pastries.",
    colors: ["#f7ccb9", "#fffaf2", "#b9d69e"],
    icon: "🍵",
    art: "/assets/openmoji/cat.svg",
    accents: [
      "/assets/openmoji/croissant.svg",
      "/assets/openmoji/basket.svg",
    ],
    charm: "stay for tea",
    showCharm: false,
    decoratedScene: true,
  },
  {
    id: "moonquilt",
    name: "Moonberry quilt",
    description: "A stitched lavender night, moon patches, berries, and sleepy stars.",
    colors: ["#7777bd", "#f6f2ff", "#d7acd4"],
    icon: "🌙",
    art: "/assets/openmoji/moon.svg",
    accents: [
      "/assets/openmoji/blueberries.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "tucked in softly",
    showCharm: false,
    decoratedScene: true,
  },
];

const safePlaceHoldMessages = [
  "You’re safe.",
  "You don’t have to be strong right now.",
  "It’s okay to let yourself rest.",
  "You’re doing just fine.",
  "I’m not here to judge how today went. I’m just happy you came back.",
  "Rest isn’t something you have to earn.",
  "Even if today felt messy, you still deserve gentleness.",
  "Nothing is being asked of you in this moment.",
  "Let your shoulders drop. You can stay awhile.",
  "You are allowed to be held without explaining anything.",
];

const safePlacePraiseMessages = [
  "Good girl.",
  "I’m proud of you.",
  "You tried your best.",
  "That was enough.",
  "Come here.",
  "You did well today.",
  "You deserve to hear kind things without earning them first.",
  "I noticed how hard you tried.",
  "You can be proud of the small things too.",
];

const safePlaceCryMessages = [
  "Yes.",
  "You don’t have to hide it here.",
  "You can let the tears come without explaining them.",
  "Crying is not a failure. Your body is letting something move.",
  "Take all the time you need.",
];

const safePlaceLittleThings = [
  {
    icon: "💧",
    prompt: "Let’s have a sip of water together.",
    response: "Good. One small sip was enough.",
  },
  {
    icon: "🍓",
    prompt: "Maybe something sweet or easy to eat?",
    response: "Good. You deserve something gentle.",
  },
  {
    icon: "🛏️",
    prompt: "How about wrapping yourself in a blanket?",
    response: "Good. Let yourself be warm.",
  },
  {
    icon: "🌬️",
    prompt: "Can we take one slow breath together?",
    response: "Good. You do not need to fix everything.",
  },
];

const CLEAN_START_VERSION = "android-release-1";

const starterReminders: Reminder[] = [];

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "today", icon: "⌂", label: "Today" },
  { id: "habits", icon: "✓", label: "Habits" },
  { id: "focus", icon: "◷", label: "Focus" },
  { id: "journal", icon: "✎", label: "Journal" },
  { id: "spaces", icon: "✦", label: "Spaces" },
];

const starterHabits: Habit[] = [];

const habitColorOptions = [
  { value: "habit-blue", label: "Sky blue", hex: "#bdeaff" },
  { value: "habit-lilac", label: "Soft lilac", hex: "#ddd8ff" },
  { value: "habit-pink", label: "Blush pink", hex: "#ffd9e4" },
  { value: "habit-sage", label: "Leaf green", hex: "#d9efc4" },
];

const moods = [
  { face: ">‿<", label: "happy", color: "mood-pink" },
  { face: "◡‿◡", label: "peaceful", color: "mood-mint" },
  { face: "•‿•", label: "okay", color: "mood-yellow" },
  { face: "–_–", label: "tired", color: "mood-blue" },
  { face: "•︵•", label: "sad", color: "mood-sky" },
  { face: "○_○", label: "anxious", color: "mood-lilac" },
  { face: "✦‿✦", label: "proud", color: "mood-peach" },
  { face: "•O•", label: "surprised", color: "mood-coral" },
];

const journalFaces = [
  "(˶ᵔ ᵕ ᵔ˶)",
  "૮ ˶ᵔ ᵕ ᵔ˶ ა",
  "(｡•́‿•̀｡)",
  "૮₍ ˶•⤙•˶ ₎ა",
  "(˶˃ ᵕ ˂˶)",
  "₍^. .^₎⟆",
  "(ෆ˙ᵕ˙ෆ)♡",
  "૮ ˶ᵔ ᵕ ᵔ˶ ა ♡",
  "(づ˶•༝•˶)づ",
  "(๑>◡<๑)",
  "ʕっ•ᴥ•ʔっ",
  "(˵ •̀ ᴗ - ˵ ) ✧",
  "(｡•̀ᴗ-)✧",
  "૮₍ ´ ꒳ `₎ა",
  "(˶ᵔ ᵕ ᵔ˶)っ",
  "(๑ᵔ⤙ᵔ๑)",
  "( ˶ˆᗜˆ˵ )",
  "꒰ᐢ. .ᐢ꒱₊˚⊹",
  "(≧◡≦) ♡",
  "૮₍˶ •. • ⑅₎ა",
  "(˶˘ ³˘(⋆❛ ہ ❛⋆)!♡",
  "૮₍ ˃ ⤙ ˂ ₎ა",
  "(˶ᵕ ᵕ˶)੭",
  "₍ᐢ.  ̫.ᐢ₎",
];

const secretDiaryFeelings = [
  { icon: "🌙", label: "quiet" },
  { icon: "🫧", label: "floaty" },
  { icon: "🌧️", label: "tender" },
  { icon: "🎀", label: "little" },
  { icon: "✨", label: "proud" },
  { icon: "🤍", label: "held" },
];

function journalFaceFor(index: number) {
  return journalFaces[index % journalFaces.length];
}

function notePreview(text: string, maxCharacters = 132) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxCharacters) return normalized;
  return `${normalized.slice(0, maxCharacters).trimEnd()}...`;
}

const eventColors: { value: EventColor; label: string; hex: string }[] = [
  { value: "emerald", label: "Emerald green", hex: "#6fb69c" },
  { value: "cyan", label: "Modern cyan", hex: "#77cdd3" },
  { value: "blue", label: "Deep sky blue", hex: "#7eb9e8" },
  { value: "brown", label: "Pastel brown", hex: "#b99f92" },
  { value: "black", label: "Midnight black", hex: "#6f6b72" },
  { value: "red", label: "Apple red", hex: "#e97878" },
  { value: "rose", label: "French rose", hex: "#e690b1" },
  { value: "coral", label: "Coral pink", hex: "#f3a4a0" },
  { value: "orange", label: "Bright orange", hex: "#efbc65" },
  { value: "lilac", label: "Soft violet", hex: "#ae96d8" },
  { value: "yellow", label: "Butter yellow", hex: "#e8c86f" },
  { value: "pink", label: "Powder pink", hex: "#eab7c9" },
];

function makeEventDraft(date: string): EventDraft {
  return {
    date,
    endDate: date,
    title: "",
    time: "09:00",
    endTime: "10:00",
    allDay: false,
    calendar: "Personal",
    memo: false,
    color: "lilac",
    guests: "",
    reminder: "10 minutes before",
    repeat: "Never",
    customRepeatEvery: 1,
    customRepeatUnit: "weeks",
    dayCounter: false,
    location: "",
    url: "",
    note: "",
    todos: [],
    todoStates: [],
    files: [],
    attachmentIds: [],
    attachedNoteIds: [],
    attachedRecordingIds: [],
  };
}

const starterClasses: ClassItem[] = [];

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function readableDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function weekForDate(dateKey: string) {
  const anchor = dateFromKey(dateKey);
  const mondayOffset = (anchor.getDay() + 6) % 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: localDateKey(date),
      day: date
        .toLocaleDateString("en", { weekday: "short" })
        .toUpperCase(),
      date: String(date.getDate()),
    };
  });
}

function eventOccursOn(event: CalendarEvent, dateKey: string) {
  if (dateKey < event.date) return false;
  const repeat = event.repeat ?? "Never";
  if (repeat === "Never") return event.date === dateKey;

  const start = dateFromKey(event.date);
  const candidate = dateFromKey(dateKey);
  const daysApart = Math.round(
    (candidate.getTime() - start.getTime()) / 86_400_000,
  );

  if (repeat === "Daily") return true;
  if (repeat === "Weekly") return daysApart % 7 === 0;
  if (repeat === "Monthly") return candidate.getDate() === start.getDate();
  if (repeat === "Yearly") {
    return (
      candidate.getMonth() === start.getMonth() &&
      candidate.getDate() === start.getDate()
    );
  }

  const every = Math.max(1, event.customRepeatEvery ?? 1);
  if (event.customRepeatUnit === "days") return daysApart % every === 0;
  if (event.customRepeatUnit === "months") {
    const monthsApart =
      (candidate.getFullYear() - start.getFullYear()) * 12 +
      candidate.getMonth() -
      start.getMonth();
    return monthsApart % every === 0 && candidate.getDate() === start.getDate();
  }
  return daysApart % (every * 7) === 0;
}

function eventTimeLabel(event: CalendarEvent) {
  if (event.allDay) return "All day";
  if (event.endTime) return `${event.time}–${event.endTime}`;
  return event.time;
}

function matchCountdownLabel(event: CalendarEvent) {
  const start = new Date(`${event.date}T${event.time || "00:00"}:00`);
  const difference = start.getTime() - Date.now();
  const hours = Math.ceil(difference / 3_600_000);
  const days = Math.ceil(difference / 86_400_000);
  if (difference <= 0) return "Today ♡";
  if (hours <= 1) return "In 1 hour ♡";
  if (hours < 24) return `In ${hours} hours ♡`;
  if (days === 1) return "Tomorrow ♡";
  return `In ${days} days ♡`;
}

function eventRepeatLabel(event: CalendarEvent) {
  if (!event.repeat || event.repeat === "Never") return "Does not repeat";
  if (event.repeat !== "Custom") return event.repeat;
  const every = event.customRepeatEvery ?? 1;
  const unit = event.customRepeatUnit ?? "weeks";
  const readableUnit =
    every === 1 && unit.endsWith("s") ? unit.slice(0, -1) : unit;
  return `Every ${every} ${readableUnit}`;
}

export default function Home() {
  const todayKey = localDateKey();
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [space, setSpace] = useState<Space>("menu");
  const [reminderHistory, setReminderHistory] = useState<
    Record<string, number[]>
  >({});
  const [reminders, setReminders] = useState<Reminder[]>(starterReminders);
  const [habits, setHabits] = useState<Habit[]>(starterHabits);
  const [moodHistory, setMoodHistory] = useState<Record<string, string>>({});
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>(
    {},
  );
  const [journalText, setJournalText] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedJournalEntry, setSelectedJournalEntry] =
    useState<JournalEntry | null>(null);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusLength, setFocusLength] = useState(25);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusSessions, setFocusSessions] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedHomeDate, setSelectedHomeDate] = useState(todayKey);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [calendarSlideDirection, setCalendarSlideDirection] = useState<
    "previous" | "next" | null
  >(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayKey);
  const [eventEditorOpen, setEventEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] =
    useState<CalendarEvent | null>(null);
  const [eventDraft, setEventDraft] = useState<EventDraft>(() =>
    makeEventDraft(todayKey),
  );
  const [todoDraft, setTodoDraft] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickCaptureText, setQuickCaptureText] = useState("");
  const [quickCaptureFile, setQuickCaptureFile] = useState<File | null>(null);
  const [quickCaptureSaving, setQuickCaptureSaving] = useState(false);
  const [postIts, setPostIts] = useState<PostIt[]>([]);
  const [postItGroups, setPostItGroups] = useState<PostItGroup[]>([]);
  const [selectedPostItIds, setSelectedPostItIds] = useState<string[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryCollections, setLibraryCollections] = useState<
    LibraryCollection[]
  >([]);
  const [selectedLibraryItem, setSelectedLibraryItem] =
    useState<LibraryItem | null>(null);
  const [libraryPanel, setLibraryPanel] = useState<
    "contents" | "pages" | "bookmarks" | "highlights" | "notes"
  >("contents");
  const [libraryCollectionFilter, setLibraryCollectionFilter] = useState<
    string | null
  >(null);
  const [entityLinks, setEntityLinks] = useState<EntityLink[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [resetPreferences, setResetPreferences] = useState<ResetPreferences>(
    DEFAULT_RESET_PREFERENCES,
  );
  const [resetExperience, setResetExperience] = useState<
    "morning" | "night" | null
  >(null);
  const [sportsSettings, setSportsSettings] = useState<SportsSettings>(
    DEFAULT_SPORTS_SETTINGS,
  );
  const [sportsEvents, setSportsEvents] = useState<SportsEvent[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [calendarMultiSelect, setCalendarMultiSelect] = useState(false);
  const [jumpDate, setJumpDate] = useState(todayKey);
  const [draggingCalendarEventId, setDraggingCalendarEventId] = useState<
    string | null
  >(null);
  const [calendarDragTarget, setCalendarDragTarget] = useState<string | null>(
    null,
  );
  const [historyMessage, setHistoryMessage] = useState("");
  const [stateReady, setStateReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncEmail, setSyncEmail] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState("");
  const [syncMessage, setSyncMessage] = useState("Checking your private sync…");
  const [syncCodeSent, setSyncCodeSent] = useState(false);
  const [authCallbackStatus, setAuthCallbackStatus] = useState<{
    kind: "working" | "success" | "error";
    message: string;
  } | null>(null);
  const [refugeOpen, setRefugeOpen] = useState(false);
  const [safePlaceMode, setSafePlaceMode] =
    useState<SafePlaceMode>("home");
  const [safePlaceMessageIndex, setSafePlaceMessageIndex] = useState(0);
  const [safePlaceHugging, setSafePlaceHugging] = useState(false);
  const [safePlaceSoundOn, setSafePlaceSoundOn] = useState(false);
  const [safePlaceCryText, setSafePlaceCryText] = useState("");
  const [safePlaceLittleStep, setSafePlaceLittleStep] = useState(0);
  const [safePlaceLittleReply, setSafePlaceLittleReply] = useState("");
  const [secretDiaryFeeling, setSecretDiaryFeeling] = useState("quiet");
  const [secretDiaryEntries, setSecretDiaryEntries] = useState<
    SecretDiaryEntry[]
  >([]);
  const [selectedSecretDiaryEntry, setSelectedSecretDiaryEntry] =
    useState<SecretDiaryEntry | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>("storybook");
  const [colorMode, setColorMode] = useState<ColorMode>("light");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState<CustomTheme>({
    accent: "#8db654",
    background: "#fff9ed",
    highlight: "#ffcf55",
    art: "/assets/openmoji/blossom.svg",
  });

  const [habitEditorOpen, setHabitEditorOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [habitDraft, setHabitDraft] = useState({
    title: "",
    icon: "🌱",
    color: "habit-sage",
  });
  const [classItems, setClassItems] = useState<ClassItem[]>(starterClasses);
  const [selectedClass, setSelectedClass] = useState(
    starterClasses[0]?.name ?? "",
  );
  const [classEditorOpen, setClassEditorOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classDraft, setClassDraft] = useState({
    name: "",
    icon: "✦",
    color: "#ddd8ff",
  });
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingName, setRecordingName] = useState("");
  const [recordingNotes, setRecordingNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [editingRecordingId, setEditingRecordingId] = useState<number | null>(
    null,
  );
  const [recordingEditDraft, setRecordingEditDraft] = useState({
    name: "",
    notes: "",
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const refugeAudioContextRef = useRef<AudioContext | null>(null);
  const refugeHeartbeatTimerRef = useRef<number | null>(null);
  const secretDiaryTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const consumedAuthLinksRef = useRef(new Set<string>());
  const undoStackRef = useRef<AereaHistoryEntry[]>([]);
  const redoStackRef = useRef<AereaHistoryEntry[]>([]);
  const [globalHistoryDepth, setGlobalHistoryDepth] = useState({
    undo: 0,
    redo: 0,
  });
  const postItDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    positions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const calendarEventDragRef = useRef<{
    id: string;
    pointerId: number;
    timer: number;
  } | null>(null);

  const [pageStyle, setPageStyle] = useState<PageStyle>("grid");
  const [penColor, setPenColor] = useState("#1f241b");
  const [penSize, setPenSize] = useState(4);
  const [penTool, setPenTool] = useState<"pen" | "eraser">("pen");
  const [sketchFullscreen, setSketchFullscreen] = useState(false);
  const [sketchToolbarOpen, setSketchToolbarOpen] = useState(true);
  const [sketchTitle, setSketchTitle] = useState("Untitled page");
  const [savedPages, setSavedPages] = useState<SketchPage[]>([]);
  const [sketchSaving, setSketchSaving] = useState(false);
  const [sketchMessage, setSketchMessage] = useState("");
  const [sketchZoom, setSketchZoom] = useState(1);
  const [strokeStabilization, setStrokeStabilization] = useState(0.62);
  const [stylusDetected, setStylusDetected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sketchViewportRef = useRef<HTMLDivElement | null>(null);
  const sketchStageRef = useRef<HTMLDivElement | null>(null);
  const sketchZoomRef = useRef(1);
  const sketchZoomFrameRef = useRef<number | null>(null);
  const pendingSketchZoomRef = useRef<{
    zoom: number;
    contentX: number;
    contentY: number;
    localX: number;
    localY: number;
  } | null>(null);
  const sketchPointersRef = useRef(
    new Map<number, { x: number; y: number }>(),
  );
  const sketchGestureRef = useRef<{
    distance: number;
    midpoint: { x: number; y: number };
  } | null>(null);
  const sketchStrokesRef = useRef<SketchStroke[]>([]);
  const sketchRedoRef = useRef<SketchStroke[]>([]);
  const activeStrokeRef = useRef<SketchStroke | null>(null);
  const activeSketchPointerRef = useRef<number | null>(null);
  const sketchBaseImageRef = useRef<HTMLImageElement | null>(null);
  const stylusDetectedRef = useRef(false);
  const redrawSketchRef = useRef<() => void>(() => undefined);
  const [historyDepth, setHistoryDepth] = useState({ undo: 0, redo: 0 });
  const calendarSwipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const doneIds = useMemo(
    () => reminderHistory[todayKey] ?? [],
    [reminderHistory, todayKey],
  );
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDoneCount =
    reminderHistory[localDateKey(yesterdayDate)]?.length ?? 0;

  useEffect(() => {
    const updateDaypart = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 18 || hour < 5);
    };
    updateDaypart();
    const interval = window.setInterval(updateDaypart, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.native = String(
      Capacitor.isNativePlatform(),
    );
    return () => {
      delete document.documentElement.dataset.native;
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void SystemBars.setStyle({
      style: colorMode === "dark" ? "DARK" : "LIGHT",
    }).catch(() => undefined);
  }, [colorMode, appTheme]);

  useEffect(() => {
    if (!stateReady) return;
    let active = true;
    const refresh = () => {
      void fetchSportsFixtures()
        .then((fixtures) => {
          if (active && fixtures) setSportsEvents(fixtures);
        })
        .catch(() => {
          // Keep the cached fixtures visible while offline or before migration.
        });
    };
    refresh();
    window.addEventListener("online", refresh);
    const interval = window.setInterval(refresh, 6 * 60 * 60 * 1000);
    return () => {
      active = false;
      window.removeEventListener("online", refresh);
      window.clearInterval(interval);
    };
  }, [stateReady]);

  useEffect(() => {
    if (!stateReady) return;
    const timer = window.setTimeout(() => {
      void syncFollowedSportsTeams(sportsSettings).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [sportsSettings, stateReady]);

  useEffect(() => {
    if (!stateReady || !isNative()) return;
    const followedEvents = sportsEvents.filter((event) =>
      sportsSettings.followedTeamIds.includes(event.teamId),
    );
    const sync = async () => {
      if (sportsSettings.notifyBeforeMatches) {
        await AereaSportsNotifications.requestPermissions().catch(() => undefined);
      }
      await AereaSportsNotifications.sync({
        enabled: sportsSettings.notifyBeforeMatches,
        leadMinutes: sportsSettings.notificationLeadMinutes,
        eventsJson: JSON.stringify(
          followedEvents.map((event) => {
            const team = INITIAL_SPORTS_TEAMS.find(
              (candidate) => candidate.id === event.teamId,
            );
            return {
              externalId: event.externalId,
              startsAt: new Date(event.startsAtUtc).getTime(),
              status: event.status,
              team: team?.shortName ?? "Your team",
              icon: team?.icon ?? "♡",
              opponent: event.opponent,
              time: event.localTime,
            };
          }),
        ),
      });
    };
    void sync().catch(() => undefined);
  }, [sportsEvents, sportsSettings, stateReady]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let active = true;
    const processLink = async (url: string | null) => {
      if (!active || !url || consumedAuthLinksRef.current.has(url)) return;
      consumedAuthLinksRef.current.add(url);
      setSyncMessage("Confirming your email…");
      setAuthCallbackStatus({
        kind: "working",
        message: "Confirming your email…",
      });
      try {
        const message = await handleAereaAuthCallback(url);
        if (!active) return;
        const email = await currentAereaEmail();
        setSyncEmail(email);
        setSyncCodeSent(false);
        setSyncMessage(message);
        setAuthCallbackStatus({ kind: "success", message });
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error
            ? `${error.message} You can request another email below.`
            : "This confirmation link could not be completed.";
        setSyncMessage(message);
        setAuthCallbackStatus({ kind: "error", message });
      }
    };

    const onAuthLink = (event: Event) => {
      const detail = (event as CustomEvent<{ url?: string }>).detail;
      void processLink(detail?.url ?? null);
    };
    window.addEventListener("aereaAuthLink", onAuthLink);
    void AereaAuth.getPendingLink()
      .then(({ url }) => processLink(url))
      .catch(() => undefined);

    return () => {
      active = false;
      window.removeEventListener("aereaAuthLink", onAuthLink);
    };
  }, []);

  useEffect(() => {
    if (
      !refugeOpen ||
      safePlaceMode === "home" ||
      safePlaceMode === "little"
    ) {
      return;
    }

    const messageCount =
      safePlaceMode === "hold"
        ? safePlaceHoldMessages.length
        : safePlaceMode === "praise"
          ? safePlacePraiseMessages.length + 1
          : safePlaceCryMessages.length;
    const advance = () =>
      setSafePlaceMessageIndex((current) => (current + 1) % messageCount);
    let timer = 0;
    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        advance();
        schedule(20_000 + Math.round(Math.random() * 10_000));
      }, delay);
    };
    schedule(safePlaceMode === "cry" ? 5_500 : 22_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [refugeOpen, safePlaceMode]);

  useEffect(
    () => () => {
      if (refugeHeartbeatTimerRef.current !== null) {
        window.clearInterval(refugeHeartbeatTimerRef.current);
      }
      if (refugeAudioContextRef.current) {
        void refugeAudioContextRef.current.close();
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      try {
        let payload = (isNative()
          ? JSON.parse((await AereaStorage.getState()).state || "{}")
          : readBrowserState()) as {
          state?: {
            reminderHistory?: Record<string, number[]>;
            reminders?: Reminder[];
            habits?: Habit[];
            entries?: JournalEntry[];
            secretDiaryEntries?: SecretDiaryEntry[];
            moodHistory?: Record<string, string>;
            completedDays?: Record<string, boolean>;
            calendarEvents?: CalendarEvent[];
            tasks?: TaskItem[];
            inboxItems?: InboxItem[];
            postIts?: PostIt[];
            postItGroups?: PostItGroup[];
            libraryItems?: LibraryItem[];
            libraryCollections?: LibraryCollection[];
            entityLinks?: EntityLink[];
            trashItems?: TrashItem[];
            resetPreferences?: ResetPreferences;
            sportsSettings?: SportsSettings;
            sportsEvents?: SportsEvent[];
            focusSessions?: number;
            appTheme?: AppTheme;
            colorMode?: ColorMode;
            customTheme?: CustomTheme;
            profilePhoto?: string | null;
            classes?: ClassItem[];
            recordings?: Recording[];
            cleanStartVersion?: string;
          } | null;
        };
        payload = (await reconcileCloudState(payload)) || payload;
        if (cancelled) return;

        if (payload.state) {
          const state = payload.state;
          // Older payloads are migrated in place. An APK update must never
          // interpret a missing version marker as permission to erase data.
          if (state.reminderHistory) setReminderHistory(state.reminderHistory);
          if (Array.isArray(state.reminders)) setReminders(state.reminders);
          if (state.habits) setHabits(state.habits);
          if (state.entries) setEntries(state.entries);
          if (state.secretDiaryEntries) {
            setSecretDiaryEntries(state.secretDiaryEntries);
          }
          if (state.moodHistory) setMoodHistory(state.moodHistory);
          if (state.completedDays) setCompletedDays(state.completedDays);
          if (state.calendarEvents) setCalendarEvents(state.calendarEvents);
          if (Array.isArray(state.tasks)) setTasks(state.tasks);
          if (Array.isArray(state.inboxItems)) setInboxItems(state.inboxItems);
          if (Array.isArray(state.postIts)) setPostIts(state.postIts);
          if (Array.isArray(state.postItGroups)) {
            setPostItGroups(state.postItGroups);
          }
          if (Array.isArray(state.libraryItems)) {
            setLibraryItems(state.libraryItems);
          }
          if (Array.isArray(state.libraryCollections)) {
            setLibraryCollections(state.libraryCollections);
          }
          if (Array.isArray(state.entityLinks)) setEntityLinks(state.entityLinks);
          if (Array.isArray(state.trashItems)) {
            const expiredTrash = state.trashItems.filter(
              (item) => new Date(item.purgeAt).getTime() <= Date.now(),
            );
            if (isNative()) {
              expiredTrash.forEach((item) => {
                const nativeFileId =
                  item.kind === "file"
                    ? (item.payload as LibraryItem).nativeFileId
                    : undefined;
                if (nativeFileId) {
                  void AereaStorage.deleteFile({ id: nativeFileId }).catch(
                    () => undefined,
                  );
                }
              });
            }
            setTrashItems(
              state.trashItems.filter(
                (item) => new Date(item.purgeAt).getTime() > Date.now(),
              ),
            );
          }
          if (state.resetPreferences) {
            setResetPreferences({
              ...DEFAULT_RESET_PREFERENCES,
              ...state.resetPreferences,
            });
          }
          if (state.sportsSettings) {
            setSportsSettings({
              ...DEFAULT_SPORTS_SETTINGS,
              ...state.sportsSettings,
            });
          }
          if (Array.isArray(state.sportsEvents)) {
            setSportsEvents(state.sportsEvents);
          }
          if (typeof state.focusSessions === "number") {
            setFocusSessions(state.focusSessions);
          }
          const savedTheme = state.appTheme;
          if (
            savedTheme &&
            (savedTheme === "custom" ||
              themeOptions.some((theme) => theme.id === savedTheme))
          ) {
            setAppTheme(savedTheme);
          } else {
            setAppTheme("storybook");
          }
          if (state.colorMode) setColorMode(state.colorMode);
          if (state.customTheme) {
            setCustomTheme((current) => ({
              ...current,
              ...state.customTheme,
              art: state.customTheme?.art || current.art,
            }));
          }
          if (typeof state.profilePhoto === "string") {
            setProfilePhoto(state.profilePhoto);
          }
          if (Array.isArray(state.classes)) {
            setClassItems(state.classes);
            if (state.classes.length > 0) {
              setSelectedClass(state.classes[0].name);
            }
          }
          if (Array.isArray(state.recordings)) {
            setRecordings(state.recordings);
          }
        }
      } catch {
        // The UI remains usable while a temporary connection issue settles.
      } finally {
        if (!cancelled) setStateReady(true);
      }
    }

    async function loadSketches() {
      try {
        const payload = isNative()
          ? await AereaStorage.listSketches()
          : { pages: readBrowserSketches<SketchPage>() };
        if (!cancelled && payload.pages) {
          setSavedPages(payload.pages);
        }
      } catch {
        // A blank gallery is a safe offline fallback.
      }
    }

    void loadState();
    void loadSketches();
    return () => {
      cancelled = true;
    };
  }, [todayKey]);

  useEffect(() => {
    let mounted = true;
    void currentAereaEmail().then((email) => {
      if (!mounted) return;
      setSyncEmail(email);
      setSyncMessage(
        email ? "Private sync is on." : "Sign in to use aérea on every device.",
      );
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const email = session?.user.email?.toLowerCase() || null;
      setSyncEmail(email === AEREA_ACCOUNT ? email : null);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!stateReady) return;
    const timeout = window.setTimeout(async () => {
      try {
        const state = {
              reminderHistory,
              reminders,
              habits,
              entries,
              secretDiaryEntries,
              moodHistory,
              completedDays,
              calendarEvents,
              tasks,
              inboxItems,
              postIts,
              postItGroups,
              libraryItems,
              libraryCollections,
              entityLinks,
              trashItems,
              resetPreferences,
              sportsSettings,
              sportsEvents,
              focusSessions,
              appTheme,
              colorMode,
              customTheme,
              profilePhoto,
              classes: classItems,
              recordings,
              cleanStartVersion: CLEAN_START_VERSION,
            };
        if (isNative()) {
          await AereaStorage.putState({ state: JSON.stringify({ state }) });
        } else {
          writeBrowserState({ state });
        }
        if (syncEmail) {
          setSyncMessage("Syncing gently…");
          await pushCloudState({ state });
          setSyncMessage("Private sync is up to date.");
        }
      } catch {
        // Keep the interface responsive if a temporary save fails.
      }
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [
    calendarEvents,
    classItems,
    appTheme,
    colorMode,
    completedDays,
    customTheme,
    entries,
    entityLinks,
    focusSessions,
    habits,
    inboxItems,
    libraryCollections,
    libraryItems,
    moodHistory,
    profilePhoto,
    reminderHistory,
    reminders,
    resetPreferences,
    recordings,
    secretDiaryEntries,
    postItGroups,
    postIts,
    sportsEvents,
    sportsSettings,
    stateReady,
    syncEmail,
    tasks,
    trashItems,
  ]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setFocusSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setTimerRunning(false);
          setFocusSessions((sessions) => sessions + 1);
          return focusLength * 60;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, focusLength]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = window.setInterval(
      () => setRecordingSeconds((current) => current + 1),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (!sketchFullscreen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sketchFullscreen]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  const pending = useMemo(
    () => reminders.filter((item) => !doneIds.includes(item.id)),
    [doneIds, reminders],
  );
  const completed = useMemo(
    () => reminders.filter((item) => doneIds.includes(item.id)),
    [doneIds, reminders],
  );
  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !task.completed && !task.skipped && task.dueDate < todayKey,
      ),
    [tasks, todayKey],
  );
  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (task) => !task.skipped && task.dueDate === todayKey,
      ),
    [tasks, todayKey],
  );
  const habitCompletions = habits.filter((habit) => habit.days[3]).length;
  const classRecordings = recordings.filter(
    (recording) => recording.className === selectedClass,
  );
  const selectedClassItem = classItems.find(
    (item) => item.name === selectedClass,
  );
  const calendarYear = viewMonth.getFullYear();
  const calendarMonth = viewMonth.getMonth();
  const daysInViewMonth = new Date(
    calendarYear,
    calendarMonth + 1,
    0,
  ).getDate();
  const leadingDays =
    (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const sportsCalendarEvents = useMemo<CalendarEvent[]>(() => {
    if (!sportsSettings.addAutomatically) return [];
    return sportsEvents
      .filter((event) => sportsSettings.followedTeamIds.includes(event.teamId))
      .map((event) => {
        const team = INITIAL_SPORTS_TEAMS.find(
          (candidate) => candidate.id === event.teamId,
        );
        const teamName = team?.name ?? "Your team";
        const matchup =
          event.homeAway === "away"
            ? `${event.opponent} vs ${teamName}`
            : `${teamName} vs ${event.opponent}`;
        const score =
          event.status === "finished" &&
          sportsSettings.showFinalScore &&
          typeof event.homeScore === "number" &&
          typeof event.awayScore === "number"
            ? ` · ${event.homeScore}—${event.awayScore}`
            : "";
        return {
          id: `sports:${event.id}`,
          date: event.localDate,
          title: `${event.status === "finished" ? "FINAL · " : ""}${matchup}${score}`,
          time: event.localTime || "00:00",
          endDate: event.localDate,
          endTime: event.localTime || "00:00",
          allDay: false,
          calendar: "Sports",
          color: "blue",
          reminder: sportsSettings.notifyBeforeMatches
            ? `${sportsSettings.notificationLeadMinutes} minutes before`
            : "None",
          repeat: "Never",
          location: event.venue,
          note: `${event.competition} · ${event.status}${event.homeAway === "home" ? " · Home" : " · Away"}`,
          eventType: "sports_event",
          sportsEventId: event.id,
          sportsCardStyle: sportsSettings.showSpecialCards,
          sportsPrimary: team?.primaryColor,
          sportsSecondary: team?.secondaryColor,
          sportsIcon: team?.icon,
        };
      });
  }, [sportsEvents, sportsSettings]);
  const allCalendarEvents = useMemo(
    () => [...calendarEvents, ...sportsCalendarEvents],
    [calendarEvents, sportsCalendarEvents],
  );
  const selectedDateEvents = allCalendarEvents
    .filter((event) => eventOccursOn(event, selectedCalendarDate))
    .sort((a, b) => a.time.localeCompare(b.time));
  const selectedDateMood = moods.find(
    (mood) => mood.label === moodHistory[selectedCalendarDate],
  );
  const selectedDayComplete = completedDays[selectedCalendarDate] === true;
  const selectedDayMissed =
    selectedCalendarDate < todayKey && !selectedDayComplete;
  const homeWeek = useMemo(() => weekForDate(todayKey), [todayKey]);
  const selectedHomeEvents = allCalendarEvents
    .filter((event) => eventOccursOn(event, selectedHomeDate))
    .sort((a, b) => a.time.localeCompare(b.time));
  const todayWidgetEvents = useMemo(
    () =>
      allCalendarEvents
        .filter((event) => eventOccursOn(event, todayKey))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [allCalendarEvents, todayKey],
  );
  const widgetDaysJson = useMemo(() => {
    const start = dateFromKey(todayKey);
    start.setDate(start.getDate() - 180);

    return JSON.stringify(
      Array.from({ length: 550 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const dateKey = localDateKey(date);
        const mood = moods.find(
          (item) => item.label === moodHistory[dateKey],
        );
        const events = allCalendarEvents
          .filter((event) => eventOccursOn(event, dateKey))
          .sort((a, b) => a.time.localeCompare(b.time))
          .slice(0, 3)
          .map((event) => ({
            title: event.title,
            time: event.allDay ? "Todo el día" : event.time,
            color: event.color,
          }));

        return {
          date: dateKey,
          mood: mood?.face ?? "",
          complete: completedDays[dateKey] === true,
          events,
        };
      }),
    );
  }, [allCalendarEvents, completedDays, moodHistory, todayKey]);
  const customArtTheme =
    themeOptions.find((theme) => theme.art === customTheme.art) ??
    themeOptions[0]!;
  const activeTheme =
    appTheme === "custom"
      ? {
          ...customArtTheme,
          id: "custom" as const,
          name: "My own little world",
          description: "Your colors and your favorite little character.",
          colors: [
            customTheme.accent,
            customTheme.background,
            customTheme.highlight,
          ] as [string, string, string],
          art: customTheme.art,
          charm: "my soft space",
        }
      : themeOptions.find((theme) => theme.id === appTheme) ?? themeOptions[0]!;
  const customThemeStyle =
    appTheme === "custom"
      ? colorMode === "dark"
        ? ({
            "--ink": "#f7f5ef",
            "--ink-soft": "#d3d7cf",
            "--muted": "#aab3aa",
            "--cream": "#151a1b",
            "--cream-deep": "#0d1214",
            "--paper": "#212827",
            "--hero": customTheme.accent,
            "--leaf": customTheme.accent,
            "--leaf-deep": customTheme.accent,
            "--lime-wash": `color-mix(in srgb, ${customTheme.accent} 20%, #1b2322)`,
            "--lime-soft": `color-mix(in srgb, ${customTheme.accent} 34%, #1b2322)`,
            "--yellow": customTheme.highlight,
            "--yellow-soft": `color-mix(in srgb, ${customTheme.highlight} 23%, #24231f)`,
            "--orange": customTheme.highlight,
            "--line": "rgba(255, 255, 255, 0.12)",
            "--app-backdrop": `radial-gradient(circle at 12% 9%, color-mix(in srgb, ${customTheme.accent} 32%, transparent), transparent 29rem), linear-gradient(145deg, #0b1012, color-mix(in srgb, ${customTheme.accent} 15%, #111719))`,
          } as CSSProperties)
        : ({
            "--ink": "#2f3827",
            "--ink-soft": "#59624e",
            "--cream": customTheme.background,
            "--paper": "#ffffff",
            "--hero": customTheme.accent,
            "--leaf": customTheme.accent,
            "--leaf-deep": customTheme.accent,
            "--lime-wash": `color-mix(in srgb, ${customTheme.accent} 18%, white)`,
            "--lime-soft": `color-mix(in srgb, ${customTheme.accent} 38%, white)`,
            "--yellow": customTheme.highlight,
            "--yellow-soft": `color-mix(in srgb, ${customTheme.highlight} 35%, white)`,
            "--orange": customTheme.highlight,
            "--app-backdrop": `linear-gradient(145deg, ${customTheme.background}, color-mix(in srgb, ${customTheme.accent} 25%, white))`,
          } as CSSProperties)
      : undefined;
  const canUndoSketch = historyDepth.undo > 0;
  const canRedoSketch = historyDepth.redo > 0;
  const captureHistorySnapshot = (): AereaHistorySnapshot =>
    structuredClone({
      reminders,
      reminderHistory,
      calendarEvents,
      entries,
      tasks,
      inboxItems,
      postIts,
      postItGroups,
      libraryItems,
      libraryCollections,
      entityLinks,
      trashItems,
      classItems,
      recordings,
      selectedClass,
    });

  const restoreHistorySnapshot = (snapshot: AereaHistorySnapshot) => {
    setReminders(snapshot.reminders);
    setReminderHistory(snapshot.reminderHistory);
    setCalendarEvents(snapshot.calendarEvents);
    setEntries(snapshot.entries);
    setTasks(snapshot.tasks);
    setInboxItems(snapshot.inboxItems);
    setPostIts(snapshot.postIts);
    setPostItGroups(snapshot.postItGroups);
    setLibraryItems(snapshot.libraryItems);
    setLibraryCollections(snapshot.libraryCollections);
    setEntityLinks(snapshot.entityLinks);
    setTrashItems(snapshot.trashItems);
    setClassItems(snapshot.classItems);
    setRecordings(snapshot.recordings);
    setSelectedClass(snapshot.selectedClass);
    setSelectedEventDetail(null);
    setSelectedJournalEntry(null);
    setSelectedLibraryItem(null);
  };

  const syncGlobalHistoryDepth = () => {
    setGlobalHistoryDepth({
      undo: undoStackRef.current.length,
      redo: redoStackRef.current.length,
    });
  };

  const recordAction = (label: string) => {
    undoStackRef.current.push({
      label,
      snapshot: captureHistorySnapshot(),
    });
    if (undoStackRef.current.length > 30) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistoryMessage(`${label} · Undo`);
    syncGlobalHistoryDepth();
  };

  const hasEntityLink = (
    fromType: EntityLink["fromType"],
    fromId: string,
    toType: EntityLink["toType"],
    toId: string,
  ) =>
    entityLinks.some(
      (link) =>
        link.fromType === fromType &&
        link.fromId === fromId &&
        link.toType === toType &&
        link.toId === toId,
    );

  const toggleEntityLink = (
    fromType: EntityLink["fromType"],
    fromId: string,
    toType: EntityLink["toType"],
    toId: string,
    label: string,
  ) => {
    recordAction(label);
    const alreadyLinked =
      hasEntityLink(fromType, fromId, toType, toId) ||
      (fromType === "task" &&
        toType === "file" &&
        (tasks.find((task) => task.id === fromId)?.attachmentIds ?? []).includes(
          toId,
        ));
    setEntityLinks((current) =>
      alreadyLinked
        ? current.filter(
            (link) =>
              !(
                link.fromType === fromType &&
                link.fromId === fromId &&
                link.toType === toType &&
                link.toId === toId
              ),
          )
        : [
            ...current,
            {
              id: crypto.randomUUID(),
              fromType,
              fromId,
              toType,
              toId,
              createdAt: new Date().toISOString(),
            },
          ],
    );

    if (fromType === "task" && toType === "file") {
      setTasks((current) =>
        current.map((task) =>
          task.id === fromId
            ? {
                ...task,
                attachmentIds: alreadyLinked
                  ? (task.attachmentIds ?? []).filter((id) => id !== toId)
                  : Array.from(new Set([...(task.attachmentIds ?? []), toId])),
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      );
    }
  };

  const undoGlobal = () => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push({
      label: previous.label,
      snapshot: captureHistorySnapshot(),
    });
    restoreHistorySnapshot(previous.snapshot);
    setHistoryMessage(`Undid ${previous.label}`);
    syncGlobalHistoryDepth();
  };

  const redoGlobal = () => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push({
      label: next.label,
      snapshot: captureHistorySnapshot(),
    });
    restoreHistorySnapshot(next.snapshot);
    setHistoryMessage(`Redid ${next.label}`);
    syncGlobalHistoryDepth();
  };
  const focusProgress = Math.max(
    0,
    Math.min(100, (focusSeconds / Math.max(1, focusLength * 60)) * 100),
  );
  const praiseMessages = [
    ...safePlacePraiseMessages,
    doneIds.length > 0
      ? "You kept your promises today."
      : "Tomorrow is another chance. You are still worthy of gentleness tonight.",
  ];
  const currentSafePlaceMessage =
    safePlaceMode === "hold"
      ? safePlaceHoldMessages[
          safePlaceMessageIndex % safePlaceHoldMessages.length
        ]
      : safePlaceMode === "praise"
        ? praiseMessages[safePlaceMessageIndex % praiseMessages.length]
        : safePlaceCryMessages[
            safePlaceMessageIndex % safePlaceCryMessages.length
          ];
  const currentLittleThing =
    safePlaceLittleThings[
      safePlaceLittleStep % safePlaceLittleThings.length
    ]!;

  useEffect(() => {
    if (!stateReady || resetExperience) return;
    const hour = new Date().getHours();
    let nextExperience: "morning" | "night" | null = null;
    if (
      resetPreferences.morningEnabled &&
      hour >= 5 &&
      hour < 12 &&
      resetPreferences.lastMorningDate !== todayKey
    ) {
      nextExperience = "morning";
    } else if (
      resetPreferences.nightEnabled &&
      (hour >= 19 || hour < 2) &&
      resetPreferences.lastNightDate !== todayKey
    ) {
      nextExperience = "night";
    }
    if (!nextExperience) return;
    const timer = window.setTimeout(
      () => setResetExperience(nextExperience),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [resetExperience, resetPreferences, stateReady, todayKey]);

  useEffect(() => {
    if (!stateReady || !Capacitor.isNativePlatform()) return;

    const nextEvent = todayWidgetEvents[0];
    const widgetTheme = appTheme === "otter" ? "otter" : "storybook";
    void AereaWidget.sync({
      date: dateFromKey(todayKey).toLocaleDateString("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      eventTitle: nextEvent?.title ?? "Sin eventos para hoy",
      eventTime: nextEvent?.allDay
        ? "Todo el día"
        : nextEvent?.time || "Abre aérea para planear",
      temperature: activeTheme.icon,
      progress: `${doneIds.length}/${reminders.length} recordatorios`,
      theme: widgetTheme,
      daysJson: widgetDaysJson,
    }).catch(() => {
      // The app remains usable if a launcher does not support widgets.
    });
  }, [
    appTheme,
    activeTheme.icon,
    doneIds.length,
    reminders.length,
    stateReady,
    todayKey,
    todayWidgetEvents,
    widgetDaysJson,
  ]);

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    setSpace("menu");
    if (tab === "today") setSelectedHomeDate(todayKey);
  };

  const saveQuickCapture = async () => {
    const text = quickCaptureText.trim();
    const file = quickCaptureFile;
    if (!text && !file) return;
    setQuickCaptureSaving(true);
    try {
      const rawDataUrl = file ? await blobAsDataUrl(file) : undefined;
      const nativeFile =
        file && rawDataUrl && isNative()
          ? await AereaStorage.saveFile({
              name: file.name,
              mimeType: file.type || "application/octet-stream",
              dataUrl: rawDataUrl,
            })
          : null;
      const cloudPath = file
        ? await uploadAereaLibraryFile(crypto.randomUUID(), file).catch(
            () => null,
          )
        : null;
      const item: InboxItem = {
        id: crypto.randomUUID(),
        kind: inferInboxKind(text, file),
        text: text || file?.name || "Untitled capture",
        createdAt: new Date().toISOString(),
        originalName: file?.name,
        mimeType: file?.type,
        size: file?.size,
        dataUrl: nativeFile ? undefined : rawDataUrl,
        nativeFileId: nativeFile?.id,
        cloudPath: cloudPath ?? undefined,
        processedAs: [],
      };
      recordAction("Quick capture");
      setInboxItems((current) => [item, ...current]);
      setQuickCaptureText("");
      setQuickCaptureFile(null);
      setQuickCaptureOpen(false);
      setHistoryMessage("Saved to Inbox ♡");
    } finally {
      setQuickCaptureSaving(false);
    }
  };

  const markInboxProcessed = (id: string, destination: string) => {
    setInboxItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              processedAs: Array.from(
                new Set([...(item.processedAs ?? []), destination]),
              ),
            }
          : item,
      ),
    );
  };

  const newPostIt = (text: string): PostIt => {
    const offset = (postIts.length % 6) * 22;
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      text,
      x: 24 + offset,
      y: 30 + offset,
      width: 190,
      height: 160,
      rotation: ((postIts.length % 5) - 2) * 0.8,
      zIndex: Math.max(0, ...postIts.map((item) => item.zIndex)) + 1,
      color: ["#fff0a8", "#ffd8e5", "#d9ecff", "#ddf3cf", "#e4dcff"][
        postIts.length % 5
      ],
      style: "plain",
      pinned: false,
      locked: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
  };

  const convertInboxItem = (
    item: InboxItem,
    destination: "event" | "task" | "post-it" | "note" | "library",
  ) => {
    recordAction(`Converted Inbox item to ${destination}`);
    const now = new Date().toISOString();
    let linkedLibraryItemId = item.libraryItemId;
    if (
      (destination === "event" || destination === "task") &&
      !linkedLibraryItemId &&
      item.originalName &&
      (item.dataUrl || item.nativeFileId)
    ) {
      linkedLibraryItemId = crypto.randomUUID();
      const capturedFile: LibraryItem = {
        id: linkedLibraryItemId,
        name: item.originalName,
        kind: item.kind === "pdf" ? "pdf" : item.kind === "photo" ? "image" : "file",
        mimeType: item.mimeType,
        size: item.size,
        dataUrl: item.dataUrl,
        nativeFileId: item.nativeFileId,
        createdAt: now,
        updatedAt: now,
        favorite: false,
        collectionIds: [],
        annotations: [],
      };
      setLibraryItems((current) => [capturedFile, ...current]);
      setInboxItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, libraryItemId: linkedLibraryItemId }
            : candidate,
        ),
      );
    }

    if (destination === "event") {
      setEditingEventId(null);
      setEventDraft({
        ...makeEventDraft(todayKey),
        title: item.text,
        files: item.originalName ? [item.originalName] : [],
        attachmentIds: linkedLibraryItemId ? [linkedLibraryItemId] : [],
        sourceInboxId: item.id,
      });
      setTodoDraft("");
      setEventEditorOpen(true);
      setCalendarOpen(true);
    }

    if (destination === "task") {
      setTasks((current) => [
        {
          id: crypto.randomUUID(),
          title: item.text,
          dueDate: todayKey,
          completed: false,
          notes: "",
          attachmentIds: linkedLibraryItemId ? [linkedLibraryItemId] : [],
          priority: "gentle",
          createdAt: now,
          updatedAt: now,
        },
        ...current,
      ]);
    }

    if (destination === "post-it") {
      setPostIts((current) => [...current, newPostIt(item.text)]);
    }

    if (destination === "note") {
      setEntries((current) => [
        {
          id: Date.now(),
          date: readableDate(todayKey),
          mood: "♡",
          text: item.text,
        },
        ...current,
      ]);
    }

    if (destination === "library") {
      const existing = item.libraryItemId
        ? libraryItems.find((candidate) => candidate.id === item.libraryItemId)
        : null;
      if (!existing) {
        const libraryItem: LibraryItem = {
          id: crypto.randomUUID(),
          name: item.originalName || notePreview(item.text, 54) || "Quick note",
          kind:
            item.kind === "pdf"
              ? "pdf"
              : item.kind === "photo"
                ? "image"
                : item.kind === "file"
                  ? "file"
                  : "note",
          mimeType: item.mimeType,
          size: item.size,
          dataUrl: item.dataUrl,
          nativeFileId: item.nativeFileId,
          cloudPath: item.cloudPath,
          textContent:
            item.kind === "text" || item.kind === "note" || item.kind === "link"
              ? item.text
              : undefined,
          createdAt: now,
          updatedAt: now,
          favorite: false,
          collectionIds: [],
          annotations: [],
        };
        setLibraryItems((current) => [libraryItem, ...current]);
        setInboxItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, libraryItemId: libraryItem.id }
              : candidate,
          ),
        );
      }
    }

    markInboxProcessed(item.id, destination);
  };

  const discardInboxItem = (item: InboxItem) => {
    recordAction("Discarded Inbox item");
    setInboxItems((current) =>
      current.filter((candidate) => candidate.id !== item.id),
    );
  };

  const importLibraryFile = async (file: File) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const dataUrl = await blobAsDataUrl(file);
    const nativeFile = isNative()
      ? await AereaStorage.saveFile({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          dataUrl,
        })
      : null;
    const cloudPath = await uploadAereaLibraryFile(id, file).catch(() => null);
    recordAction("Imported Library file");
    const item: LibraryItem = {
      id,
      name: file.name,
      kind: fileKind(file),
      mimeType: file.type,
      size: file.size,
      dataUrl: nativeFile ? undefined : dataUrl,
      nativeFileId: nativeFile?.id,
      cloudPath: cloudPath ?? undefined,
      createdAt: now,
      updatedAt: now,
      favorite: false,
      collectionIds: [],
      annotations: [],
    };
    setLibraryItems((current) => [item, ...current]);
    return item;
  };

  const openLibraryItem = async (item: LibraryItem) => {
    const lastOpenedAt = new Date().toISOString();
    setLibraryItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, lastOpenedAt } : candidate,
      ),
    );
    let dataUrl = item.dataUrl;
    let mimeType = item.mimeType;
    if (item.nativeFileId && isNative()) {
      try {
        const stored = await AereaStorage.readFile({ id: item.nativeFileId });
        dataUrl = stored.dataUrl;
        mimeType = item.mimeType || stored.mimeType;
      } catch {
        // A file synced from another device can be restored from private storage.
      }
    }
    if (!dataUrl && item.cloudPath) {
      try {
        const downloaded = await downloadAereaLibraryFile(item.cloudPath);
        dataUrl = await blobAsDataUrl(downloaded);
        mimeType = item.mimeType || downloaded.type;
        if (isNative()) {
          const local = await AereaStorage.saveFile({
            name: item.name,
            mimeType: mimeType || "application/octet-stream",
            dataUrl,
          });
          setLibraryItems((current) =>
            current.map((candidate) =>
              candidate.id === item.id
                ? { ...candidate, nativeFileId: local.id }
                : candidate,
            ),
          );
        }
      } catch {
        setHistoryMessage("This file could not be opened, but its Library record is safe.");
      }
    }
    setLibraryPanel("contents");
    setSelectedLibraryItem({ ...item, dataUrl, mimeType, lastOpenedAt });
  };

  const updateLibraryItem = (
    id: string,
    update: (item: LibraryItem) => LibraryItem,
  ) => {
    setLibraryItems((current) =>
      current.map((item) => (item.id === id ? update(item) : item)),
    );
    setSelectedLibraryItem((current) =>
      current?.id === id ? update(current) : current,
    );
  };

  const addLibraryAnnotation = (
    item: LibraryItem,
    type: "bookmark" | "highlight" | "note",
  ) => {
    const page = item.readerLocation?.page ?? 1;
    const text =
      type === "bookmark"
        ? window.prompt("Optional bookmark name", `Page ${page}`)
        : window.prompt(
            type === "highlight" ? "Highlighted text or excerpt" : "Write a note",
          );
    if (text === null) return;
    recordAction(`Created ${type}`);
    const timestamp = new Date().toISOString();
    updateLibraryItem(item.id, (current) => ({
      ...current,
      updatedAt: timestamp,
      annotations: [
        ...(current.annotations ?? []),
        {
          id: crypto.randomUUID(),
          type,
          location: { ...current.readerLocation, page },
          ...(type === "bookmark"
            ? { name: text.trim() || `Page ${page}` }
            : type === "highlight"
              ? { excerpt: text.trim(), color: "#ffe69a" }
              : { text: text.trim() }),
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }));
  };

  const deleteLibraryAnnotation = (itemId: string, annotationId: string) => {
    recordAction("Deleted annotation");
    updateLibraryItem(itemId, (current) => ({
      ...current,
      annotations: (current.annotations ?? []).filter(
        (annotation) => annotation.id !== annotationId,
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const createLibraryCollection = () => {
    const name = window.prompt("Name this collection");
    if (!name?.trim()) return;
    recordAction("Created collection");
    setLibraryCollections((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        order: current.length,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const moveToTrash = (
    kind: "event" | "task" | "note" | "post-it" | "file",
    label: string,
    payload: unknown,
  ) => {
    recordAction(`Moved ${label} to Trash`);
    setTrashItems((current) => [createTrashItem(kind, label, payload), ...current]);
    if (kind === "event") {
      const event = payload as CalendarEvent;
      setCalendarEvents((current) =>
        current.filter((candidate) => candidate.id !== event.id),
      );
    } else if (kind === "task") {
      const task = payload as TaskItem;
      setTasks((current) => current.filter((candidate) => candidate.id !== task.id));
    } else if (kind === "note") {
      const note = payload as JournalEntry;
      setEntries((current) => current.filter((candidate) => candidate.id !== note.id));
    } else if (kind === "post-it") {
      const postIt = payload as PostIt;
      setPostIts((current) =>
        current.filter((candidate) => candidate.id !== postIt.id),
      );
    } else {
      const file = payload as LibraryItem;
      setLibraryItems((current) =>
        current.filter((candidate) => candidate.id !== file.id),
      );
    }
  };

  const restoreTrashItem = (item: TrashItem) => {
    recordAction(`Restored ${item.label}`);
    if (item.kind === "event") {
      setCalendarEvents((current) => [...current, item.payload as CalendarEvent]);
    } else if (item.kind === "task") {
      setTasks((current) => [...current, item.payload as TaskItem]);
    } else if (item.kind === "note") {
      setEntries((current) => [item.payload as JournalEntry, ...current]);
    } else if (item.kind === "post-it") {
      setPostIts((current) => [...current, item.payload as PostIt]);
    } else if (item.kind === "file") {
      setLibraryItems((current) => [item.payload as LibraryItem, ...current]);
    }
    setTrashItems((current) =>
      current.filter((candidate) => candidate.id !== item.id),
    );
  };

  const deleteTrashItemForever = async (item: TrashItem) => {
    if (item.kind === "file") {
      const file = item.payload as LibraryItem;
      const nativeFileId = file.nativeFileId;
      if (nativeFileId && isNative()) {
        await AereaStorage.deleteFile({ id: nativeFileId }).catch(
          () => undefined,
        );
      }
      if (file.cloudPath) {
        await deleteAereaLibraryFile(file.cloudPath).catch(() => undefined);
      }
    }
    setTrashItems((current) =>
      current.filter((candidate) => candidate.id !== item.id),
    );
    const entityId = String(
      (item.payload as { id?: string | number } | null)?.id ?? "",
    );
    const entityType =
      item.kind === "event"
        ? "event"
        : item.kind === "task"
          ? "task"
          : item.kind === "note"
            ? "note"
            : item.kind === "file"
              ? "file"
              : null;
    if (entityId && entityType) {
      setEntityLinks((current) =>
        current.filter(
          (link) =>
            !(
              (link.fromType === entityType && link.fromId === entityId) ||
              (link.toType === entityType && link.toId === entityId)
            ),
        ),
      );
    }
  };

  const rescheduleTask = (
    task: TaskItem,
    destination: "today" | "tomorrow" | "pick" | "dismiss",
  ) => {
    const picked =
      destination === "pick"
        ? window.prompt("Move it to which date? (YYYY-MM-DD)", todayKey)
        : null;
    if (destination === "pick" && !/^\d{4}-\d{2}-\d{2}$/.test(picked ?? "")) {
      return;
    }
    recordAction(`Rescheduled ${task.title}`);
    setTasks((current) =>
      current.map((candidate) => {
        if (candidate.id !== task.id) return candidate;
        if (destination === "dismiss") {
          return { ...candidate, skipped: true, updatedAt: new Date().toISOString() };
        }
        const dueDate =
          destination === "today"
            ? todayKey
            : destination === "tomorrow"
              ? addDays(todayKey, 1)
              : picked!;
        return {
          ...candidate,
          dueDate,
          skipped: false,
          updatedAt: new Date().toISOString(),
          rescheduleHistory: [
            ...(candidate.rescheduleHistory ?? []),
            { from: candidate.dueDate, to: dueDate, at: new Date().toISOString() },
          ],
        };
      }),
    );
  };

  const closeResetExperience = () => {
    const current = resetExperience;
    if (!current) return;
    setResetPreferences((preferences) => ({
      ...preferences,
      ...(current === "morning"
        ? { lastMorningDate: todayKey }
        : { lastNightDate: todayKey }),
    }));
    setResetExperience(null);
  };

  const startPostItDrag = (
    event: ReactPointerEvent<HTMLElement>,
    postIt: PostIt,
  ) => {
    const group = postIt.groupId
      ? postItGroups.find((candidate) => candidate.id === postIt.groupId)
      : null;
    if (postIt.locked || group?.locked) return;
    const groupIds = postIt.groupId
      ? postIts
          .filter((candidate) => candidate.groupId === postIt.groupId)
          .map((candidate) => candidate.id)
      : selectedPostItIds.includes(postIt.id)
        ? selectedPostItIds
        : [postIt.id];
    recordAction("Moved post-it");
    postItDragRef.current = {
      id: postIt.id,
      startX: event.clientX,
      startY: event.clientY,
      positions: Object.fromEntries(
        postIts
          .filter((candidate) => groupIds.includes(candidate.id))
          .map((candidate) => [
            candidate.id,
            { x: candidate.x, y: candidate.y },
          ]),
      ),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const movePostIt = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = postItDragRef.current;
    if (!drag) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    setPostIts((current) =>
      current.map((candidate) => {
        const origin = drag.positions[candidate.id];
        return origin
          ? {
              ...candidate,
              x: Math.max(0, origin.x + deltaX),
              y: Math.max(0, origin.y + deltaY),
              updatedAt: new Date().toISOString(),
            }
          : candidate;
      }),
    );
  };

  const stopPostItDrag = () => {
    postItDragRef.current = null;
  };

  const groupSelectedPostIts = () => {
    if (selectedPostItIds.length < 2) return;
    const name = window.prompt("Optional group name", "Ideas")?.trim() || "Group";
    const group: PostItGroup = {
      id: crypto.randomUUID(),
      name,
      locked: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    recordAction("Grouped post-its");
    setPostItGroups((current) => [...current, group]);
    setPostIts((current) =>
      current.map((item) =>
        selectedPostItIds.includes(item.id)
          ? { ...item, groupId: group.id, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    setSelectedPostItIds([]);
  };

  const updateSelectedPostIts = (
    label: string,
    update: (item: PostIt, all: PostIt[]) => PostIt,
  ) => {
    if (selectedPostItIds.length === 0) return;
    recordAction(label);
    setPostIts((current) =>
      current.map((item) =>
        selectedPostItIds.includes(item.id) ? update(item, current) : item,
      ),
    );
  };

  const ungroupSelectedPostIts = () => {
    const groupIds = Array.from(
      new Set(
        postIts
          .filter((item) => selectedPostItIds.includes(item.id) && item.groupId)
          .map((item) => item.groupId!),
      ),
    );
    if (groupIds.length === 0) return;
    recordAction("Ungrouped post-its");
    setPostIts((current) =>
      current.map((item) =>
        groupIds.includes(item.groupId ?? "")
          ? { ...item, groupId: undefined, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    setPostItGroups((current) =>
      current.filter((group) => !groupIds.includes(group.id)),
    );
    setSelectedPostItIds([]);
  };

  const openCalendarAtToday = () => {
    const today = dateFromKey(todayKey);
    setSelectedHomeDate(todayKey);
    setSelectedCalendarDate(todayKey);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setEventEditorOpen(false);
    setCalendarOpen(true);
  };

  const goToCalendarDate = (dateKey = jumpDate) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      setHistoryMessage("Choose a valid date.");
      return;
    }
    const date = dateFromKey(dateKey);
    if (localDateKey(date) !== dateKey) {
      setHistoryMessage("Choose a valid date.");
      return;
    }
    setSelectedCalendarDate(dateKey);
    setSelectedHomeDate(dateKey);
    setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setEventEditorOpen(false);
  };

  const shiftCalendarMonth = (offset: number) => {
    setCalendarSlideDirection(offset > 0 ? "next" : "previous");
    const next = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + offset,
      1,
    );
    const selectedDay = dateFromKey(selectedCalendarDate).getDate();
    const clampedDay = Math.min(
      selectedDay,
      new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate(),
    );
    setViewMonth(next);
    setSelectedCalendarDate(
      calendarDateKey(next.getFullYear(), next.getMonth(), clampedDay),
    );
  };

  const startCalendarSwipe = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    calendarSwipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const finishCalendarSwipe = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = calendarSwipeStartRef.current;
    const touch = event.changedTouches[0];
    calendarSwipeStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 46 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) {
      return;
    }
    shiftCalendarMonth(deltaX < 0 ? 1 : -1);
  };

  const updateProfilePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) return;

        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(
          image,
          (size - width) / 2,
          (size - height) / 2,
          width,
          height,
        );
        setProfilePhoto(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const openHabitEditor = (habit?: Habit) => {
    if (habit) {
      setEditingHabitId(habit.id);
      setHabitDraft({
        title: habit.title,
        icon: habit.icon,
        color: habit.color,
      });
    } else {
      setEditingHabitId(null);
      setHabitDraft({
        title: "",
        icon: "🌱",
        color: "habit-sage",
      });
    }
    setHabitEditorOpen(true);
  };

  const saveHabit = () => {
    const nextTitle = habitDraft.title.trim();
    const nextIcon = habitDraft.icon.trim() || "🌱";
    if (!nextTitle) return;

    if (editingHabitId !== null) {
      setHabits((current) =>
        current.map((habit) =>
          habit.id === editingHabitId
            ? {
                ...habit,
                title: nextTitle,
                icon: nextIcon,
                color: habitDraft.color,
              }
            : habit,
        ),
      );
    } else {
      setHabits((current) => [
        ...current,
        {
          id: Date.now(),
          title: nextTitle,
          icon: nextIcon,
          color: habitDraft.color,
          days: [false, false, false, false, false, false, false],
          streak: 0,
        },
      ]);
    }
    setHabitEditorOpen(false);
  };

  const deleteHabit = () => {
    if (editingHabitId === null) return;
    setHabits((current) =>
      current.filter((habit) => habit.id !== editingHabitId),
    );
    setHabitEditorOpen(false);
  };

  const openClassEditor = (classItem?: ClassItem) => {
    if (classItem) {
      setEditingClassId(classItem.id);
      setClassDraft({
        name: classItem.name,
        icon: classItem.icon,
        color: classItem.color,
      });
    } else {
      setEditingClassId(null);
      setClassDraft({ name: "", icon: "✦", color: "#ddd8ff" });
    }
    setClassEditorOpen(true);
  };

  const saveClass = () => {
    const nextName = classDraft.name.trim();
    if (!nextName) return;
    recordAction(editingClassId ? "Edited class" : "Created class");

    if (editingClassId) {
      const previous = classItems.find((item) => item.id === editingClassId);
      setClassItems((current) =>
        current.map((item) =>
          item.id === editingClassId
            ? { ...item, ...classDraft, name: nextName }
            : item,
        ),
      );
      if (previous) {
        setRecordings((current) =>
          current.map((recording) =>
            recording.className === previous.name
              ? { ...recording, className: nextName }
              : recording,
          ),
        );
        if (selectedClass === previous.name) setSelectedClass(nextName);
      }
    } else {
      const nextClass: ClassItem = {
        id: crypto.randomUUID(),
        ...classDraft,
        name: nextName,
      };
      setClassItems((current) => [...current, nextClass]);
      setSelectedClass(nextClass.name);
    }
    setClassEditorOpen(false);
  };

  const deleteClass = () => {
    if (!editingClassId) return;
    const removed = classItems.find((item) => item.id === editingClassId);
    if (!removed) return;
    const hasRecordings = recordings.some(
      (recording) => recording.className === removed.name,
    );
    if (
      hasRecordings &&
      !window.confirm(
        "This class has saved recordings. Remove the class and its recordings?",
      )
    ) {
      return;
    }

    recordAction("Deleted class");
    const remaining = classItems.filter((item) => item.id !== editingClassId);
    setClassItems(remaining);
    setRecordings((current) =>
      current.filter((recording) => recording.className !== removed.name),
    );
    setEntityLinks((current) =>
      current.filter(
        (link) =>
          !(link.fromType === "class" && link.fromId === removed.id),
      ),
    );
    if (selectedClass === removed.name) {
      setSelectedClass(remaining[0]?.name ?? "");
    }
    setClassEditorOpen(false);
  };

  const exitSketchFullscreen = () => {
    sketchZoomRef.current = 1;
    setSketchZoom(1);
    setSketchToolbarOpen(false);
    setSketchFullscreen(false);
  };

  const updateDoneIds = (
    update: number[] | ((current: number[]) => number[]),
  ) => {
    setReminderHistory((current) => {
      const currentDay = current[todayKey] ?? [];
      const nextDay =
        typeof update === "function" ? update(currentDay) : update;
      return { ...current, [todayKey]: nextDay };
    });
  };

  const createReminder = () => {
    const title = window.prompt("What should aérea remind you about?")?.trim();
    if (!title) return;
    const detail = window.prompt("Optional gentle detail", "")?.trim() ?? "";
    recordAction("Created reminder");
    setReminders((current) => [
      ...current,
      {
        id: Date.now(),
        title,
        detail,
        icon: "♡",
        tint: ["blue", "yellow", "lilac"][current.length % 3],
      },
    ]);
  };

  const deleteReminder = (id: number) => {
    const reminder = reminders.find((item) => item.id === id);
    if (!reminder || !window.confirm(`Delete “${reminder.title}”?`)) return;
    recordAction("Deleted reminder");
    setReminders((current) => current.filter((item) => item.id !== id));
    setReminderHistory((current) =>
      Object.fromEntries(
        Object.entries(current).map(([date, ids]) => [
          date,
          ids.filter((itemId) => itemId !== id),
        ]),
      ),
    );
  };

  const chooseMood = (dateKey: string, mood: string) => {
    setMoodHistory((current) => ({ ...current, [dateKey]: mood }));
  };

  const openNewEvent = (dateKey = selectedCalendarDate) => {
    setEditingEventId(null);
    setEventDraft(makeEventDraft(dateKey));
    setTodoDraft("");
    setEventEditorOpen(true);
  };

  const openEventEditor = (calendarEvent: CalendarEvent) => {
    setEditingEventId(calendarEvent.id);
    setEventDraft({
      ...makeEventDraft(calendarEvent.date),
      ...calendarEvent,
    });
    setTodoDraft("");
    setEventEditorOpen(true);
  };

  const saveCalendarEvent = () => {
    if (!eventDraft.title.trim()) return;
    if (
      !eventDraft.allDay &&
      (eventDraft.endDate || eventDraft.date) === eventDraft.date &&
      (eventDraft.endTime ?? "") <= eventDraft.time
    ) {
      setHistoryMessage("The end time must be after the start time.");
      return;
    }
    const conflictingEvent = allCalendarEvents.find(
      (event) =>
        event.id !== editingEventId &&
        !event.allDay &&
        !eventDraft.allDay &&
        eventOccursOn(event, eventDraft.date) &&
        rangesOverlap(
          eventDraft.time,
          eventDraft.endTime,
          event.time,
          event.endTime,
        ),
    );
    if (
      conflictingEvent &&
      !window.confirm(
        `This overlaps with ${conflictingEvent.title} · ${eventTimeLabel(conflictingEvent)}. Keep it anyway?`,
      )
    ) {
      return;
    }
    recordAction(editingEventId ? "Edited event" : "Created event");
    const savedEvent: CalendarEvent = {
      ...eventDraft,
      id: editingEventId ?? crypto.randomUUID(),
      title: eventDraft.title.trim(),
      endDate: eventDraft.endDate || eventDraft.date,
    };
    setCalendarEvents((current) =>
      editingEventId
        ? current.map((item) =>
            item.id === editingEventId ? savedEvent : item,
          )
        : [...current, savedEvent],
    );
    setEntityLinks((current) => {
      const withoutOldAttachments = current.filter(
        (link) => !(link.fromType === "event" && link.fromId === savedEvent.id),
      );
      const createdAt = new Date().toISOString();
      const attachments: EntityLink[] = (savedEvent.attachmentIds ?? []).map(
        (fileId) => ({
          id: crypto.randomUUID(),
          fromType: "event",
          fromId: savedEvent.id,
          toType: "file",
          toId: fileId,
          createdAt,
        }),
      );
      const noteLinks: EntityLink[] = (savedEvent.attachedNoteIds ?? []).map(
        (noteId) => ({
          id: crypto.randomUUID(),
          fromType: "event",
          fromId: savedEvent.id,
          toType: "note",
          toId: String(noteId),
          createdAt,
        }),
      );
      const recordingLinks: EntityLink[] = (
        savedEvent.attachedRecordingIds ?? []
      ).map((recordingId) => ({
        id: crypto.randomUUID(),
        fromType: "event",
        fromId: savedEvent.id,
        toType: "recording",
        toId: String(recordingId),
        createdAt,
      }));
      return [
        ...withoutOldAttachments,
        ...attachments,
        ...noteLinks,
        ...recordingLinks,
      ];
    });
    setSelectedCalendarDate(savedEvent.date);
    if (savedEvent.sourceInboxId) {
      markInboxProcessed(savedEvent.sourceInboxId, "event");
    }
    setEventEditorOpen(false);
    setEditingEventId(null);
  };

  const updateEventDraft = <Key extends keyof EventDraft>(
    key: Key,
    value: EventDraft[Key],
  ) => {
    setEventDraft((current) => ({ ...current, [key]: value }));
  };

  const duplicateCalendarEvent = (event: CalendarEvent) => {
    if (event.eventType === "sports_event") return;
    setEditingEventId(null);
    setEventDraft({
      ...makeEventDraft(event.date),
      ...event,
      title: `${event.title} (copy)`,
      sourceInboxId: undefined,
    });
    setTodoDraft("");
    setSelectedEventDetail(null);
    setCalendarOpen(true);
    setEventEditorOpen(true);
  };

  const moveCalendarEvent = (eventId: string, destinationDate: string) => {
    const event = calendarEvents.find((candidate) => candidate.id === eventId);
    if (!event || event.date === destinationDate) return;
    const conflict = allCalendarEvents.find(
      (candidate) =>
        candidate.id !== event.id &&
        !candidate.allDay &&
        !event.allDay &&
        eventOccursOn(candidate, destinationDate) &&
        rangesOverlap(event.time, event.endTime, candidate.time, candidate.endTime),
    );
    if (
      conflict &&
      !window.confirm(
        `This overlaps with ${conflict.title} · ${eventTimeLabel(conflict)}. Move it anyway?`,
      )
    ) {
      return;
    }
    recordAction("Moved event");
    setCalendarEvents((current) =>
      current.map((candidate) =>
        candidate.id === eventId
          ? {
              ...candidate,
              date: destinationDate,
              endDate:
                candidate.endDate && candidate.endDate !== candidate.date
                  ? addDays(
                      destinationDate,
                      Math.max(
                        0,
                        Math.round(
                          (dateFromKey(candidate.endDate).getTime() -
                            dateFromKey(candidate.date).getTime()) /
                            86_400_000,
                        ),
                      ),
                    )
                  : destinationDate,
            }
          : candidate,
      ),
    );
    setSelectedCalendarDate(destinationDate);
  };

  const startCalendarEventDrag = (
    event: ReactPointerEvent<HTMLElement>,
    calendarEvent: CalendarEvent,
  ) => {
    if (calendarEvent.eventType === "sports_event") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const timer = window.setTimeout(() => {
      setDraggingCalendarEventId(calendarEvent.id);
      setCalendarDragTarget(calendarEvent.date);
    }, 360);
    calendarEventDragRef.current = {
      id: calendarEvent.id,
      pointerId: event.pointerId,
      timer,
    };
  };

  const updateCalendarEventDrag = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    if (!draggingCalendarEventId) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-calendar-date]")
      ?.dataset.calendarDate;
    if (target) setCalendarDragTarget(target);
  };

  const finishCalendarEventDrag = () => {
    const drag = calendarEventDragRef.current;
    if (drag) window.clearTimeout(drag.timer);
    if (draggingCalendarEventId && calendarDragTarget) {
      moveCalendarEvent(draggingCalendarEventId, calendarDragTarget);
    }
    calendarEventDragRef.current = null;
    setDraggingCalendarEventId(null);
    setCalendarDragTarget(null);
  };

  const copyCurrentWeek = () => {
    const destination = window.prompt(
      "Choose any date in the destination week (YYYY-MM-DD)",
      addDays(selectedCalendarDate, 7),
    );
    if (!destination || !/^\d{4}-\d{2}-\d{2}$/.test(destination)) return;
    const sourceWeek = weekForDate(selectedCalendarDate).map((day) => day.key);
    const destinationWeek = weekForDate(destination).map((day) => day.key);
    const sourceEvents = calendarEvents.filter(
      (event) => event.repeat === "Never" && sourceWeek.includes(event.date),
    );
    if (sourceEvents.length === 0) {
      setHistoryMessage("There are no one-time events to copy this week.");
      return;
    }
    const preview = sourceEvents
      .map((event) => `${event.title} · ${eventTimeLabel(event)}`)
      .join("\n");
    if (!window.confirm(`Copy ${sourceEvents.length} events?\n\n${preview}`)) return;
    recordAction("Copied week");
    setCalendarEvents((current) => {
      const copies: CalendarEvent[] = [];
      sourceEvents.forEach((event) => {
        const dayIndex = sourceWeek.indexOf(event.date);
        const date = destinationWeek[dayIndex];
        const duplicate = current.some(
          (candidate) =>
            candidate.date === date &&
            candidate.time === event.time &&
            candidate.title.trim().toLowerCase() ===
              event.title.trim().toLowerCase(),
        );
        if (!duplicate) {
          copies.push({
            ...event,
            id: crypto.randomUUID(),
            date,
            endDate: date,
            sourceInboxId: undefined,
          });
        }
      });
      return [...current, ...copies];
    });
    setSelectedCalendarDate(destination);
  };

  const deleteSelectedEvents = () => {
    const events = calendarEvents.filter((event) =>
      selectedEventIds.includes(event.id),
    );
    if (events.length === 0) return;
    if (!window.confirm(`Move ${events.length} events to Trash?`)) return;
    recordAction("Deleted selected events");
    setTrashItems((current) => [
      ...events.map((event) => createTrashItem("event", event.title, event)),
      ...current,
    ]);
    setCalendarEvents((current) =>
      current.filter((event) => !selectedEventIds.includes(event.id)),
    );
    setSelectedEventIds([]);
    setCalendarMultiSelect(false);
  };

  const moveSelectedEvents = () => {
    const selected = calendarEvents.filter((event) =>
      selectedEventIds.includes(event.id),
    );
    if (selected.length === 0) return;
    const firstDate = [...selected].sort((a, b) => a.date.localeCompare(b.date))[0].date;
    const destination = window.prompt(
      "Move the first selected event to (YYYY-MM-DD)",
      addDays(firstDate, 1),
    );
    if (!destination || !/^\d{4}-\d{2}-\d{2}$/.test(destination)) return;
    const offset = Math.round(
      (dateFromKey(destination).getTime() - dateFromKey(firstDate).getTime()) /
        86_400_000,
    );
    const hasConflict = selected.some((event) => {
      const targetDate = addDays(event.date, offset);
      return allCalendarEvents.some(
        (candidate) =>
          !selectedEventIds.includes(candidate.id) &&
          !candidate.allDay &&
          !event.allDay &&
          eventOccursOn(candidate, targetDate) &&
          rangesOverlap(event.time, event.endTime, candidate.time, candidate.endTime),
      );
    });
    if (hasConflict && !window.confirm("One or more moved events overlap another event. Keep them anyway?")) return;
    recordAction("Moved selected events");
    setCalendarEvents((current) =>
      current.map((event) =>
        selectedEventIds.includes(event.id)
          ? {
              ...event,
              date: addDays(event.date, offset),
              endDate: addDays(event.endDate || event.date, offset),
            }
          : event,
      ),
    );
    setSelectedEventIds([]);
    setCalendarMultiSelect(false);
    goToCalendarDate(destination);
  };

  const recolorSelectedEvents = (color: EventColor) => {
    if (selectedEventIds.length === 0) return;
    recordAction("Changed selected event colors");
    setCalendarEvents((current) =>
      current.map((event) =>
        selectedEventIds.includes(event.id) ? { ...event, color } : event,
      ),
    );
  };

  const duplicateSelectedEvents = () => {
    const selected = calendarEvents.filter((event) =>
      selectedEventIds.includes(event.id),
    );
    if (selected.length === 0) return;
    recordAction("Duplicated selected events");
    setCalendarEvents((current) => [
      ...current,
      ...selected.map((event) => ({
        ...event,
        id: crypto.randomUUID(),
        title: `${event.title} (copy)`,
        sourceInboxId: undefined,
      })),
    ]);
    setSelectedEventIds([]);
    setCalendarMultiSelect(false);
  };

  const setEventTodoState = (
    eventId: string,
    todoIndex: number,
    nextState: "done" | "missed",
  ) => {
    const updateEvent = (event: CalendarEvent) => {
      if (event.id !== eventId) return event;
      const todoStates = [...(event.todoStates ?? [])];
      todoStates[todoIndex] =
        todoStates[todoIndex] === nextState ? "pending" : nextState;
      return { ...event, todoStates };
    };

    setCalendarEvents((current) => current.map(updateEvent));
    setSelectedEventDetail((current) =>
      current ? updateEvent(current) : current,
    );
  };

  const toggleHabit = (habitId: number, dayIndex = 3) => {
    setHabits((current) =>
      current.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              days: habit.days.map((done, index) =>
                index === dayIndex ? !done : done,
              ),
            }
          : habit,
      ),
    );
  };

  const saveJournalEntry = () => {
    if (!journalText.trim()) return;
    recordAction("Created note");
    const mood =
      moods.find((item) => item.label === moodHistory[todayKey])?.face ??
      journalFaces[entries.length % journalFaces.length];
    setEntries((current) => [
      {
        id: Date.now(),
        date: readableDate(todayKey),
        mood,
        text: journalText.trim(),
      },
      ...current,
    ]);
    setJournalText("");
  };

  const deleteJournalEntry = (id: number) => {
    const entry = entries.find((candidate) => candidate.id === id);
    if (!entry) return;
    moveToTrash("note", `Note · ${entry.date}`, entry);
    setSelectedJournalEntry((current) =>
      current?.id === id ? null : current,
    );
  };

  const saveSecretDiaryEntry = () => {
    const text = secretDiaryTextareaRef.current?.value.trim() ?? "";
    if (!text) return;
    const feeling =
      secretDiaryFeelings.find((item) => item.label === secretDiaryFeeling)
        ?.icon ?? "🌙";
    setSecretDiaryEntries((current) => [
      {
        id: Date.now(),
        date: readableDate(todayKey),
        feeling,
        text,
      },
      ...current,
    ]);
    if (secretDiaryTextareaRef.current) {
      secretDiaryTextareaRef.current.value = "";
    }
  };

  const deleteSecretDiaryEntry = (id: number) => {
    setSecretDiaryEntries((current) =>
      current.filter((entry) => entry.id !== id),
    );
    setSelectedSecretDiaryEntry((current) =>
      current?.id === id ? null : current,
    );
  };

  const stopSafePlaceHeartbeat = () => {
    if (refugeHeartbeatTimerRef.current !== null) {
      window.clearInterval(refugeHeartbeatTimerRef.current);
      refugeHeartbeatTimerRef.current = null;
    }
    if (refugeAudioContextRef.current) {
      void refugeAudioContextRef.current.close();
      refugeAudioContextRef.current = null;
    }
    setSafePlaceSoundOn(false);
  };

  const startSafePlaceHeartbeat = () => {
    stopSafePlaceHeartbeat();
    if (typeof AudioContext === "undefined") return;
    const context = new AudioContext();
    refugeAudioContextRef.current = context;
    void context.resume();

    const thump = (delay = 0) => {
      window.setTimeout(() => {
        if (context.state === "closed") return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(64, now);
        oscillator.frequency.exponentialRampToValueAtTime(48, now + 0.16);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.24);
      }, delay);
    };

    const beat = () => {
      thump();
      thump(145);
    };
    beat();
    refugeHeartbeatTimerRef.current = window.setInterval(beat, 1_320);
    setSafePlaceSoundOn(true);
  };

  const enterSafePlaceMode = (mode: SafePlaceMode) => {
    setSafePlaceMode(mode);
    setSafePlaceMessageIndex(0);
    setSafePlaceHugging(false);
    setSafePlaceLittleReply("");
    if (mode === "hold") startSafePlaceHeartbeat();
    else stopSafePlaceHeartbeat();
  };

  const closeSafePlace = () => {
    stopSafePlaceHeartbeat();
    setSafePlaceMode("home");
    setSafePlaceMessageIndex(0);
    setSafePlaceHugging(false);
    setRefugeOpen(false);
  };

  const saveSafePlaceCryNote = () => {
    if (!safePlaceCryText.trim()) return;
    recordAction("Created note");
    setEntries((current) => [
      {
        id: Date.now(),
        date: readableDate(todayKey),
        mood: "🌧️",
        text: safePlaceCryText.trim(),
      },
      ...current,
    ]);
    setSafePlaceCryText("");
  };

  const completeSafePlaceLittleThing = () => {
    const current = safePlaceLittleThings[safePlaceLittleStep]!;
    setSafePlaceLittleReply(current.response);
    window.setTimeout(() => {
      setSafePlaceLittleReply("");
      setSafePlaceLittleStep(
        (step) => (step + 1) % safePlaceLittleThings.length,
      );
    }, 1_900);
  };

  const chooseFocusLength = (minutes: number) => {
    setTimerRunning(false);
    setFocusLength(minutes);
    setFocusSeconds(minutes * 60);
  };

  const startRecording = async () => {
    setRecordingError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecordingError("Audio recording is not available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = isNative() ? await blobAsDataUrl(blob) : URL.createObjectURL(blob);
        recordAction("Created class recording");
        setRecordings((current) => [
          {
            id: Date.now(),
            className: selectedClass,
            name:
              recordingName.trim() ||
              `Class #${current.filter((item) => item.className === selectedClass).length + 1}`,
            notes: recordingNotes.trim(),
            duration: recordingSeconds,
            url,
          },
          ...current,
        ]);
        setRecordingName("");
        setRecordingNotes("");
        setRecordingSeconds(0);
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setRecordingError("Please allow microphone access to record a class.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    setIsRecording(false);
  };

  const openRecordingEditor = (recording: Recording) => {
    setEditingRecordingId(recording.id);
    setRecordingEditDraft({
      name: recording.name,
      notes: recording.notes,
    });
  };

  const saveRecordingEdit = () => {
    if (editingRecordingId === null) return;
    const nextName = recordingEditDraft.name.trim();
    if (!nextName) return;
    recordAction("Edited class recording");
    setRecordings((current) =>
      current.map((recording) =>
        recording.id === editingRecordingId
          ? {
              ...recording,
              name: nextName,
              notes: recordingEditDraft.notes.trim(),
            }
          : recording,
      ),
    );
    setEditingRecordingId(null);
  };

  const deleteRecording = (recording: Recording) => {
    if (!window.confirm(`Delete “${recording.name}”?`)) return;
    recordAction("Deleted class recording");
    if (recording.url?.startsWith("blob:")) {
      URL.revokeObjectURL(recording.url);
    }
    setRecordings((current) =>
      current.filter((item) => item.id !== recording.id),
    );
    if (editingRecordingId === recording.id) {
      setEditingRecordingId(null);
    }
  };

  const syncSketchHistory = () => {
    setHistoryDepth({
      undo: sketchStrokesRef.current.length,
      redo: sketchRedoRef.current.length,
    });
  };

  const canvasPointFromClient = (
    clientX: number,
    clientY: number,
    pressure: number,
    pointerType: string,
  ): SketchPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const safeWidth = Math.max(1, rect.width);
    const safeHeight = Math.max(1, rect.height);
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / safeWidth)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / safeHeight)),
      pressure:
        pointerType === "pen"
          ? Math.min(1, Math.max(0.12, pressure || 0.45))
          : 0.55,
    };
  };

  const renderStroke = (
    context: CanvasRenderingContext2D,
    stroke: SketchStroke,
    startIndex = 0,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || stroke.points.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const cssToCanvas = canvas.width / Math.max(1, rect.width);

    context.save();
    context.globalCompositeOperation =
      stroke.tool === "eraser" ? "destination-out" : "source-over";
    context.strokeStyle = stroke.color;
    context.fillStyle = stroke.color;
    context.lineCap = "round";
    context.lineJoin = "round";

    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      const width =
        (stroke.tool === "eraser"
          ? stroke.size * 4
          : stroke.size * (0.45 + point.pressure * 1.1)) * cssToCanvas;
      context.beginPath();
      context.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        width / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
      return;
    }

    for (
      let index = Math.max(1, startIndex);
      index < stroke.points.length;
      index += 1
    ) {
      const previous = stroke.points[index - 1];
      const current = stroke.points[index];
      const averagePressure = (previous.pressure + current.pressure) / 2;
      context.lineWidth =
        (stroke.tool === "eraser"
          ? stroke.size * 4
          : stroke.size * (0.45 + averagePressure * 1.1)) * cssToCanvas;
      context.beginPath();
      context.moveTo(
        previous.x * canvas.width,
        previous.y * canvas.height,
      );
      context.lineTo(current.x * canvas.width, current.y * canvas.height);
      context.stroke();
    }
    context.restore();
  };

  const redrawSketch = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    if (sketchBaseImageRef.current) {
      context.globalCompositeOperation = "source-over";
      context.drawImage(
        sketchBaseImageRef.current,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
    sketchStrokesRef.current.forEach((stroke) =>
      renderStroke(context, stroke),
    );
    if (activeStrokeRef.current) {
      renderStroke(context, activeStrokeRef.current);
    }
    context.restore();
  };
  useEffect(() => {
    redrawSketchRef.current = redrawSketch;
  });

  const resetSketchHistory = () => {
    sketchStrokesRef.current = [];
    sketchRedoRef.current = [];
    activeStrokeRef.current = null;
    activeSketchPointerRef.current = null;
    setHistoryDepth({ undo: 0, redo: 0 });
  };

  const undoDrawing = () => {
    const previous = sketchStrokesRef.current.pop();
    if (!previous) return;
    sketchRedoRef.current.push(previous);
    syncSketchHistory();
    redrawSketch();
  };

  const redoDrawing = () => {
    const next = sketchRedoRef.current.pop();
    if (!next) return;
    sketchStrokesRef.current.push(next);
    syncSketchHistory();
    redrawSketch();
  };

  const setSketchZoomAround = (
    nextZoom: number,
    clientPoint?: { x: number; y: number },
    commit = true,
  ) => {
    const viewport = sketchViewportRef.current;
    const previousZoom = sketchZoomRef.current;
    const zoom = Math.min(3, Math.max(1, Number(nextZoom.toFixed(2))));
    if (zoom === previousZoom) return;

    if (viewport) {
      const bounds = viewport.getBoundingClientRect();
      const anchor = clientPoint ?? {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      };
      const localX = anchor.x - bounds.left;
      const localY = anchor.y - bounds.top;
      const contentX = (viewport.scrollLeft + localX) / previousZoom;
      const contentY = (viewport.scrollTop + localY) / previousZoom;
      pendingSketchZoomRef.current = {
        zoom,
        contentX,
        contentY,
        localX,
        localY,
      };
      if (sketchZoomFrameRef.current === null) {
        sketchZoomFrameRef.current = window.requestAnimationFrame(() => {
          const pending = pendingSketchZoomRef.current;
          const stage = sketchStageRef.current;
          if (pending && stage) {
            stage.style.setProperty("--sketch-zoom", String(pending.zoom));
            stage.style.setProperty(
              "--sketch-stage-size",
              `${pending.zoom * 100}%`,
            );
            stage.style.setProperty(
              "--sketch-inverse-zoom",
              String(1 / pending.zoom),
            );
          }
          if (pending && sketchViewportRef.current) {
            sketchViewportRef.current.scrollLeft =
              pending.contentX * pending.zoom - pending.localX;
            sketchViewportRef.current.scrollTop =
              pending.contentY * pending.zoom - pending.localY;
          }
          pendingSketchZoomRef.current = null;
          sketchZoomFrameRef.current = null;
        });
      }
    }

    sketchZoomRef.current = zoom;
    if (commit) setSketchZoom(zoom);
  };

  const sketchGesture = () => {
    const pointers = Array.from(sketchPointersRef.current.values());
    if (pointers.length < 2) return null;
    const [first, second] = pointers;
    return {
      distance: Math.hypot(second.x - first.x, second.y - first.y),
      midpoint: {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      },
    };
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sketchPointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    canvas.setPointerCapture(event.pointerId);

    if (event.pointerType === "pen") {
      stylusDetectedRef.current = true;
      setStylusDetected(true);
    }

    if (event.pointerType === "touch" && sketchPointersRef.current.size >= 2) {
      activeStrokeRef.current = null;
      activeSketchPointerRef.current = null;
      redrawSketch();
      sketchGestureRef.current = sketchGesture();
      return;
    }

    if (event.pointerType === "touch" && stylusDetectedRef.current) {
      return;
    }

    const point = canvasPointFromClient(
      event.clientX,
      event.clientY,
      event.pressure,
      event.pointerType,
    );
    activeStrokeRef.current = {
      tool: penTool,
      color: penColor,
      size: penSize,
      points: [point],
    };
    activeSketchPointerRef.current = event.pointerId;
    sketchRedoRef.current = [];
  };

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (sketchPointersRef.current.has(event.pointerId)) {
      sketchPointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (
      event.pointerType === "touch" &&
      sketchPointersRef.current.size >= 2
    ) {
      const nextGesture = sketchGesture();
      const previousGesture = sketchGestureRef.current;
      const viewport = sketchViewportRef.current;
      if (nextGesture && previousGesture) {
        if (viewport) {
          viewport.scrollLeft +=
            previousGesture.midpoint.x - nextGesture.midpoint.x;
          viewport.scrollTop +=
            previousGesture.midpoint.y - nextGesture.midpoint.y;
        }
        if (previousGesture.distance > 0) {
          setSketchZoomAround(
            sketchZoomRef.current *
              (nextGesture.distance / previousGesture.distance),
            nextGesture.midpoint,
            false,
          );
        }
      }
      sketchGestureRef.current = nextGesture;
      return;
    }

    if (
      activeSketchPointerRef.current !== event.pointerId ||
      !activeStrokeRef.current
    ) {
      return;
    }
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    const nativeEvents =
      event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    const stroke = activeStrokeRef.current;
    const firstNewIndex = stroke.points.length;
    const smoothing = Math.max(0.18, 1 - strokeStabilization * 0.82);

    nativeEvents.forEach((nativeEvent) => {
      const rawPoint = canvasPointFromClient(
        nativeEvent.clientX,
        nativeEvent.clientY,
        nativeEvent.pressure,
        nativeEvent.pointerType,
      );
      const previous = stroke.points[stroke.points.length - 1];
      const point = {
        x: previous.x + (rawPoint.x - previous.x) * smoothing,
        y: previous.y + (rawPoint.y - previous.y) * smoothing,
        pressure:
          previous.pressure +
          (rawPoint.pressure - previous.pressure) * Math.max(0.45, smoothing),
      };
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      if (distance > 0.00008) stroke.points.push(point);
    });

    if (stroke.points.length > firstNewIndex) {
      renderStroke(context, stroke, firstNewIndex);
    }
  };

  const stopDrawing = (event?: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event) {
      sketchPointersRef.current.delete(event.pointerId);
    } else {
      sketchPointersRef.current.clear();
    }
    if (sketchPointersRef.current.size < 2) {
      sketchGestureRef.current = null;
      setSketchZoom(sketchZoomRef.current);
    }
    if (
      event &&
      activeSketchPointerRef.current === event.pointerId &&
      activeStrokeRef.current
    ) {
      const stroke = activeStrokeRef.current;
      if (stroke.points.length === 1) {
        const context = canvasRef.current?.getContext("2d");
        if (context) renderStroke(context, stroke);
      }
      sketchStrokesRef.current.push(stroke);
      activeStrokeRef.current = null;
      activeSketchPointerRef.current = null;
      sketchRedoRef.current = [];
      syncSketchHistory();
    }
  };

  const clearCanvas = (remember = true) => {
    void remember;
    sketchBaseImageRef.current = null;
    resetSketchHistory();
    redrawSketch();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    let frame = 0;

    const resizeCanvas = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        let ratio = Math.min(
          3,
          Math.max(2, window.devicePixelRatio || 1),
        );
        const maximumPixels = 8_000_000;
        const requestedPixels = rect.width * ratio * rect.height * ratio;
        if (requestedPixels > maximumPixels) {
          ratio *= Math.sqrt(maximumPixels / requestedPixels);
        }
        const nextWidth = Math.max(1, Math.round(rect.width * ratio));
        const nextHeight = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width === nextWidth && canvas.height === nextHeight) return;
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        redrawSketchRef.current();
      });
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeTab, sketchFullscreen, space]);

  useEffect(
    () => () => {
      if (sketchZoomFrameRef.current !== null) {
        window.cancelAnimationFrame(sketchZoomFrameRef.current);
      }
    },
    [],
  );

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "aerea-note.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const refreshSketches = async () => {
    const payload = isNative()
      ? await AereaStorage.listSketches()
      : { pages: readBrowserSketches<SketchPage>() };
    if (payload.pages) setSavedPages(payload.pages);
  };

  const saveDrawingToApp = async () => {
    const canvas = canvasRef.current;
    if (!canvas || sketchSaving) return;
    setSketchSaving(true);
    setSketchMessage("");

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not prepare this page.");

      if (isNative()) {
        await AereaStorage.saveSketch({
          title: sketchTitle.trim() || "Untitled page",
          pageStyle,
          dataUrl: await blobAsDataUrl(blob),
        });
      } else {
        const now = new Date().toISOString();
        writeBrowserSketches<SketchPage>([
          {
            id: crypto.randomUUID(),
            title: sketchTitle.trim() || "Untitled page",
            pageStyle,
            createdAt: now,
            updatedAt: now,
            dataUrl: await blobAsDataUrl(blob),
          },
          ...readBrowserSketches<SketchPage>(),
        ]);
      }

      await refreshSketches();
      setSketchMessage("Saved safely inside aérea ♡");
    } catch (error) {
      setSketchMessage(
        error instanceof Error ? error.message : "Could not save this page.",
      );
    } finally {
      setSketchSaving(false);
    }
  };

  const loadSketchPage = (page: SketchPage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.onload = () => {
      sketchBaseImageRef.current = image;
      resetSketchHistory();
      redrawSketch();
      setSketchTitle(page.title);
      setPageStyle(page.pageStyle);
      setSketchMessage(`Opened “${page.title}”`);
    };
    image.src = page.dataUrl || `/api/sketches/${page.id}`;
  };

  const deleteSketchPage = async (pageId: string) => {
    if (isNative()) {
      await AereaStorage.deleteSketch({ id: pageId });
      await refreshSketches();
      setSketchMessage("Page moved out of your sketchbook.");
    } else {
      writeBrowserSketches(
        readBrowserSketches<SketchPage>().filter((page) => page.id !== pageId),
      );
      await refreshSketches();
      setSketchMessage("Page moved out of your sketchbook.");
    }
  };

  const sendSyncCode = async () => {
    setSyncMessage("Sending your private sign-in code…");
    try {
      await requestAereaCode(AEREA_ACCOUNT);
      setSyncCodeSent(true);
      setSyncMessage(`A sign-in code was sent to ${AEREA_ACCOUNT}.`);
    } catch (error) {
      setSyncMessage(
        error instanceof Error ? error.message : "Could not send the code.",
      );
    }
  };

  const confirmSyncCode = async () => {
    setSyncMessage("Checking the code…");
    try {
      await verifyAereaCode(syncCode);
      setSyncEmail(AEREA_ACCOUNT);
      setSyncCode("");
      setSyncCodeSent(false);
      setSyncMessage("Private sync is on. Reloading your saved day…");
      window.location.reload();
    } catch (error) {
      setSyncMessage(
        error instanceof Error ? error.message : "That code did not work.",
      );
    }
  };

  const signOutOfSync = async () => {
    await supabase.auth.signOut();
    setSyncEmail(null);
    setSyncCodeSent(false);
    setSyncMessage("Signed out. Your local copy is still safe on this device.");
  };

  return (
    <main
      className="app-shell"
      data-theme={appTheme}
      data-color-mode={colorMode}
      data-refuge-open={refugeOpen}
      style={customThemeStyle}
    >
      <div className="paper-grain" aria-hidden="true" />
      <section
        className={
          sketchFullscreen
            ? "phone-canvas sketchbook-fullscreen-active"
            : "phone-canvas"
        }
      >
        {!sketchFullscreen && (
          <div
            className="storybook-scene"
            data-visual={activeTheme.id}
            aria-hidden="true"
          >
            <span className="storybook-cloud cloud-one" />
            <span className="storybook-cloud cloud-two" />
            <span className="storybook-hill hill-one" />
            <span className="storybook-hill hill-two" />
            {activeTheme.decoratedScene && (
              <>
                <span className="theme-scene-sparkle sparkle-one">✦</span>
                <span className="theme-scene-sparkle sparkle-two">✧</span>
                <span className="theme-scene-sparkle sparkle-three">✦</span>
                <span className="theme-scene-frame" />
                <span className="theme-scene-ribbon" />
                <span className="theme-scene-dots" />
                <img
                  className="theme-scene-accent accent-1"
                  src={activeTheme.accents[0]}
                  alt=""
                />
                <img
                  className="theme-scene-accent accent-2"
                  src={activeTheme.accents[1]}
                  alt=""
                />
              </>
            )}
          </div>
        )}
        {!sketchFullscreen && <header className="topbar">
          <button
            className="brand-wrap"
            onClick={() => setRefugeOpen(true)}
            aria-label="Open Safe Place"
          >
            <span className="brand-mark profile-mark">
              {profilePhoto ? (
                <img src={profilePhoto} alt="" />
              ) : (
                <span aria-hidden="true">♡</span>
              )}
            </span>
            <span>
              <span className="eyebrow">MY LITTLE DAY</span>
              <strong className="wordmark">aérea</strong>
            </span>
          </button>
          <div className="header-actions">
            <button
              className="calendar-button"
              onClick={openCalendarAtToday}
            >
              <span className="calendar-glyph" aria-hidden="true" />
              Calendar
            </button>
            <button
              className="avatar-button"
              aria-label="Open appearance settings"
              onClick={() => setSettingsOpen(true)}
            >
              <span>⚙</span>
            </button>
          </div>
        </header>}

        <div className="main-content">
          {activeTab === "today" && (
            <TodayScreen
              pending={pending}
              completed={completed}
              completeReminder={(id) =>
                updateDoneIds((current) => [...current, id])
              }
              restoreReminder={(id) =>
                updateDoneIds((current) =>
                  current.filter((item) => item !== id),
                )
              }
              createReminder={createReminder}
              deleteReminder={deleteReminder}
              openCalendar={openCalendarAtToday}
              yesterdayDoneCount={yesterdayDoneCount}
              selectedDate={selectedHomeDate}
              selectDate={setSelectedHomeDate}
              todayKey={todayKey}
              weekDays={homeWeek}
              selectedDateEvents={selectedHomeEvents}
              openEventDetail={setSelectedEventDetail}
              dayCharm={activeTheme.art}
              dayCharmLabel={activeTheme.name}
              dayCharmText={activeTheme.charm}
              showDayCharm={activeTheme.showCharm !== false}
              isNight={isNight}
            />
          )}

          {activeTab === "habits" && (
            <section className="screen-section">
              <ScreenIntro
                label="SMALL STEPS, SOFTLY"
                title="Your habits"
                copy="Consistency matters more than perfection. Tap today when a little promise is done."
                sticker="🌿"
              />
              <div className="habit-summary card">
                <div className="habit-ring">
                  <strong>{habitCompletions}</strong>
                  <span>of {habits.length}</span>
                </div>
                <div>
                  <p className="tiny-label">TODAY&apos;S PROGRESS</p>
                  <h3>
                    {habits.length === 0
                      ? "Your first habit can start softly."
                      : habitCompletions === habits.length
                      ? "Every little promise kept!"
                      : "You are growing gently."}
                  </h3>
                  <p>Each check becomes part of your gentle progress.</p>
                </div>
              </div>
              <div className="habit-list">
                {habits.map((habit) => (
                  <article className={`habit-row ${habit.color}`} key={habit.id}>
                    <button
                      className="habit-icon habit-edit-icon"
                      onClick={() => openHabitEditor(habit)}
                      aria-label={`Edit ${habit.title}`}
                    >
                      {habit.icon}
                    </button>
                    <div className="habit-name">
                      <strong>{habit.title}</strong>
                      <small>{habit.streak} day gentle streak</small>
                    </div>
                    <div className="habit-dots">
                      {habit.days.map((done, index) => (
                        <button
                          key={index}
                          className={done ? "habit-dot done" : "habit-dot"}
                          onClick={() => toggleHabit(habit.id, index)}
                          aria-label={`Toggle day ${index + 1}`}
                        >
                          <small>
                            {["M", "T", "W", "T", "F", "S", "S"][index]}
                          </small>
                          <span>{done ? "✓" : ""}</span>
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <button
                className="primary-soft-button"
                onClick={() => openHabitEditor()}
              >
                ＋ Add a new habit
              </button>
            </section>
          )}

          {activeTab === "focus" && (
            <section className="screen-section focus-screen">
              <ScreenIntro
                label="A QUIET POCKET OF TIME"
                title="Let’s focus together"
                copy="Choose a gentle session and give one thing your full attention."
                sticker="⏳"
              />
              <div className="focus-layout">
                <article className="timer-card card">
                  <div className="timer-modes">
                    {[
                      [25, "Focus"],
                      [5, "Short break"],
                      [15, "Long break"],
                    ].map(([minutes, label]) => (
                      <button
                        key={minutes}
                        className={focusLength === minutes ? "active" : ""}
                        onClick={() => chooseFocusLength(minutes as number)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div
                    className={timerRunning ? "timer-bloom running" : "timer-bloom"}
                    style={
                      {
                        "--timer-progress": `${focusProgress}%`,
                      } as CSSProperties
                    }
                  >
                    <div className="timer-color-well" aria-hidden="true" />
                    <span className="timer-keepsake keepsake-one" aria-hidden="true">
                      ୨୧
                    </span>
                    <span className="timer-keepsake keepsake-two" aria-hidden="true">
                      ♡
                    </span>
                    <span className="timer-keepsake keepsake-three" aria-hidden="true">
                      ✦
                    </span>
                    <span className="timer-keepsake keepsake-four" aria-hidden="true">
                      ❀
                    </span>
                    <div className="timer-bloom-face">
                      <span className="tiny-label">GENTLE FOCUS</span>
                      <strong>{formatTimer(focusSeconds)}</strong>
                      <small>
                        {timerRunning
                          ? "color fades gently with the time"
                          : "ready when you are"}
                      </small>
                    </div>
                  </div>
                  <div className="timer-actions">
                    <button
                      className="timer-main"
                      onClick={() => setTimerRunning((current) => !current)}
                    >
                      {timerRunning ? "Pause" : "Start focus"}
                    </button>
                    <button
                      className="timer-reset"
                      onClick={() => {
                        setTimerRunning(false);
                        setFocusSeconds(focusLength * 60);
                      }}
                    >
                      ↻
                    </button>
                  </div>
                </article>
                <aside className="focus-side">
                  <span className="focus-sticker" aria-hidden="true">✦</span>
                  <h3>Your quiet progress</h3>
                  <p>Every finished session is saved as a small win.</p>
                  <div className="session-count">
                    <span>✦</span>
                    <strong>{focusSessions}</strong>
                    <small>focus sessions today</small>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {activeTab === "journal" && (
            <section className="screen-section">
              <ScreenIntro
                label="A PAGE JUST FOR YOU"
                title="Quick journal"
                copy="Capture the thought before it floats away. A sentence is enough."
                sticker="🪶"
              />
              <div className="journal-layout">
                <article className="journal-compose card">
                  <p className="tiny-label">A QUICK NOTE</p>
                  <label className="journal-paper">
                    <span>Today, I want to remember…</span>
                    <textarea
                      value={journalText}
                      onChange={(event) => setJournalText(event.target.value)}
                      placeholder="Write whatever is sitting with you."
                    />
                  </label>
                  <div className="journal-actions">
                    <small>Your words stay private.</small>
                    <button onClick={saveJournalEntry}>Save this moment</button>
                  </div>
                </article>
                <aside className="recent-entries">
                  <p className="tiny-label">RECENT LITTLE MOMENTS</p>
                  {entries.map((entry, index) => (
                    <article className="entry-card" key={entry.id}>
                      <button
                        className="entry-card-open"
                        onClick={() => setSelectedJournalEntry(entry)}
                        aria-label={`Open note from ${entry.date}`}
                      >
                        <div className="entry-card-top">
                          <span className="entry-face">
                            {journalFaceFor(index)}
                          </span>
                          <small>{entry.date}</small>
                        </div>
                        <p>{notePreview(entry.text)}</p>
                      </button>
                      <button
                        className="delete-entry"
                        onClick={() => deleteJournalEntry(entry.id)}
                        aria-label={`Delete note from ${entry.date}`}
                        title="Delete this note"
                      >
                        ×
                      </button>
                    </article>
                  ))}
                </aside>
              </div>
            </section>
          )}

          {activeTab === "spaces" && (
            <section className="screen-section">
              {space === "menu" && (
                <>
                  <ScreenIntro
                    label="EVERYTHING HAS A HOME"
                    title="Your little spaces"
                    copy="Classes, drawings, recordings, and plans—kept together, never crowded."
                    sticker="✨"
                  />
                  <div className="spaces-grid">
                    <SpaceCard
                      title="Inbox"
                      subtitle="Quick captures to sort later"
                      color="space-peach"
                      icon="＋"
                      note={`${inboxItems.length} captured`}
                      onClick={() => setSpace("inbox")}
                    />
                    <SpaceCard
                      title="Library"
                      subtitle="PDFs, EPUBs, files & notes"
                      color="space-blue"
                      icon="▤"
                      note={`${libraryItems.length} items`}
                      onClick={() => setSpace("library")}
                    />
                    <SpaceCard
                      title="Class library"
                      subtitle="Recordings with notes"
                      color="space-blue"
                      icon="🎧"
                      note={`${recordings.length} recordings`}
                      onClick={() => setSpace("classes")}
                    />
                    <SpaceCard
                      title="Post-its"
                      subtitle="A free little note board"
                      color="space-lilac"
                      icon="✎"
                      note={`${postIts.filter((item) => !item.archived).length} notes`}
                      onClick={() => setSpace("postits")}
                    />
                    <SpaceCard
                      title="Cute sketchbook"
                      subtitle="Draw and handwrite notes"
                      color="space-lilac"
                      icon="✎"
                      note="Grid · lined · blank"
                      onClick={() => setSpace("sketchbook")}
                    />
                    <SpaceCard
                      title="Focus"
                      subtitle="Your gentle timer"
                      color="space-peach"
                      icon="◷"
                      note={`${focusSessions} sessions today`}
                      onClick={() => changeTab("focus")}
                    />
                    <SpaceCard
                      title="Calendar"
                      subtitle="Everything in one rhythm"
                      color="space-peach"
                      icon="▦"
                      note="Android + aérea"
                      onClick={openCalendarAtToday}
                    />
                    <SpaceCard
                      title="Trash"
                      subtitle="Recoverable for 30 days"
                      color="space-lilac"
                      icon="♲"
                      note={`${trashItems.length} items`}
                      onClick={() => setSpace("trash")}
                    />
                  </div>
                </>
              )}

              {space === "inbox" && (
                <section className="feature-space inbox-space">
                  <InnerHeader
                    label="QUICK CAPTURE"
                    title="Inbox"
                    onBack={() => setSpace("menu")}
                  />
                  <div className="feature-space-toolbar">
                    <p>
                      Keep first, decide later. The original capture stays here
                      even after you turn it into something else.
                    </p>
                    <button onClick={() => setQuickCaptureOpen(true)}>
                      ＋ Capture something
                    </button>
                  </div>

                  {overdueTasks.length > 0 && (
                    <section className="reschedule-shelf">
                      <p className="tiny-label">NEEDS A NEW DAY</p>
                      {overdueTasks.map((task) => (
                        <article key={task.id}>
                          <div>
                            <strong>You didn&apos;t finish “{task.title}”.</strong>
                            <small>Originally {readableDate(task.dueDate)}</small>
                          </div>
                          <div>
                            <button onClick={() => rescheduleTask(task, "today")}>Today</button>
                            <button onClick={() => rescheduleTask(task, "tomorrow")}>Tomorrow</button>
                            <button onClick={() => rescheduleTask(task, "pick")}>Pick date</button>
                            <button onClick={() => rescheduleTask(task, "dismiss")}>Dismiss</button>
                          </div>
                        </article>
                      ))}
                    </section>
                  )}

                  <div className="inbox-list">
                    {inboxItems.map((item) => (
                      <article className="inbox-item" key={item.id}>
                        <div className="inbox-item-icon" aria-hidden="true">
                          {item.kind === "photo"
                            ? "▧"
                            : item.kind === "pdf"
                              ? "PDF"
                              : item.kind === "link"
                                ? "⌁"
                                : "✎"}
                        </div>
                        <div className="inbox-item-copy">
                          <small>{item.kind} · {new Date(item.createdAt).toLocaleString()}</small>
                          <strong>{item.text}</strong>
                          {item.originalName && <span>{item.originalName}</span>}
                          {(item.processedAs ?? []).length > 0 && (
                            <span>Also kept as {item.processedAs?.join(" · ")}</span>
                          )}
                        </div>
                        <div className="inbox-convert-actions">
                          {(["event", "task", "post-it", "note", "library"] as const).map(
                            (destination) => (
                              <button
                                key={destination}
                                onClick={() => convertInboxItem(item, destination)}
                              >
                                {destination}
                              </button>
                            ),
                          )}
                          <button
                            className="inbox-discard"
                            onClick={() => discardInboxItem(item)}
                          >
                            discard
                          </button>
                        </div>
                      </article>
                    ))}
                    {inboxItems.length === 0 && (
                      <p className="empty-feature-space">Your Inbox is clear ♡</p>
                    )}
                  </div>

                  <section className="task-shelf">
                    <div className="section-heading">
                      <div>
                        <p className="tiny-label">TASKS</p>
                        <h3>{tasks.filter((task) => !task.completed && !task.skipped).length} open</h3>
                      </div>
                    </div>
                    {tasks.filter((task) => !task.skipped).map((task) => (
                      <article className={task.completed ? "task-row done" : "task-row"} key={task.id}>
                        <button
                          onClick={() => {
                            recordAction(task.completed ? "Reopened task" : "Completed task");
                            setTasks((current) =>
                              current.map((candidate) =>
                                candidate.id === task.id
                                  ? {
                                      ...candidate,
                                      completed: !candidate.completed,
                                      updatedAt: new Date().toISOString(),
                                    }
                                  : candidate,
                              ),
                            );
                          }}
                        >
                          {task.completed ? "✓" : "○"}
                        </button>
                        <div>
                          <strong>{task.title}</strong>
                          <small>{readableDate(task.dueDate)}</small>
                        </div>
                        <details className="task-attachments">
                          <summary>
                            Attached
                            {((task.attachmentIds ?? []).length +
                              entityLinks.filter(
                                (link) =>
                                  link.fromType === "task" &&
                                  link.fromId === task.id &&
                                  link.toType === "note",
                              ).length) > 0 &&
                              ` · ${(task.attachmentIds ?? []).length + entityLinks.filter(
                                (link) =>
                                  link.fromType === "task" &&
                                  link.fromId === task.id &&
                                  link.toType === "note",
                              ).length}`}
                          </summary>
                          <div className="entity-attachment-picker">
                            <p className="tiny-label">LIBRARY</p>
                            {libraryItems
                              .filter((item) => !item.archived)
                              .map((item) => {
                                const checked =
                                  (task.attachmentIds ?? []).includes(item.id) ||
                                  hasEntityLink("task", task.id, "file", item.id);
                                return (
                                  <label key={item.id}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        toggleEntityLink(
                                          "task",
                                          task.id,
                                          "file",
                                          item.id,
                                          checked
                                            ? "Detached file from task"
                                            : "Attached file to task",
                                        )
                                      }
                                    />
                                    {item.kind === "pdf" ? "📄" : "▤"} {item.name}
                                  </label>
                                );
                              })}
                            <p className="tiny-label">NOTES</p>
                            {entries.map((entry) => {
                              const noteId = String(entry.id);
                              const checked = hasEntityLink(
                                "task",
                                task.id,
                                "note",
                                noteId,
                              );
                              return (
                                <label key={entry.id}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      toggleEntityLink(
                                        "task",
                                        task.id,
                                        "note",
                                        noteId,
                                        checked
                                          ? "Detached note from task"
                                          : "Attached note to task",
                                      )
                                    }
                                  />
                                  📝 {notePreview(entry.text, 38)}
                                </label>
                              );
                            })}
                            {libraryItems.length === 0 && entries.length === 0 && (
                              <small>Add a Library file or note first.</small>
                            )}
                          </div>
                        </details>
                        <button onClick={() => moveToTrash("task", task.title, task)}>×</button>
                      </article>
                    ))}
                  </section>
                </section>
              )}

              {space === "library" && (
                <section className="feature-space library-space">
                  <InnerHeader
                    label="YOUR REAL LIBRARY"
                    title="Library"
                    onBack={() => setSpace("menu")}
                  />
                  <div className="feature-space-toolbar">
                    <div>
                      <strong>Files stay in one place.</strong>
                      <p>Collections and favorites never duplicate the original.</p>
                    </div>
                    <div>
                      <label className="feature-file-button">
                        ＋ Add files
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.epub,image/*,audio/*,.doc,.docx,.txt"
                          onChange={(event) => {
                            const files = Array.from(event.target.files ?? []);
                            event.target.value = "";
                            files.forEach((file) => void importLibraryFile(file));
                          }}
                        />
                      </label>
                      <button onClick={createLibraryCollection}>New collection</button>
                    </div>
                  </div>

                  <div className="library-collections">
                    {libraryCollections.map((collection) => (
                      <article key={collection.id}>
                        <button
                          className={libraryCollectionFilter === collection.id ? "active" : ""}
                          onClick={() =>
                            setLibraryCollectionFilter((current) =>
                              current === collection.id ? null : collection.id,
                            )
                          }
                        >
                          <span>♡</span>
                          <strong>{collection.name}</strong>
                          <small>
                            {libraryItems.filter((item) =>
                              item.collectionIds?.includes(collection.id),
                            ).length} items
                          </small>
                        </button>
                        <div>
                          <button
                            onClick={() => {
                              const name = window.prompt("Rename collection", collection.name);
                              if (!name?.trim()) return;
                              recordAction("Renamed collection");
                              setLibraryCollections((current) =>
                                current.map((item) =>
                                  item.id === collection.id
                                    ? { ...item, name: name.trim() }
                                    : item,
                                ),
                              );
                            }}
                          >Rename</button>
                          <button
                            onClick={() => {
                              if (!window.confirm(`Delete collection “${collection.name}”? Files will stay in Library.`)) return;
                              recordAction("Deleted collection");
                              setLibraryCollections((current) =>
                                current.filter((item) => item.id !== collection.id),
                              );
                              setLibraryItems((current) =>
                                current.map((item) => ({
                                  ...item,
                                  collectionIds: item.collectionIds?.filter(
                                    (id) => id !== collection.id,
                                  ),
                                })),
                              );
                              setLibraryCollectionFilter(null);
                            }}
                          >Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>

                  {libraryItems.some((item) => item.lastOpenedAt) && (
                    <section className="library-strip">
                      <p className="tiny-label">RECENTLY OPENED</p>
                      <div>
                        {[...libraryItems]
                          .filter((item) => item.lastOpenedAt)
                          .sort((a, b) =>
                            (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""),
                          )
                          .slice(0, 6)
                          .map((item) => (
                            <button key={item.id} onClick={() => openLibraryItem(item)}>
                              <span>{item.kind === "pdf" ? "PDF" : "▤"}</span>
                              <strong>{item.name}</strong>
                              <small>
                                {item.readerLocation?.page
                                  ? `Continue · page ${item.readerLocation.page}`
                                  : "Open again"}
                              </small>
                            </button>
                          ))}
                      </div>
                    </section>
                  )}

                  <div className="library-filter-row">
                    <button
                      className={!libraryCollectionFilter ? "active" : ""}
                      onClick={() => setLibraryCollectionFilter(null)}
                    >All files</button>
                    <button
                      className={libraryCollectionFilter === "favorites" ? "active" : ""}
                      onClick={() => setLibraryCollectionFilter("favorites")}
                    >Favorites</button>
                    <span>{libraryItems.filter((item) => !item.archived).length}</span>
                    <span>♡ {libraryItems.filter((item) => item.favorite).length} favorites</span>
                  </div>
                  <div className="library-grid">
                    {libraryItems
                      .filter((item) => !item.archived)
                      .filter((item) =>
                        !libraryCollectionFilter
                          ? true
                          : libraryCollectionFilter === "favorites"
                            ? item.favorite
                            : item.collectionIds?.includes(libraryCollectionFilter),
                      )
                      .map((item) => (
                      <article key={item.id}>
                        <button className="library-cover" onClick={() => openLibraryItem(item)}>
                          {item.kind === "image" && item.dataUrl ? (
                            <img src={item.dataUrl} alt="" />
                          ) : (
                            <span>{item.kind === "pdf" ? "PDF" : item.kind.toUpperCase()}</span>
                          )}
                        </button>
                        <div>
                          <button onClick={() => openLibraryItem(item)}>
                            <strong>{item.name}</strong>
                            <small>
                              {item.readerLocation?.percentage
                                ? `${item.readerLocation.percentage}% read`
                                : item.kind}
                            </small>
                          </button>
                          <button
                            className={item.favorite ? "favorite active" : "favorite"}
                            onClick={() => {
                              recordAction(item.favorite ? "Removed favorite" : "Added favorite");
                              setLibraryItems((current) =>
                                current.map((candidate) =>
                                  candidate.id === item.id
                                    ? { ...candidate, favorite: !candidate.favorite }
                                    : candidate,
                                ),
                              );
                            }}
                            aria-label="Toggle favorite"
                          >
                            ♡
                          </button>
                          <button onClick={() => moveToTrash("file", item.name, item)}>×</button>
                        </div>
                      </article>
                    ))}
                  </div>
                  {libraryItems.some((item) => item.archived) && (
                    <details className="library-archive">
                      <summary>Archive · {libraryItems.filter((item) => item.archived).length}</summary>
                      {libraryItems.filter((item) => item.archived).map((item) => (
                        <article key={item.id}>
                          <span>{item.kind.toUpperCase()}</span>
                          <strong>{item.name}</strong>
                          <button
                            onClick={() => {
                              recordAction("Restored Library file");
                              updateLibraryItem(item.id, (current) => ({ ...current, archived: false }));
                            }}
                          >Restore</button>
                          <button onClick={() => moveToTrash("file", item.name, item)}>Trash</button>
                        </article>
                      ))}
                    </details>
                  )}
                  {libraryItems.length === 0 && (
                    <p className="empty-feature-space">Your Library is ready for its first file.</p>
                  )}
                </section>
              )}

              {space === "postits" && (
                <section className="feature-space postit-space">
                  <InnerHeader
                    label="LITTLE NOTES EVERYWHERE"
                    title="Post-its"
                    onBack={() => setSpace("menu")}
                  />
                  <div className="postit-toolbar">
                    <button
                      onClick={() => {
                        recordAction("Created post-it");
                        setPostIts((current) => [...current, newPostIt("")]);
                      }}
                    >
                      ＋ New post-it
                    </button>
                    <button
                      disabled={selectedPostItIds.length < 2}
                      onClick={groupSelectedPostIts}
                    >
                      Group selected
                    </button>
                    <button
                      disabled={!selectedPostItIds.some((id) =>
                        postIts.find((item) => item.id === id)?.groupId,
                      )}
                      onClick={ungroupSelectedPostIts}
                    >Ungroup</button>
                    <button
                      disabled={!selectedPostItIds.length}
                      onClick={() =>
                        updateSelectedPostIts("Locked selected post-its", (item) => ({
                          ...item,
                          locked: true,
                          updatedAt: new Date().toISOString(),
                        }))
                      }
                    >Lock</button>
                    <select
                      aria-label="Change selected post-it color"
                      defaultValue=""
                      disabled={!selectedPostItIds.length}
                      onChange={(event) => {
                        const color = event.target.value;
                        if (!color) return;
                        updateSelectedPostIts("Changed post-it colors", (item) => ({
                          ...item,
                          color,
                          updatedAt: new Date().toISOString(),
                        }));
                        event.target.value = "";
                      }}
                    >
                      <option value="">Color…</option>
                      <option value="#fff0a8">Butter</option>
                      <option value="#ffd8e5">Blush</option>
                      <option value="#d9ecff">Sky</option>
                      <option value="#ddf3cf">Mint</option>
                      <option value="#e4dcff">Lilac</option>
                    </select>
                    <button
                      disabled={!selectedPostItIds.length}
                      onClick={() => {
                        updateSelectedPostIts("Archived selected post-its", (item) => ({
                          ...item,
                          archived: true,
                          updatedAt: new Date().toISOString(),
                        }));
                        setSelectedPostItIds([]);
                      }}
                    >Archive</button>
                    <button
                      className="destructive"
                      disabled={!selectedPostItIds.length}
                      onClick={() => {
                        const selected = postIts.filter((item) => selectedPostItIds.includes(item.id));
                        if (!window.confirm(`Move ${selected.length} post-its to Trash?`)) return;
                        recordAction("Deleted selected post-its");
                        setTrashItems((current) => [
                          ...selected.map((item) => createTrashItem("post-it", "Post-it", item)),
                          ...current,
                        ]);
                        setPostIts((current) => current.filter((item) => !selectedPostItIds.includes(item.id)));
                        setSelectedPostItIds([]);
                      }}
                    >Trash</button>
                    <span>{selectedPostItIds.length} selected</span>
                  </div>
                  {postItGroups.length > 0 && (
                    <div className="postit-group-strip">
                      {postItGroups.map((group) => (
                        <button
                          key={group.id}
                          className={group.locked ? "locked" : ""}
                          onClick={() => {
                            recordAction(group.locked ? "Unlocked post-it group" : "Locked post-it group");
                            setPostItGroups((current) =>
                              current.map((candidate) =>
                                candidate.id === group.id
                                  ? { ...candidate, locked: !candidate.locked }
                                  : candidate,
                              ),
                            );
                          }}
                        >
                          {group.locked ? "🔒" : "◇"} {group.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="postit-board">
                    {postIts.filter((item) => !item.archived).map((postIt) => (
                      <article
                        className={[
                          "postit",
                          postIt.locked ? "locked" : "",
                          postIt.pinned ? "pinned" : "",
                          selectedPostItIds.includes(postIt.id) ? "selected" : "",
                        ].filter(Boolean).join(" ")}
                        key={postIt.id}
                        style={{
                          left: postIt.x,
                          top: postIt.y,
                          width: postIt.width,
                          height: postIt.height,
                          zIndex: postIt.zIndex,
                          background: postIt.color,
                          transform: `rotate(${postIt.rotation}deg)`,
                        }}
                        onPointerDown={(event) => startPostItDrag(event, postIt)}
                        onPointerMove={movePostIt}
                        onPointerUp={stopPostItDrag}
                        onPointerCancel={stopPostItDrag}
                      >
                        <header>
                          <button
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() =>
                              setSelectedPostItIds((current) =>
                                current.includes(postIt.id)
                                  ? current.filter((id) => id !== postIt.id)
                                  : [...current, postIt.id],
                              )
                            }
                            aria-label="Select post-it"
                          >
                            {selectedPostItIds.includes(postIt.id) ? "✓" : "○"}
                          </button>
                          <span>{postIt.pinned ? "PINNED" : postIt.groupId ? "GROUP" : "NOTE"}</span>
                          <button
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => {
                              recordAction(postIt.locked ? "Unlocked post-it" : "Locked post-it");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === postIt.id
                                    ? { ...candidate, locked: !candidate.locked }
                                    : candidate,
                                ),
                              );
                            }}
                          >
                            {postIt.locked ? "🔒" : "◇"}
                          </button>
                        </header>
                        <textarea
                          value={postIt.text}
                          onPointerDown={(event) => event.stopPropagation()}
                          onFocus={() => recordAction("Edited post-it")}
                          onChange={(event) =>
                            setPostIts((current) =>
                              current.map((candidate) =>
                                candidate.id === postIt.id
                                  ? {
                                      ...candidate,
                                      text: event.target.value,
                                      updatedAt: new Date().toISOString(),
                                    }
                                  : candidate,
                              ),
                            )
                          }
                          placeholder="Write a little something…"
                        />
                        <footer onPointerDown={(event) => event.stopPropagation()}>
                          <button
                            onClick={() => {
                              recordAction(postIt.pinned ? "Unpinned post-it" : "Pinned post-it");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === postIt.id
                                    ? { ...candidate, pinned: !candidate.pinned }
                                    : candidate,
                                ),
                              );
                            }}
                          >Pin</button>
                          <button
                            onClick={() => {
                              recordAction("Duplicated post-it");
                              setPostIts((current) => [
                                ...current,
                                {
                                  ...postIt,
                                  id: crypto.randomUUID(),
                                  x: postIt.x + 24,
                                  y: postIt.y + 24,
                                  zIndex: Math.max(...current.map((item) => item.zIndex)) + 1,
                                  groupId: undefined,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                },
                              ]);
                            }}
                          >Duplicate</button>
                          <button
                            onClick={() => {
                              recordAction("Brought post-it forward");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === postIt.id
                                    ? {
                                        ...candidate,
                                        zIndex: Math.max(...current.map((item) => item.zIndex)) + 1,
                                      }
                                    : candidate,
                                ),
                              );
                            }}
                          >Front</button>
                          <button
                            onClick={() => {
                              recordAction("Brought post-it forward");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === postIt.id
                                    ? { ...candidate, zIndex: candidate.zIndex + 1 }
                                    : candidate,
                                ),
                              );
                            }}
                          >Forward</button>
                          <button
                            onClick={() => {
                              recordAction("Sent post-it backward");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === postIt.id
                                    ? { ...candidate, zIndex: Math.max(0, candidate.zIndex - 1) }
                                    : candidate,
                                ),
                              );
                            }}
                          >Backward</button>
                          <button
                            onClick={() => {
                              recordAction("Sent post-it to back");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === postIt.id
                                    ? { ...candidate, zIndex: 0 }
                                    : candidate,
                                ),
                              );
                            }}
                          >Back</button>
                          <button
                            onClick={() => {
                              recordAction("Resized post-it");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === postIt.id
                                    ? {
                                        ...candidate,
                                        width: candidate.width >= 270 ? 170 : candidate.width + 50,
                                        height: candidate.height >= 230 ? 140 : candidate.height + 40,
                                      }
                                    : candidate,
                                ),
                              );
                            }}
                          >Size</button>
                          <button
                            onClick={() => {
                              recordAction("Archived post-it");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === postIt.id
                                    ? { ...candidate, archived: true }
                                    : candidate,
                                ),
                              );
                            }}
                          >Archive</button>
                          <button onClick={() => moveToTrash("post-it", "Post-it", postIt)}>×</button>
                        </footer>
                      </article>
                    ))}
                    {postIts.filter((item) => !item.archived).length === 0 && (
                      <p className="postit-empty">Tap “New post-it” and place it anywhere ♡</p>
                    )}
                  </div>
                  {postIts.some((item) => item.archived) && (
                    <details className="postit-archive">
                      <summary>Archive · {postIts.filter((item) => item.archived).length}</summary>
                      {postIts.filter((item) => item.archived).map((item) => (
                        <article key={item.id}>
                          <span>{notePreview(item.text, 70) || "Empty post-it"}</span>
                          <button
                            onClick={() => {
                              recordAction("Restored post-it from Archive");
                              setPostIts((current) =>
                                current.map((candidate) =>
                                  candidate.id === item.id
                                    ? { ...candidate, archived: false }
                                    : candidate,
                                ),
                              );
                            }}
                          >Restore</button>
                          <button onClick={() => moveToTrash("post-it", "Post-it", item)}>Trash</button>
                        </article>
                      ))}
                    </details>
                  )}
                </section>
              )}

              {space === "trash" && (
                <section className="feature-space trash-space">
                  <InnerHeader
                    label="RECOVERABLE FOR 30 DAYS"
                    title="Trash"
                    onBack={() => setSpace("menu")}
                  />
                  <p className="trash-explainer">
                    Archive keeps things for later. Trash is only for deleted
                    items and clears itself after 30 days.
                  </p>
                  <div className="trash-list">
                    {trashItems.map((item) => (
                      <article key={item.id}>
                        <span>{item.kind}</span>
                        <div>
                          <strong>{item.label}</strong>
                          <small>{trashDaysRemaining(item)} days remaining</small>
                        </div>
                        <button onClick={() => restoreTrashItem(item)}>Restore</button>
                        <button
                          className="delete-forever"
                          onClick={() => {
                            if (!window.confirm(`Delete “${item.label}” forever?`)) return;
                            void deleteTrashItemForever(item);
                          }}
                        >Delete forever</button>
                      </article>
                    ))}
                    {trashItems.length === 0 && (
                      <p className="empty-feature-space">Trash is empty.</p>
                    )}
                  </div>
                </section>
              )}

              {space === "classes" && (
                <section>
                  <InnerHeader
                    label="CLASS LIBRARY"
                    title="Recordings & notes"
                    onBack={() => setSpace("menu")}
                  />
                  <div className="classes-layout">
                    <aside className="class-list card">
                      <p className="tiny-label">MY CLASSES</p>
                      {classItems.map((item) => (
                        <div
                          className={`class-row ${
                            selectedClass === item.name ? "active" : ""
                          }`}
                          key={item.id}
                          style={
                            {
                              "--class-color": item.color,
                            } as CSSProperties
                          }
                        >
                          <button
                            className="class-icon-edit"
                            onClick={() => openClassEditor(item)}
                            aria-label={`Edit ${item.name}`}
                          >
                            {item.icon}
                          </button>
                          <button
                            className={
                              selectedClass === item.name
                                ? "class-item active"
                                : "class-item"
                            }
                            onClick={() => setSelectedClass(item.name)}
                          >
                            <span className="class-item-copy">
                              <strong>{item.name}</strong>
                              <small>
                                {
                                  recordings.filter(
                                    (recording) =>
                                      recording.className === item.name,
                                  ).length
                                }{" "}
                                saved audios
                              </small>
                            </span>
                          </button>
                        </div>
                      ))}
                      {classItems.length === 0 && (
                        <p className="empty-classes">
                          Add the classes you are taking right now.
                        </p>
                      )}
                      <button
                        className="add-class"
                        onClick={() => openClassEditor()}
                      >
                        ＋ Add a class
                      </button>
                    </aside>
                    <div className="recording-area">
                      {classItems.length === 0 ? (
                        <article className="record-card card empty-class-card">
                          <span>📚</span>
                          <h3>Your class shelf is ready</h3>
                          <p>
                            Add a class first, then keep its recordings and
                            notes together.
                          </p>
                          <button onClick={() => openClassEditor()}>
                            Add my first class
                          </button>
                        </article>
                      ) : (
                        <>
                      <article className="record-card card">
                        <div className="record-heading">
                          <div>
                            <p className="tiny-label">NEW CLASS AUDIO</p>
                            <h3>{selectedClass}</h3>
                          </div>
                          <span className={isRecording ? "live-dot active" : "live-dot"}>
                            {isRecording ? "recording" : "ready"}
                          </span>
                        </div>
                        <div className="record-fields">
                          <input
                            value={recordingName}
                            onChange={(event) => setRecordingName(event.target.value)}
                            placeholder={`Class #${classRecordings.length + 1}`}
                            aria-label="Recording name"
                          />
                          <textarea
                            value={recordingNotes}
                            onChange={(event) =>
                              setRecordingNotes(event.target.value)
                            }
                            placeholder="Notes to keep beside this recording…"
                          />
                        </div>
                        <div className="record-controls">
                          <button
                            className={isRecording ? "record-button active" : "record-button"}
                            onClick={isRecording ? stopRecording : startRecording}
                          >
                            <span>{isRecording ? "■" : "●"}</span>
                            {isRecording ? "Stop & save" : "Start recording"}
                          </button>
                          <strong>{formatTimer(recordingSeconds)}</strong>
                        </div>
                        {recordingError && (
                          <p className="record-error">{recordingError}</p>
                        )}
                      </article>
                      {selectedClassItem && (
                        <article className="class-materials card">
                          <div className="section-heading">
                            <div>
                              <p className="tiny-label">ATTACHED</p>
                              <h3>Files & notes for {selectedClass}</h3>
                            </div>
                          </div>
                          <div className="class-attached-items">
                            {entityLinks
                              .filter(
                                (link) =>
                                  link.fromType === "class" &&
                                  link.fromId === selectedClassItem.id,
                              )
                              .map((link) => {
                                const file =
                                  link.toType === "file"
                                    ? libraryItems.find(
                                        (item) => item.id === link.toId,
                                      )
                                    : null;
                                const note =
                                  link.toType === "note"
                                    ? entries.find(
                                        (entry) => String(entry.id) === link.toId,
                                      )
                                    : null;
                                if (file) {
                                  return (
                                    <button
                                      key={link.id}
                                      onClick={() => void openLibraryItem(file)}
                                    >
                                      {file.kind === "pdf" ? "📄" : "▤"} {file.name}
                                    </button>
                                  );
                                }
                                if (note) {
                                  return (
                                    <button
                                      key={link.id}
                                      onClick={() => setSelectedJournalEntry(note)}
                                    >
                                      📝 {notePreview(note.text, 42)}
                                    </button>
                                  );
                                }
                                return null;
                              })}
                            {classRecordings.map((recording) => (
                              <span key={`recording-${recording.id}`}>
                                🎙 {recording.name}
                              </span>
                            ))}
                          </div>
                          <div className="class-material-pickers">
                            <details>
                              <summary>Attach from Library</summary>
                              <div className="entity-attachment-picker">
                                {libraryItems
                                  .filter((item) => !item.archived)
                                  .map((item) => {
                                    const checked = hasEntityLink(
                                      "class",
                                      selectedClassItem.id,
                                      "file",
                                      item.id,
                                    );
                                    return (
                                      <label key={item.id}>
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() =>
                                            toggleEntityLink(
                                              "class",
                                              selectedClassItem.id,
                                              "file",
                                              item.id,
                                              checked
                                                ? "Detached file from class"
                                                : "Attached file to class",
                                            )
                                          }
                                        />
                                        {item.kind === "pdf" ? "📄" : "▤"} {item.name}
                                      </label>
                                    );
                                  })}
                                {libraryItems.length === 0 && (
                                  <small>Your Library is empty.</small>
                                )}
                              </div>
                            </details>
                            <details>
                              <summary>Attach a note</summary>
                              <div className="entity-attachment-picker">
                                {entries.map((entry) => {
                                  const noteId = String(entry.id);
                                  const checked = hasEntityLink(
                                    "class",
                                    selectedClassItem.id,
                                    "note",
                                    noteId,
                                  );
                                  return (
                                    <label key={entry.id}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          toggleEntityLink(
                                            "class",
                                            selectedClassItem.id,
                                            "note",
                                            noteId,
                                            checked
                                              ? "Detached note from class"
                                              : "Attached note to class",
                                          )
                                        }
                                      />
                                      📝 {notePreview(entry.text, 44)}
                                    </label>
                                  );
                                })}
                                {entries.length === 0 && (
                                  <small>No notes yet.</small>
                                )}
                              </div>
                            </details>
                          </div>
                        </article>
                      )}
                      <div className="recording-list">
                        <div className="section-heading">
                          <div>
                            <p className="tiny-label">SAVED IN THIS CLASS</p>
                            <h3>{classRecordings.length} recordings</h3>
                          </div>
                        </div>
                        {classRecordings.map((recording) => (
                          <article
                            className={
                              editingRecordingId === recording.id
                                ? "audio-item editing"
                                : "audio-item"
                            }
                            key={recording.id}
                          >
                            <div className="audio-icon">♫</div>
                            <div className="audio-copy">
                              {editingRecordingId === recording.id ? (
                                <div className="recording-edit-fields">
                                  <label>
                                    <span>Name</span>
                                    <input
                                      value={recordingEditDraft.name}
                                      onChange={(event) =>
                                        setRecordingEditDraft((current) => ({
                                          ...current,
                                          name: event.target.value,
                                        }))
                                      }
                                    />
                                  </label>
                                  <label>
                                    <span>Description or notes</span>
                                    <textarea
                                      value={recordingEditDraft.notes}
                                      onChange={(event) =>
                                        setRecordingEditDraft((current) => ({
                                          ...current,
                                          notes: event.target.value,
                                        }))
                                      }
                                    />
                                  </label>
                                  <div className="recording-edit-actions">
                                    <button onClick={saveRecordingEdit}>
                                      Save
                                    </button>
                                    <button
                                      className="recording-cancel"
                                      onClick={() => setEditingRecordingId(null)}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="recording-delete"
                                      onClick={() => deleteRecording(recording)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <strong>{recording.name}</strong>
                                  <small>{formatTimer(recording.duration)}</small>
                                  {recording.notes && <p>{recording.notes}</p>}
                                  {recording.url && (
                                    <audio
                                      controls
                                      controlsList="nodownload noplaybackrate"
                                      preload="metadata"
                                      src={recording.url}
                                    >
                                      <track kind="captions" />
                                    </audio>
                                  )}
                                </>
                              )}
                            </div>
                            {editingRecordingId !== recording.id && (
                              <button
                                className="audio-edit-button"
                                onClick={() => openRecordingEditor(recording)}
                                aria-label={`Edit ${recording.name}`}
                              >
                                ✎
                              </button>
                            )}
                          </article>
                        ))}
                      </div>
                        </>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {space === "sketchbook" && (
                <section>
                  <InnerHeader
                    label="CUTE SKETCHBOOK"
                    title="A page for your ideas"
                    onBack={() => setSpace("menu")}
                  />
                  <div
                    className={
                      sketchFullscreen
                        ? "sketch-layout sketch-fullscreen"
                        : "sketch-layout"
                    }
                  >
                    <aside
                      className={
                        sketchFullscreen
                          ? `sketch-tools card floating-tools ${
                              sketchToolbarOpen ? "open" : "closed"
                            }`
                          : "sketch-tools card"
                      }
                    >
                      <div>
                        <p className="tiny-label">DRAWING TOOL</p>
                        <div className="drawing-tool-toggle">
                          <button
                            className={penTool === "pen" ? "active" : ""}
                            onClick={() => setPenTool("pen")}
                          >
                            <span>✎</span> Pen
                          </button>
                          <button
                            className={penTool === "eraser" ? "active" : ""}
                            onClick={() => setPenTool("eraser")}
                          >
                            <span>▱</span> Eraser
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="tiny-label">QUICK CORRECTIONS</p>
                        <div className="sketch-history-controls">
                          <button
                            onClick={undoDrawing}
                            disabled={!canUndoSketch}
                            aria-label="Undo last stroke"
                          >
                            <span>↶</span> Undo
                          </button>
                          <button
                            onClick={redoDrawing}
                            disabled={!canRedoSketch}
                            aria-label="Redo stroke"
                          >
                            <span>↷</span> Redo
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="tiny-label">PAGE STYLE</p>
                        <div className="page-style-grid">
                          {([
                            ["grid", "▦", "Grid"],
                            ["lined", "☰", "Lined"],
                            ["dotted", "⠿", "Dotted"],
                            ["plain", "□", "Blank"],
                          ] as [PageStyle, string, string][]).map(
                            ([id, icon, label]) => (
                              <button
                                key={id}
                                className={pageStyle === id ? "active" : ""}
                                onClick={() => setPageStyle(id)}
                              >
                                <span>{icon}</span>
                                <small>{label}</small>
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="tiny-label">PEN COLOR</p>
                        <div className="pen-colors">
                          {["#23384b", "#3c87c7", "#ff8b57", "#65a84e", "#9b7bc7"].map(
                            (color) => (
                              <button
                                key={color}
                                className={penColor === color ? "active" : ""}
                                style={{ backgroundColor: color }}
                                onClick={() => setPenColor(color)}
                                aria-label={`Use ${color} pen`}
                              />
                            ),
                          )}
                        </div>
                      </div>
                      <label className="pen-size">
                        <span className="tiny-label">PEN SIZE</span>
                        <input
                          type="range"
                          min="1"
                          max="14"
                          value={penSize}
                          onChange={(event) => setPenSize(Number(event.target.value))}
                        />
                      </label>
                      <label className="pen-size stroke-stabilizer">
                        <span className="tiny-label">
                          STROKE STABILIZER ·{" "}
                          {Math.round(strokeStabilization * 100)}%
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="0.85"
                          step="0.05"
                          value={strokeStabilization}
                          onChange={(event) =>
                            setStrokeStabilization(Number(event.target.value))
                          }
                        />
                      </label>
                      <div
                        className={
                          stylusDetected
                            ? "stylus-status detected"
                            : "stylus-status"
                        }
                      >
                        <span>{stylusDetected ? "✦" : "✎"}</span>
                        <p>
                          <strong>
                            {stylusDetected
                              ? "Tablet pen detected"
                              : "Ready for your tablet pen"}
                          </strong>
                          <small>
                            Pressure and automatic palm rejection are on.
                          </small>
                        </p>
                      </div>
                      <button
                        className="clear-page"
                        onClick={() => clearCanvas()}
                      >
                        Clear page
                      </button>
                      <button
                        className="save-page"
                        onClick={saveDrawingToApp}
                        disabled={sketchSaving}
                      >
                        {sketchSaving ? "Saving…" : "Save inside aérea"}
                      </button>
                      <button className="download-page" onClick={downloadDrawing}>
                        Download a copy
                      </button>
                    </aside>
                    {sketchFullscreen && (
                      <div className="sketch-fullscreen-topbar">
                        <button
                          className="sketch-exit-fullscreen"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            exitSketchFullscreen();
                          }}
                        >
                          <span>←</span>
                          <span className="sketch-exit-label">Exit</span>
                        </button>
                        <div className="sketch-fullscreen-actions">
                          <button
                            onClick={undoDrawing}
                            disabled={!canUndoSketch}
                            aria-label="Undo last stroke"
                          >
                            ↶
                          </button>
                          <button
                            onClick={redoDrawing}
                            disabled={!canRedoSketch}
                            aria-label="Redo stroke"
                          >
                            ↷
                          </button>
                          <button
                            className={
                              sketchToolbarOpen
                                ? "sketch-toolbar-toggle active"
                                : "sketch-toolbar-toggle"
                            }
                            onClick={() =>
                              setSketchToolbarOpen((current) => !current)
                            }
                            aria-label={
                              sketchToolbarOpen
                                ? "Hide drawing tools"
                                : "Show drawing tools"
                            }
                          >
                            {sketchToolbarOpen ? "×" : "✎"}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="notebook-wrap">
                      <div className="notebook-top">
                        <input
                          value={sketchTitle}
                          onChange={(event) => setSketchTitle(event.target.value)}
                          aria-label="Page title"
                        />
                        <div>
                          <span>{readableDate(todayKey)}</span>
                          <button
                            className="fullscreen-page-button"
                            onClick={() => {
                              setSketchToolbarOpen(false);
                              sketchZoomRef.current = 1;
                              setSketchZoom(1);
                              setSketchFullscreen((current) => !current);
                            }}
                          >
                            {sketchFullscreen ? "Exit full page" : "Full page"}
                          </button>
                        </div>
                      </div>
                      <div
                        className="sketch-viewport"
                        ref={sketchViewportRef}
                      >
                        <div
                          className="sketch-zoom-stage"
                          ref={sketchStageRef}
                          style={
                            {
                              "--sketch-zoom": sketchZoom,
                              "--sketch-stage-size": `${sketchZoom * 100}%`,
                              "--sketch-inverse-zoom": 1 / sketchZoom,
                            } as CSSProperties
                          }
                        >
                          <div className={`drawing-page ${pageStyle}`}>
                            <span className="tape tape-one" />
                            <span className="tape tape-two" />
                            <canvas
                              ref={canvasRef}
                              width={1200}
                              height={800}
                              onPointerDown={startDrawing}
                              onPointerMove={draw}
                              onPointerUp={stopDrawing}
                              onPointerCancel={stopDrawing}
                              onLostPointerCapture={stopDrawing}
                              aria-label="Drawing and handwriting canvas"
                            />
                          </div>
                        </div>
                      </div>
                      {sketchFullscreen && (
                        <div className="sketch-fullscreen-bottombar">
                          <div
                            className="sketch-zoom-controls"
                            aria-label="Page zoom controls"
                          >
                            <button
                              onClick={() =>
                                setSketchZoomAround(sketchZoomRef.current - 0.25)
                              }
                              disabled={sketchZoom <= 1}
                              aria-label="Zoom out"
                            >
                              −
                            </button>
                            <strong>{Math.round(sketchZoom * 100)}%</strong>
                            <button
                              onClick={() =>
                                setSketchZoomAround(sketchZoomRef.current + 0.25)
                              }
                              disabled={sketchZoom >= 3}
                              aria-label="Zoom in"
                            >
                              ＋
                            </button>
                            <button
                              className="zoom-fit"
                              onClick={() => setSketchZoomAround(1)}
                            >
                              Fit
                            </button>
                            <small>Pinch with two fingers</small>
                          </div>
                        </div>
                      )}
                      {sketchMessage && (
                        <p className="sketch-message">{sketchMessage}</p>
                      )}
                    </div>
                  </div>
                  <section className="saved-sketches">
                    <div className="section-heading">
                      <div>
                        <p className="tiny-label">SAVED INSIDE AÉREA</p>
                        <h3>Your pages</h3>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => {
                          clearCanvas(false);
                          resetSketchHistory();
                          setSketchTitle("Untitled page");
                          setSketchMessage("A fresh page is ready.");
                        }}
                      >
                        ＋ New page
                      </button>
                    </div>
                    {savedPages.length === 0 ? (
                      <div className="empty-sketch-gallery">
                        <span>✎</span>
                        <p>Your saved pages will live here across devices.</p>
                      </div>
                    ) : (
                      <div className="sketch-gallery">
                        {savedPages.map((page) => (
                          <article key={page.id}>
                            <button
                              className={`sketch-thumb ${page.pageStyle}`}
                              onClick={() => loadSketchPage(page)}
                            >
                              <img
                                src={page.dataUrl || `/api/sketches/${page.id}`}
                                alt={`Preview of ${page.title}`}
                              />
                            </button>
                            <div>
                              <button onClick={() => loadSketchPage(page)}>
                                <strong>{page.title}</strong>
                                <small>{page.pageStyle} page</small>
                              </button>
                              <button
                                className="delete-sketch"
                                onClick={() => deleteSketchPage(page.id)}
                                aria-label={`Delete ${page.title}`}
                              >
                                ×
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </section>
              )}
            </section>
          )}
        </div>

        {!sketchFullscreen && (
          <>
            {(globalHistoryDepth.undo > 0 || globalHistoryDepth.redo > 0) && (
              <div className="global-history-controls" aria-label="Undo and redo">
                <button
                  onClick={undoGlobal}
                  disabled={globalHistoryDepth.undo === 0}
                  aria-label="Undo last action"
                >↶</button>
                <button
                  onClick={redoGlobal}
                  disabled={globalHistoryDepth.redo === 0}
                  aria-label="Redo last action"
                >↷</button>
              </div>
            )}
            <nav className="bottom-nav" aria-label="Primary navigation">
              {tabs.map((tab) =>
                tab.id === "focus" ? (
                  <button
                    key="quick-capture"
                    className="nav-item quick-capture-nav"
                    onClick={() => setQuickCaptureOpen(true)}
                    aria-label="Open Quick Capture"
                  >
                    <span>＋</span>
                    <small>Capture</small>
                  </button>
                ) : (
                  <button
                    key={tab.id}
                    className={
                      activeTab === tab.id ? "nav-item active" : "nav-item"
                    }
                    onClick={() => changeTab(tab.id)}
                  >
                    <span>{tab.icon}</span>
                    <small>{tab.label}</small>
                  </button>
                ),
              )}
            </nav>
          </>
        )}
      </section>

      {historyMessage && (
        <div className="history-snackbar" role="status">
          <span>{historyMessage}</span>
          {globalHistoryDepth.undo > 0 && (
            <button onClick={undoGlobal}>Undo</button>
          )}
          <button onClick={() => setHistoryMessage("")} aria-label="Dismiss">×</button>
        </div>
      )}

      {authCallbackStatus && (
        <div className="modal-backdrop auth-callback-backdrop" role="presentation">
          <section
            className={`auth-callback-modal ${authCallbackStatus.kind}`}
            role="dialog"
            aria-modal="true"
            aria-label="Email confirmation"
          >
            <span aria-hidden="true">
              {authCallbackStatus.kind === "working"
                ? "⋯"
                : authCallbackStatus.kind === "success"
                  ? "♡"
                  : "!"}
            </span>
            <p className="tiny-label">EMAIL CONFIRMATION</p>
            <h2>
              {authCallbackStatus.kind === "working"
                ? "One little moment"
                : authCallbackStatus.kind === "success"
                  ? "You’re confirmed"
                  : "This link needs help"}
            </h2>
            <p>{authCallbackStatus.message}</p>
            {authCallbackStatus.kind === "error" ? (
              <div>
                <button
                  onClick={() => {
                    setAuthCallbackStatus(null);
                    setSettingsOpen(true);
                    void sendSyncCode();
                  }}
                >Send another email</button>
                <button onClick={() => setAuthCallbackStatus(null)}>Close</button>
              </div>
            ) : authCallbackStatus.kind === "success" ? (
              <button onClick={() => setAuthCallbackStatus(null)}>Continue to aérea</button>
            ) : null}
          </section>
        </div>
      )}

      {quickCaptureOpen && (
        <div className="modal-backdrop quick-capture-backdrop" role="presentation">
          <form
            className="quick-capture-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Quick Capture"
            onSubmit={(event) => {
              event.preventDefault();
              void saveQuickCapture();
            }}
          >
            <header>
              <div>
                <p className="tiny-label">INBOX · KEEP IT NOW</p>
                <h2>Quick Capture</h2>
              </div>
              <button
                type="button"
                onClick={() => setQuickCaptureOpen(false)}
                aria-label="Close Quick Capture"
              >×</button>
            </header>
            <textarea
              autoFocus
              value={quickCaptureText}
              onChange={(event) => setQuickCaptureText(event.target.value)}
              placeholder="entregar tarea martes…"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void saveQuickCapture();
                }
              }}
            />
            <label className="quick-capture-file">
              <span>＋ Add a photo, PDF, or file</span>
              <input
                type="file"
                accept="image/*,.pdf,.epub,.doc,.docx,.txt,audio/*"
                onChange={(event) =>
                  setQuickCaptureFile(event.target.files?.[0] ?? null)
                }
              />
              {quickCaptureFile && <strong>{quickCaptureFile.name}</strong>}
            </label>
            <footer>
              <small>No folder needed. Sort it whenever you want.</small>
              <button
                type="submit"
                disabled={
                  quickCaptureSaving ||
                  (!quickCaptureText.trim() && !quickCaptureFile)
                }
              >
                {quickCaptureSaving ? "Keeping it…" : "Keep in Inbox"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {resetExperience && (
        <div className="modal-backdrop reset-backdrop" role="presentation">
          <section
            className={`reset-modal ${resetExperience}`}
            role="dialog"
            aria-modal="true"
            aria-label={resetExperience === "morning" ? "Morning Reset" : "Night Reset"}
          >
            <header>
              <div>
                <p className="tiny-label">
                  {resetExperience === "morning" ? "MORNING RESET" : "NIGHT RESET"}
                </p>
                <h2>
                  {dateFromKey(todayKey).toLocaleDateString("en", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </div>
              <button onClick={closeResetExperience} aria-label="Close">×</button>
            </header>

            {resetExperience === "morning" ? (
              <>
                <p className="reset-summary">
                  {allCalendarEvents.filter((event) => eventOccursOn(event, todayKey)).length} events · {todayTasks.filter((task) => !task.completed).length} tasks · {pending.length} reminders
                </p>
                <div className="reset-category-grid">
                  <button onClick={() => { closeResetExperience(); openCalendarAtToday(); }}>
                    <span>▦</span>
                    <strong>{allCalendarEvents.filter((event) => eventOccursOn(event, todayKey)).length}</strong>
                    <small>today&apos;s events</small>
                  </button>
                  <button onClick={() => { changeTab("spaces"); setSpace("inbox"); closeResetExperience(); }}>
                    <span>✓</span>
                    <strong>{todayTasks.filter((task) => !task.completed).length}</strong>
                    <small>open tasks</small>
                  </button>
                  <button onClick={() => { changeTab("today"); closeResetExperience(); }}>
                    <span>♡</span>
                    <strong>{pending.length}</strong>
                    <small>gentle reminders</small>
                  </button>
                </div>
                {overdueTasks.length > 0 && (
                  <div className="reset-overdue">
                    <p className="tiny-label">FROM YESTERDAY</p>
                    {overdueTasks.map((task) => (
                      <article key={task.id}>
                        <strong>You didn&apos;t finish “{task.title}”.</strong>
                        <div>
                          <button onClick={() => rescheduleTask(task, "today")}>Today</button>
                          <button onClick={() => rescheduleTask(task, "tomorrow")}>Tomorrow</button>
                          <button onClick={() => rescheduleTask(task, "pick")}>Pick date</button>
                          <button onClick={() => rescheduleTask(task, "dismiss")}>Dismiss</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="reset-summary">
                  You finished {todayTasks.filter((task) => task.completed).length + doneIds.length} of {todayTasks.length + reminders.length} things today ♡
                </p>
                {todayTasks.filter((task) => !task.completed).length > 0 ? (
                  <div className="night-unfinished">
                    <p className="tiny-label">MOVE UNFINISHED THINGS?</p>
                    {todayTasks.filter((task) => !task.completed).map((task) => (
                      <article key={task.id}>
                        <strong>{task.title}</strong>
                        <div>
                          <button onClick={() => rescheduleTask(task, "tomorrow")}>Tomorrow</button>
                          <button onClick={() => rescheduleTask(task, "pick")}>Pick date</button>
                          <button onClick={() => rescheduleTask(task, "dismiss")}>Skip</button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="reset-all-done">Everything important is tucked away for tonight.</p>
                )}
              </>
            )}
            <button className="reset-done" onClick={closeResetExperience}>
              {resetExperience === "morning" ? "Start my day" : "Good night ♡"}
            </button>
          </section>
        </div>
      )}

      {calendarOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className={
              eventEditorOpen
                ? "calendar-modal calendar-event-mode"
                : "calendar-modal"
            }
            role="dialog"
            aria-modal="true"
            aria-label={
              eventEditorOpen ? "Calendar event editor" : "Interactive calendar"
            }
          >
            {eventEditorOpen ? (
              <>
                <div className="event-editor-top">
                  <button
                    className="event-editor-back"
                    type="button"
                    onClick={() => setEventEditorOpen(false)}
                    aria-label="Back to calendar"
                  >
                    ←
                  </button>
                  <div>
                    <p className="tiny-label">
                      {editingEventId ? "EDIT YOUR PLAN" : "A NEW LITTLE PLAN"}
                    </p>
                    <h2>{editingEventId ? "Edit event" : "New event"}</h2>
                  </div>
                  <button
                    className="event-save-button"
                    type="button"
                    onClick={saveCalendarEvent}
                    disabled={!eventDraft.title.trim()}
                  >
                    Save
                  </button>
                </div>

                <form
                  className="event-editor"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveCalendarEvent();
                  }}
                >
                  <label className="event-title-input">
                    <span>Title</span>
                    <input
                      autoFocus
                      value={eventDraft.title}
                      onChange={(event) =>
                        updateEventDraft("title", event.target.value)
                      }
                      placeholder="What are you planning?"
                    />
                  </label>

                  <section className="event-editor-card">
                    <label className="event-row">
                      <span className="event-row-icon">▦</span>
                      <span>
                        <small>Calendar</small>
                        <select
                          value={eventDraft.calendar}
                          onChange={(event) =>
                            updateEventDraft("calendar", event.target.value)
                          }
                        >
                          <option>Personal</option>
                          <option>Classes</option>
                          <option>Study</option>
                          <option>Health</option>
                        </select>
                      </span>
                    </label>

                    <label className="event-row switch-row">
                      <span className="event-row-icon">24</span>
                      <strong>All-day</strong>
                      <input
                        type="checkbox"
                        checked={eventDraft.allDay}
                        onChange={(event) =>
                          updateEventDraft("allDay", event.target.checked)
                        }
                      />
                    </label>

                    <div className="event-dates">
                      <label>
                        <span>Starts</span>
                        <input
                          type="date"
                          value={eventDraft.date}
                          onChange={(event) => {
                            const nextDate = event.target.value;
                            setEventDraft((current) => ({
                              ...current,
                              date: nextDate,
                              endDate:
                                !current.endDate || current.endDate < nextDate
                                  ? nextDate
                                  : current.endDate,
                            }));
                          }}
                        />
                        {!eventDraft.allDay && (
                          <input
                            type="time"
                            value={eventDraft.time}
                            onChange={(event) =>
                              updateEventDraft("time", event.target.value)
                            }
                          />
                        )}
                      </label>
                      <label>
                        <span>Ends</span>
                        <input
                          type="date"
                          min={eventDraft.date}
                          value={eventDraft.endDate}
                          onChange={(event) =>
                            updateEventDraft("endDate", event.target.value)
                          }
                        />
                        {!eventDraft.allDay && (
                          <input
                            type="time"
                            value={eventDraft.endTime}
                            onChange={(event) =>
                              updateEventDraft("endTime", event.target.value)
                            }
                          />
                        )}
                      </label>
                    </div>

                    <label className="event-row switch-row">
                      <span className="event-row-icon">⌖</span>
                      <strong>Save as memo</strong>
                      <input
                        type="checkbox"
                        checked={eventDraft.memo}
                        onChange={(event) =>
                          updateEventDraft("memo", event.target.checked)
                        }
                      />
                    </label>
                  </section>

                  <section className="event-editor-card">
                    <div className="event-setting-heading">
                      <span className="event-row-icon">◇</span>
                      <span>
                        <small>Event color</small>
                        <strong>
                          {
                            eventColors.find(
                              (color) => color.value === eventDraft.color,
                            )?.label
                          }
                        </strong>
                      </span>
                    </div>
                    <div className="event-color-palette">
                      {eventColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={
                            eventDraft.color === color.value ? "active" : ""
                          }
                          style={{ "--event-color": color.hex } as CSSProperties}
                          onClick={() =>
                            updateEventDraft("color", color.value)
                          }
                          aria-label={color.label}
                          title={color.label}
                        >
                          <span />
                        </button>
                      ))}
                    </div>

                    <label className="event-row">
                      <span className="event-row-icon">♙</span>
                      <span>
                        <small>People</small>
                        <input
                          value={eventDraft.guests}
                          onChange={(event) =>
                            updateEventDraft("guests", event.target.value)
                          }
                          placeholder="Add names or emails"
                        />
                      </span>
                    </label>

                    <label className="event-row">
                      <span className="event-row-icon">◷</span>
                      <span>
                        <small>Event reminder</small>
                        <select
                          value={eventDraft.reminder}
                          onChange={(event) =>
                            updateEventDraft("reminder", event.target.value)
                          }
                        >
                          <option>None</option>
                          <option>At start time</option>
                          <option>10 minutes before</option>
                          <option>30 minutes before</option>
                          <option>1 hour before</option>
                          <option>1 day before</option>
                        </select>
                      </span>
                    </label>
                  </section>

                  <section className="event-editor-card event-options-card">
                    <label className="event-option">
                      <span>↻</span>
                      <small>Repeat</small>
                      <select
                        value={eventDraft.repeat}
                        onChange={(event) =>
                          updateEventDraft(
                            "repeat",
                            event.target.value as RepeatOption,
                          )
                        }
                      >
                        <option>Never</option>
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Yearly</option>
                        <option>Custom</option>
                      </select>
                    </label>
                    {eventDraft.repeat === "Custom" && (
                      <div className="custom-repeat">
                        <span>Every</span>
                        <input
                          type="number"
                          min="1"
                          value={eventDraft.customRepeatEvery}
                          onChange={(event) =>
                            updateEventDraft(
                              "customRepeatEvery",
                              Number(event.target.value),
                            )
                          }
                        />
                        <select
                          value={eventDraft.customRepeatUnit}
                          onChange={(event) =>
                            updateEventDraft(
                              "customRepeatUnit",
                              event.target.value as
                                | "days"
                                | "weeks"
                                | "months",
                            )
                          }
                        >
                          <option value="days">days</option>
                          <option value="weeks">weeks</option>
                          <option value="months">months</option>
                        </select>
                      </div>
                    )}
                    <label className="event-option day-counter-option">
                      <span>▣</span>
                      <small>Day counter</small>
                      <input
                        type="checkbox"
                        checked={eventDraft.dayCounter}
                        onChange={(event) =>
                          updateEventDraft("dayCounter", event.target.checked)
                        }
                      />
                    </label>
                    <label className="event-option">
                      <span>⌖</span>
                      <small>Location</small>
                      <input
                        value={eventDraft.location}
                        onChange={(event) =>
                          updateEventDraft("location", event.target.value)
                        }
                        placeholder="Add a place"
                      />
                    </label>
                    <label className="event-option">
                      <span>⌁</span>
                      <small>URL</small>
                      <input
                        type="url"
                        value={eventDraft.url}
                        onChange={(event) =>
                          updateEventDraft("url", event.target.value)
                        }
                        placeholder="https://"
                      />
                    </label>
                  </section>

                  <section className="event-editor-card">
                    <label className="event-note-field">
                      <span>▤ Note</span>
                      <textarea
                        value={eventDraft.note}
                        onChange={(event) =>
                          updateEventDraft("note", event.target.value)
                        }
                        placeholder="Anything you want to remember…"
                      />
                    </label>

                    <div className="event-todo-field">
                      <span>✓ To-do list</span>
                      <div>
                        <input
                          value={todoDraft}
                          onChange={(event) => setTodoDraft(event.target.value)}
                          placeholder="Add a small step"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!todoDraft.trim()) return;
                            updateEventDraft("todos", [
                              ...(eventDraft.todos ?? []),
                              todoDraft.trim(),
                            ]);
                            updateEventDraft("todoStates", [
                              ...(eventDraft.todoStates ?? []),
                              "pending",
                            ]);
                            setTodoDraft("");
                          }}
                        >
                          Add
                        </button>
                      </div>
                      {(eventDraft.todos ?? []).map((todo, index) => (
                        <button
                          className="event-todo-item"
                          type="button"
                          key={`${todo}-${index}`}
                          onClick={() => {
                            updateEventDraft(
                              "todos",
                              (eventDraft.todos ?? []).filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            );
                            updateEventDraft(
                              "todoStates",
                              (eventDraft.todoStates ?? []).filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            );
                          }}
                        >
                          <i>✓</i>
                          <span>{todo}</span>
                          <small>remove</small>
                        </button>
                      ))}
                    </div>

                    <label className="event-file-field">
                      <span>⌕ Add new files</span>
                      <input
                        type="file"
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          event.target.value = "";
                          void Promise.all(files.map(importLibraryFile)).then(
                            (items) => {
                              updateEventDraft("files", [
                                ...(eventDraft.files ?? []),
                                ...items.map((item) => item.name),
                              ]);
                              updateEventDraft("attachmentIds", Array.from(new Set([
                                ...(eventDraft.attachmentIds ?? []),
                                ...items.map((item) => item.id),
                              ])));
                            },
                          );
                        }}
                      />
                      {(eventDraft.files ?? []).length > 0 && (
                        <small>{eventDraft.files?.join(" · ")}</small>
                      )}
                    </label>

                    {libraryItems.length > 0 && (
                      <div className="event-existing-attachments">
                        <span>Attached · choose from Library</span>
                        <div>
                          {libraryItems.filter((item) => !item.archived).map((item) => {
                            const attached = eventDraft.attachmentIds?.includes(item.id) ?? false;
                            return (
                              <label key={item.id}>
                                <input
                                  type="checkbox"
                                  checked={attached}
                                  onChange={(event) => {
                                    const ids = eventDraft.attachmentIds ?? [];
                                    updateEventDraft(
                                      "attachmentIds",
                                      event.target.checked
                                        ? Array.from(new Set([...ids, item.id]))
                                        : ids.filter((id) => id !== item.id),
                                    );
                                    const names = eventDraft.files ?? [];
                                    updateEventDraft(
                                      "files",
                                      event.target.checked
                                        ? Array.from(new Set([...names, item.name]))
                                        : names.filter((name) => name !== item.name),
                                    );
                                  }}
                                />
                                <span>{item.kind === "pdf" ? "📄" : "▤"}</span>
                                <strong>{item.name}</strong>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(entries.length > 0 || recordings.length > 0) && (
                      <div className="event-existing-attachments related-content-picker">
                        <span>Related notes & recordings</span>
                        <div>
                          {entries.map((note) => {
                            const attached = eventDraft.attachedNoteIds?.includes(note.id) ?? false;
                            return (
                              <label key={`note-${note.id}`}>
                                <input
                                  type="checkbox"
                                  checked={attached}
                                  onChange={(event) =>
                                    updateEventDraft(
                                      "attachedNoteIds",
                                      event.target.checked
                                        ? Array.from(new Set([...(eventDraft.attachedNoteIds ?? []), note.id]))
                                        : (eventDraft.attachedNoteIds ?? []).filter((id) => id !== note.id),
                                    )
                                  }
                                />
                                <span>📝</span>
                                <strong>{notePreview(note.text, 42)}</strong>
                              </label>
                            );
                          })}
                          {recordings.map((recording) => {
                            const attached = eventDraft.attachedRecordingIds?.includes(recording.id) ?? false;
                            return (
                              <label key={`recording-${recording.id}`}>
                                <input
                                  type="checkbox"
                                  checked={attached}
                                  onChange={(event) =>
                                    updateEventDraft(
                                      "attachedRecordingIds",
                                      event.target.checked
                                        ? Array.from(new Set([...(eventDraft.attachedRecordingIds ?? []), recording.id]))
                                        : (eventDraft.attachedRecordingIds ?? []).filter((id) => id !== recording.id),
                                    )
                                  }
                                />
                                <span>🎙</span>
                                <strong>{recording.name}</strong>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>

                  <button
                    className="mobile-event-save"
                    type="submit"
                    disabled={!eventDraft.title.trim()}
                  >
                    Save event
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="modal-top">
                  <div className="calendar-month-heading">
                    <button
                      onClick={() => shiftCalendarMonth(-1)}
                      aria-label="Previous month"
                    >
                      ←
                    </button>
                    <div>
                      <p className="tiny-label">YOUR WHOLE RHYTHM</p>
                      <h2>
                        {viewMonth.toLocaleDateString("en", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h2>
                    </div>
                    <button
                      onClick={() => shiftCalendarMonth(1)}
                      aria-label="Next month"
                    >
                      →
                    </button>
                  </div>
                  <button
                    onClick={() => setCalendarOpen(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="calendar-sources">
                  <span>
                    <i className="source-android" /> Android calendar
                  </span>
                  <span>
                    <i className="source-aerea" /> aérea
                  </span>
                  <span className="mood-source">◡‿◡ mood stickers</span>
                  <span className="swipe-source">↔ swipe months</span>
                </div>
                <div className="calendar-power-tools">
                  {selectedCalendarDate !== todayKey && (
                    <button onClick={openCalendarAtToday}>Today</button>
                  )}
                  <label>
                    <span>Jump to</span>
                    <input
                      type="date"
                      value={jumpDate}
                      onChange={(event) => setJumpDate(event.target.value)}
                    />
                    <button onClick={() => goToCalendarDate()}>Go</button>
                  </label>
                  <button onClick={copyCurrentWeek}>Copy week</button>
                  <button
                    className={calendarMultiSelect ? "active" : ""}
                    onClick={() => {
                      setCalendarMultiSelect((current) => !current);
                      setSelectedEventIds([]);
                    }}
                  >
                    {calendarMultiSelect ? "Done selecting" : "Select events"}
                  </button>
                </div>
                {calendarMultiSelect && (
                  <div className="calendar-batch-tools">
                    <strong>{selectedEventIds.length} selected</strong>
                    <button disabled={!selectedEventIds.length} onClick={moveSelectedEvents}>Move</button>
                    <button disabled={!selectedEventIds.length} onClick={duplicateSelectedEvents}>Duplicate</button>
                    <select
                      aria-label="Change selected event color"
                      defaultValue=""
                      disabled={!selectedEventIds.length}
                      onChange={(event) => {
                        if (!event.target.value) return;
                        recolorSelectedEvents(event.target.value as EventColor);
                        event.target.value = "";
                      }}
                    >
                      <option value="">Color…</option>
                      {eventColors.map((color) => (
                        <option key={color.value} value={color.value}>{color.label}</option>
                      ))}
                    </select>
                    <button
                      className="destructive"
                      disabled={!selectedEventIds.length}
                      onClick={deleteSelectedEvents}
                    >Trash</button>
                  </div>
                )}
                <div className="month-grid-viewport">
                  <div
                    key={`${calendarYear}-${calendarMonth}`}
                    className={[
                      "month-grid",
                      calendarSlideDirection
                        ? `calendar-slide-${calendarSlideDirection}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onAnimationEnd={() => setCalendarSlideDirection(null)}
                    onTouchStart={startCalendarSwipe}
                    onTouchEnd={finishCalendarSwipe}
                    aria-label="Calendar month. Swipe left or right to change month."
                  >
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (day) => <strong key={day}>{day}</strong>,
                  )}
                  {Array.from({ length: leadingDays }, (_, index) => (
                    <i key={`empty-${index}`} />
                  ))}
                  {Array.from({ length: daysInViewMonth }, (_, index) => {
                    const day = index + 1;
                    const dayKey = calendarDateKey(
                      calendarYear,
                      calendarMonth,
                      day,
                    );
                    const dayEvents = allCalendarEvents.filter((event) =>
                      eventOccursOn(event, dayKey),
                    );
                    const dayMood = moods.find(
                      (mood) => mood.label === moodHistory[dayKey],
                    );
                    const dayComplete = completedDays[dayKey] === true;
                    const dayMissed = dayKey < todayKey && !dayComplete;
                    return (
                      <button
                        key={day}
                        data-calendar-date={dayKey}
                        className={[
                          selectedCalendarDate === dayKey ? "selected" : "",
                          dayEvents.length > 0 ? "has-event" : "",
                          dayMood ? "has-mood" : "",
                          dayComplete ? "day-complete" : "",
                          dayMissed ? "day-missed" : "",
                          dayKey === todayKey ? "today" : "",
                          calendarDragTarget === dayKey ? "drag-target" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => setSelectedCalendarDate(dayKey)}
                      >
                        <span className="calendar-day-number">{day}</span>
                        {dayMood && (
                          <i
                            className={`calendar-mood-sticker ${dayMood.color}`}
                            title={dayMood.label}
                          >
                            {dayMood.face}
                          </i>
                        )}
                        {(dayComplete || dayMissed) && (
                          <i
                            className={
                              dayComplete
                                ? "calendar-day-status complete"
                                : "calendar-day-status missed"
                            }
                            title={
                              dayComplete
                                ? "Everything completed"
                                : "Day not marked complete"
                            }
                          >
                            {dayComplete ? "✓" : "×"}
                          </i>
                        )}
                        {dayEvents.length > 0 && (
                          <>
                            <span className="calendar-event-dots">
                              {dayEvents.slice(0, 3).map((event) => (
                                <b
                                  className={`event-dot ${event.color}`}
                                  key={event.id}
                                />
                              ))}
                            </span>
                            <small className={dayEvents.some((event) => event.sportsCardStyle) ? "has-match" : ""}>
                              {dayEvents.length === 1
                                ? dayEvents[0].sportsCardStyle
                                  ? `${dayEvents[0].sportsIcon ?? "♡"} MATCH DAY`
                                  : dayEvents[0].title
                                : `${dayEvents.length} plans`}
                            </small>
                          </>
                        )}
                      </button>
                    );
                  })}
                  </div>
                </div>
                <div className="selected-day-panel">
                  <div className="selected-day-heading">
                    <div>
                      <p className="tiny-label">SELECTED DAY</p>
                      <h3>{readableDate(selectedCalendarDate)}</h3>
                    </div>
                    <button onClick={() => openNewEvent()}>
                      ＋ Add event
                    </button>
                  </div>

                  <div className="calendar-mood-picker">
                    <div>
                      <span
                        className={
                          selectedDateMood
                            ? `selected-mood-sticker ${selectedDateMood.color}`
                            : "selected-mood-sticker empty"
                        }
                      >
                        {selectedDateMood?.face ?? "♡"}
                      </span>
                      <span>
                        <strong>How did this day feel?</strong>
                        <small>
                          Your answer becomes this day&apos;s sticker.
                        </small>
                      </span>
                      {selectedDateMood && (
                        <button
                          type="button"
                          onClick={() =>
                            setMoodHistory((current) => {
                              const next = { ...current };
                              delete next[selectedCalendarDate];
                              return next;
                            })
                          }
                        >
                          clear
                        </button>
                      )}
                    </div>
                    <MoodBubbles
                      selectedMood={selectedDateMood?.label ?? ""}
                      onSelect={(mood) =>
                        chooseMood(selectedCalendarDate, mood)
                      }
                    />
                  </div>

                  <div
                    className={[
                      "day-completion-control",
                      selectedDayComplete ? "complete" : "",
                      selectedDayMissed ? "missed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span>
                      {selectedDayComplete
                        ? "✓"
                        : selectedDayMissed
                          ? "×"
                          : "○"}
                    </span>
                    <div>
                      <strong>
                        {selectedDayComplete
                          ? "Everything completed"
                          : selectedDayMissed
                            ? "This day wasn’t completed"
                            : selectedCalendarDate > todayKey
                              ? "This day hasn’t arrived yet"
                              : "Finished everything today?"}
                      </strong>
                      <small>
                        Past days that are not checked automatically show ×.
                      </small>
                    </div>
                    <button
                      type="button"
                      disabled={selectedCalendarDate > todayKey}
                      onClick={() =>
                        setCompletedDays((current) => {
                          const next = { ...current };
                          if (selectedDayComplete) {
                            delete next[selectedCalendarDate];
                          } else {
                            next[selectedCalendarDate] = true;
                          }
                          return next;
                        })
                      }
                    >
                      {selectedDayComplete ? "Undo" : "Mark ✓"}
                    </button>
                  </div>

                  {selectedDateEvents.length === 0 ? (
                    <p className="empty-day">
                      Nothing here yet—this day is yours.
                    </p>
                  ) : (
                    <div className="selected-day-events">
                      {selectedDateEvents.map((calendarEvent) => {
                        const conflict =
                          !calendarEvent.allDay &&
                          selectedDateEvents.some(
                            (candidate) =>
                              candidate.id !== calendarEvent.id &&
                              !candidate.allDay &&
                              rangesOverlap(
                                calendarEvent.time,
                                calendarEvent.endTime,
                                candidate.time,
                                candidate.endTime,
                              ),
                          );
                        const selected = selectedEventIds.includes(calendarEvent.id);
                        return (
                          <article
                            className={[
                              "event-chip",
                              calendarEvent.color,
                              calendarEvent.sportsCardStyle ? "match-day" : "",
                              calendarEvent.allDay ? "all-day" : "",
                              conflict ? "has-conflict" : "",
                              selected ? "selected" : "",
                              draggingCalendarEventId === calendarEvent.id ? "dragging" : "",
                            ].filter(Boolean).join(" ")}
                            key={calendarEvent.id}
                            style={
                              calendarEvent.sportsCardStyle
                                ? ({
                                    "--sports-primary": calendarEvent.sportsPrimary,
                                    "--sports-secondary": calendarEvent.sportsSecondary,
                                  } as CSSProperties)
                                : undefined
                            }
                            onPointerDown={(event) => startCalendarEventDrag(event, calendarEvent)}
                            onPointerMove={updateCalendarEventDrag}
                            onPointerUp={finishCalendarEventDrag}
                            onPointerCancel={finishCalendarEventDrag}
                          >
                            <span>{calendarEvent.allDay ? "ALL DAY" : eventTimeLabel(calendarEvent)}</span>
                            <button
                              className="event-chip-main"
                              onClick={() => {
                                if (calendarMultiSelect) {
                                  if (calendarEvent.eventType === "sports_event") return;
                                  setSelectedEventIds((current) =>
                                    current.includes(calendarEvent.id)
                                      ? current.filter((id) => id !== calendarEvent.id)
                                      : [...current, calendarEvent.id],
                                  );
                                } else if (calendarEvent.eventType === "sports_event") {
                                  setSelectedEventDetail(calendarEvent);
                                } else {
                                  openEventEditor(calendarEvent);
                                }
                              }}
                              aria-label={`${calendarMultiSelect ? "Select" : "Open"} ${calendarEvent.title}`}
                            >
                              {calendarEvent.sportsCardStyle && (
                                <i>{calendarEvent.sportsIcon ?? "♡"} MATCH DAY</i>
                              )}
                              <strong>{calendarEvent.title}</strong>
                              <small>
                                {calendarEvent.calendar ?? "Personal"}
                                {(calendarEvent.repeat ?? "Never") !== "Never"
                                  ? ` · ${calendarEvent.repeat}`
                                  : ""}
                                {calendarEvent.location
                                  ? ` · ${calendarEvent.location}`
                                  : ""}
                                {conflict ? " · overlaps" : ""}
                              </small>
                            </button>
                            {calendarEvent.eventType !== "sports_event" && (
                              <button
                                className="event-chip-delete"
                                onClick={() => {
                                  if (!window.confirm(`Move “${calendarEvent.title}” to Trash?`)) return;
                                  moveToTrash("event", calendarEvent.title, calendarEvent);
                                }}
                                aria-label={`Delete ${calendarEvent.title}`}
                              >
                                ×
                              </button>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  className="calendar-add-large"
                  onClick={() => openNewEvent()}
                >
                  <span>＋</span>
                  Add something to {readableDate(selectedCalendarDate)}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {refugeOpen && (
        <div className="modal-backdrop refuge-backdrop" role="presentation">
          <section
            className="refuge-modal"
            data-safe-mode={safePlaceMode}
            role="dialog"
            aria-modal="true"
            aria-label="Safe Place"
          >
            <header className="refuge-header">
              <div>
                <p className="tiny-label">🌙 SAFE PLACE · SECRET DIARY</p>
                <h2>Welcome back, sweetheart.</h2>
                <p>A hidden page for the things you only want to tell yourself.</p>
              </div>
              <button onClick={closeSafePlace} aria-label="Close Safe Place">
                ×
              </button>
            </header>

            <div className="refuge-ribbon" aria-hidden="true">
              <span>♡</span>
              <i />
              <strong>soft · quiet · here with you</strong>
              <i />
              <span>♡</span>
            </div>

            {safePlaceMode === "home" ? (
              <div className="secret-diary-home">
                <article className="secret-diary-page">
                  <div className="secret-diary-date">
                    <span>PRIVATE PAGE</span>
                    <time>{readableDate(todayKey)}</time>
                  </div>
                  <h3>What can stay between these pages?</h3>
                  <div
                    className="secret-diary-feelings"
                    aria-label="How this page feels"
                  >
                    {secretDiaryFeelings.map((feeling) => (
                      <button
                        key={feeling.label}
                        className={
                          secretDiaryFeeling === feeling.label ? "active" : ""
                        }
                        onClick={() => setSecretDiaryFeeling(feeling.label)}
                        aria-pressed={secretDiaryFeeling === feeling.label}
                        aria-label={feeling.label}
                      >
                        <span aria-hidden="true">{feeling.icon}</span>
                        <small>{feeling.label}</small>
                      </button>
                    ))}
                  </div>
                  <label className="secret-diary-writing">
                    <span>Dear secret diary,</span>
                    <textarea
                      ref={secretDiaryTextareaRef}
                      placeholder="You can be completely honest here…"
                      aria-label="Write a secret diary entry"
                    />
                  </label>
                  <button
                    className="secret-diary-save"
                    onClick={saveSecretDiaryEntry}
                  >
                    <span aria-hidden="true">🔒</span>
                    Close and keep this page
                  </button>
                </article>

                <aside className="secret-diary-side">
                  <section className="secret-pages">
                    <div>
                      <p className="tiny-label">BEHIND THE RIBBON</p>
                      <h3>My hidden pages</h3>
                    </div>
                    {secretDiaryEntries.length === 0 ? (
                      <p className="secret-pages-empty">
                        Your first page will wait here quietly.
                      </p>
                    ) : (
                      <div className="secret-page-list">
                        {secretDiaryEntries.slice(0, 4).map((entry) => (
                          <article key={entry.id}>
                            <button
                              className="secret-page-open"
                              onClick={() => setSelectedSecretDiaryEntry(entry)}
                              aria-label={`Open secret page from ${entry.date}`}
                            >
                              <span aria-hidden="true">{entry.feeling}</span>
                              <div>
                                <small>{entry.date}</small>
                                <p>{notePreview(entry.text, 88)}</p>
                              </div>
                            </button>
                            <button
                              onClick={() => deleteSecretDiaryEntry(entry.id)}
                              aria-label={`Delete secret page from ${entry.date}`}
                            >
                              ×
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <details className="comfort-drawer">
                    <summary>
                      <span>♡</span>
                      Open my comfort drawer
                    </summary>
                    <p>Nothing here is a task. Choose only what feels kind.</p>
                    <div
                      className="refuge-needs"
                      aria-label="Choose what you need"
                    >
                      <button
                        className="safe-choice hold"
                        onClick={() => enterSafePlaceMode("hold")}
                      >
                        <span>🧸</span>
                        <strong>Hold me</strong>
                        <small>Stay with a soft heartbeat.</small>
                      </button>
                      <button
                        className="safe-choice praise"
                        onClick={() => enterSafePlaceMode("praise")}
                      >
                        <span>🎀</span>
                        <strong>Need praise</strong>
                        <small>Kind words, one at a time.</small>
                      </button>
                      <button
                        className="safe-choice cry"
                        onClick={() => enterSafePlaceMode("cry")}
                      >
                        <span>🤍</span>
                        <strong>Can I cry?</strong>
                        <small>Rain, quiet, and room to feel.</small>
                      </button>
                      <button
                        className="safe-choice little"
                        onClick={() => enterSafePlaceMode("little")}
                      >
                        <span>🌸</span>
                        <strong>Little things</strong>
                        <small>Tiny care, never a demand.</small>
                      </button>
                    </div>
                  </details>
                </aside>
              </div>
            ) : (
              <div className="safe-experience">
                <button
                  className="safe-back"
                  onClick={() => enterSafePlaceMode("home")}
                >
                  ← Safe Place
                </button>

                {safePlaceMode === "hold" && (
                  <article className="safe-hold-card">
                    <button
                      className={
                        safePlaceHugging
                          ? "safe-teddy hugging"
                          : "safe-teddy"
                      }
                      onClick={() =>
                        setSafePlaceHugging((current) => !current)
                      }
                      aria-pressed={safePlaceHugging}
                      aria-label="Hug the teddy"
                    >
                      <span aria-hidden="true">🧸</span>
                      <small>
                        {safePlaceHugging
                          ? "hugging you back"
                          : "tap for a hug"}
                      </small>
                    </button>
                    <div className="safe-message" aria-live="polite">
                      <p>{currentSafePlaceMessage}</p>
                      <span>New words will arrive when they’re ready.</span>
                    </div>
                    <button
                      className="safe-sound-toggle"
                      onClick={() =>
                        safePlaceSoundOn
                          ? stopSafePlaceHeartbeat()
                          : startSafePlaceHeartbeat()
                      }
                      aria-pressed={safePlaceSoundOn}
                    >
                      {safePlaceSoundOn
                        ? "♡ soft heartbeat on"
                        : "♡ play soft heartbeat"}
                    </button>
                  </article>
                )}

                {safePlaceMode === "praise" && (
                  <article className="safe-praise-card">
                    <span className="safe-bow" aria-hidden="true">
                      🎀
                    </span>
                    <p className="safe-praise-message" aria-live="polite">
                      {currentSafePlaceMessage}
                    </p>
                    <small>
                      These words are written into aérea. Nothing is generated
                      while you’re here.
                    </small>
                  </article>
                )}

                {safePlaceMode === "cry" && (
                  <article className="safe-cry-card">
                    <div className="safe-rain" aria-hidden="true">
                      {Array.from({ length: 8 }, (_, index) => (
                        <i key={index} style={{ "--drop": index } as CSSProperties} />
                      ))}
                    </div>
                    <p className="safe-cry-message" aria-live="polite">
                      {currentSafePlaceMessage}
                    </p>
                    <textarea
                      value={safePlaceCryText}
                      onChange={(event) =>
                        setSafePlaceCryText(event.target.value)
                      }
                      placeholder="You can write here, or leave this space quiet."
                      aria-label="A private note for this moment"
                    />
                    <button
                      onClick={saveSafePlaceCryNote}
                      disabled={!safePlaceCryText.trim()}
                    >
                      Keep this in my journal
                    </button>
                  </article>
                )}

                {safePlaceMode === "little" && (
                  <article className="safe-little-card">
                    <span aria-hidden="true">{currentLittleThing.icon}</span>
                    <p>
                      {safePlaceLittleReply ||
                        currentLittleThing.prompt}
                    </p>
                    {!safePlaceLittleReply && (
                      <div>
                        <button onClick={completeSafePlaceLittleThing}>
                          We did it
                        </button>
                        <button
                          className="safe-skip"
                          onClick={() =>
                            setSafePlaceLittleStep(
                              (step) =>
                                (step + 1) % safePlaceLittleThings.length,
                            )
                          }
                        >
                          Not this one
                        </button>
                      </div>
                    )}
                  </article>
                )}
              </div>
            )}

            <div className="refuge-consent">
              <span>◇</span>
              <p>
                <strong>You are in charge of this space.</strong>
                You can pause, leave, skip anything, or come back whenever you
                want. Care never requires you to ignore a boundary.
              </p>
            </div>

            {safePlaceMode === "home" && (
              <button className="refuge-home-button" onClick={closeSafePlace}>
                Close and lock my diary
              </button>
            )}
          </section>
        </div>
      )}

      {selectedLibraryItem && (
        <div className="modal-backdrop library-reader-backdrop" role="presentation">
          <section
            className="library-reader-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Reader for ${selectedLibraryItem.name}`}
          >
            <header className="library-reader-header">
              <div>
                <p className="tiny-label">{selectedLibraryItem.kind.toUpperCase()} · LIBRARY</p>
                <h2>{selectedLibraryItem.name}</h2>
                <small>
                  {selectedLibraryItem.readerLocation?.page
                    ? `Continue · page ${selectedLibraryItem.readerLocation.page}`
                    : "Your position is saved automatically"}
                </small>
              </div>
              <div>
                <button
                  className={selectedLibraryItem.favorite ? "active" : ""}
                  onClick={() => {
                    recordAction(
                      selectedLibraryItem.favorite ? "Removed favorite" : "Added favorite",
                    );
                    updateLibraryItem(selectedLibraryItem.id, (item) => ({
                      ...item,
                      favorite: !item.favorite,
                    }));
                  }}
                  aria-label="Toggle favorite"
                >♡</button>
                <button onClick={() => setSelectedLibraryItem(null)} aria-label="Close reader">×</button>
              </div>
            </header>

            <div className="library-reader-layout">
              <main className="library-document-stage">
                {selectedLibraryItem.kind === "image" && selectedLibraryItem.dataUrl ? (
                  <img src={selectedLibraryItem.dataUrl} alt={selectedLibraryItem.name} />
                ) : selectedLibraryItem.kind === "audio" && selectedLibraryItem.dataUrl ? (
                  <audio controls src={selectedLibraryItem.dataUrl} />
                ) : selectedLibraryItem.kind === "pdf" && selectedLibraryItem.dataUrl ? (
                  <iframe
                    key={`${selectedLibraryItem.id}-${selectedLibraryItem.readerLocation?.page ?? 1}-${selectedLibraryItem.readerLocation?.zoom ?? 100}`}
                    src={`${selectedLibraryItem.dataUrl}#page=${selectedLibraryItem.readerLocation?.page ?? 1}&zoom=${selectedLibraryItem.readerLocation?.zoom ?? 100}`}
                    title={selectedLibraryItem.name}
                  />
                ) : selectedLibraryItem.kind === "note" ? (
                  <article className="library-note-preview">
                    <p>{selectedLibraryItem.textContent ?? selectedLibraryItem.name}</p>
                  </article>
                ) : (
                  <div className="library-generic-preview">
                    <span>{selectedLibraryItem.kind === "epub" ? "EPUB" : "▤"}</span>
                    <strong>{selectedLibraryItem.name}</strong>
                    <p>
                      This format is kept safely in Library. Use the panel to
                      save chapters, bookmarks and notes.
                    </p>
                  </div>
                )}
                <div className="reader-location-controls">
                  <label>
                    Page
                    <input
                      type="number"
                      min="1"
                      value={selectedLibraryItem.readerLocation?.page ?? 1}
                      onChange={(event) => {
                        const page = Math.max(1, Number(event.target.value) || 1);
                        updateLibraryItem(selectedLibraryItem.id, (item) => ({
                          ...item,
                          readerLocation: { ...item.readerLocation, page },
                        }));
                      }}
                    />
                  </label>
                  <label>
                    Progress
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedLibraryItem.readerLocation?.percentage ?? 0}
                      onChange={(event) => {
                        const percentage = Number(event.target.value);
                        updateLibraryItem(selectedLibraryItem.id, (item) => ({
                          ...item,
                          readerLocation: { ...item.readerLocation, percentage },
                        }));
                      }}
                    />
                    <span>{selectedLibraryItem.readerLocation?.percentage ?? 0}%</span>
                  </label>
                  {selectedLibraryItem.kind === "pdf" && (
                    <label>
                      Zoom
                      <select
                        value={selectedLibraryItem.readerLocation?.zoom ?? 100}
                        onChange={(event) =>
                          updateLibraryItem(selectedLibraryItem.id, (item) => ({
                            ...item,
                            readerLocation: {
                              ...item.readerLocation,
                              zoom: Number(event.target.value),
                            },
                          }))
                        }
                      >
                        <option value={75}>75%</option>
                        <option value={100}>100%</option>
                        <option value={125}>125%</option>
                        <option value={150}>150%</option>
                      </select>
                    </label>
                  )}
                </div>
              </main>

              <aside className="library-reader-panel">
                <nav aria-label="Reader navigation">
                  {(["contents", "pages", "bookmarks", "highlights", "notes"] as const).map(
                    (panel) => (
                      <button
                        key={panel}
                        className={libraryPanel === panel ? "active" : ""}
                        onClick={() => setLibraryPanel(panel)}
                      >
                        {panel}
                      </button>
                    ),
                  )}
                </nav>

                {libraryPanel === "contents" && (
                  <section className="reader-panel-section">
                    <p className="tiny-label">CONTENTS</p>
                    <h3>{selectedLibraryItem.name}</h3>
                    {selectedLibraryItem.kind === "epub" ? (
                      <label>
                        Current chapter
                        <input
                          value={selectedLibraryItem.readerLocation?.chapter ?? ""}
                          placeholder="Chapter title"
                          onChange={(event) =>
                            updateLibraryItem(selectedLibraryItem.id, (item) => ({
                              ...item,
                              readerLocation: {
                                ...item.readerLocation,
                                chapter: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    ) : (
                      <p>
                        PDF outlines remain available in the embedded reader when
                        the document contains one. Page navigation always works.
                      </p>
                    )}

                    <div className="reader-collections">
                      <strong>Collections</strong>
                      {libraryCollections.map((collection) => {
                        const included = selectedLibraryItem.collectionIds?.includes(collection.id) ?? false;
                        return (
                          <label key={collection.id}>
                            <input
                              type="checkbox"
                              checked={included}
                              onChange={(event) => {
                                recordAction("Changed Library collection");
                                updateLibraryItem(selectedLibraryItem.id, (item) => ({
                                  ...item,
                                  collectionIds: event.target.checked
                                    ? Array.from(new Set([...(item.collectionIds ?? []), collection.id]))
                                    : (item.collectionIds ?? []).filter((id) => id !== collection.id),
                                }));
                              }}
                            />
                            {collection.name}
                          </label>
                        );
                      })}
                    </div>

                    <div className="library-used-in">
                      <p className="tiny-label">USED IN</p>
                      {calendarEvents
                        .filter((event) => event.attachmentIds?.includes(selectedLibraryItem.id))
                        .map((event) => (
                          <button key={event.id} onClick={() => setSelectedEventDetail(event)}>
                            ▦ {event.title} · {readableDate(event.date)}
                          </button>
                        ))}
                      {tasks
                        .filter((task) => task.attachmentIds?.includes(selectedLibraryItem.id))
                        .map((task) => <span key={task.id}>✓ {task.title}</span>)}
                      {entityLinks
                        .filter(
                          (link) =>
                            link.fromType === "class" &&
                            link.toType === "file" &&
                            link.toId === selectedLibraryItem.id,
                        )
                        .map((link) => {
                          const classItem = classItems.find(
                            (item) => item.id === link.fromId,
                          );
                          return classItem ? (
                            <button
                              key={link.id}
                              onClick={() => {
                                setSelectedClass(classItem.name);
                                setSelectedLibraryItem(null);
                                setSpace("classes");
                                setActiveTab("spaces");
                              }}
                            >
                              {classItem.icon} {classItem.name}
                            </button>
                          ) : null;
                        })}
                      {!calendarEvents.some((event) => event.attachmentIds?.includes(selectedLibraryItem.id)) &&
                        !tasks.some((task) => task.attachmentIds?.includes(selectedLibraryItem.id)) &&
                        !entityLinks.some(
                          (link) =>
                            link.fromType === "class" &&
                            link.toType === "file" &&
                            link.toId === selectedLibraryItem.id,
                        ) && (
                          <small>Not attached anywhere yet.</small>
                        )}
                    </div>
                  </section>
                )}

                {libraryPanel === "pages" && (
                  <section className="reader-panel-section">
                    <p className="tiny-label">PAGE THUMBNAILS</p>
                    <div className="reader-page-grid">
                      {Array.from({ length: 9 }, (_, index) => {
                        const currentPage = selectedLibraryItem.readerLocation?.page ?? 1;
                        const page = Math.max(1, currentPage - 4) + index;
                        const hasMark = selectedLibraryItem.annotations?.some(
                          (annotation) => annotation.location.page === page,
                        );
                        return (
                          <button
                            key={page}
                            className={page === currentPage ? "active" : ""}
                            onClick={() =>
                              updateLibraryItem(selectedLibraryItem.id, (item) => ({
                                ...item,
                                readerLocation: { ...item.readerLocation, page },
                              }))
                            }
                          >
                            <span>PAGE</span>
                            <strong>{page}</strong>
                            {hasMark && <i>♡</i>}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {(["bookmarks", "highlights", "notes"] as const).includes(libraryPanel as "bookmarks" | "highlights" | "notes") && (
                  <section className="reader-panel-section">
                    <div className="reader-annotation-heading">
                      <div>
                        <p className="tiny-label">{libraryPanel.toUpperCase()}</p>
                        <h3>{(selectedLibraryItem.annotations ?? []).filter((annotation) => annotation.type === libraryPanel.slice(0, -1)).length} saved</h3>
                      </div>
                      <button
                        onClick={() =>
                          addLibraryAnnotation(
                            selectedLibraryItem,
                            libraryPanel === "bookmarks"
                              ? "bookmark"
                              : libraryPanel === "highlights"
                                ? "highlight"
                                : "note",
                          )
                        }
                      >＋ Add</button>
                    </div>
                    <div className="reader-annotation-list">
                      {(selectedLibraryItem.annotations ?? [])
                        .filter((annotation) => annotation.type === libraryPanel.slice(0, -1))
                        .map((annotation) => (
                          <article key={annotation.id}>
                            <button
                              onClick={() =>
                                updateLibraryItem(selectedLibraryItem.id, (item) => ({
                                  ...item,
                                  readerLocation: {
                                    ...item.readerLocation,
                                    ...annotation.location,
                                  },
                                }))
                              }
                            >
                              <strong>
                                {annotation.name || annotation.excerpt || annotation.text || "Saved place"}
                              </strong>
                              <small>
                                {annotation.location.chapter || `Page ${annotation.location.page ?? 1}`}
                              </small>
                            </button>
                            <button
                              aria-label="Edit annotation"
                              onClick={() => {
                                const currentText = annotation.name || annotation.excerpt || annotation.text || "";
                                const text = window.prompt("Edit", currentText);
                                if (text === null) return;
                                recordAction("Edited annotation");
                                updateLibraryItem(selectedLibraryItem.id, (item) => ({
                                  ...item,
                                  annotations: (item.annotations ?? []).map((candidate) =>
                                    candidate.id === annotation.id
                                      ? {
                                          ...candidate,
                                          ...(candidate.type === "bookmark"
                                            ? { name: text }
                                            : candidate.type === "highlight"
                                              ? { excerpt: text }
                                              : { text }),
                                          updatedAt: new Date().toISOString(),
                                        }
                                      : candidate,
                                  ),
                                }));
                              }}
                            >✎</button>
                            <button
                              aria-label="Delete annotation"
                              onClick={() => deleteLibraryAnnotation(selectedLibraryItem.id, annotation.id)}
                            >×</button>
                          </article>
                        ))}
                      {(selectedLibraryItem.annotations ?? []).filter(
                        (annotation) => annotation.type === libraryPanel.slice(0, -1),
                      ).length === 0 && <p>Nothing saved here yet.</p>}
                    </div>
                  </section>
                )}

                <footer className="library-reader-actions">
                  <button
                    onClick={() => {
                      recordAction("Archived Library file");
                      updateLibraryItem(selectedLibraryItem.id, (item) => ({ ...item, archived: true }));
                      setSelectedLibraryItem(null);
                    }}
                  >Archive</button>
                  <button
                    className="destructive"
                    onClick={() => {
                      const stored = libraryItems.find((item) => item.id === selectedLibraryItem.id);
                      if (!stored || !window.confirm(`Move “${stored.name}” to Trash?`)) return;
                      setSelectedLibraryItem(null);
                      moveToTrash("file", stored.name, stored);
                    }}
                  >Move to Trash</button>
                </footer>
              </aside>
            </div>
          </section>
        </div>
      )}

      {selectedJournalEntry && (
        <NoteDetailDialog
          date={selectedJournalEntry.date}
          face={selectedJournalEntry.mood || "♡"}
          label="A FULL LITTLE MOMENT"
          text={selectedJournalEntry.text}
          usedIn={[
            ...calendarEvents
              .filter((event) =>
                event.attachedNoteIds?.includes(selectedJournalEntry.id),
              )
              .map((event) => ({
                id: `event-${event.id}`,
                label: `▦ ${event.title}`,
                onClick: () => {
                  setSelectedJournalEntry(null);
                  setSelectedEventDetail(event);
                },
              })),
            ...entityLinks
              .filter(
                (link) =>
                  link.toType === "note" &&
                  link.toId === String(selectedJournalEntry.id) &&
                  link.fromType === "task",
              )
              .flatMap((link) => {
                const task = tasks.find((item) => item.id === link.fromId);
                return task
                  ? [
                      {
                        id: `task-${task.id}`,
                        label: `✓ ${task.title}`,
                        onClick: () => {
                          setSelectedJournalEntry(null);
                          setActiveTab("spaces");
                          setSpace("inbox");
                        },
                      },
                    ]
                  : [];
              }),
            ...entityLinks
              .filter(
                (link) =>
                  link.toType === "note" &&
                  link.toId === String(selectedJournalEntry.id) &&
                  link.fromType === "class",
              )
              .flatMap((link) => {
                const classItem = classItems.find(
                  (item) => item.id === link.fromId,
                );
                return classItem
                  ? [
                      {
                        id: `class-${classItem.id}`,
                        label: `${classItem.icon} ${classItem.name}`,
                        onClick: () => {
                          setSelectedJournalEntry(null);
                          setSelectedClass(classItem.name);
                          setActiveTab("spaces");
                          setSpace("classes");
                        },
                      },
                    ]
                  : [];
              }),
          ]}
          onClose={() => setSelectedJournalEntry(null)}
          onSave={(text) => {
            recordAction("Edited note");
            setEntries((current) =>
              current.map((entry) =>
                entry.id === selectedJournalEntry.id ? { ...entry, text } : entry,
              ),
            );
            setSelectedJournalEntry((current) =>
              current ? { ...current, text } : current,
            );
          }}
          onDelete={() => deleteJournalEntry(selectedJournalEntry.id)}
        />
      )}

      {selectedSecretDiaryEntry && (
        <NoteDetailDialog
          date={selectedSecretDiaryEntry.date}
          face={selectedSecretDiaryEntry.feeling}
          label="PRIVATE DIARY PAGE"
          text={selectedSecretDiaryEntry.text}
          secret
          onClose={() => setSelectedSecretDiaryEntry(null)}
          onDelete={() =>
            deleteSecretDiaryEntry(selectedSecretDiaryEntry.id)
          }
        />
      )}

      {selectedEventDetail && (
        <div className="modal-backdrop event-detail-backdrop" role="presentation">
          <section
            className={`event-detail-note ${selectedEventDetail.color}`}
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${selectedEventDetail.title}`}
          >
            <header className="event-detail-header">
              <div>
                <p className="tiny-label">
                  {selectedEventDetail.calendar ?? "PERSONAL"}
                </p>
                <h2>{selectedEventDetail.title}</h2>
              </div>
              <button
                onClick={() => setSelectedEventDetail(null)}
                aria-label="Close event details"
              >
                ×
              </button>
            </header>

            <div className="event-detail-time">
              <span aria-hidden="true">◷</span>
              <div>
                <strong>{eventTimeLabel(selectedEventDetail)}</strong>
                <small>
                  {readableDate(selectedEventDetail.date)}
                  {selectedEventDetail.endDate &&
                  selectedEventDetail.endDate !== selectedEventDetail.date
                    ? ` → ${readableDate(selectedEventDetail.endDate)}`
                    : ""}
                </small>
              </div>
            </div>

            <div className="event-detail-facts">
              {selectedEventDetail.location && (
                <div>
                  <span>⌖</span>
                  <small>Location</small>
                  <strong>{selectedEventDetail.location}</strong>
                </div>
              )}
              {selectedEventDetail.guests && (
                <div>
                  <span>♡</span>
                  <small>People</small>
                  <strong>{selectedEventDetail.guests}</strong>
                </div>
              )}
              {selectedEventDetail.reminder && (
                <div>
                  <span>♢</span>
                  <small>Reminder</small>
                  <strong>{selectedEventDetail.reminder}</strong>
                </div>
              )}
              {(selectedEventDetail.repeat ?? "Never") !== "Never" && (
                <div>
                  <span>↻</span>
                  <small>Repeats</small>
                  <strong>{eventRepeatLabel(selectedEventDetail)}</strong>
                </div>
              )}
              {selectedEventDetail.dayCounter && (
                <div>
                  <span>⌁</span>
                  <small>Day counter</small>
                  <strong>Enabled</strong>
                </div>
              )}
              {selectedEventDetail.memo && (
                <div>
                  <span>✎</span>
                  <small>Saved as</small>
                  <strong>Memo</strong>
                </div>
              )}
            </div>

            {selectedEventDetail.note && (
              <section className="event-detail-section">
                <p className="tiny-label">DESCRIPTION & NOTES</p>
                <p>{selectedEventDetail.note}</p>
              </section>
            )}

            {(selectedEventDetail.todos ?? []).length > 0 && (
              <section className="event-detail-section">
                <p className="tiny-label">TO-DO LIST</p>
                <ul className="event-detail-todos">
                  {selectedEventDetail.todos?.map((todo, index) => (
                    <li
                      className={
                        selectedEventDetail.todoStates?.[index] ?? "pending"
                      }
                      key={`${todo}-${index}`}
                    >
                      <span>{todo}</span>
                      <span
                        className="event-todo-status-actions"
                        aria-label={`Status for ${todo}`}
                      >
                        <button
                          type="button"
                          className={
                            selectedEventDetail.todoStates?.[index] === "done"
                              ? "selected done"
                              : "done"
                          }
                          onClick={() =>
                            setEventTodoState(
                              selectedEventDetail.id,
                              index,
                              "done",
                            )
                          }
                          aria-label={`Mark ${todo} as done`}
                          aria-pressed={
                            selectedEventDetail.todoStates?.[index] === "done"
                          }
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className={
                            selectedEventDetail.todoStates?.[index] === "missed"
                              ? "selected missed"
                              : "missed"
                          }
                          onClick={() =>
                            setEventTodoState(
                              selectedEventDetail.id,
                              index,
                              "missed",
                            )
                          }
                          aria-label={`Mark ${todo} as not done`}
                          aria-pressed={
                            selectedEventDetail.todoStates?.[index] === "missed"
                          }
                        >
                          ×
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {((selectedEventDetail.files ?? []).length > 0 ||
              (selectedEventDetail.attachmentIds ?? []).length > 0 ||
              (selectedEventDetail.attachedNoteIds ?? []).length > 0 ||
              (selectedEventDetail.attachedRecordingIds ?? []).length > 0) && (
              <section className="event-detail-section">
                <p className="tiny-label">ATTACHED</p>
                <div className="event-detail-files">
                  {(selectedEventDetail.attachmentIds ?? []).map((fileId) => {
                    const item = libraryItems.find((candidate) => candidate.id === fileId);
                    if (!item) return null;
                    return (
                      <button key={fileId} onClick={() => void openLibraryItem(item)}>
                        {item.kind === "pdf" ? "📄" : "▤"} {item.name} ↗
                      </button>
                    );
                  })}
                  {(selectedEventDetail.files ?? [])
                    .filter(
                      (name) =>
                        !libraryItems.some(
                          (item) =>
                            selectedEventDetail.attachmentIds?.includes(item.id) &&
                            item.name === name,
                        ),
                    )
                    .map((file) => <span key={file}>⌕ {file}</span>)}
                  {(selectedEventDetail.attachedNoteIds ?? []).map((noteId) => {
                    const note = entries.find((candidate) => candidate.id === noteId);
                    if (!note) return null;
                    return (
                      <button
                        key={`note-${noteId}`}
                        onClick={() => {
                          setSelectedEventDetail(null);
                          setSelectedJournalEntry(note);
                        }}
                      >📝 {notePreview(note.text, 48)} ↗</button>
                    );
                  })}
                  {(selectedEventDetail.attachedRecordingIds ?? []).map((recordingId) => {
                    const recording = recordings.find((candidate) => candidate.id === recordingId);
                    if (!recording) return null;
                    return (
                      <button
                        key={`recording-${recordingId}`}
                        onClick={() => {
                          setSelectedEventDetail(null);
                          setSelectedClass(recording.className);
                          changeTab("spaces");
                          setSpace("classes");
                          openRecordingEditor(recording);
                        }}
                      >🎙 {recording.name} ↗</button>
                    );
                  })}
                </div>
              </section>
            )}

            {selectedEventDetail.url && (
              <a
                className="event-detail-link"
                href={selectedEventDetail.url}
                target="_blank"
                rel="noreferrer"
              >
                Open attached link ↗
              </a>
            )}

            {selectedEventDetail.eventType === "sports_event" ? (
              <div
                className="match-day-detail-note"
                style={{
                  "--sports-primary": selectedEventDetail.sportsPrimary,
                  "--sports-secondary": selectedEventDetail.sportsSecondary,
                } as CSSProperties}
              >
                <strong>{selectedEventDetail.sportsIcon ?? "♡"} MATCH DAY</strong>
                <span>Automatic sports events stay separate from your personal calendar.</span>
              </div>
            ) : (
              <div className="event-detail-actions">
                <button
                  className="event-detail-edit"
                  onClick={() => {
                    const event = selectedEventDetail;
                    const eventDate = dateFromKey(event.date);
                    setSelectedCalendarDate(event.date);
                    setViewMonth(
                      new Date(eventDate.getFullYear(), eventDate.getMonth(), 1),
                    );
                    setSelectedEventDetail(null);
                    setCalendarOpen(true);
                    openEventEditor(event);
                  }}
                >
                  ✎ Edit
                </button>
                <button onClick={() => duplicateCalendarEvent(selectedEventDetail)}>
                  Duplicate
                </button>
                <button
                  className="destructive"
                  onClick={() => {
                    const event = selectedEventDetail;
                    if (!window.confirm(`Move “${event.title}” to Trash?`)) return;
                    setSelectedEventDetail(null);
                    moveToTrash("event", event.title, event);
                  }}
                >
                  Move to Trash
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop settings-backdrop" role="presentation">
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Appearance settings"
          >
            <header className="settings-header">
              <div>
                <p className="tiny-label">DRESS UP AÉREA</p>
                <h2>{activeTheme.name}</h2>
                <p>Pick a whole tiny world whenever you get bored.</p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
              >
                ×
              </button>
            </header>

            <section className="profile-card" aria-label="Profile picture">
              <span className="profile-preview">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Your profile" />
                ) : (
                  <span aria-hidden="true">♡</span>
                )}
              </span>
              <div>
                <p className="tiny-label">YOUR LITTLE CORNER</p>
                <h3>Choose your profile picture</h3>
                <p>It replaces the old “á” in the top corner.</p>
              </div>
              <div className="profile-actions">
                <label>
                  Choose photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={updateProfilePhoto}
                  />
                </label>
                {profilePhoto && (
                  <button onClick={() => setProfilePhoto(null)}>
                    Remove
                  </button>
                )}
              </div>
            </section>

            <section className="reset-settings-card" aria-label="Daily resets">
              <div>
                <p className="tiny-label">BEGIN & END GENTLY</p>
                <h3>Morning and Night Reset</h3>
                <p>Small daily check-ins, never another statistics page.</p>
              </div>
              <label>
                <span>
                  <strong>Morning Reset</strong>
                  <small>Only what matters today</small>
                </span>
                <input
                  type="checkbox"
                  checked={resetPreferences.morningEnabled}
                  onChange={(event) =>
                    setResetPreferences((current) => ({
                      ...current,
                      morningEnabled: event.target.checked,
                    }))
                  }
                />
              </label>
              <label>
                <span>
                  <strong>Night Reset</strong>
                  <small>Decide what happens to unfinished things</small>
                </span>
                <input
                  type="checkbox"
                  checked={resetPreferences.nightEnabled}
                  onChange={(event) =>
                    setResetPreferences((current) => ({
                      ...current,
                      nightEnabled: event.target.checked,
                    }))
                  }
                />
              </label>
            </section>

            <section className="sports-settings-card" aria-label="Sports settings">
              <div className="sports-settings-heading">
                <div>
                  <p className="tiny-label">SETTINGS → SPORTS</p>
                  <h3>Teams you follow</h3>
                  <p>Automatic fixtures stay separate from your personal events.</p>
                </div>
                <span>💙💛</span>
              </div>
              {INITIAL_SPORTS_TEAMS.map((team) => {
                const followed = sportsSettings.followedTeamIds.includes(team.id);
                return (
                  <label className="follow-team-row" key={team.id}>
                    <span className="team-colors" style={{
                      "--team-primary": team.primaryColor,
                      "--team-secondary": team.secondaryColor,
                    } as CSSProperties} />
                    <span>
                      <strong>{team.name} {team.icon}</strong>
                      <small>{followed ? "Matches are visible" : "Available to follow"}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={followed}
                      onChange={(event) =>
                        setSportsSettings((current) => ({
                          ...current,
                          followedTeamIds: event.target.checked
                            ? Array.from(new Set([...current.followedTeamIds, team.id]))
                            : current.followedTeamIds.filter((id) => id !== team.id),
                        }))
                      }
                    />
                  </label>
                );
              })}
              <div className="sports-toggle-grid">
                <label>
                  <span>Add matches automatically</span>
                  <input
                    type="checkbox"
                    checked={sportsSettings.addAutomatically}
                    onChange={(event) =>
                      setSportsSettings((current) => ({
                        ...current,
                        addAutomatically: event.target.checked,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Show special match cards</span>
                  <input
                    type="checkbox"
                    checked={sportsSettings.showSpecialCards}
                    onChange={(event) =>
                      setSportsSettings((current) => ({
                        ...current,
                        showSpecialCards: event.target.checked,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Notify me before matches</span>
                  <input
                    type="checkbox"
                    checked={sportsSettings.notifyBeforeMatches}
                    onChange={(event) =>
                      setSportsSettings((current) => ({
                        ...current,
                        notifyBeforeMatches: event.target.checked,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Notification time</span>
                  <select
                    value={sportsSettings.notificationLeadMinutes}
                    onChange={(event) =>
                      setSportsSettings((current) => ({
                        ...current,
                        notificationLeadMinutes: Number(event.target.value),
                      }))
                    }
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={180}>3 hours</option>
                    <option value={1440}>1 day</option>
                  </select>
                </label>
                <label>
                  <span>Show final score</span>
                  <input
                    type="checkbox"
                    checked={sportsSettings.showFinalScore}
                    onChange={(event) =>
                      setSportsSettings((current) => ({
                        ...current,
                        showFinalScore: event.target.checked,
                      }))
                    }
                  />
                </label>
              </div>
            </section>

            <section className="sync-card" aria-label="Private device sync">
              <div>
                <p className="tiny-label">PHONE · TABLET · PC</p>
                <h3>{syncEmail ? "Your devices are together" : "Private sync"}</h3>
                <p>{syncMessage}</p>
              </div>
              {syncEmail ? (
                <div className="sync-account">
                  <strong>{syncEmail}</strong>
                  <button onClick={signOutOfSync}>Sign out</button>
                </div>
              ) : (
                <div className="sync-actions">
                  {!syncCodeSent ? (
                    <button onClick={sendSyncCode}>Email me a sign-in code</button>
                  ) : (
                    <>
                      <label>
                        Sign-in code
                        <input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={syncCode}
                          onChange={(event) => setSyncCode(event.target.value)}
                          placeholder="Enter the code"
                        />
                      </label>
                      <button
                        onClick={confirmSyncCode}
                        disabled={!syncCode.trim()}
                      >
                        Connect this device
                      </button>
                      <button
                        className="sync-resend"
                        onClick={sendSyncCode}
                      >
                        Send another code
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>

            <section className="mode-card" aria-label="Light or dark mode">
              <div>
                <p className="tiny-label">BRIGHTNESS</p>
                <h3>{colorMode === "dark" ? "Cozy after dark" : "Soft daylight"}</h3>
                <p>Your chosen world in daylight or under a sleepy night sky.</p>
              </div>
              <div className="mode-switch">
                <button
                  className={colorMode === "light" ? "active" : ""}
                  onClick={() => setColorMode("light")}
                  aria-pressed={colorMode === "light"}
                >
                  ☀ Light
                </button>
                <button
                  className={colorMode === "dark" ? "active" : ""}
                  onClick={() => setColorMode("dark")}
                  aria-pressed={colorMode === "dark"}
                >
                  ☾ Dark
                </button>
              </div>
            </section>

            <section className="theme-wardrobe" aria-label="Aérea themes">
              <div className="theme-wardrobe-heading">
                <div>
                  <p className="tiny-label">TINY WORLDS</p>
                  <h3>Choose today&apos;s atmosphere</h3>
                </div>
                <span>{themeOptions.length} themes</span>
              </div>
              <div className="theme-grid">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-option ${appTheme === theme.id ? "active" : ""}`}
                    data-theme-option={theme.id}
                    onClick={() => setAppTheme(theme.id)}
                    aria-pressed={appTheme === theme.id}
                    style={
                      {
                        "--theme-one": theme.colors[0],
                        "--theme-two": theme.colors[1],
                        "--theme-three": theme.colors[2],
                      } as CSSProperties
                    }
                  >
                    <span className="theme-option-art" aria-hidden="true">
                      <i className="theme-mini-ground" />
                      <img
                        className="theme-option-main-art"
                        src={theme.art}
                        alt=""
                      />
                      <img
                        className="theme-option-accent-art"
                        src={theme.accents[0]}
                        alt=""
                      />
                    </span>
                    <span className="theme-option-copy">
                      <strong>{theme.name}</strong>
                      <small>{theme.description}</small>
                      <i>
                        {theme.colors.map((color) => (
                          <b key={color} style={{ background: color }} />
                        ))}
                      </i>
                    </span>
                    <span className="theme-selected">
                      {appTheme === theme.id ? "✓" : "♡"}
                    </span>
                  </button>
                ))}
              </div>
              <p className="theme-credit">
                Hand-drawn theme stickers by{" "}
                <a
                  href="https://openmoji.org/"
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenMoji
                </a>
                , created by design students, professors, and contributors.
              </p>
            </section>

            <section
              className={`custom-theme-card ${appTheme === "custom" ? "active" : ""}`}
              aria-label="Customize your own theme"
            >
              <div className="custom-theme-heading">
                <div>
                  <p className="tiny-label">MAKE IT YOURS</p>
                  <h3>Create your own little world</h3>
                  <p>Mix three colors and choose who decorates your sky.</p>
                </div>
                <button
                  onClick={() => setAppTheme("custom")}
                  aria-pressed={appTheme === "custom"}
                >
                  {appTheme === "custom" ? "Using my theme ✓" : "Use my theme"}
                </button>
              </div>

              <div
                className="custom-theme-preview"
                style={
                  {
                    "--custom-accent": customTheme.accent,
                    "--custom-background": customTheme.background,
                    "--custom-highlight": customTheme.highlight,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                <span className="custom-preview-cloud" />
                <span className="custom-preview-sparkle">✦</span>
                <img src={customTheme.art} alt="" />
              </div>

              <div className="custom-color-grid">
                {[
                  {
                    key: "background" as const,
                    label: "Background",
                    detail: "main page",
                  },
                  {
                    key: "accent" as const,
                    label: "Accent",
                    detail: "sky & buttons",
                  },
                  {
                    key: "highlight" as const,
                    label: "Highlight",
                    detail: "happy details",
                  },
                ].map((color) => (
                  <label key={color.key}>
                    <input
                      type="color"
                      value={customTheme[color.key]}
                      onChange={(event) =>
                        setCustomTheme((current) => ({
                          ...current,
                          [color.key]: event.target.value,
                        }))
                      }
                      aria-label={`Choose ${color.label.toLowerCase()} color`}
                    />
                    <span>
                      <strong>{color.label}</strong>
                      <small>{color.detail}</small>
                    </span>
                  </label>
                ))}
              </div>

              <div className="custom-character-picker">
                <div>
                  <p className="tiny-label">SKY FRIEND</p>
                  <strong>Choose a tiny character</strong>
                </div>
                <div className="custom-character-options">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.id}
                      className={customTheme.art === theme.art ? "active" : ""}
                      onClick={() =>
                        setCustomTheme((current) => ({
                          ...current,
                          art: theme.art,
                        }))
                      }
                      aria-label={`Use ${theme.name} character`}
                      aria-pressed={customTheme.art === theme.art}
                    >
                      <img src={theme.art} alt="" />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="settings-footnote">
              <img src={activeTheme.art} alt="" />
              <p>
                Your theme and brightness are saved with the rest of aérea, so
                the same little world follows you to your tablet.
              </p>
            </div>
          </section>
        </div>
      )}

      {habitEditorOpen && (
        <div className="modal-backdrop habit-editor-backdrop" role="presentation">
          <section
            className="class-editor-modal habit-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingHabitId !== null ? "Edit habit" : "Add habit"}
          >
            <header>
              <div>
                <p className="tiny-label">GENTLE ROUTINE</p>
                <h2>
                  {editingHabitId !== null ? "Edit your habit" : "Add a habit"}
                </h2>
              </div>
              <button
                onClick={() => setHabitEditorOpen(false)}
                aria-label="Close habit editor"
              >
                ×
              </button>
            </header>

            <label>
              Habit name
              <input
                value={habitDraft.title}
                onChange={(event) =>
                  setHabitDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Drink a glass of water"
                autoFocus
              />
            </label>

            <div className="class-editor-row">
              <label>
                Emoji
                <input
                  value={habitDraft.icon}
                  onChange={(event) =>
                    setHabitDraft((current) => ({
                      ...current,
                      icon: event.target.value,
                    }))
                  }
                  maxLength={8}
                  aria-label="Habit emoji"
                />
              </label>
              <fieldset>
                <legend>Color</legend>
                {habitColorOptions.map((color) => (
                  <button
                    key={color.value}
                    className={habitDraft.color === color.value ? "active" : ""}
                    style={{ background: color.hex }}
                    onClick={() =>
                      setHabitDraft((current) => ({
                        ...current,
                        color: color.value,
                      }))
                    }
                    aria-label={color.label}
                    aria-pressed={habitDraft.color === color.value}
                  />
                ))}
              </fieldset>
            </div>

            <footer>
              {editingHabitId !== null ? (
                <button className="delete-class" onClick={deleteHabit}>
                  Delete habit
                </button>
              ) : (
                <span />
              )}
              <span />
              <button
                className="cancel-class"
                onClick={() => setHabitEditorOpen(false)}
              >
                Cancel
              </button>
              <button className="save-class" onClick={saveHabit}>
                Save habit
              </button>
            </footer>
          </section>
        </div>
      )}

      {classEditorOpen && (
        <div className="modal-backdrop class-editor-backdrop" role="presentation">
          <section
            className="class-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingClassId ? "Edit class" : "Add class"}
          >
            <header>
              <div>
                <p className="tiny-label">CLASS DETAILS</p>
                <h2>{editingClassId ? "Edit this class" : "Add a new class"}</h2>
              </div>
              <button
                onClick={() => setClassEditorOpen(false)}
                aria-label="Close class editor"
              >
                ×
              </button>
            </header>
            <label>
              Class name
              <input
                value={classDraft.name}
                onChange={(event) =>
                  setClassDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="For example: Network Security"
                autoFocus
              />
            </label>
            <div className="class-editor-row">
              <label>
                Little symbol
                <input
                  value={classDraft.icon}
                  onChange={(event) =>
                    setClassDraft((current) => ({
                      ...current,
                      icon: event.target.value.slice(0, 3),
                    }))
                  }
                  maxLength={3}
                  aria-label="Class symbol"
                />
              </label>
              <fieldset>
                <legend>Class color</legend>
                {["#ddd8ff", "#cceeff", "#f7dec7", "#ffd7df", "#dff2c5"].map(
                  (color) => (
                    <button
                      type="button"
                      key={color}
                      className={classDraft.color === color ? "active" : ""}
                      style={{ background: color }}
                      onClick={() =>
                        setClassDraft((current) => ({ ...current, color }))
                      }
                      aria-label={`Choose ${color}`}
                      aria-pressed={classDraft.color === color}
                    />
                  ),
                )}
              </fieldset>
            </div>
            <footer>
              {editingClassId && (
                <button className="delete-class" onClick={deleteClass}>
                  Delete class
                </button>
              )}
              <span />
              <button
                className="cancel-class"
                onClick={() => setClassEditorOpen(false)}
              >
                Cancel
              </button>
              <button
                className="save-class"
                onClick={saveClass}
                disabled={!classDraft.name.trim()}
              >
                Save class
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

function TodayScreen({
  pending,
  completed,
  completeReminder,
  restoreReminder,
  createReminder,
  deleteReminder,
  openCalendar,
  selectedDate,
  selectDate,
  selectedDateEvents,
  openEventDetail,
  todayKey,
  weekDays,
  yesterdayDoneCount,
  dayCharm,
  dayCharmLabel,
  dayCharmText,
  showDayCharm,
  isNight,
}: {
  pending: Reminder[];
  completed: Reminder[];
  completeReminder: (id: number) => void;
  restoreReminder: (id: number) => void;
  createReminder: () => void;
  deleteReminder: (id: number) => void;
  openCalendar: () => void;
  selectedDate: string;
  selectDate: (dateKey: string) => void;
  selectedDateEvents: CalendarEvent[];
  openEventDetail: (event: CalendarEvent) => void;
  todayKey: string;
  weekDays: { key: string; day: string; date: string }[];
  yesterdayDoneCount: number;
  dayCharm: string;
  dayCharmLabel: string;
  dayCharmText: string;
  showDayCharm: boolean;
  isNight: boolean;
}) {
  const selectedDateObject = dateFromKey(selectedDate);
  const selectedIsToday = selectedDate === todayKey;
  const selectedWeekday = selectedDateObject.toLocaleDateString("en", {
    weekday: "long",
  });

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="date-label">
            {selectedDateObject
              .toLocaleDateString("en", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </p>
          <h2>
            {selectedIsToday
              ? isNight
                ? "Good evening, lovely."
                : "Good morning, lovely."
              : `A little look at ${selectedWeekday}.`}
          </h2>
          <p className="soft-copy">
            {selectedIsToday
              ? isNight
                ? "You did enough today. Let the evening soften around you."
                : "Let’s make today feel a little lighter."
              : "Tap today whenever you want to come back."}
          </p>
        </div>
        {showDayCharm && (
          <div
            className={[
              "day-charm",
              dayCharmText === "you may rest" ? "curved-copy" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`${dayCharmLabel}: ${dayCharmText}`}
          >
            <img src={dayCharm} alt="" />
            {dayCharmText === "you may rest" ? (
              <svg
                className="day-charm-curve"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <defs>
                  <path
                    id="you-may-rest-curve"
                    d="M 15 70 Q 50 94 85 70"
                  />
                </defs>
                <text>
                  <textPath
                    href="#you-may-rest-curve"
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    YOU MAY REST
                  </textPath>
                </text>
              </svg>
            ) : (
              <span>{dayCharmText}</span>
            )}
          </div>
        )}
      </section>

      <section className="week-strip" aria-label="Current week">
        {weekDays.map((day) => (
          <button
            key={day.key}
            className={[
              "day",
              selectedDate === day.key ? "active" : "",
              todayKey === day.key ? "today" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => selectDate(day.key)}
            aria-pressed={selectedDate === day.key}
          >
            <span>{day.day}</span>
            <strong>{day.date}</strong>
            {todayKey === day.key && <i />}
          </button>
        ))}
      </section>

      <section className="day-grid">
        <div className="column">
          <div className="section-heading">
            <div>
              <p className="tiny-label">YOUR RHYTHM</p>
              <h3>
                {selectedIsToday
                  ? "Today’s schedule"
                  : `${selectedWeekday}’s schedule`}
              </h3>
            </div>
            <button className="text-button" onClick={openCalendar}>
              See calendar
            </button>
          </div>
          {selectedDateEvents.length === 0 ? (
            <article className="empty-schedule">
              <span>☁</span>
              <p>A clear day. Add something whenever you&apos;re ready.</p>
            </article>
          ) : (
            selectedDateEvents.map((event) => (
              <button
                type="button"
                className={[
                  "schedule-card",
                  `${event.color}-card`,
                  event.sportsCardStyle ? "match-day-schedule-card" : "",
                ].filter(Boolean).join(" ")}
                style={
                  event.sportsCardStyle
                    ? ({
                        "--sports-primary": event.sportsPrimary,
                        "--sports-secondary": event.sportsSecondary,
                      } as CSSProperties)
                    : undefined
                }
                key={event.id}
                onClick={() => openEventDetail(event)}
                aria-label={`Open details for ${event.title}`}
              >
                <div className="time-block">
                  <strong>{event.allDay ? "ALL" : event.time}</strong>
                  <span>{event.allDay ? "DAY" : "TIME"}</span>
                </div>
                <div className="schedule-line" />
                <div className="schedule-copy">
                  <p className="card-tag">
                    {event.sportsCardStyle
                      ? `${event.sportsIcon ?? "♡"} MATCH DAY`
                      : event.calendar ?? "AÉREA"}
                  </p>
                  <h4>{event.title}</h4>
                  <span>
                    {event.location || event.note || "Saved in your calendar"}
                  </span>
                  {event.eventType === "sports_event" && (
                    <small className="match-countdown">{matchCountdownLabel(event)}</small>
                  )}
                </div>
                <div className="mini-people">
                  {event.eventType === "sports_event"
                    ? event.sportsIcon ?? "♡"
                    : event.color === "yellow"
                      ? "☀️"
                      : "✦"}
                </div>
              </button>
            ))
          )}
          <button className="add-event-button" onClick={openCalendar}>
            <span>＋</span> Add something to your day
          </button>
        </div>

        <div className="column">
          <div className="section-heading">
            <div>
              <p className="tiny-label">LITTLE REMINDERS</p>
              <h3>Take care of you</h3>
            </div>
            <div className="reminder-heading-actions">
              <span className="progress-pill">
                {completed.length}/{pending.length + completed.length}
              </span>
              <button className="text-button" onClick={createReminder}>＋ Reminder</button>
            </div>
          </div>
          <div className="reminder-card">
            {pending.length === 0 ? (
              <div className="all-done">
                <span>{completed.length === 0 ? "♡" : "🌈"}</span>
                <strong>
                  {completed.length === 0 ? "No reminders yet" : "Everything is complete!"}
                </strong>
                <p>
                  {completed.length === 0
                    ? "Add only what would genuinely help today."
                    : "Your little list is resting for the day."}
                </p>
              </div>
            ) : (
              pending.map((item) => (
                <div className="reminder-item-wrap" key={item.id}>
                  <button
                    className={`reminder-row ${item.tint}`}
                    onClick={() => completeReminder(item.id)}
                  >
                    <span className="reminder-icon">{item.icon}</span>
                    <span className="reminder-copy">
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                    <span className="check-circle">✓</span>
                  </button>
                  <button
                    className="delete-reminder"
                    onClick={() => deleteReminder(item.id)}
                    aria-label={`Delete ${item.title}`}
                  >×</button>
                </div>
              ))
            )}
          </div>
          <div className="completed-wrap">
            <div className="completed-history-line">
              <p className="completed-title">COMPLETED TODAY</p>
              <span>Yesterday {yesterdayDoneCount}/{pending.length + completed.length}</span>
            </div>
            {completed.length === 0 ? (
              <p className="empty-completed">
                Finished reminders will rest here.
              </p>
            ) : (
              completed.map((item) => (
                <button
                  className="completed-item"
                  onClick={() => restoreReminder(item.id)}
                  key={item.id}
                >
                  <span>✓</span><del>{item.title}</del><small>undo</small>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <button className="calendar-mood-note" onClick={openCalendar}>
        <span>◡‿◡</span>
        <span>
          <small>A TINY CALENDAR CHECK-IN</small>
          <strong>Add today&apos;s mood sticker</strong>
        </span>
        <i>→</i>
      </button>
    </>
  );
}

function MoodBubbles({
  selectedMood,
  onSelect,
}: {
  selectedMood: string;
  onSelect: (mood: string) => void;
}) {
  return (
    <div className="mood-bubbles">
      {moods.map((mood) => (
        <button
          key={mood.label}
          className={[
            "mood-bubble",
            mood.color,
            selectedMood === mood.label ? "active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onSelect(mood.label)}
        >
          <span>{mood.face}</span><small>{mood.label}</small>
        </button>
      ))}
    </div>
  );
}

function NoteDetailDialog({
  date,
  face,
  label,
  text,
  secret = false,
  onClose,
  onSave,
  onDelete,
  usedIn = [],
}: {
  date: string;
  face: string;
  label: string;
  text: string;
  secret?: boolean;
  onClose: () => void;
  onSave?: (text: string) => void;
  onDelete: () => void;
  usedIn?: { id: string; label: string; onClick: () => void }[];
}) {
  const [draft, setDraft] = useState(text);
  const [editing, setEditing] = useState(false);
  return (
    <div
      className={
        secret
          ? "modal-backdrop note-detail-backdrop secret"
          : "modal-backdrop note-detail-backdrop"
      }
      role="presentation"
    >
      <section
        className="note-detail-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Note from ${date}`}
      >
        <header>
          <span aria-hidden="true">{face}</span>
          <div>
            <p className="tiny-label">{label}</p>
            <time>{date}</time>
          </div>
          <button onClick={onClose} aria-label="Close note">
            ×
          </button>
        </header>
        {editing ? (
          <textarea
            className="note-detail-editor"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          />
        ) : (
          <p className="note-detail-text">{draft}</p>
        )}
        {usedIn.length > 0 && (
          <aside className="note-used-in">
            <p className="tiny-label">USED IN</p>
            <div>
              {usedIn.map((item) => (
                <button key={item.id} onClick={item.onClick}>
                  {item.label}
                </button>
              ))}
            </div>
          </aside>
        )}
        <footer>
          <small>{secret ? "This page stays private." : "Your words, fully here."}</small>
          {onSave && (
            <button
              onClick={() => {
                if (editing) {
                  const next = draft.trim();
                  if (!next) return;
                  onSave(next);
                }
                setEditing((current) => !current);
              }}
            >{editing ? "Save note" : "Edit note"}</button>
          )}
          <button onClick={onDelete}>Delete note</button>
        </footer>
      </section>
    </div>
  );
}

function ScreenIntro({
  label,
  title,
  copy,
  sticker,
}: {
  label: string;
  title: string;
  copy: string;
  sticker: string;
}) {
  return (
    <header className="screen-intro">
      <div>
        <p className="tiny-label">{label}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <span className="screen-sticker">{sticker}</span>
    </header>
  );
}

function SpaceCard({
  title,
  subtitle,
  color,
  icon,
  note,
  onClick,
}: {
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button className={`space-card ${color}`} onClick={onClick}>
      <span className="space-icon">{icon}</span>
      <span className="space-copy">
        <small>{subtitle}</small>
        <strong>{title}</strong>
        <i>{note}</i>
      </span>
      <span className="space-arrow">→</span>
    </button>
  );
}

function InnerHeader({
  label,
  title,
  onBack,
}: {
  label: string;
  title: string;
  onBack: () => void;
}) {
  return (
    <header className="inner-header">
      <button onClick={onBack}>←</button>
      <div>
        <p className="tiny-label">{label}</p>
        <h2>{title}</h2>
      </div>
    </header>
  );
}
