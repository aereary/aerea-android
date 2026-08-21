"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";
import {
  AEREA_ACCOUNT,
  currentAereaEmail,
  pushCloudState,
  readBrowserSketches,
  readBrowserState,
  reconcileCloudState,
  requestAereaCode,
  supabase,
  verifyAereaCode,
  writeBrowserSketches,
  writeBrowserState,
} from "./supabase-sync";
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
import {
  CalendarMemo,
  StudyFileItem,
  StudyLibrary,
  StudyNotebook,
  StudyNote,
  StudyTask,
} from "./study-library";
import { EpubBook, readEpub } from "./epub-reader";
import {
  EpubReadingState,
  EpubStudyReader,
  PdfInkStroke,
  PdfStudyReader,
} from "./study-reader";
import {
  decodeSketchPaper,
  DEFAULT_SKETCH_PAPER,
  drawSketchPaper,
  encodeSketchPaper,
  getSketchPageDimensions,
  getSketchPageSize,
  PageStyle,
  SKETCH_PAGE_COLORS,
  SKETCH_PAGE_SIZES,
  SketchPageOrientation,
  SketchPageSizeId,
  sketchPaperInkColors,
} from "./sketch-paper";

type Tab = "today" | "habits" | "focus" | "journal" | "spaces";
type PrimaryNavId = Tab | "add";
type Space = "menu" | "classes" | "library" | "sketchbook";
type MetricsPeriod = "week" | "month" | "year" | "all";
type AppTheme =
  | "storybook"
  | "otter"
  | "dreambear"
  | "strawberry"
  | "duckpond"
  | "bunnybakery"
  | "mooncat"
  | "whalesong"
  | "ribbonpromise"
  | "gentlekitten"
  | "softguidance"
  | "velvetrest"
  | "lovelyevening"
  | "rosegrid"
  | "noirrest"
  | "ao3night"
  | "peachparlor"
  | "mintletter"
  | "blueberrynight"
  | "duckmail"
  | "moonquilt"
  | "custom";
type ColorMode = "light" | "dark";

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

type AereaStoragePlugin = {
  getState(): Promise<{ state: string | null }>;
  putState(options: { state: string }): Promise<void>;
  listSketches(): Promise<{ pages: SketchPage[] }>;
  saveSketch(options: {
    title: string;
    pageStyle: string;
    dataUrl: string;
  }): Promise<void>;
  deleteSketch(options: { id: string }): Promise<void>;
  listDocuments(): Promise<{ files: StudyFileItem[] }>;
  saveDocument(options: {
    name: string;
    mediaType: string;
    kind: StudyFileItem["kind"];
    dataUrl: string;
  }): Promise<{ file: StudyFileItem }>;
  getDocument(options: { id: string }): Promise<{ dataUrl: string }>;
  deleteDocument(options: { id: string }): Promise<void>;
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

function joinBytes(parts: Uint8Array[]) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

async function canvasAsPdfBlob(
  canvas: HTMLCanvasElement,
  pageWidthPoints: number,
  pageHeightPoints: number,
) {
  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.96),
  );
  if (!jpeg) throw new Error("Could not prepare the PDF page.");

  const imageBytes = new Uint8Array(await jpeg.arrayBuffer());
  const encoder = new TextEncoder();
  const textBytes = (value: string) => encoder.encode(value);
  const pageWidth = Number(pageWidthPoints.toFixed(3));
  const pageHeight = Number(pageHeightPoints.toFixed(3));
  const drawing = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  const drawingBytes = textBytes(drawing);
  const objects = [
    textBytes("<< /Type /Catalog /Pages 2 0 R >>"),
    textBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    textBytes(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
    ),
    joinBytes([
      textBytes(`<< /Length ${drawingBytes.length} >>\nstream\n`),
      drawingBytes,
      textBytes("endstream"),
    ]),
    joinBytes([
      textBytes(
        `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
      ),
      imageBytes,
      textBytes("\nendstream"),
    ]),
  ];

  const parts: Uint8Array[] = [textBytes("%PDF-1.4\n%âãÏÓ\n")];
  const offsets = [0];
  let byteOffset = parts[0].length;
  objects.forEach((body, index) => {
    offsets.push(byteOffset);
    const object = joinBytes([
      textBytes(`${index + 1} 0 obj\n`),
      body,
      textBytes("\nendobj\n"),
    ]);
    parts.push(object);
    byteOffset += object.length;
  });
  const xrefOffset = byteOffset;
  const xref = [
    "xref",
    "0 6",
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    "<< /Size 6 /Root 1 0 R >>",
    "startxref",
    String(xrefOffset),
    "%%EOF",
    "",
  ].join("\n");
  parts.push(textBytes(xref));
  return new Blob([joinBytes(parts)], { type: "application/pdf" });
}

function downloadBlob(blob: Blob, fileName: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.download = fileName;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
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
  repeatUntil?: string;
  excludedDates?: string[];
  dayCounter?: boolean;
  location?: string;
  url?: string;
  note?: string;
  todos?: string[];
  todoStates?: ("pending" | "done" | "missed")[];
  files?: string[];
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

type CalendarSearchOccurrence = {
  event: CalendarEvent;
  date: string;
};

type EventDeleteRequest = {
  eventId: string;
  occurrenceDate: string;
};

type PostItColor = "lavender" | "butter" | "blush" | "sky";
type PostItPage =
  | "today"
  | "habits"
  | "library"
  | "focus"
  | "journal"
  | "spaces:menu"
  | "spaces:classes"
  | "spaces:library"
  | "spaces:sketchbook";

type PostItNote = {
  id: string;
  text: string;
  color: PostItColor;
  page: PostItPage;
  x: number;
  y: number;
  rotation: number;
};

type PostItDraft = Pick<PostItNote, "text" | "color">;

type SketchPage = {
  id: string;
  title: string;
  pageStyle: string;
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
  id: string;
  tool:
    | "pen"
    | "pencil"
    | "highlighter"
    | "eraser"
    | "line"
    | "rectangle"
    | "ellipse"
    | "tape"
    | "text"
    | "lasso";
  color: string;
  size: number;
  points: SketchPoint[];
  text?: string;
  revealed?: boolean;
};

type SketchTool = SketchStroke["tool"] | "eyedropper";

type CalendarCategory = {
  id: string;
  name: string;
  color: EventColor;
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
  featured?: boolean;
  interfaceIdea?: string;
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
    id: "dreambear",
    name: "Starlit teddy sky",
    description: "Glowing lavender skies, cloud-soft cards, tiny stars, and a teddy who says you may rest.",
    colors: ["#8f86ea", "#fffaff", "#ff929f"],
    icon: "🧸",
    art: "/assets/openmoji/teddy.svg",
    accents: [
      "/assets/openmoji/cloud.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "you may rest",
    decoratedScene: true,
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
    id: "lovelyevening",
    name: "Lovely lavender evening",
    description: "A luminous lavender sky, cloud-glass cards, elegant type, and a little otter giving you permission to rest.",
    colors: ["#a99af7", "#fbf9ff", "#f4d6ff"],
    icon: "✦",
    art: "/assets/openmoji/otter.svg",
    accents: [
      "/assets/openmoji/cloud.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "you may rest",
    featured: true,
    interfaceIdea: "cloud glass",
  },
  {
    id: "rosegrid",
    name: "Rose paper editorial",
    description: "Warm ivory graph paper, blush ink, fine serif headlines, and airy stationery cards.",
    colors: ["#f3a8ba", "#fffdf9", "#272522"],
    icon: "♡",
    art: "/assets/openmoji/otter.svg",
    accents: [
      "/assets/openmoji/blossom.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "you may rest",
    featured: true,
    interfaceIdea: "editorial grid",
  },
  {
    id: "noirrest",
    name: "Noir quiet hours",
    description: "Ink-black glass, silver outlines, spacious typography, and a calm after-dark timeline.",
    colors: ["#0c0d10", "#24262b", "#f1f1f3"],
    icon: "✦",
    art: "/assets/openmoji/cat.svg",
    accents: [
      "/assets/openmoji/moon.svg",
      "/assets/openmoji/star.svg",
    ],
    charm: "you may rest",
    featured: true,
    interfaceIdea: "monochrome glass",
  },
  {
    id: "ao3night",
    name: "Rose Pine night letters",
    description: "Deep green-black AO3 ink with pastel rose, lilac, sky, and sage details.",
    colors: ["#14201c", "#f8c8dc", "#c4a7e7"],
    icon: "♡",
    art: "/assets/openmoji/love-letter.svg",
    accents: [
      "/assets/openmoji/star.svg",
      "/assets/openmoji/blossom.svg",
    ],
    charm: "little night letters",
    showCharm: false,
    featured: true,
    interfaceIdea: "dark AO3 pastels",
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

const CLEAN_START_VERSION = "android-release-1";

const starterReminders: Reminder[] = [
  {
    id: 1,
    title: "Drink water",
    detail: "Your first glass of the day",
    icon: "💧",
    tint: "blue",
  },
  {
    id: 2,
    title: "Morning vitamins",
    detail: "With breakfast",
    icon: "🌼",
    tint: "yellow",
  },
  {
    id: 3,
    title: "Review class notes",
    detail: "15 gentle minutes",
    icon: "📖",
    tint: "lilac",
  },
];

const tabs: { id: PrimaryNavId; icon: string; label: string }[] = [
  { id: "today", icon: "⌂", label: "Today" },
  { id: "habits", icon: "✓", label: "Habits" },
  { id: "add", icon: "＋", label: "Add" },
  { id: "journal", icon: "✎", label: "Journal" },
  { id: "spaces", icon: "✦", label: "Spaces" },
];
const extendedCalendarTabs = tabs.filter(
  (tab): tab is { id: Tab; icon: string; label: string } => tab.id !== "add",
);

const starterHabits: Habit[] = [
  {
    id: 1,
    title: "Drink 6 glasses of water",
    icon: "💧",
    color: "habit-blue",
    days: [false, false, false, false, false, false, false],
    streak: 0,
  },
  {
    id: 2,
    title: "Study for at least 25 minutes",
    icon: "📚",
    color: "habit-lilac",
    days: [false, false, false, false, false, false, false],
    streak: 0,
  },
  {
    id: 3,
    title: "Write one gentle thought",
    icon: "🪶",
    color: "habit-pink",
    days: [false, false, false, false, false, false, false],
    streak: 0,
  },
  {
    id: 4,
    title: "Stretch and breathe",
    icon: "🌿",
    color: "habit-sage",
    days: [false, false, false, false, false, false, false],
    streak: 0,
  },
];

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

const postItColors: Array<{
  value: PostItColor;
  label: string;
  hex: string;
}> = [
  { value: "lavender", label: "Lavender", hex: "#dfd0f3" },
  { value: "butter", label: "Butter", hex: "#ffe3a0" },
  { value: "blush", label: "Blush", hex: "#f5c6de" },
  { value: "sky", label: "Sky", hex: "#c9ddf4" },
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

const starterCalendarCategories: CalendarCategory[] = [
  { id: "personal", name: "Personal", color: "pink" },
  { id: "classes", name: "Classes", color: "emerald" },
  { id: "study", name: "Study", color: "lilac" },
  { id: "assignments", name: "Assignments", color: "yellow" },
  { id: "exams", name: "Exams", color: "coral" },
  { id: "appointments", name: "Appointments", color: "blue" },
  { id: "health", name: "Health", color: "cyan" },
  { id: "birthdays", name: "Birthdays", color: "rose" },
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
  };
}

const starterClasses: ClassItem[] = [
  { id: "differential-equations", name: "Differential Equations", icon: "∫", color: "#ddd8ff" },
  { id: "ethical-hacking", name: "Ethical Hacking", icon: "⌘", color: "#cceeff" },
  { id: "intellectual-property", name: "Intellectual Property", icon: "§", color: "#f7dec7" },
];

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

function eventDetailDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
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
  if (event.repeatUntil && dateKey > event.repeatUntil) return false;
  if (event.excludedDates?.includes(dateKey)) return false;
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

function previousDateKey(dateKey: string) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

function datesBetween(start: Date, end: Date) {
  const dates: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= last) {
    dates.push(localDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function metricsDateRange(period: MetricsPeriod, anchor: Date, firstKnownDate: Date) {
  const normalized = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (period === "week") {
    const start = new Date(normalized);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }
  if (period === "month") {
    return {
      start: new Date(normalized.getFullYear(), normalized.getMonth(), 1),
      end: new Date(normalized.getFullYear(), normalized.getMonth() + 1, 0),
    };
  }
  if (period === "year") {
    return {
      start: new Date(normalized.getFullYear(), 0, 1),
      end: new Date(normalized.getFullYear(), 11, 31),
    };
  }
  return {
    start: new Date(
      firstKnownDate.getFullYear(),
      firstKnownDate.getMonth(),
      firstKnownDate.getDate(),
    ),
    end: new Date(),
  };
}

function currentStreak(keys: string[], completed: (dateKey: string) => boolean) {
  let streak = 0;
  for (let index = keys.length - 1; index >= 0; index -= 1) {
    if (!completed(keys[index])) break;
    streak += 1;
  }
  return streak;
}

const moodScores: Record<string, number> = {
  sad: 20,
  anxious: 30,
  tired: 38,
  okay: 58,
  surprised: 70,
  peaceful: 82,
  happy: 92,
  proud: 96,
};

function eventCompactTimeLabel(event: CalendarEvent) {
  if (event.allDay) return "All day";
  return event.endTime ? `${event.time}–${event.endTime}` : event.time;
}

function eventStartTimeLabel(event: CalendarEvent) {
  if (event.allDay) return "All day";
  const match = event.time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return event.time;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function eventEndTimeLabel(event: CalendarEvent) {
  if (!event.endTime) return "";
  const match = event.endTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return event.endTime;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function eventDetailTimeParts(event: CalendarEvent) {
  if (event.allDay) return { range: "All day", period: "" };

  const formatPart = (value: string) => {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return { clock: value, period: "" };
    const hour = Number(match[1]);
    return {
      clock: `${String(hour % 12 || 12).padStart(2, "0")}:${match[2]}`,
      period: hour >= 12 ? "PM" : "AM",
    };
  };

  const start = formatPart(event.time);
  if (!event.endTime) return { range: start.clock, period: start.period };
  const end = formatPart(event.endTime);
  if (start.period && end.period && start.period !== end.period) {
    return {
      range: `${start.clock} ${start.period} – ${end.clock}`,
      period: end.period,
    };
  }
  return {
    range: `${start.clock} – ${end.clock}`,
    period: end.period || start.period,
  };
}

function normalizeCalendarSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function calendarEventSearchText(event: CalendarEvent) {
  return normalizeCalendarSearch(
    [
      event.title,
      event.calendar,
      event.note,
      event.location,
      event.guests,
      event.reminder,
      event.repeat,
      ...(event.todos ?? []),
      ...(event.files ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function calendarEventAtOccurrence(event: CalendarEvent, dateKey: string) {
  const originalStart = dateFromKey(event.date);
  const originalEnd = dateFromKey(event.endDate ?? event.date);
  const durationDays = Math.max(
    0,
    Math.round(
      (originalEnd.getTime() - originalStart.getTime()) / 86_400_000,
    ),
  );
  const occurrenceEnd = dateFromKey(dateKey);
  occurrenceEnd.setDate(occurrenceEnd.getDate() + durationDays);
  return {
    ...event,
    date: dateKey,
    endDate: event.endDate ? localDateKey(occurrenceEnd) : undefined,
  };
}

function scheduleEventIcon(event: CalendarEvent) {
  const searchable = `${event.calendar ?? ""} ${event.title}`.toLowerCase();
  if (searchable.includes("workout") || searchable.includes("health")) return "🏋️";
  if (searchable.includes("class") || searchable.includes("school")) return "💻";
  if (searchable.includes("study") || searchable.includes("exam")) return "📖";
  if (searchable.includes("lunch") || searchable.includes("breakfast") || searchable.includes("dinner")) return "🥗";
  if (searchable.includes("journal") || event.memo) return "📓";
  if (event.todos?.length) return "☑️";
  if (event.location) return "📍";
  const colorIcons: Record<EventColor, string> = {
    lilac: "✨", yellow: "☀️", blue: "✏️", pink: "💗",
    emerald: "🌱", cyan: "💧", brown: "☕", black: "🌙",
    red: "📌", rose: "🌸", coral: "🍑", orange: "🧡",
  };
  return colorIcons[event.color];
}

function minutesFromTime(time = "09:00") {
  const [hours, minutes] = time.split(":").map(Number);
  return Math.max(0, Math.min(24 * 60, (hours || 0) * 60 + (minutes || 0)));
}

function eventDraftHasValidRange(draft: EventDraft) {
  const endDate = draft.endDate || draft.date;
  if (!draft.date || !endDate || endDate < draft.date) return false;
  if (draft.allDay || endDate > draft.date) return true;
  if (!draft.time || !draft.endTime) return false;
  return minutesFromTime(draft.endTime) > minutesFromTime(draft.time);
}

function findComingUpEvent(events: CalendarEvent[], now: Date) {
  const currentMinute = now.getHours() * 60 + now.getMinutes();

  return (
    events
      .filter((event) => !event.allDay)
      .map((event) => {
        const start = minutesFromTime(event.time);
        const requestedEnd = event.endTime
          ? minutesFromTime(event.endTime)
          : start + 60;
        const end = Math.min(24 * 60, Math.max(start + 15, requestedEnd));
        return { event, start, end };
      })
      .filter(({ end }) => end > currentMinute)
      .sort(
        (first, second) =>
          first.start - second.start || first.end - second.end,
      )[0]?.event ?? null
  );
}

function timeFromMinutes(value: number) {
  const minutes = Math.max(0, Math.min(23 * 60 + 45, Math.round(value / 15) * 15));
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const SCHEDULE_START_MINUTE = 0;
const SCHEDULE_END_MINUTE = 24 * 60;
const SCHEDULE_TOTAL_MINUTES = SCHEDULE_END_MINUTE - SCHEDULE_START_MINUTE;

function scheduleDatesFor(dateKey: string, count: 5 | 7) {
  const anchor = dateFromKey(dateKey);
  const mondayOffset = (anchor.getDay() + 6) % 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - mondayOffset);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function layoutScheduleEvents(events: CalendarEvent[]) {
  const timed = events
    .filter((event) => !event.allDay)
    .map((event) => {
      const start = minutesFromTime(event.time);
      const requestedEnd = event.endTime
        ? minutesFromTime(event.endTime)
        : start + 60;
      const end = Math.min(24 * 60, Math.max(start + 15, requestedEnd));
      return { event, start, end };
    })
    .sort((first, second) => first.start - second.start || first.end - second.end);

  const placed: Array<(typeof timed)[number] & { lane: number; laneCount: number }> = [];
  let overlapGroup: typeof timed = [];
  let overlapGroupEnd = -1;

  const flushOverlapGroup = () => {
    if (overlapGroup.length === 0) return;
    const laneEnds: number[] = [];
    const groupPlacements = overlapGroup.map((item) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= item.start);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = item.end;
      return { ...item, lane };
    });
    const laneCount = Math.max(1, laneEnds.length);
    placed.push(...groupPlacements.map((item) => ({ ...item, laneCount })));
    overlapGroup = [];
    overlapGroupEnd = -1;
  };

  timed.forEach((item) => {
    if (overlapGroup.length > 0 && item.start >= overlapGroupEnd) {
      flushOverlapGroup();
    }
    overlapGroup.push(item);
    overlapGroupEnd = Math.max(overlapGroupEnd, item.end);
  });
  flushOverlapGroup();

  return placed;
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
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [calendarScheduleOpen, setCalendarScheduleOpen] = useState(false);
  const [calendarSearchOpen, setCalendarSearchOpen] = useState(false);
  const [calendarSearchQuery, setCalendarSearchQuery] = useState("");
  const [hiddenCalendarSources, setHiddenCalendarSources] = useState<string[]>([]);
  const [calendarCategories, setCalendarCategories] = useState<CalendarCategory[]>(
    starterCalendarCategories,
  );
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<Pick<CalendarCategory, "name" | "color">>({
    name: "",
    color: "lilac",
  });
  const [categoryEditorError, setCategoryEditorError] = useState("");
  const [scheduleFocusOpen, setScheduleFocusOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [metricsPeriod, setMetricsPeriod] = useState<MetricsPeriod>("week");
  const [metricsAnchorDate, setMetricsAnchorDate] = useState(() => new Date());
  const [selectedHomeDate, setSelectedHomeDate] = useState(todayKey);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [calendarSlideDirection, setCalendarSlideDirection] = useState<
    "previous" | "next" | null
  >(null);
  const [scheduleSlideDirection, setScheduleSlideDirection] = useState<
    "previous" | "next" | null
  >(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayKey);
  const [eventEditorOpen, setEventEditorOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] =
    useState<CalendarEvent | null>(null);
  const [eventDetailReturnDayPocket, setEventDetailReturnDayPocket] =
    useState<string | null>(null);
  const [eventDeleteRequest, setEventDeleteRequest] =
    useState<EventDeleteRequest | null>(null);
  const [
    eventTemplateSuggestionsDismissed,
    setEventTemplateSuggestionsDismissed,
  ] = useState(false);
  const [daySummaryDate, setDaySummaryDate] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState<EventDraft>(() =>
    makeEventDraft(todayKey),
  );
  const [todoDraft, setTodoDraft] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [postIts, setPostIts] = useState<PostItNote[]>([]);
  const [studyNotebooks, setStudyNotebooks] = useState<StudyNotebook[]>([]);
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>([]);
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([]);
  const [calendarMemos, setCalendarMemos] = useState<CalendarMemo[]>([]);
  const [studyFiles, setStudyFiles] = useState<StudyFileItem[]>([]);
  const [pdfAnnotations, setPdfAnnotations] = useState<Record<string, PdfInkStroke[]>>({});
  const [epubReadingStates, setEpubReadingStates] = useState<Record<string, EpubReadingState>>({});
  const [activeStudyFile, setActiveStudyFile] = useState<StudyFileItem | null>(null);
  const [activeEpubBook, setActiveEpubBook] = useState<EpubBook | null>(null);
  const [studyReaderMessage, setStudyReaderMessage] = useState("");
  const [activeStudyNotebookId, setActiveStudyNotebookId] = useState<string | null>(null);
  const [postItEditorOpen, setPostItEditorOpen] = useState(false);
  const [editingPostItId, setEditingPostItId] = useState<string | null>(null);
  const [selectedPostItId, setSelectedPostItId] = useState<string | null>(null);
  const [postItDraft, setPostItDraft] = useState<PostItDraft>({
    text: "",
    color: "lavender",
  });
  const [stateReady, setStateReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncEmail, setSyncEmail] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState("");
  const [syncMessage, setSyncMessage] = useState("Checking your private sync…");
  const [syncCodeSent, setSyncCodeSent] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [scheduleNow, setScheduleNow] = useState(() => new Date());
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
  const [selectedClass, setSelectedClass] = useState(starterClasses[0].name);
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
  const [pageStyle, setPageStyle] = useState<PageStyle>(DEFAULT_SKETCH_PAPER.style);
  const [sketchPageColor, setSketchPageColor] = useState(DEFAULT_SKETCH_PAPER.color);
  const [sketchPageSize, setSketchPageSize] = useState<SketchPageSizeId>(DEFAULT_SKETCH_PAPER.size);
  const [sketchPageOrientation, setSketchPageOrientation] =
    useState<SketchPageOrientation>(DEFAULT_SKETCH_PAPER.orientation);
  const [penColor, setPenColor] = useState("#1f241b");
  const [penSize, setPenSize] = useState(4);
  const [penTool, setPenTool] = useState<SketchTool>("pen");
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
  const activeSketchCanvasRectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const resizeSketchCanvasRef = useRef<() => void>(() => undefined);
  const sketchBaseImageRef = useRef<HTMLImageElement | null>(null);
  const sketchImageInputRef = useRef<HTMLInputElement | null>(null);
  const sketchStrokeStartedAtRef = useRef(0);
  const [straightenOnHold, setStraightenOnHold] = useState(true);
  const [scratchToErase, setScratchToErase] = useState(true);
  const [selectedSketchStrokeIds, setSelectedSketchStrokeIds] = useState<string[]>([]);
  const [sketchTextEditor, setSketchTextEditor] = useState<{ point: SketchPoint; text: string } | null>(null);
  const selectedSketchStrokeIdsRef = useRef<string[]>([]);
  const sketchSelectionBoxRef = useRef<{ left: number; top: number; right: number; bottom: number } | null>(null);
  const sketchSelectionDragRef = useRef<{ point: SketchPoint; originals: Map<string, SketchPoint[]> } | null>(null);
  const stylusDetectedRef = useRef(false);
  const redrawSketchRef = useRef<() => void>(() => undefined);
  const [historyDepth, setHistoryDepth] = useState({ undo: 0, redo: 0 });
  const calendarSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const scheduleSwipeStartRef = useRef<number | null>(null);
  const scheduleTimelineScrollRef = useRef<HTMLDivElement | null>(null);
  const calendarLongPressRef = useRef<number | null>(null);
  const calendarLongPressedRef = useRef(false);
  const calendarPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const phoneCanvasRef = useRef<HTMLElement | null>(null);
  const postItDragRef = useRef<{
    id: string;
    pointerId: number;
    target: HTMLElement;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const postItLongPressRef = useRef<number | null>(null);

  const doneIds = useMemo(
    () => reminderHistory[todayKey] ?? [],
    [reminderHistory, todayKey],
  );
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDoneCount =
    reminderHistory[localDateKey(yesterdayDate)]?.length ?? 0;

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setScheduleNow(now);
      setIsNight(now.getHours() >= 18 || now.getHours() < 5);
    };
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

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
            moodHistory?: Record<string, string>;
            completedDays?: Record<string, boolean>;
            calendarEvents?: CalendarEvent[];
            postIts?: PostItNote[];
            calendarCategories?: CalendarCategory[];
            focusSessions?: number;
            appTheme?: AppTheme;
            colorMode?: ColorMode;
            customTheme?: CustomTheme;
            profilePhoto?: string | null;
            classes?: ClassItem[];
            recordings?: Recording[];
            studyNotebooks?: StudyNotebook[];
            studyNotes?: StudyNote[];
            studyTasks?: StudyTask[];
            calendarMemos?: CalendarMemo[];
            pdfAnnotations?: Record<string, PdfInkStroke[]>;
            epubReadingStates?: Record<string, EpubReadingState>;
            cleanStartVersion?: string;
          } | null;
        };
        payload = (await reconcileCloudState(payload)) || payload;
        if (cancelled) return;

        if (payload.state) {
          const state = payload.state;
          if (state.cleanStartVersion === CLEAN_START_VERSION) {
            if (state.reminderHistory) setReminderHistory(state.reminderHistory);
            if (state.reminders) setReminders(state.reminders);
            if (state.habits) setHabits(state.habits);
            if (state.entries) setEntries(state.entries);
            if (state.moodHistory) setMoodHistory(state.moodHistory);
            if (state.completedDays) setCompletedDays(state.completedDays);
            if (state.calendarEvents) setCalendarEvents(state.calendarEvents);
            if (Array.isArray(state.postIts)) {
              setPostIts(
                state.postIts.map((note) => ({
                  ...note,
                  page: note.page || "today",
                })),
              );
            }
            if (Array.isArray(state.calendarCategories) && state.calendarCategories.length) {
              setCalendarCategories(state.calendarCategories);
            } else if (state.calendarEvents?.length) {
              const restoredCategories = [...starterCalendarCategories];
              state.calendarEvents.forEach((event) => {
                const name = event.calendar?.trim();
                if (
                  name &&
                  !restoredCategories.some(
                    (category) => category.name.toLowerCase() === name.toLowerCase(),
                  )
                ) {
                  restoredCategories.push({
                    id: `restored-${restoredCategories.length}`,
                    name,
                    color: event.color,
                  });
                }
              });
              setCalendarCategories(restoredCategories);
            }
            if (typeof state.focusSessions === "number") {
              setFocusSessions(state.focusSessions);
            }
            if (Array.isArray(state.studyNotebooks)) {
              setStudyNotebooks(state.studyNotebooks);
            }
            if (Array.isArray(state.studyNotes)) {
              setStudyNotes(state.studyNotes);
            }
            if (Array.isArray(state.studyTasks)) {
              setStudyTasks(state.studyTasks);
            }
            if (Array.isArray(state.calendarMemos)) {
              setCalendarMemos(state.calendarMemos);
            }
            if (state.pdfAnnotations && typeof state.pdfAnnotations === "object") {
              setPdfAnnotations(state.pdfAnnotations);
            }
            if (state.epubReadingStates && typeof state.epubReadingStates === "object") {
              setEpubReadingStates(state.epubReadingStates);
            }
          } else {
            setReminderHistory({});
            setReminders(starterReminders);
            setHabits(starterHabits);
            setEntries([]);
            setMoodHistory({});
            setCompletedDays({});
            setCalendarEvents([]);
            setPostIts([]);
            setCalendarCategories(starterCalendarCategories);
            setFocusSessions(0);
            setRecordings([]);
            setStudyNotebooks([]);
            setStudyNotes([]);
            setStudyTasks([]);
            setCalendarMemos([]);
            setPdfAnnotations({});
            setEpubReadingStates({});
            window.localStorage.removeItem("aerea-reminders");
            window.localStorage.removeItem("aerea-habits");
            window.localStorage.removeItem("aerea-journal");
            window.localStorage.removeItem("aerea-mood");
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

    async function loadStudyFiles() {
      try {
        const payload = isNative()
          ? await AereaStorage.listDocuments()
          : await fetch("/api/files", { cache: "no-store" }).then(async (response) => {
              if (!response.ok) throw new Error("Study files are unavailable.");
              return (await response.json()) as { files?: StudyFileItem[] };
            });
        if (!cancelled && Array.isArray(payload.files)) {
          setStudyFiles(payload.files);
        }
      } catch {
        // The library remains available for notes and notebooks while files reconnect.
      }
    }

    void loadState();
    void loadSketches();
    void loadStudyFiles();
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
              moodHistory,
              completedDays,
              calendarEvents,
              postIts,
              calendarCategories,
              focusSessions,
              appTheme,
              colorMode,
              customTheme,
              profilePhoto,
              classes: classItems,
              recordings,
              studyNotebooks,
              studyNotes,
              studyTasks,
              calendarMemos,
              pdfAnnotations,
              epubReadingStates,
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
    calendarCategories,
    classItems,
    appTheme,
    colorMode,
    completedDays,
    customTheme,
    entries,
    focusSessions,
    habits,
    moodHistory,
    postIts,
    profilePhoto,
    reminderHistory,
    reminders,
    recordings,
    studyNotebooks,
    studyNotes,
    studyTasks,
    calendarMemos,
    pdfAnnotations,
    epubReadingStates,
    stateReady,
    syncEmail,
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
    [doneIds],
  );
  const completed = useMemo(
    () => reminders.filter((item) => doneIds.includes(item.id)),
    [doneIds],
  );
  const habitCompletions = habits.filter((habit) => habit.days[3]).length;
  const classRecordings = recordings.filter(
    (recording) => recording.className === selectedClass,
  );
  const currentPostItPage: PostItPage =
    activeTab === "spaces" ? `spaces:${space}` : activeTab;
  const visiblePostIts = postIts.filter(
    (note) => (note.page || "today") === currentPostItPage,
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
  const extendedLeadingDays = new Date(
    calendarYear,
    calendarMonth,
    1,
  ).getDay();
  const calendarDays = useMemo(() => {
    return Array.from(
      { length: daysInViewMonth },
      (_, index) => ({
        date: new Date(calendarYear, calendarMonth, index + 1),
        currentMonth: true,
      }),
    );
  }, [calendarMonth, calendarYear, daysInViewMonth]);
  const extendedCalendarWeekCount = Math.max(
    6,
    Math.ceil((extendedLeadingDays + daysInViewMonth) / 7),
  );
  const extendedCalendarDays = useMemo(() => {
    return Array.from({ length: extendedCalendarWeekCount * 7 }, (_, index) => {
      const date = new Date(
        calendarYear,
        calendarMonth,
        index - extendedLeadingDays + 1,
      );
      const firstOfMonth = new Date(calendarYear, calendarMonth, 1);
      const firstOfNextMonth = new Date(calendarYear, calendarMonth + 1, 1);
      return {
        date,
        currentMonth: date.getMonth() === calendarMonth,
        previousMonth: date < firstOfMonth,
        nextMonth: date >= firstOfNextMonth,
      };
    });
  }, [calendarMonth, calendarYear, extendedCalendarWeekCount, extendedLeadingDays]);
  const extendedCalendarSources = useMemo(() => {
    const sources = new Set<string>(
      calendarCategories.map((category) => category.name),
    );
    calendarEvents.forEach((event) => sources.add(event.calendar || "Personal"));
    return Array.from(sources);
  }, [calendarCategories, calendarEvents]);
  const scheduleDays = useMemo(
    () => scheduleDatesFor(selectedCalendarDate, 7),
    [selectedCalendarDate],
  );
  const scheduleMarks = useMemo(
    () => Array.from(
      { length: SCHEDULE_TOTAL_MINUTES / 30 + 1 },
      (_, index) => SCHEDULE_START_MINUTE + index * 30,
    ),
    [],
  );
  const currentScheduleMinute = scheduleNow.getHours() * 60 + scheduleNow.getMinutes();
  const selectedDateEvents = calendarEvents
    .filter((event) => eventOccursOn(event, selectedCalendarDate))
    .sort((a, b) => a.time.localeCompare(b.time));
  const eventDraftRangeIsValid = eventDraftHasValidRange(eventDraft);
  const eventTitleSuggestions = useMemo(() => {
    const query = normalizeCalendarSearch(eventDraft.title);
    if (editingEventId || eventTemplateSuggestionsDismissed || query.length < 2) {
      return [];
    }

    return calendarEvents
      .filter((event) => normalizeCalendarSearch(event.title).includes(query))
      .sort((first, second) => {
        const firstTitle = normalizeCalendarSearch(first.title);
        const secondTitle = normalizeCalendarSearch(second.title);
        const firstStarts = firstTitle.startsWith(query) ? 0 : 1;
        const secondStarts = secondTitle.startsWith(query) ? 0 : 1;
        return (
          firstStarts - secondStarts ||
          firstTitle.localeCompare(secondTitle) ||
          first.time.localeCompare(second.time)
        );
      })
      .slice(0, 5);
  }, [
    calendarEvents,
    editingEventId,
    eventDraft.title,
    eventTemplateSuggestionsDismissed,
  ]);
  const calendarSearchResults = useMemo<CalendarSearchOccurrence[]>(() => {
    const query = normalizeCalendarSearch(calendarSearchQuery);
    if (!query) return [];

    const today = dateFromKey(todayKey);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 365);
    const rangeEnd = new Date(today);
    rangeEnd.setDate(rangeEnd.getDate() + 365);
    const todayTime = today.getTime();
    const results: CalendarSearchOccurrence[] = [];

    calendarEvents
      .filter((event) => calendarEventSearchText(event).includes(query))
      .forEach((event) => {
        if ((event.repeat ?? "Never") === "Never") {
          results.push({ event, date: event.date });
          return;
        }

        const seriesStart = dateFromKey(event.date);
        const cursor = new Date(
          Math.max(seriesStart.getTime(), rangeStart.getTime()),
        );
        const occurrences: CalendarSearchOccurrence[] = [];
        while (cursor <= rangeEnd) {
          const date = localDateKey(cursor);
          if (eventOccursOn(event, date)) occurrences.push({ event, date });
          cursor.setDate(cursor.getDate() + 1);
        }

        if (occurrences.length === 0) {
          results.push({ event, date: event.date });
          return;
        }

        results.push(
          ...occurrences
            .sort(
              (first, second) =>
                Math.abs(dateFromKey(first.date).getTime() - todayTime) -
                Math.abs(dateFromKey(second.date).getTime() - todayTime),
            )
            .slice(0, 80),
        );
      });

    return results
      .sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          first.event.time.localeCompare(second.event.time),
      )
      .slice(0, 240);
  }, [calendarEvents, calendarSearchQuery, todayKey]);
  const calendarSearchGroups = useMemo(() => {
    const groups: Array<{
      date: string;
      occurrences: CalendarSearchOccurrence[];
    }> = [];
    calendarSearchResults.forEach((occurrence) => {
      const current = groups[groups.length - 1];
      if (current?.date === occurrence.date) {
        current.occurrences.push(occurrence);
      } else {
        groups.push({ date: occurrence.date, occurrences: [occurrence] });
      }
    });
    return groups;
  }, [calendarSearchResults]);
  const selectedScheduleAllDayEvents = selectedDateEvents.filter(
    (event) => event.allDay,
  );
  const selectedTimedScheduleEvents = layoutScheduleEvents(
    selectedDateEvents.filter((event) => !event.allDay),
  );
  const selectedScheduleAgendaEvents = [
    ...selectedScheduleAllDayEvents,
    ...selectedTimedScheduleEvents.map(({ event }) => event),
  ];
  const scheduleHasAllDayEvents = selectedScheduleAllDayEvents.length > 0;
  const lastScheduledMinute = selectedTimedScheduleEvents.reduce(
    (latest, { end }) => Math.max(latest, end),
    0,
  );
  const scheduleAddMinute = Math.max(
    SCHEDULE_START_MINUTE,
    Math.min(
      SCHEDULE_END_MINUTE - 120,
      Math.max(
        selectedCalendarDate === todayKey
          ? Math.ceil(currentScheduleMinute / 15) * 15
          : 9 * 60,
        lastScheduledMinute ? lastScheduledMinute + 15 : 0,
      ),
    ),
  );
  const selectedDateMood = moods.find(
    (mood) => mood.label === moodHistory[selectedCalendarDate],
  );
  const selectedScheduleDateObject = dateFromKey(selectedCalendarDate);
  const selectedScheduleIsToday = selectedCalendarDate === todayKey;
  const selectedScheduleWeekday = selectedScheduleDateObject.toLocaleDateString("en", {
    weekday: "long",
  });
  const selectedDayComplete = completedDays[selectedCalendarDate] === true;
  const homeWeek = useMemo(() => weekForDate(todayKey), [todayKey]);
  const selectedHomeEvents = calendarEvents
    .filter((event) => eventOccursOn(event, selectedHomeDate))
    .sort((a, b) => a.time.localeCompare(b.time));
  const todayWidgetEvents = useMemo(
    () =>
      calendarEvents
        .filter((event) => eventOccursOn(event, todayKey))
        .sort((a, b) => a.time.localeCompare(b.time)),
    [calendarEvents, todayKey],
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
        const events = calendarEvents
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
  }, [calendarEvents, completedDays, moodHistory, todayKey]);
  const hydrationReminderIds = useMemo(
    () =>
      reminders
        .filter((reminder) => {
          const name = normalizeCalendarSearch(reminder.title);
          return (
            reminder.icon.includes("💧") ||
            name.includes("water") ||
            name.includes("drink") ||
            name.includes("hydrat") ||
            name.includes("agua")
          );
        })
        .map((reminder) => reminder.id),
    [reminders],
  );
  const firstMetricsDate = useMemo(() => {
    const knownDates = [
      ...Object.keys(reminderHistory),
      ...Object.keys(moodHistory),
      ...Object.keys(completedDays),
      ...calendarEvents.map((event) => event.date),
    ].filter(Boolean).sort();
    if (knownDates[0]) return dateFromKey(knownDates[0]);
    const fallback = dateFromKey(todayKey);
    fallback.setDate(fallback.getDate() - 6);
    return fallback;
  }, [calendarEvents, completedDays, moodHistory, reminderHistory, todayKey]);
  const metricsRange = useMemo(
    () => metricsDateRange(metricsPeriod, metricsAnchorDate, firstMetricsDate),
    [firstMetricsDate, metricsAnchorDate, metricsPeriod],
  );
  const metricDateKeys = useMemo(
    () => datesBetween(metricsRange.start, metricsRange.end),
    [metricsRange.end, metricsRange.start],
  );
  const metricsWeekKeys = useMemo(() => {
    const week = metricsDateRange("week", metricsAnchorDate, firstMetricsDate);
    return datesBetween(week.start, week.end);
  }, [firstMetricsDate, metricsAnchorDate]);
  const dayHasHydration = (dateKey: string) => {
    const checked = reminderHistory[dateKey] ?? [];
    return hydrationReminderIds.some((id) => checked.includes(id));
  };
  const dayHasClass = (dateKey: string) =>
    calendarEvents.some((event) => {
      if (!eventOccursOn(event, dateKey)) return false;
      const category = normalizeCalendarSearch(event.calendar ?? "");
      const title = normalizeCalendarSearch(event.title);
      return (
        category.includes("class") ||
        title.includes("class") ||
        title.includes("course") ||
        title.includes("lecture") ||
        title.includes("clase")
      );
    });
  const dayHasStudy = (dateKey: string) =>
    calendarEvents.some((event) => {
      if (!eventOccursOn(event, dateKey)) return false;
      const text = normalizeCalendarSearch(
        `${event.calendar ?? ""} ${event.title} ${event.note ?? ""}`,
      );
      return (
        text.includes("study") ||
        text.includes("focus") ||
        text.includes("exam") ||
        text.includes("estudi") ||
        text.includes("repas")
      );
    });
  const metricTrackedKeys = metricDateKeys.filter((dateKey) => dateKey <= todayKey);
  const hydratedDays = metricTrackedKeys.filter(dayHasHydration).length;
  const classDays = metricTrackedKeys.filter(dayHasClass).length;
  const completedMetricDays = metricTrackedKeys.filter(
    (dateKey) => completedDays[dateKey] === true,
  ).length;
  const moodMetricValues = metricTrackedKeys
    .map((dateKey) => moodScores[moodHistory[dateKey]])
    .filter((value): value is number => Number.isFinite(value));
  const averageMood = moodMetricValues.length
    ? Math.round(
        moodMetricValues.reduce((total, value) => total + value, 0) /
          moodMetricValues.length,
      )
    : 0;
  const metricGoal = Math.max(1, metricDateKeys.length);
  const metricProgress = {
    hydration: Math.round((hydratedDays / metricGoal) * 100),
    classes: Math.round((classDays / metricGoal) * 100),
    completed: Math.round((completedMetricDays / metricGoal) * 100),
  };
  const metricStreaks = {
    hydration: currentStreak(metricTrackedKeys, dayHasHydration),
    classes: currentStreak(metricTrackedKeys, dayHasClass),
    completed: currentStreak(
      metricTrackedKeys,
      (dateKey) => completedDays[dateKey] === true,
    ),
  };
  const moodWeekValues = metricsWeekKeys.map(
    (dateKey) => moodScores[moodHistory[dateKey]] ?? 50,
  );
  const moodLinePoints = moodWeekValues
    .map((value, index) => `${8 + index * 14},${86 - value * 0.64}`)
    .join(" ");
  const consistentWeekday = useMemo(() => {
    const totals = Array.from({ length: 7 }, () => 0);
    metricTrackedKeys.forEach((dateKey) => {
      const score =
        Number(dayHasHydration(dateKey)) +
        Number(dayHasClass(dateKey)) +
        Number(dayHasStudy(dateKey)) +
        Number(completedDays[dateKey] === true);
      totals[(dateFromKey(dateKey).getDay() + 6) % 7] += score;
    });
    const best = totals.indexOf(Math.max(...totals));
    return ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"][best];
  }, [calendarEvents, completedDays, hydrationReminderIds, metricTrackedKeys, reminderHistory]);
  const metricsRangeLabel = (() => {
    if (metricsPeriod === "all") return "All your little days";
    if (metricsPeriod === "year") return String(metricsRange.start.getFullYear());
    if (metricsPeriod === "month") {
      return metricsRange.start.toLocaleDateString("en", {
        month: "long",
        year: "numeric",
      });
    }
    const start = metricsRange.start.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    });
    const end = metricsRange.end.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    });
    return `${start} – ${end}`;
  })();
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
  const canUndo = historyDepth.undo > 0;
  const canRedo = historyDepth.redo > 0;
  const sketchPaperSettings = {
    style: pageStyle,
    color: sketchPageColor,
    size: sketchPageSize,
    orientation: sketchPageOrientation,
  };
  const sketchPaperDimensions = getSketchPageDimensions(
    sketchPageSize,
    sketchPageOrientation,
  );
  const sketchPageDefinition = getSketchPageSize(sketchPageSize);
  const sketchPaperColors = sketchPaperInkColors(sketchPageColor);
  const sketchPaperStyle = {
    "--sketch-page-aspect": `${sketchPaperDimensions.widthIn} / ${sketchPaperDimensions.heightIn}`,
    "--sketch-page-aspect-number": sketchPaperDimensions.widthIn / sketchPaperDimensions.heightIn,
    "--sketch-paper-color": sketchPageColor,
    "--sketch-rule-color": sketchPaperColors.rule,
    "--sketch-margin-color": sketchPaperColors.margin,
  } as CSSProperties;
  const focusProgress = Math.max(
    0,
    Math.min(100, (focusSeconds / Math.max(1, focusLength * 60)) * 100),
  );
  useEffect(() => {
    if (!calendarOpen || !calendarScheduleOpen) {
      setScheduleFocusOpen(false);
    }
  }, [calendarScheduleOpen, calendarOpen]);

  useEffect(() => {
    if (!scheduleFocusOpen) return;
    const closeFocusedSchedule = (event: KeyboardEvent) => {
      if (event.key === "Escape") setScheduleFocusOpen(false);
    };
    window.addEventListener("keydown", closeFocusedSchedule);
    return () => window.removeEventListener("keydown", closeFocusedSchedule);
  }, [scheduleFocusOpen]);

  useEffect(() => {
    if (!calendarOpen || !calendarScheduleOpen) return;
    const datedEvents = calendarEvents.filter((event) =>
      eventOccursOn(event, selectedCalendarDate),
    );
    if (datedEvents.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      const timeline = scheduleTimelineScrollRef.current;
      if (!timeline) return;
      const firstTimedEvent = layoutScheduleEvents(
        datedEvents.filter((event) => !event.allDay),
      )[0]?.start;
      const now = new Date();
      const currentMinute = now.getHours() * 60 + now.getMinutes();
      const focusMinute = firstTimedEvent ?? (selectedCalendarDate === todayKey ? currentMinute : 9 * 60);
      const scrollMinute = Math.max(
        SCHEDULE_START_MINUTE,
        Math.min(SCHEDULE_END_MINUTE - 180, focusMinute - 60),
      );
      timeline.scrollTop = ((scrollMinute - SCHEDULE_START_MINUTE) / SCHEDULE_TOTAL_MINUTES) * timeline.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [calendarEvents, calendarOpen, calendarScheduleOpen, selectedCalendarDate, todayKey]);

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

  const openMetrics = () => {
    setMetricsAnchorDate(new Date());
    setMetricsOpen(true);
  };

  const shiftMetricsRange = (direction: number) => {
    if (metricsPeriod === "all") return;
    setMetricsAnchorDate((current) => {
      const next = new Date(current);
      if (metricsPeriod === "week") next.setDate(next.getDate() + direction * 7);
      if (metricsPeriod === "month") next.setMonth(next.getMonth() + direction);
      if (metricsPeriod === "year") next.setFullYear(next.getFullYear() + direction);
      return next;
    });
  };

  const startNewCalendarCategory = () => {
    setEditingCategoryId(null);
    setCategoryDraft({ name: "", color: "lilac" });
    setCategoryEditorError("");
  };

  const openCalendarCategoryEditor = (category?: CalendarCategory) => {
    if (category) {
      setEditingCategoryId(category.id);
      setCategoryDraft({ name: category.name, color: category.color });
    } else {
      startNewCalendarCategory();
    }
    setCategoryEditorError("");
    setCategoryEditorOpen(true);
  };

  const saveCalendarCategory = () => {
    const name = categoryDraft.name.trim();
    if (!name) {
      setCategoryEditorError("Give this event type a name.");
      return;
    }
    const duplicate = calendarCategories.some(
      (category) =>
        category.id !== editingCategoryId &&
        category.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setCategoryEditorError("That event type already exists.");
      return;
    }

    if (editingCategoryId) {
      const previous = calendarCategories.find(
        (category) => category.id === editingCategoryId,
      );
      if (!previous) return;
      setCalendarCategories((current) =>
        current.map((category) =>
          category.id === editingCategoryId
            ? { ...category, name, color: categoryDraft.color }
            : category,
        ),
      );
      setCalendarEvents((current) =>
        current.map((event) =>
          event.calendar === previous.name
            ? { ...event, calendar: name, color: categoryDraft.color }
            : event,
        ),
      );
      setHiddenCalendarSources((current) =>
        current.map((source) => (source === previous.name ? name : source)),
      );
      setEventDraft((current) =>
        current.calendar === previous.name
          ? { ...current, calendar: name, color: categoryDraft.color }
          : current,
      );
    } else {
      setCalendarCategories((current) => [
        ...current,
        {
          id: `category-${crypto.randomUUID()}`,
          name,
          color: categoryDraft.color,
        },
      ]);
    }
    startNewCalendarCategory();
  };

  const deleteCalendarCategory = (categoryId: string) => {
    if (calendarCategories.length <= 1) {
      setCategoryEditorError("Keep at least one event type.");
      return;
    }
    const category = calendarCategories.find((item) => item.id === categoryId);
    const replacement = calendarCategories.find((item) => item.id !== categoryId);
    if (!category || !replacement) return;
    setCalendarCategories((current) =>
      current.filter((item) => item.id !== categoryId),
    );
    setCalendarEvents((current) =>
      current.map((event) =>
        event.calendar === category.name
          ? {
              ...event,
              calendar: replacement.name,
              color: replacement.color,
            }
          : event,
      ),
    );
    setHiddenCalendarSources((current) =>
      current.filter((source) => source !== category.name),
    );
    setEventDraft((current) =>
      current.calendar === category.name
        ? {
            ...current,
            calendar: replacement.name,
            color: replacement.color,
          }
        : current,
    );
    if (editingCategoryId === categoryId) startNewCalendarCategory();
  };

  const openPostItEditor = (postIt?: PostItNote) => {
    if (postIt) {
      setEditingPostItId(postIt.id);
      setPostItDraft({
        text: postIt.text,
        color: postIt.color,
      });
    } else {
      setEditingPostItId(null);
      setPostItDraft({
        text: "",
        color: postItColors[visiblePostIts.length % postItColors.length].value,
      });
    }
    setPostItEditorOpen(true);
  };

  const savePostIt = () => {
    const text = postItDraft.text.trim();
    if (!text) return;

    if (editingPostItId) {
      setPostIts((current) =>
        current.map((note) =>
          note.id === editingPostItId ? { ...note, ...postItDraft, text } : note,
        ),
      );
      setSelectedPostItId(editingPostItId);
    } else {
      const id = crypto.randomUUID();
      const slot = visiblePostIts.length % 4;
      const newPostIt: PostItNote = {
        id,
        text,
        color: postItDraft.color,
        page: currentPostItPage,
        x: [24, 73, 68, 31][slot],
        y: [16, 26, 58, 77][slot],
        rotation: [-5, 5, 3, -4][slot],
      };
      setPostIts((current) => [...current, newPostIt]);
      setSelectedPostItId(id);
    }
    setPostItEditorOpen(false);
  };

  const deletePostIt = (id: string) => {
    setPostIts((current) => current.filter((note) => note.id !== id));
    setSelectedPostItId((current) => (current === id ? null : current));
    setPostItEditorOpen(false);
  };

  const startPostItDrag = (
    event: ReactPointerEvent<HTMLElement>,
    postIt: PostItNote,
  ) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const canvas = phoneCanvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const centerX = bounds.left + (postIt.x / 100) * bounds.width;
    const centerY = bounds.top + (postIt.y / 100) * bounds.height;
    postItDragRef.current = {
      id: postIt.id,
      pointerId: event.pointerId,
      target: event.currentTarget,
      offsetX: event.clientX - centerX,
      offsetY: event.clientY - centerY,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedPostItId(postIt.id);
    if (postItLongPressRef.current) window.clearTimeout(postItLongPressRef.current);
    postItLongPressRef.current = window.setTimeout(() => {
      const activeDrag = postItDragRef.current;
      if (!activeDrag || activeDrag.id !== postIt.id) return;
      if (activeDrag.target.hasPointerCapture(activeDrag.pointerId)) {
        activeDrag.target.releasePointerCapture(activeDrag.pointerId);
      }
      postItDragRef.current = null;
      setSelectedPostItId(null);
      navigator.vibrate?.(18);
      openPostItEditor(postIt);
    }, 560);
  };

  const movePostIt = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = postItDragRef.current;
    const canvas = phoneCanvasRef.current;
    if (!drag || !canvas || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 10) {
      if (postItLongPressRef.current) window.clearTimeout(postItLongPressRef.current);
      postItLongPressRef.current = null;
    }
    const bounds = canvas.getBoundingClientRect();
    const x = Math.max(
      9,
      Math.min(91, ((event.clientX - bounds.left - drag.offsetX) / bounds.width) * 100),
    );
    const y = Math.max(
      3,
      Math.min(97, ((event.clientY - bounds.top - drag.offsetY) / bounds.height) * 100),
    );
    setPostIts((current) =>
      current.map((note) => (note.id === drag.id ? { ...note, x, y } : note)),
    );
  };

  const finishPostItDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (postItLongPressRef.current) window.clearTimeout(postItLongPressRef.current);
    postItLongPressRef.current = null;
    const drag = postItDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    postItDragRef.current = null;
  };

  const openCalendarAtToday = () => {
    const today = dateFromKey(todayKey);
    setSelectedHomeDate(todayKey);
    setSelectedCalendarDate(todayKey);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setEventEditorOpen(false);
    setCalendarExpanded(false);
    setCalendarScheduleOpen(false);
    setCalendarSearchOpen(false);
    setCalendarSearchQuery("");
    setMonthPickerOpen(false);
    setCalendarOpen(true);
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

  const shiftScheduleWeek = (offset: number) => {
    setScheduleSlideDirection(offset > 0 ? "next" : "previous");
    const next = dateFromKey(selectedCalendarDate);
    next.setDate(next.getDate() + offset * 7);
    const nextKey = localDateKey(next);
    setSelectedCalendarDate(nextKey);
    setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const startScheduleSwipe = (event: ReactTouchEvent<HTMLDivElement>) => {
    scheduleSwipeStartRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const finishScheduleSwipe = (event: ReactTouchEvent<HTMLDivElement>) => {
    const startX = scheduleSwipeStartRef.current;
    const endX = event.changedTouches[0]?.clientX;
    scheduleSwipeStartRef.current = null;
    if (startX === null || endX === undefined || Math.abs(endX - startX) < 46) return;
    shiftScheduleWeek(endX < startX ? 1 : -1);
  };

  const goToScheduleToday = () => {
    if (selectedCalendarDate !== todayKey) {
      setScheduleSlideDirection(
        dateFromKey(todayKey).getTime() > dateFromKey(selectedCalendarDate).getTime()
          ? "next"
          : "previous",
      );
    }
    const today = dateFromKey(todayKey);
    setSelectedCalendarDate(todayKey);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
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

  const beginCalendarLongPress = (
    dayKey: string,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    calendarLongPressedRef.current = false;
    calendarPressStartRef.current = { x: event.clientX, y: event.clientY };
    if (calendarLongPressRef.current) window.clearTimeout(calendarLongPressRef.current);
    calendarLongPressRef.current = window.setTimeout(() => {
      calendarLongPressedRef.current = true;
      setSelectedCalendarDate(dayKey);
      setDaySummaryDate(dayKey);
      navigator.vibrate?.(18);
    }, 560);
  };

  const moveCalendarLongPress = (event: ReactPointerEvent<HTMLElement>) => {
    const start = calendarPressStartRef.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) {
      cancelCalendarLongPress();
    }
  };

  const cancelCalendarLongPress = () => {
    if (calendarLongPressRef.current) window.clearTimeout(calendarLongPressRef.current);
    calendarLongPressRef.current = null;
    calendarPressStartRef.current = null;
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

    const remaining = classItems.filter((item) => item.id !== editingClassId);
    setClassItems(remaining);
    setRecordings((current) =>
      current.filter((recording) => recording.className !== removed.name),
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

  const chooseMood = (dateKey: string, mood: string) => {
    setMoodHistory((current) => {
      const next = { ...current };
      if (next[dateKey] === mood) {
        delete next[dateKey];
      } else {
        next[dateKey] = mood;
      }
      return next;
    });
  };

  const openNewEvent = (dateKey = selectedCalendarDate) => {
    const defaultCategory = calendarCategories[0] ?? starterCalendarCategories[0];
    setCalendarSearchOpen(false);
    setEditingEventId(null);
    setEventTemplateSuggestionsDismissed(false);
    setEventDraft({
      ...makeEventDraft(dateKey),
      calendar: defaultCategory.name,
      color: defaultCategory.color,
    });
    setTodoDraft("");
    setEventEditorOpen(true);
  };

  const openNewEventFromNavigation = () => {
    const dateKey = activeTab === "today" ? selectedHomeDate : todayKey;
    const date = dateFromKey(dateKey);
    setSelectedCalendarDate(dateKey);
    setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setCalendarExpanded(false);
    setCalendarScheduleOpen(false);
    setCalendarSearchOpen(false);
    setMonthPickerOpen(false);
    setCalendarOpen(true);
    openNewEvent(dateKey);
  };

  const openNewEventAtMinute = (dateKey: string, minute: number) => {
    const start = Math.max(0, Math.min(23 * 60 + 30, Math.round(minute / 15) * 15));
    const defaultCategory = calendarCategories[0] ?? starterCalendarCategories[0];
    setSelectedCalendarDate(dateKey);
    setEditingEventId(null);
    setEventTemplateSuggestionsDismissed(false);
    setEventDraft({
      ...makeEventDraft(dateKey),
      calendar: defaultCategory.name,
      color: defaultCategory.color,
      time: timeFromMinutes(start),
      endTime: timeFromMinutes(Math.min(23 * 60 + 45, start + 60)),
    });
    setTodoDraft("");
    setEventEditorOpen(true);
  };

  const openEventEditor = (calendarEvent: CalendarEvent) => {
    setCalendarSearchOpen(false);
    setEditingEventId(calendarEvent.id);
    setEventTemplateSuggestionsDismissed(true);
    setEventDraft({
      ...makeEventDraft(calendarEvent.date),
      ...calendarEvent,
    });
    setTodoDraft("");
    setEventEditorOpen(true);
  };

  const openEventDetail = (
    calendarEvent: CalendarEvent,
    returnDayPocket: string | null = null,
  ) => {
    setEventDetailReturnDayPocket(returnDayPocket);
    setSelectedEventDetail(calendarEvent);
  };

  const closeEventDetail = () => {
    setSelectedEventDetail(null);
    setEventDetailReturnDayPocket(null);
  };

  const returnToDayPocket = () => {
    if (!eventDetailReturnDayPocket) return;
    const returnDate = eventDetailReturnDayPocket;
    setSelectedEventDetail(null);
    setEventDetailReturnDayPocket(null);
    setSelectedCalendarDate(returnDate);
    setDaySummaryDate(returnDate);
  };

  const saveCalendarEvent = () => {
    if (!eventDraft.title.trim() || !eventDraftHasValidRange(eventDraft)) return;
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
    setSelectedCalendarDate(savedEvent.date);
    setEventEditorOpen(false);
    setEditingEventId(null);
  };

  const applyEventTemplate = (template: CalendarEvent) => {
    setEventTemplateSuggestionsDismissed(true);
    setEventDraft((current) => {
      const templateStart = dateFromKey(template.date);
      const templateEnd = dateFromKey(template.endDate ?? template.date);
      const durationDays = Math.max(
        0,
        Math.round(
          (templateEnd.getTime() - templateStart.getTime()) / 86_400_000,
        ),
      );
      const copiedEnd = dateFromKey(current.date);
      copiedEnd.setDate(copiedEnd.getDate() + durationDays);

      return {
        ...template,
        title: template.title,
        date: current.date,
        endDate: localDateKey(copiedEnd),
        excludedDates: [],
        repeatUntil: undefined,
        todos: [...(template.todos ?? [])],
        todoStates: (template.todos ?? []).map(() => "pending" as const),
        files: [...(template.files ?? [])],
      };
    });
  };

  const closeEventDelete = () => setEventDeleteRequest(null);

  const deleteWholeEvent = () => {
    if (!eventDeleteRequest) return;
    const deletedId = eventDeleteRequest.eventId;
    setCalendarEvents((current) =>
      current.filter((event) => event.id !== deletedId),
    );
    setSelectedEventDetail((current) =>
      current?.id === deletedId ? null : current,
    );
    closeEventDelete();
  };

  const deleteOnlyOccurrence = () => {
    if (!eventDeleteRequest) return;
    const { eventId, occurrenceDate } = eventDeleteRequest;
    setCalendarEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event;
        return {
          ...event,
          excludedDates: Array.from(
            new Set([...(event.excludedDates ?? []), occurrenceDate]),
          ).sort(),
        };
      }),
    );
    closeEventDelete();
  };

  const deleteThisAndFutureOccurrences = () => {
    if (!eventDeleteRequest) return;
    const { eventId, occurrenceDate } = eventDeleteRequest;
    setCalendarEvents((current) =>
      current.flatMap((event) => {
        if (event.id !== eventId) return [event];
        if (occurrenceDate <= event.date) return [];
        return [{ ...event, repeatUntil: previousDateKey(occurrenceDate) }];
      }),
    );
    closeEventDelete();
  };

  const updateEventDraft = <Key extends keyof EventDraft>(
    key: Key,
    value: EventDraft[Key],
  ) => {
    setEventDraft((current) => ({ ...current, [key]: value }));
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
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setSelectedJournalEntry((current) =>
      current?.id === id ? null : current,
    );
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

  const setSketchSelection = (ids: string[]) => {
    selectedSketchStrokeIdsRef.current = ids;
    setSelectedSketchStrokeIds(ids);
    if (ids.length === 0) sketchSelectionBoxRef.current = null;
  };

  const strokeBounds = (stroke: SketchStroke) => {
    const xs = stroke.points.map((point) => point.x);
    const ys = stroke.points.map((point) => point.y);
    return {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys),
    };
  };

  const canvasPointFromClient = (
    clientX: number,
    clientY: number,
    pressure: number,
    pointerType: string,
  ): SketchPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const liveRect = canvas.getBoundingClientRect();
    const rect = activeSketchCanvasRectRef.current ?? liveRect;
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
      stroke.tool === "eraser"
        ? "destination-out"
        : stroke.tool === "highlighter"
          ? "multiply"
          : "source-over";
    context.globalAlpha =
      stroke.tool === "highlighter"
        ? 0.26
        : stroke.tool === "pencil"
          ? 0.72
          : stroke.tool === "tape" && stroke.revealed
            ? 0.13
            : 1;
    context.strokeStyle = stroke.color;
    context.fillStyle = stroke.color;
    context.lineCap = "round";
    context.lineJoin = "round";

    if (stroke.tool === "text" && stroke.text) {
      const point = stroke.points[0];
      context.globalAlpha = 1;
      context.font = `600 ${Math.max(18, stroke.size * 5) * cssToCanvas}px ui-rounded, system-ui, sans-serif`;
      context.textBaseline = "top";
      context.fillText(stroke.text, point.x * canvas.width, point.y * canvas.height);
      context.restore();
      return;
    }

    if (["line", "rectangle", "ellipse"].includes(stroke.tool) && stroke.points.length > 1) {
      const first = stroke.points[0];
      const last = stroke.points[stroke.points.length - 1];
      context.lineWidth = stroke.size * cssToCanvas;
      context.beginPath();
      if (stroke.tool === "line") {
        context.moveTo(first.x * canvas.width, first.y * canvas.height);
        context.lineTo(last.x * canvas.width, last.y * canvas.height);
      } else if (stroke.tool === "rectangle") {
        context.rect(
          first.x * canvas.width,
          first.y * canvas.height,
          (last.x - first.x) * canvas.width,
          (last.y - first.y) * canvas.height,
        );
      } else {
        const centerX = ((first.x + last.x) / 2) * canvas.width;
        const centerY = ((first.y + last.y) / 2) * canvas.height;
        context.ellipse(
          centerX,
          centerY,
          Math.abs(last.x - first.x) * canvas.width / 2,
          Math.abs(last.y - first.y) * canvas.height / 2,
          0,
          0,
          Math.PI * 2,
        );
      }
      context.stroke();
      context.restore();
      return;
    }

    if (stroke.tool === "lasso") {
      context.globalAlpha = 0.85;
      context.strokeStyle = "#719aac";
      context.lineWidth = 1.5 * cssToCanvas;
      context.setLineDash([6 * cssToCanvas, 5 * cssToCanvas]);
    }

    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      const width =
        (stroke.tool === "eraser"
          ? stroke.size * 4
          : stroke.tool === "highlighter" || stroke.tool === "tape"
            ? stroke.size * 4.5
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
          : stroke.tool === "highlighter" || stroke.tool === "tape"
            ? stroke.size * 4.5
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
    if (sketchSelectionBoxRef.current) {
      const box = sketchSelectionBoxRef.current;
      context.save();
      context.strokeStyle = "#6fa8bd";
      context.fillStyle = "rgba(169, 220, 235, .08)";
      context.lineWidth = Math.max(2, canvas.width / 700);
      context.setLineDash([10, 7]);
      context.fillRect(
        box.left * canvas.width,
        box.top * canvas.height,
        (box.right - box.left) * canvas.width,
        (box.bottom - box.top) * canvas.height,
      );
      context.strokeRect(
        box.left * canvas.width,
        box.top * canvas.height,
        (box.right - box.left) * canvas.width,
        (box.bottom - box.top) * canvas.height,
      );
      context.restore();
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
    setSketchSelection([]);
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

  const importSketchImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        sketchBaseImageRef.current = image;
        resetSketchHistory();
        redrawSketch();
        setSketchMessage("Image attached — draw, highlight, or cross things out on top.");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const pointInsideBox = (
    point: SketchPoint,
    box: { left: number; top: number; right: number; bottom: number },
  ) =>
    point.x >= box.left &&
    point.x <= box.right &&
    point.y >= box.top &&
    point.y <= box.bottom;

  const refreshSketchSelectionBox = (ids = selectedSketchStrokeIdsRef.current) => {
    const selected = sketchStrokesRef.current.filter((stroke) => ids.includes(stroke.id));
    if (selected.length === 0) {
      sketchSelectionBoxRef.current = null;
      return;
    }
    const bounds = selected.map(strokeBounds);
    sketchSelectionBoxRef.current = {
      left: Math.max(0, Math.min(...bounds.map((box) => box.left)) - 0.008),
      top: Math.max(0, Math.min(...bounds.map((box) => box.top)) - 0.012),
      right: Math.min(1, Math.max(...bounds.map((box) => box.right)) + 0.008),
      bottom: Math.min(1, Math.max(...bounds.map((box) => box.bottom)) + 0.012),
    };
  };

  const deleteSketchSelection = () => {
    const ids = selectedSketchStrokeIdsRef.current;
    if (ids.length === 0) return;
    sketchStrokesRef.current = sketchStrokesRef.current.filter((stroke) => !ids.includes(stroke.id));
    setSketchSelection([]);
    syncSketchHistory();
    redrawSketch();
  };

  const duplicateSketchSelection = () => {
    const ids = selectedSketchStrokeIdsRef.current;
    if (ids.length === 0) return;
    const copies = sketchStrokesRef.current
      .filter((stroke) => ids.includes(stroke.id))
      .map((stroke) => ({
        ...stroke,
        id: crypto.randomUUID(),
        points: stroke.points.map((point) => ({
          ...point,
          x: Math.min(1, point.x + 0.025),
          y: Math.min(1, point.y + 0.025),
        })),
      }));
    sketchStrokesRef.current.push(...copies);
    setSketchSelection(copies.map((stroke) => stroke.id));
    refreshSketchSelectionBox(copies.map((stroke) => stroke.id));
    syncSketchHistory();
    redrawSketch();
  };

  const isScratchGesture = (stroke: SketchStroke) => {
    if (stroke.points.length < 14) return false;
    let reversals = 0;
    let previousDirection = 0;
    stroke.points.slice(1).forEach((point, index) => {
      const direction = Math.sign(point.x - stroke.points[index].x);
      if (direction && previousDirection && direction !== previousDirection) reversals += 1;
      if (direction) previousDirection = direction;
    });
    const box = strokeBounds(stroke);
    return reversals >= 4 && box.right - box.left > 0.045 && box.bottom - box.top > 0.012;
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    const canvasRect = canvas.getBoundingClientRect();
    activeSketchCanvasRectRef.current = {
      left: canvasRect.left,
      top: canvasRect.top,
      width: canvasRect.width,
      height: canvasRect.height,
    };
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
      activeSketchCanvasRectRef.current = null;
      redrawSketch();
      sketchGestureRef.current = sketchGesture();
      return;
    }

    if (event.pointerType === "touch" && stylusDetectedRef.current) {
      activeSketchCanvasRectRef.current = null;
      return;
    }

    const point = canvasPointFromClient(
      event.clientX,
      event.clientY,
      event.pressure,
      event.pointerType,
    );

    if (penTool === "eyedropper") {
      const context = canvas.getContext("2d");
      if (context) {
        const pixel = context.getImageData(
          Math.min(canvas.width - 1, Math.max(0, Math.round(point.x * canvas.width))),
          Math.min(canvas.height - 1, Math.max(0, Math.round(point.y * canvas.height))),
          1,
          1,
        ).data;
        setPenColor(`#${[pixel[0], pixel[1], pixel[2]].map((value) => value.toString(16).padStart(2, "0")).join("")}`);
      }
      setPenTool("pen");
      setSketchMessage("Color picked from the page.");
      activeSketchCanvasRectRef.current = null;
      return;
    }

    if (
      penTool === "lasso" &&
      sketchSelectionBoxRef.current &&
      pointInsideBox(point, sketchSelectionBoxRef.current)
    ) {
      sketchSelectionDragRef.current = {
        point,
        originals: new Map(
          sketchStrokesRef.current
            .filter((stroke) => selectedSketchStrokeIdsRef.current.includes(stroke.id))
            .map((stroke) => [stroke.id, stroke.points.map((item) => ({ ...item }))]),
        ),
      };
      activeSketchPointerRef.current = event.pointerId;
      return;
    }

    if (penTool === "text") {
      setSketchTextEditor({ point, text: "" });
      activeSketchCanvasRectRef.current = null;
      return;
    }

    if (penTool === "tape") {
      const tape = sketchStrokesRef.current.find((stroke) =>
        stroke.tool === "tape" &&
        stroke.points.some((item) => Math.hypot(item.x - point.x, item.y - point.y) < 0.025),
      );
      if (tape) {
        tape.revealed = !tape.revealed;
        redrawSketch();
        activeSketchCanvasRectRef.current = null;
        return;
      }
    }

    if (penTool !== "lasso") setSketchSelection([]);
    activeStrokeRef.current = {
      id: crypto.randomUUID(),
      tool: penTool as SketchStroke["tool"],
      color: penTool === "tape" ? "#f4cdd9" : penColor,
      size: penSize,
      points: [point],
    };
    sketchStrokeStartedAtRef.current = performance.now();
    activeSketchPointerRef.current = event.pointerId;
    sketchRedoRef.current = [];
  };

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
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
      (!activeStrokeRef.current && !sketchSelectionDragRef.current)
    ) {
      return;
    }

    if (sketchSelectionDragRef.current) {
      const current = canvasPointFromClient(event.clientX, event.clientY, event.pressure, event.pointerType);
      const drag = sketchSelectionDragRef.current;
      const deltaX = current.x - drag.point.x;
      const deltaY = current.y - drag.point.y;
      sketchStrokesRef.current.forEach((stroke) => {
        const original = drag.originals.get(stroke.id);
        if (!original) return;
        stroke.points = original.map((point) => ({
          ...point,
          x: Math.min(1, Math.max(0, point.x + deltaX)),
          y: Math.min(1, Math.max(0, point.y + deltaY)),
        }));
      });
      refreshSketchSelectionBox();
      redrawSketch();
      return;
    }
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    // Samsung tablet pens can report coalesced samples in a transient visual
    // viewport coordinate space. The primary pen event is stable and keeps a
    // finished stroke from stretching vertically after the next redraw.
    const nativeEvents =
      event.pointerType === "pen"
        ? [event.nativeEvent]
        : event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    const stroke = activeStrokeRef.current;
    if (!stroke) return;
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
      if (distance > 0.00008) {
        if (["line", "rectangle", "ellipse"].includes(stroke.tool)) {
          stroke.points = [stroke.points[0], point];
        } else {
          stroke.points.push(point);
        }
      }
    });

    if (stroke.points.length > firstNewIndex) {
      if (["line", "rectangle", "ellipse", "lasso"].includes(stroke.tool)) {
        redrawSketch();
      } else {
        renderStroke(context, stroke, firstNewIndex);
      }
    }
  };

  const stopDrawing = (event?: ReactPointerEvent<HTMLCanvasElement>) => {
    const releaseCanvasGeometry = () => {
      activeSketchCanvasRectRef.current = null;
      resizeSketchCanvasRef.current();
    };
    if (event) {
      sketchPointersRef.current.delete(event.pointerId);
    } else {
      sketchPointersRef.current.clear();
    }
    if (sketchPointersRef.current.size < 2) {
      sketchGestureRef.current = null;
      setSketchZoom(sketchZoomRef.current);
    }
    if (sketchSelectionDragRef.current) {
      sketchSelectionDragRef.current = null;
      activeSketchPointerRef.current = null;
      syncSketchHistory();
      redrawSketch();
      releaseCanvasGeometry();
      return;
    }
    if (
      event &&
      activeSketchPointerRef.current === event.pointerId &&
      activeStrokeRef.current
    ) {
      const stroke = activeStrokeRef.current;
      if (stroke.tool === "lasso") {
        const box = strokeBounds(stroke);
        const ids = sketchStrokesRef.current
          .filter((candidate) =>
            candidate.tool !== "eraser" &&
            candidate.points.some((point) => pointInsideBox(point, box)),
          )
          .map((candidate) => candidate.id);
        setSketchSelection(ids);
        refreshSketchSelectionBox(ids);
        activeStrokeRef.current = null;
        activeSketchPointerRef.current = null;
        redrawSketch();
        releaseCanvasGeometry();
        return;
      }
      if (
        scratchToErase &&
        ["pen", "pencil"].includes(stroke.tool) &&
        performance.now() - sketchStrokeStartedAtRef.current < 1800 &&
        isScratchGesture(stroke)
      ) {
        const box = strokeBounds(stroke);
        const before = sketchStrokesRef.current.length;
        sketchStrokesRef.current = sketchStrokesRef.current.filter((candidate) =>
          !candidate.points.some((point) => pointInsideBox(point, box)),
        );
        if (sketchStrokesRef.current.length < before) {
          activeStrokeRef.current = null;
          activeSketchPointerRef.current = null;
          syncSketchHistory();
          redrawSketch();
          setSketchMessage("Scratch-out removed the ink underneath.");
          releaseCanvasGeometry();
          return;
        }
      }
      if (
        straightenOnHold &&
        stroke.tool === "pen" &&
        stroke.points.length > 1 &&
        performance.now() - sketchStrokeStartedAtRef.current >= 520
      ) {
        stroke.points = [stroke.points[0], stroke.points[stroke.points.length - 1]];
        redrawSketch();
        const context = canvasRef.current?.getContext("2d");
        if (context) renderStroke(context, stroke);
      }
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
    releaseCanvasGeometry();
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
      if (activeSketchPointerRef.current !== null) return;
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

    resizeSketchCanvasRef.current = resizeCanvas;
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      resizeSketchCanvasRef.current = () => undefined;
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

  const renderSketchExportCanvas = (dpi = 150) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dimensions = getSketchPageDimensions(
      sketchPageSize,
      sketchPageOrientation,
    );
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = Math.max(1, Math.round(dimensions.widthIn * dpi));
    exportCanvas.height = Math.max(1, Math.round(dimensions.heightIn * dpi));
    const context = exportCanvas.getContext("2d");
    if (!context) return null;

    drawSketchPaper(context, exportCanvas.width, exportCanvas.height, sketchPaperSettings);
    const selection = sketchSelectionBoxRef.current;
    sketchSelectionBoxRef.current = null;
    redrawSketch();
    try {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
    } finally {
      sketchSelectionBoxRef.current = selection;
      redrawSketch();
    }
    return exportCanvas;
  };

  const downloadDrawing = async (format: "png" | "pdf") => {
    const exportCanvas = renderSketchExportCanvas();
    if (!exportCanvas) return;
    const cleanTitle = (sketchTitle.trim() || "aerea-note")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "aerea-note";
    try {
      if (format === "pdf") {
        const dimensions = getSketchPageDimensions(
          sketchPageSize,
          sketchPageOrientation,
        );
        const pdf = await canvasAsPdfBlob(
          exportCanvas,
          dimensions.widthIn * 72,
          dimensions.heightIn * 72,
        );
        downloadBlob(pdf, `${cleanTitle}-${sketchPageSize}.pdf`);
      } else {
        const png = await new Promise<Blob | null>((resolve) =>
          exportCanvas.toBlob(resolve, "image/png"),
        );
        if (!png) throw new Error("Could not prepare the PNG page.");
        downloadBlob(png, `${cleanTitle}-${sketchPageSize}.png`);
      }
      setSketchMessage(
        `Downloaded the complete ${sketchPageDefinition.label} page as ${format.toUpperCase()}.`,
      );
    } catch (error) {
      setSketchMessage(error instanceof Error ? error.message : "Could not download this page.");
    }
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
          pageStyle: encodeSketchPaper(sketchPaperSettings),
          dataUrl: await blobAsDataUrl(blob),
        });
      } else {
        const now = new Date().toISOString();
        writeBrowserSketches<SketchPage>([
          {
            id: crypto.randomUUID(),
            title: sketchTitle.trim() || "Untitled page",
            pageStyle: encodeSketchPaper(sketchPaperSettings),
            createdAt: now,
            updatedAt: now,
            dataUrl: await blobAsDataUrl(blob),
          },
          ...readBrowserSketches<SketchPage>(),
        ]);
      }

      await refreshSketches();
      if (activeStudyNotebookId) {
        setStudyNotebooks((current) =>
          current.map((notebook) =>
            notebook.id === activeStudyNotebookId
              ? {
                  ...notebook,
                  pageCount: notebook.pageCount + 1,
                  updatedAt: new Date().toISOString(),
                }
              : notebook,
          ),
        );
      }
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
      const paper = decodeSketchPaper(page.pageStyle);
      setPageStyle(paper.style);
      setSketchPageColor(paper.color);
      setSketchPageSize(paper.size);
      setSketchPageOrientation(paper.orientation);
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

  const refreshStudyFiles = async () => {
    const payload = isNative()
      ? await AereaStorage.listDocuments()
      : await fetch("/api/files", { cache: "no-store" }).then(async (response) => {
          if (!response.ok) throw new Error("Could not refresh your study files.");
          return (await response.json()) as { files: StudyFileItem[] };
        });
    setStudyFiles(payload.files || []);
  };

  const importStudyFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.size === 0) continue;
      if (file.size > 40 * 1024 * 1024) {
        throw new Error(`${file.name} is larger than 40 MB.`);
      }
      const lowerName = file.name.toLowerCase();
      const kind: StudyFileItem["kind"] =
        file.type === "application/pdf" || lowerName.endsWith(".pdf")
          ? "pdf"
          : file.type === "application/epub+zip" || lowerName.endsWith(".epub")
            ? "epub"
            : "file";
      const mediaType =
        file.type ||
        (kind === "pdf"
          ? "application/pdf"
          : kind === "epub"
            ? "application/epub+zip"
            : "application/octet-stream");

      if (isNative()) {
        await AereaStorage.saveDocument({
          name: file.name,
          mediaType,
          kind,
          dataUrl: await blobAsDataUrl(file),
        });
      } else {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/files", { method: "POST", body: form });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || `Could not import ${file.name}.`);
        }
      }
    }
    await refreshStudyFiles();
  };

  const deleteStudyFile = async (file: StudyFileItem) => {
    if (!window.confirm(`Delete “${file.name}” and its stored file?`)) return;
    if (isNative()) {
      await AereaStorage.deleteDocument({ id: file.id });
    } else {
      const response = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this file.");
    }
    setStudyFiles((current) => current.filter((item) => item.id !== file.id));
    setPdfAnnotations((current) => {
      const next = { ...current };
      delete next[file.id];
      return next;
    });
    setEpubReadingStates((current) => {
      const next = { ...current };
      delete next[file.id];
      return next;
    });
  };

  const studyFileSource = (file: StudyFileItem) =>
    file.dataUrl || `/api/files/${file.id}`;

  const openStudyFile = async (file: StudyFileItem) => {
    setStudyReaderMessage("");
    setActiveEpubBook(null);
    let readableFile = file;
    if (isNative() && !file.dataUrl) {
      try {
        setStudyReaderMessage("Opening your private file…");
        const payload = await AereaStorage.getDocument({ id: file.id });
        readableFile = { ...file, dataUrl: payload.dataUrl };
        setStudyReaderMessage("");
      } catch (error) {
        setStudyReaderMessage(
          error instanceof Error ? error.message : "This file could not be opened.",
        );
        return;
      }
    }
    if (readableFile.kind === "pdf") {
      setActiveStudyFile(readableFile);
      return;
    }
    if (readableFile.kind === "epub") {
      setStudyReaderMessage("Opening your EPUB…");
      try {
        const response = await fetch(studyFileSource(readableFile));
        if (!response.ok) throw new Error("This EPUB could not be read.");
        const book = await readEpub(await response.blob());
        setActiveStudyFile(readableFile);
        setActiveEpubBook(book);
        setStudyReaderMessage("");
      } catch (error) {
        setStudyReaderMessage(
          error instanceof Error ? error.message : "This EPUB could not be opened.",
        );
      }
      return;
    }
    const link = document.createElement("a");
    link.href = studyFileSource(readableFile);
    link.download = readableFile.name;
    link.target = "_blank";
    link.rel = "noopener";
    link.click();
  };

  const openStudyNotebook = (notebook: StudyNotebook) => {
    setActiveStudyNotebookId(notebook.id);
    setPageStyle(notebook.paper);
    clearCanvas(false);
    resetSketchHistory();
    setSketchTitle(`${notebook.title} · Page ${notebook.pageCount + 1}`);
    setSketchMessage("");
    setActiveTab("spaces");
    setSpace("sketchbook");
    setSketchToolbarOpen(false);
    setSketchFullscreen(true);
  };

  const importIcsCalendar = async (file: File) => {
    const text = (await file.text()).replace(/\r?\n[ \t]/g, "");
    const blocks = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    if (!blocks.length) throw new Error("No events were found in that .ics file.");

    const importedCategory =
      calendarCategories.find((category) => category.name === "Imported") || {
        id: "imported-calendar",
        name: "Imported",
        color: "cyan" as EventColor,
      };
    if (!calendarCategories.some((category) => category.name === "Imported")) {
      setCalendarCategories((current) => [...current, importedCategory]);
    }

    const unescapeIcs = (value: string) =>
      value
        .replace(/\\n/gi, "\n")
        .replace(/\\,/g, ",")
        .replace(/\\;/g, ";")
        .replace(/\\\\/g, "\\");
    const property = (block: string, name: string) => {
      const line = block.split(/\r?\n/).find((item) => item.startsWith(name));
      if (!line) return { value: "", options: "" };
      const colon = line.indexOf(":");
      return {
        options: colon >= 0 ? line.slice(name.length, colon) : "",
        value: colon >= 0 ? unescapeIcs(line.slice(colon + 1)) : "",
      };
    };
    const parsedDate = (raw: string) => {
      const digits = raw.replace(/[^0-9]/g, "");
      if (digits.length < 8) return { date: todayKey, time: "09:00" };
      return {
        date: `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`,
        time: digits.length >= 12 ? `${digits.slice(8, 10)}:${digits.slice(10, 12)}` : "09:00",
      };
    };

    const importedEvents: CalendarEvent[] = blocks.map((block) => {
      const startProperty = property(block, "DTSTART");
      const endProperty = property(block, "DTEND");
      const start = parsedDate(startProperty.value);
      const end = parsedDate(endProperty.value || startProperty.value);
      const allDay = startProperty.options.includes("VALUE=DATE") || !startProperty.value.includes("T");
      return {
        id: crypto.randomUUID(),
        date: start.date,
        endDate: end.date,
        title: property(block, "SUMMARY").value || "Imported event",
        time: start.time,
        endTime: end.time,
        allDay,
        calendar: importedCategory.name,
        color: importedCategory.color,
        reminder: "No reminder",
        repeat: "Never",
        location: property(block, "LOCATION").value,
        note: property(block, "DESCRIPTION").value,
        todos: [],
        todoStates: [],
        files: [],
      };
    });
    setCalendarEvents((current) => [...current, ...importedEvents]);
    return importedEvents.length;
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
      style={customThemeStyle}
    >
      <div className="paper-grain" aria-hidden="true" />
      <section
        ref={phoneCanvasRef}
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
          <div className="brand-wrap">
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
          </div>
          <div className="header-actions">
            <button
              className="post-it-create-button"
              type="button"
              onClick={() => openPostItEditor()}
              aria-label="Create a movable post-it"
              title="New post-it"
            >
              <span aria-hidden="true" />
            </button>
            <button
              className="calendar-button"
              onClick={openCalendarAtToday}
              aria-label="Open calendar"
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
              themeId={appTheme}
              pending={pending}
              completed={completed}
              reminders={reminders}
              saveReminder={(reminder) =>
                setReminders((current) =>
                  current.some((item) => item.id === reminder.id)
                    ? current.map((item) =>
                        item.id === reminder.id ? reminder : item,
                      )
                    : [...current, reminder],
                )
              }
              deleteReminder={(reminderId) => {
                setReminders((current) =>
                  current.filter((item) => item.id !== reminderId),
                );
                setReminderHistory((current) =>
                  Object.fromEntries(
                    Object.entries(current).map(([dateKey, ids]) => [
                      dateKey,
                      ids.filter((id) => id !== reminderId),
                    ]),
                  ),
                );
              }}
              completeReminder={(id) =>
                updateDoneIds((current) => [...current, id])
              }
              restoreReminder={(id) =>
                updateDoneIds((current) =>
                  current.filter((item) => item !== id),
                )
              }
              openCalendar={openCalendarAtToday}
              yesterdayDoneCount={yesterdayDoneCount}
              selectedDate={selectedHomeDate}
              selectDate={setSelectedHomeDate}
              todayKey={todayKey}
              weekDays={homeWeek}
              selectedDateEvents={selectedHomeEvents}
              openEventDetail={openEventDetail}
              now={scheduleNow}
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
                    {habitCompletions === habits.length
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
                      title="Library"
                      subtitle="Notes, PDFs & books"
                      color="space-lilac"
                      icon="▥"
                      note={`${studyNotes.length + studyFiles.length} saved items`}
                      onClick={() => setSpace("library")}
                    />
                    <SpaceCard
                      title="Class recordings"
                      subtitle="Recordings with notes"
                      color="space-blue"
                      icon="🎧"
                      note={`${recordings.length} recordings`}
                      onClick={() => setSpace("classes")}
                    />
                    <SpaceCard
                      title="Calendar"
                      subtitle="Everything in one rhythm"
                      color="space-peach"
                      icon="▦"
                      note="Android + aérea"
                      onClick={openCalendarAtToday}
                    />
                  </div>
                </>
              )}

              {space === "library" && (
                <StudyLibrary
                  notes={studyNotes}
                  files={studyFiles}
                  onNotesChange={setStudyNotes}
                  onOpenFile={(file) => void openStudyFile(file)}
                  onDeleteFile={(file) => void deleteStudyFile(file)}
                  onImportFiles={importStudyFiles}
                  onBack={() => setSpace("menu")}
                />
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

              {false && space === "sketchbook" && (
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
                        <p className="tiny-label">YOUR PENCIL CASE</p>
                        <div className="drawing-tool-toggle sketch-primary-tools">
                          {([
                            ["pen", "✎", "Pen"],
                            ["pencil", "⌁", "Pencil"],
                            ["highlighter", "▰", "Marker"],
                            ["eraser", "▱", "Eraser"],
                            ["lasso", "◌", "Select"],
                          ] as [SketchTool, string, string][]).map(([tool, icon, label]) => (
                            <button
                              key={tool}
                              className={penTool === tool ? "active" : ""}
                              onClick={() => setPenTool(tool)}
                              aria-pressed={penTool === tool}
                            >
                              <span>{icon}</span>{label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="tiny-label">SHAPES & NOTES</p>
                        <div className="drawing-tool-toggle sketch-shape-tools">
                          {([
                            ["line", "╱", "Line"],
                            ["rectangle", "□", "Box"],
                            ["ellipse", "○", "Circle"],
                            ["text", "T", "Text"],
                            ["tape", "▤", "Tape"],
                            ["eyedropper", "◉", "Color"],
                          ] as [SketchTool, string, string][]).map(([tool, icon, label]) => (
                            <button
                              key={tool}
                              className={penTool === tool ? "active" : ""}
                              onClick={() => setPenTool(tool)}
                              aria-pressed={penTool === tool}
                            >
                              <span>{icon}</span>{label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedSketchStrokeIds.length > 0 && (
                        <div className="sketch-selection-actions">
                          <p><strong>{selectedSketchStrokeIds.length}</strong> selected · drag to move</p>
                          <div>
                            <button onClick={duplicateSketchSelection}>Duplicate</button>
                            <button onClick={deleteSketchSelection}>Delete</button>
                            <button onClick={() => { setSketchSelection([]); redrawSketch(); }}>Done</button>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="tiny-label">QUICK CORRECTIONS</p>
                        <div className="sketch-history-controls">
                          <button
                            onClick={undoDrawing}
                            disabled={!canUndo}
                            aria-label="Undo last stroke"
                          >
                            <span>↶</span> Undo
                          </button>
                          <button
                            onClick={redoDrawing}
                            disabled={!canRedo}
                            aria-label="Redo stroke"
                          >
                            <span>↷</span> Redo
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="tiny-label">SMART PAPER</p>
                        <div className="sketch-smart-tools">
                          <button className={straightenOnHold ? "active" : ""} onClick={() => setStraightenOnHold((value) => !value)} aria-pressed={straightenOnHold}>
                            <span>╱</span> Hold for straight line
                          </button>
                          <button onClick={() => sketchImageInputRef.current?.click()}>
                            <span>▧</span> Attach an image
                          </button>
                          <button className={scratchToErase ? "active" : ""} onClick={() => setScratchToErase((value) => !value)} aria-pressed={scratchToErase}>
                            <span>⌁</span> Scratch-out gesture
                          </button>
                          <input ref={sketchImageInputRef} type="file" accept="image/*" onChange={importSketchImage} hidden />
                        </div>
                        <small className="smart-paper-note">Hold any pen stroke to straighten it. Scribble quickly over ink to erase it. Use Select to circle, move, duplicate, or delete strokes. Tap Tape to reveal it.</small>
                      </div>
                      <div>
                        <p className="tiny-label">SKETCHBOOK EXTRAS</p>
                        <div className="sketch-smart-tools">
                          <button
                            type="button"
                            onClick={() => {
                              setSketchFullscreen(false);
                              setSketchToolbarOpen(false);
                              setActiveTab("focus");
                              setSpace("menu");
                            }}
                          >
                            <span>◷</span>
                            <span className="sketch-extra-copy">
                              <strong>Focus clock</strong>
                              <small>Start a quiet study session</small>
                            </span>
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
                            ["cornell", "▥", "Cornell"],
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
                        <p className="tiny-label">PAGE COLOR</p>
                        <div className="page-color-grid">
                          {SKETCH_PAGE_COLORS.map((color) => (
                            <button
                              key={color.value}
                              className={sketchPageColor === color.value ? "active" : ""}
                              style={{ backgroundColor: color.value }}
                              onClick={() => setSketchPageColor(color.value)}
                              aria-label={`Use ${color.label} paper`}
                              title={color.label}
                            />
                          ))}
                          <label
                            className={
                              SKETCH_PAGE_COLORS.some((color) => color.value === sketchPageColor)
                                ? "page-color-custom"
                                : "page-color-custom active"
                            }
                            title="Custom paper color"
                          >
                            <input
                              type="color"
                              value={sketchPageColor}
                              onChange={(event) => setSketchPageColor(event.target.value)}
                              aria-label="Choose a custom paper color"
                            />
                            <span>＋</span>
                          </label>
                        </div>
                      </div>
                      <label className="sketch-page-size">
                        <span className="tiny-label">PAGE SIZE</span>
                        <select
                          value={sketchPageSize}
                          onChange={(event) =>
                            setSketchPageSize(event.target.value as SketchPageSizeId)
                          }
                        >
                          {SKETCH_PAGE_SIZES.map((page) => (
                            <option key={page.id} value={page.id}>
                              {page.label} · {page.measurement}
                            </option>
                          ))}
                        </select>
                        <small>
                          {sketchPageDefinition.measurement} · preserved in PNG and PDF
                        </small>
                      </label>
                      <div>
                        <p className="tiny-label">ORIENTATION</p>
                        <div className="page-orientation-toggle">
                          {([
                            ["portrait", "▯", "Portrait"],
                            ["landscape", "▭", "Landscape"],
                          ] as [SketchPageOrientation, string, string][]).map(
                            ([orientation, icon, label]) => (
                              <button
                                key={orientation}
                                className={
                                  sketchPageOrientation === orientation ? "active" : ""
                                }
                                onClick={() => setSketchPageOrientation(orientation)}
                                aria-pressed={sketchPageOrientation === orientation}
                              >
                                <span>{icon}</span>
                                {label}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="tiny-label">PEN COLOR</p>
                        <div className="pen-colors">
                          {[
                            "#23384b",
                            "#3c87c7",
                            "#6fc9e8",
                            "#65a84e",
                            "#a9d59c",
                            "#f4c74f",
                            "#ff9b7a",
                            "#ef86ad",
                            "#9b7bc7",
                            "#777b82",
                          ].map(
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
                          <label className="pen-color-custom" title="Custom ink color">
                            <input
                              type="color"
                              value={penColor}
                              onChange={(event) => setPenColor(event.target.value)}
                              aria-label="Choose a custom ink color"
                            />
                            <span>＋</span>
                          </label>
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
                      <div className="sketch-export-card">
                        <p className="tiny-label">DOWNLOAD COMPLETE PAGE</p>
                        <div>
                          <button
                            className="download-page"
                            onClick={() => void downloadDrawing("png")}
                          >
                            <span>▧</span> PNG
                          </button>
                          <button
                            className="download-page"
                            onClick={() => void downloadDrawing("pdf")}
                          >
                            <span>▤</span> PDF
                          </button>
                        </div>
                        <small>Paper color, pattern, proportions, and every mark are included.</small>
                      </div>
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
                            disabled={!canUndo}
                            aria-label="Undo last stroke"
                          >
                            ↶
                          </button>
                          <button
                            onClick={redoDrawing}
                            disabled={!canRedo}
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
                          <span className="sketch-page-meta">
                            {sketchPageDefinition.label} · {sketchPageDefinition.measurement}
                          </span>
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
                      {sketchTextEditor && (
                        <div className="sketch-text-sheet" role="dialog" aria-label="Add text to the page">
                          <div>
                            <p className="tiny-label">TEXT NOTE</p>
                            <strong>Place a neat text box</strong>
                          </div>
                          <textarea
                            autoFocus
                            value={sketchTextEditor!.text}
                            onChange={(event) => setSketchTextEditor((current) => current ? { ...current, text: event.target.value } : current)}
                            placeholder="Type something for this spot…"
                          />
                          <footer>
                            <button onClick={() => setSketchTextEditor(null)}>Cancel</button>
                            <button
                              disabled={!sketchTextEditor!.text.trim()}
                              onClick={() => {
                                sketchStrokesRef.current.push({
                                  id: crypto.randomUUID(),
                                  tool: "text",
                                  color: penColor,
                                  size: penSize,
                                  points: [sketchTextEditor!.point],
                                  text: sketchTextEditor!.text.trim(),
                                });
                                sketchRedoRef.current = [];
                                setSketchTextEditor(null);
                                syncSketchHistory();
                                redrawSketch();
                              }}
                            >
                              Add to page
                            </button>
                          </footer>
                        </div>
                      )}
                      <div
                        className="sketch-viewport"
                        ref={sketchViewportRef}
                      >
                        <div
                          className="sketch-zoom-stage"
                          ref={sketchStageRef}
                          style={
                            {
                              ...sketchPaperStyle,
                              "--sketch-zoom": sketchZoom,
                              "--sketch-stage-size": `${sketchZoom * 100}%`,
                              "--sketch-inverse-zoom": 1 / sketchZoom,
                            } as CSSProperties
                          }
                        >
                          <div
                            className={`drawing-page ${pageStyle}`}
                            style={sketchPaperStyle}
                            data-page-size={sketchPageSize}
                            data-orientation={sketchPageOrientation}
                          >
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
                        {savedPages.map((page) => {
                          const paper = decodeSketchPaper(page.pageStyle);
                          const size = getSketchPageSize(paper.size);
                          const dimensions = getSketchPageDimensions(
                            paper.size,
                            paper.orientation,
                          );
                          const ink = sketchPaperInkColors(paper.color);
                          const paperStyle = {
                            "--sketch-page-aspect": `${dimensions.widthIn} / ${dimensions.heightIn}`,
                            "--sketch-paper-color": paper.color,
                            "--sketch-rule-color": ink.rule,
                            "--sketch-margin-color": ink.margin,
                          } as CSSProperties;
                          return (
                            <article key={page.id}>
                              <button
                                className={`sketch-thumb ${paper.style}`}
                                style={paperStyle}
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
                                  <small>{size.label} · {paper.style} · {paper.orientation}</small>
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
                          );
                        })}
                      </div>
                    )}
                  </section>
                </section>
              )}
            </section>
          )}
        </div>

        {!sketchFullscreen && visiblePostIts.length > 0 && (
          <div
            className="post-it-layer"
            aria-label={`Your movable post-its on ${currentPostItPage}`}
          >
            {visiblePostIts.map((postIt) => (
              <article
                className={`movable-post-it ${postIt.color}`}
                key={postIt.id}
                style={
                  {
                    "--post-it-x": `${postIt.x}%`,
                    "--post-it-y": `${postIt.y}%`,
                    "--post-it-rotation": `${postIt.rotation}deg`,
                  } as CSSProperties
                }
                onPointerDown={(event) => startPostItDrag(event, postIt)}
                onPointerMove={movePostIt}
                onPointerUp={finishPostItDrag}
                onPointerCancel={finishPostItDrag}
                onContextMenu={(event) => event.preventDefault()}
                role="button"
                tabIndex={0}
                aria-label="Movable post-it. Hold to edit."
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPostItEditor(postIt);
                  }
                }}
              >
                <span className="post-it-tape" aria-hidden="true" />
                <p>{postIt.text}</p>
              </article>
            ))}
          </div>
        )}

        {!sketchFullscreen && <nav className="bottom-nav" aria-label="Primary navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={[
                "nav-item",
                activeTab === tab.id ? "active" : "",
                tab.id === "add" ? "nav-add-event" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => {
                if (tab.id === "add") {
                  openNewEventFromNavigation();
                  return;
                }
                changeTab(tab.id);
              }}
            >
              <span>{tab.icon}</span>
              <small>{tab.label}</small>
            </button>
          ))}
        </nav>}
      </section>

      {activeStudyFile?.kind === "pdf" && (
        <PdfStudyReader
          fileId={activeStudyFile.id}
          fileName={activeStudyFile.name}
          source={studyFileSource(activeStudyFile)}
          annotations={pdfAnnotations[activeStudyFile.id] || []}
          onAnnotationsChange={(strokes) =>
            setPdfAnnotations((current) => ({
              ...current,
              [activeStudyFile.id]: strokes,
            }))
          }
          onClose={() => setActiveStudyFile(null)}
        />
      )}

      {activeStudyFile?.kind === "epub" && activeEpubBook && (
        <EpubStudyReader
          fileName={activeStudyFile.name}
          book={activeEpubBook}
          readingState={
            epubReadingStates[activeStudyFile.id] || {
              chapter: 0,
              fontSize: 19,
              lineHeight: 1.7,
              bookmarks: [],
              chapterNotes: {},
              highlights: [],
            }
          }
          onReadingStateChange={(readingState) =>
            setEpubReadingStates((current) => ({
              ...current,
              [activeStudyFile.id]: readingState,
            }))
          }
          onClose={() => {
            setActiveStudyFile(null);
            setActiveEpubBook(null);
          }}
        />
      )}

      {studyReaderMessage && (
        <button
          type="button"
          className="study-reader-message"
          onClick={() => setStudyReaderMessage("")}
        >
          <span>{studyReaderMessage}</span><b>×</b>
        </button>
      )}

      {calendarOpen && (
        <div
          className={[
            "modal-backdrop",
            calendarScheduleOpen && !eventEditorOpen ? "agenda-overlay-backdrop" : "",
            calendarExpanded && !eventEditorOpen ? "extended-month-backdrop" : "",
          ].filter(Boolean).join(" ")}
          role="presentation"
        >
          <section
            className={[
              "calendar-modal",
              eventEditorOpen ? "calendar-event-mode" : "",
              eventEditorOpen ? "event-editor-themed" : "",
              calendarScheduleOpen && !eventEditorOpen ? "calendar-expanded" : "",
              calendarScheduleOpen && !eventEditorOpen ? "agenda-v2-modal" : "",
              calendarExpanded && !eventEditorOpen ? "calendar-extended-month" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              eventEditorOpen
                ? ({
                    "--event-editor-accent":
                      eventColors.find(
                        (color) => color.value === eventDraft.color,
                      )?.hex ?? "#ae96d8",
                  } as CSSProperties)
                : undefined
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
                    disabled={!eventDraft.title.trim() || !eventDraftRangeIsValid}
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
                      onChange={(event) => {
                        setEventTemplateSuggestionsDismissed(false);
                        updateEventDraft("title", event.target.value);
                      }}
                      placeholder="What are you planning?"
                    />
                  </label>

                  {eventTitleSuggestions.length > 0 && (
                    <section
                      className="event-title-suggestions"
                      aria-label="Existing events with a similar name"
                    >
                      <p>USE AN EXISTING PLAN</p>
                      {eventTitleSuggestions.map((suggestion) => (
                        <button
                          type="button"
                          key={suggestion.id}
                          onClick={() => applyEventTemplate(suggestion)}
                          aria-label={`Copy settings from ${suggestion.title}`}
                        >
                          <span className="event-template-history" aria-hidden="true">
                            ↶
                          </span>
                          <span>
                            <strong>{suggestion.title}</strong>
                            <small>
                              {suggestion.calendar ?? "Personal"} ·{" "}
                              {eventStartTimeLabel(suggestion)}
                              {(suggestion.repeat ?? "Never") !== "Never"
                                ? ` · ${eventRepeatLabel(suggestion)}`
                                : ""}
                            </small>
                          </span>
                          <em>Use</em>
                        </button>
                      ))}
                    </section>
                  )}

                  <section className="event-editor-card">
                    <label className="event-row">
                      <span className="event-row-icon">▦</span>
                      <span>
                        <small>Calendar</small>
                        <select
                          value={eventDraft.calendar}
                          onChange={(event) => {
                            const category = calendarCategories.find(
                              (item) => item.name === event.target.value,
                            );
                            setEventDraft((current) => ({
                              ...current,
                              calendar: event.target.value,
                              color: category?.color ?? current.color,
                            }));
                          }}
                        >
                          {calendarCategories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </span>
                    </label>

                    <button
                      className="event-category-manage-button"
                      type="button"
                      onClick={() => openCalendarCategoryEditor()}
                    >
                      Edit event types
                    </button>

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
                          aria-invalid={!eventDraftRangeIsValid}
                          aria-describedby={
                            eventDraftRangeIsValid ? undefined : "event-date-error"
                          }
                          onChange={(event) =>
                            updateEventDraft("endDate", event.target.value)
                          }
                        />
                        {!eventDraft.allDay && (
                          <input
                            type="time"
                            value={eventDraft.endTime}
                            aria-invalid={!eventDraftRangeIsValid}
                            aria-describedby={
                              eventDraftRangeIsValid ? undefined : "event-date-error"
                            }
                            onChange={(event) =>
                              updateEventDraft("endTime", event.target.value)
                            }
                          />
                        )}
                      </label>
                    </div>
                    {!eventDraftRangeIsValid && (
                      <p className="event-date-error" id="event-date-error" role="alert">
                        End must be later than start.
                      </p>
                    )}

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
                      <span>⌕ Files</span>
                      <input
                        type="file"
                        multiple
                        onChange={(event) =>
                          updateEventDraft(
                            "files",
                            Array.from(event.target.files ?? []).map(
                              (file) => file.name,
                            ),
                          )
                        }
                      />
                      {(eventDraft.files ?? []).length > 0 && (
                        <small>{eventDraft.files?.join(" · ")}</small>
                      )}
                    </label>
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
                {calendarScheduleOpen && (
                  <>
                    <div className="storybook-scene agenda-v3-scene" data-visual={activeTheme.id} aria-hidden="true">
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
                          <img className="theme-scene-accent accent-1" src={activeTheme.accents[0]} alt="" />
                          <img className="theme-scene-accent accent-2" src={activeTheme.accents[1]} alt="" />
                        </>
                      )}
                    </div>
                    <header className="topbar agenda-v2-homebar">
                      <div className="brand-wrap">
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
                      </div>
                      <div className="header-actions">
                        <button
                          className="calendar-button"
                          type="button"
                          onClick={() => {
                            setMonthPickerOpen(false);
                            setCalendarScheduleOpen(false);
                          }}
                          aria-label="Back to compact calendar"
                        >
                          <span className="calendar-glyph" aria-hidden="true" />
                          Calendar
                        </button>
                        <button
                          className="avatar-button"
                          type="button"
                          onClick={() => setSettingsOpen(true)}
                          aria-label="Open appearance settings"
                        >
                          <span>⚙</span>
                        </button>
                      </div>
                    </header>
                  </>
                )}
                {calendarExpanded && (
                  <section
                    className="extended-calendar-view"
                    aria-label="Extended monthly calendar"
                  >
                    <header className="extended-calendar-header">
                      <div className="extended-calendar-heading-copy">
                        <div className="extended-calendar-month">
                          <button
                            className="extended-calendar-title"
                            type="button"
                            onClick={() => setMonthPickerOpen((open) => !open)}
                            aria-expanded={monthPickerOpen}
                          >
                            {viewMonth.toLocaleDateString("en", {
                              month: "long",
                              year: "numeric",
                            })}
                            <span className="extended-month-chevron" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <nav
                        className="extended-calendar-header-actions"
                        aria-label="Calendar tools"
                      >
                        <button
                          className="extended-schedule-button"
                          type="button"
                          onClick={() => {
                            setCalendarExpanded(false);
                            setMonthPickerOpen(false);
                            setCalendarScheduleOpen(true);
                          }}
                          aria-label="Open day schedule"
                          title="Open day schedule"
                        >
                          <span className="extended-schedule-glyph" aria-hidden="true">☆</span>
                        </button>
                        <button
                          className="extended-compact-button"
                          type="button"
                          onClick={() => {
                            setCalendarExpanded(false);
                            setMonthPickerOpen(false);
                          }}
                          aria-label="Back to compact month"
                          title="Back to compact month"
                        >
                          <span className="extended-compact-glyph" aria-hidden="true">
                            <i />
                            <i />
                          </span>
                        </button>
                      </nav>
                    </header>

                    {monthPickerOpen && (
                      <div className="extended-calendar-picker" role="dialog" aria-label="Choose month">
                        {Array.from({ length: 12 }, (_, month) => (
                          <button
                            type="button"
                            key={month}
                            className={month === calendarMonth ? "active" : ""}
                            onClick={() => {
                              setViewMonth(new Date(calendarYear, month, 1));
                              setMonthPickerOpen(false);
                            }}
                          >
                            {new Date(calendarYear, month, 1).toLocaleDateString("en", {
                              month: "short",
                            })}
                          </button>
                        ))}
                      </div>
                    )}

                    <section className="extended-calendar-filters" aria-label="Visible event types">
                      <div className="extended-filter-list">
                        {extendedCalendarSources.map((source, index) => {
                          const hidden = hiddenCalendarSources.includes(source);
                          return (
                            <button
                              type="button"
                              key={source}
                              className={`source-${index % 4} ${hidden ? "muted" : "active"}`}
                              onClick={() =>
                                setHiddenCalendarSources((current) =>
                                  current.includes(source)
                                    ? current.filter((item) => item !== source)
                                    : [...current, source],
                                )
                              }
                              aria-pressed={!hidden}
                            >
                              <span>{hidden ? "" : "✓"}</span>
                              {source}
                            </button>
                          );
                        })}
                        {hiddenCalendarSources.length > 0 && (
                          <button
                            className="extended-filter-show-all"
                            type="button"
                            onClick={() => setHiddenCalendarSources([])}
                          >
                            Show all
                          </button>
                        )}
                      </div>
                      <button
                        className="extended-filter-menu"
                        type="button"
                        onClick={() => openCalendarCategoryEditor()}
                        aria-label="Edit event types"
                        title="Edit event types"
                      >
                        <span aria-hidden="true" />
                      </button>
                    </section>

                    <div
                      key={`${calendarYear}-${calendarMonth}`}
                      className={[
                        "extended-month-grid",
                        calendarSlideDirection
                          ? `calendar-slide-${calendarSlideDirection}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={
                        {
                          "--extended-calendar-weeks": extendedCalendarWeekCount,
                        } as CSSProperties
                      }
                      onAnimationEnd={() => setCalendarSlideDirection(null)}
                      onTouchStart={startCalendarSwipe}
                      onTouchEnd={finishCalendarSwipe}
                      aria-label="Extended calendar month. Swipe left or right to change month."
                    >
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
                        <strong key={weekday}>{weekday}</strong>
                      ))}
                      {extendedCalendarDays.map((calendarDay) => {
                        const { date, currentMonth, previousMonth, nextMonth } = calendarDay;
                        const dayKey = localDateKey(date);
                        const dayEvents = calendarEvents
                          .filter(
                            (calendarEvent) =>
                              eventOccursOn(calendarEvent, dayKey) &&
                              !hiddenCalendarSources.includes(
                                calendarEvent.calendar || "Personal",
                              ),
                          )
                          .sort((first, second) => first.time.localeCompare(second.time));
                        return (
                          <div
                            className={[
                              "extended-calendar-cell",
                              currentMonth ? "" : "outside-month",
                              previousMonth ? "previous-month month-spillover" : "",
                              nextMonth ? "month-spillover" : "",
                              selectedCalendarDate === dayKey ? "selected" : "",
                              date.getDay() === 0 || date.getDay() === 6 ? "weekend" : "",
                              date.getDay() === 0 ? "sunday" : "",
                              date.getDay() === 6 ? "saturday" : "",
                              dayKey === todayKey ? "today" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            key={dayKey}
                            role="button"
                            tabIndex={0}
                            aria-label={`${readableDate(dayKey)}, ${dayEvents.length} events`}
                            onPointerDown={(event) => beginCalendarLongPress(dayKey, event)}
                            onPointerMove={moveCalendarLongPress}
                            onPointerUp={cancelCalendarLongPress}
                            onPointerCancel={cancelCalendarLongPress}
                            onContextMenu={(event) => event.preventDefault()}
                            onClick={() => setSelectedCalendarDate(dayKey)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                setSelectedCalendarDate(dayKey);
                              }
                            }}
                          >
                            <span className="extended-calendar-date">{date.getDate()}</span>
                            <div className="extended-calendar-events">
                              {dayEvents.slice(0, 3).map((calendarEvent) => (
                                <button
                                  type="button"
                                  className={`extended-event-pill ${calendarEvent.color}`}
                                  key={`${calendarEvent.id}-${dayKey}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedCalendarDate(dayKey);
                                    openEventDetail(
                                      calendarEventAtOccurrence(calendarEvent, dayKey),
                                    );
                                  }}
                                  title={`${calendarEvent.title} · ${eventStartTimeLabel(calendarEvent)}`}
                                >
                                  <span>
                                    <strong>{calendarEvent.title}</strong>
                                  </span>
                                </button>
                              ))}
                              {dayEvents.length > 3 && (
                                <small>+{dayEvents.length - 3}</small>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <nav className="extended-calendar-nav" aria-label="Primary navigation">
                      {extendedCalendarTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          className={tab.id === activeTab ? "active" : ""}
                          onClick={() => {
                            setCalendarExpanded(false);
                            setCalendarOpen(false);
                            changeTab(tab.id);
                          }}
                        >
                          <span aria-hidden="true">{tab.icon}</span>
                          <small>{tab.label}</small>
                        </button>
                      ))}
                    </nav>
                  </section>
                )}
                {!calendarExpanded && !calendarScheduleOpen && (
                  <div className="modal-top">
                    <div className="calendar-month-heading">
                      <button onClick={() => shiftCalendarMonth(-1)} aria-label="Previous month">←</button>
                      <div>
                        <p className="tiny-label">YOUR WHOLE RHYTHM</p>
                        <button
                          type="button"
                          className="calendar-date-menu-trigger"
                          onClick={() => setMonthPickerOpen((open) => !open)}
                          aria-expanded={monthPickerOpen}
                          aria-label="Choose month and year"
                        >
                          {viewMonth.toLocaleDateString("en", {
                            month: "long",
                            year: "numeric",
                          })}
                        </button>
                      </div>
                      <button onClick={() => shiftCalendarMonth(1)} aria-label="Next month">→</button>
                    </div>
                    <button
                      onClick={() => {
                        setMonthPickerOpen(false);
                        setCalendarOpen(false);
                      }}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                )}
                {monthPickerOpen && !calendarExpanded && !calendarScheduleOpen && (
                  <div className="calendar-date-menu" role="dialog" aria-label="Choose month and year">
                    <div className="calendar-date-menu-columns">
                      <div className="calendar-date-menu-list" aria-label="Months">
                        {Array.from({ length: 12 }, (_, month) => (
                          <button
                            key={month}
                            className={month === calendarMonth ? "active" : ""}
                            aria-current={month === calendarMonth ? "date" : undefined}
                            onClick={() => setViewMonth(new Date(calendarYear, month, 1))}
                          >
                            {new Date(2026, month, 1).toLocaleDateString("en", { month: "long" })}
                          </button>
                        ))}
                      </div>
                      <div className="calendar-date-menu-list years" aria-label="Years">
                        {Array.from({ length: 11 }, (_, index) => calendarYear - 5 + index).map((year) => (
                          <button
                            key={year}
                            className={year === calendarYear ? "active" : ""}
                            aria-current={year === calendarYear ? "date" : undefined}
                            onClick={() => setViewMonth(new Date(year, calendarMonth, 1))}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="calendar-date-menu-done" onClick={() => setMonthPickerOpen(false)}>Done</button>
                  </div>
                )}
                <div className="calendar-sources">
                  <span>
                    <i className="source-android" /> Android calendar
                  </span>
                  <span>
                    <i className="source-aerea" /> aérea
                  </span>
                  <span className="mood-source">◡‿◡ mood stickers</span>
                  <span className="swipe-source">↔ swipe months</span>
                  {!calendarExpanded && !calendarScheduleOpen && (
                    <button
                      className="calendar-search-trigger"
                      type="button"
                      onClick={() => {
                        setMonthPickerOpen(false);
                        setCalendarSearchOpen(true);
                      }}
                      aria-label="Search calendar events"
                      title="Search events"
                    >
                      <span className="calendar-search-glyph" aria-hidden="true" />
                    </button>
                  )}
                  {!calendarExpanded && !calendarScheduleOpen && (
                    <button
                      className="calendar-view-toggle"
                      type="button"
                      aria-pressed={false}
                      aria-label="Open schedule"
                      title="Open schedule"
                      onClick={() => {
                        const visibleDates = scheduleDatesFor(selectedCalendarDate, 7);
                        if (!visibleDates.some((date) => localDateKey(date) === selectedCalendarDate)) {
                          setSelectedCalendarDate(localDateKey(visibleDates[0]));
                        }
                        setCalendarExpanded(false);
                        setCalendarScheduleOpen(true);
                      }}
                    >
                      <span aria-hidden="true">☷</span>
                    </button>
                  )}
                  {!calendarExpanded && !calendarScheduleOpen && (
                    <button
                      className="calendar-view-toggle calendar-month-view-toggle"
                      type="button"
                      aria-pressed={false}
                      aria-label="Open extended monthly calendar"
                      title="Extended calendar"
                      onClick={() => {
                        setCalendarScheduleOpen(false);
                        setCalendarExpanded(true);
                      }}
                    >
                      <span aria-hidden="true">▦</span>
                    </button>
                  )}
                </div>
                {calendarSearchOpen && !calendarExpanded && !calendarScheduleOpen && (
                  <section
                    className="calendar-search-screen"
                    aria-label="Search calendar events"
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setCalendarSearchOpen(false);
                        setCalendarSearchQuery("");
                      }
                    }}
                  >
                    <header className="calendar-search-header">
                      <button
                        className="calendar-search-back"
                        type="button"
                        onClick={() => {
                          setCalendarSearchOpen(false);
                          setCalendarSearchQuery("");
                        }}
                        aria-label="Back to compact calendar"
                      >
                        ←
                      </button>
                      <div className="calendar-search-field">
                        <span
                          className="calendar-search-glyph"
                          aria-hidden="true"
                        />
                        <input
                          autoFocus
                          type="search"
                          value={calendarSearchQuery}
                          onChange={(event) =>
                            setCalendarSearchQuery(event.target.value)
                          }
                          placeholder="Search events"
                          aria-label="Search by event, class, place, or note"
                        />
                        {calendarSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCalendarSearchQuery("")}
                            aria-label="Clear search"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </header>

                    <div className="calendar-search-summary" aria-live="polite">
                      <span>
                        {calendarSearchQuery.trim()
                          ? calendarSearchResults.length === 240
                            ? "240+ results"
                            : `${calendarSearchResults.length} ${calendarSearchResults.length === 1 ? "result" : "results"}`
                          : "Search your whole calendar"}
                      </span>
                      {calendarSearchQuery.trim() && (
                        <small>title · calendar · notes · place</small>
                      )}
                    </div>

                    <div className="calendar-search-results">
                      {!calendarSearchQuery.trim() ? (
                        <div className="calendar-search-empty">
                          <span className="calendar-search-empty-icon" aria-hidden="true">
                            <i className="calendar-search-glyph" />
                          </span>
                          <strong>Find any little plan</strong>
                          <p>
                            Search a title, class, place, description, checklist,
                            or attached file.
                          </p>
                        </div>
                      ) : calendarSearchGroups.length === 0 ? (
                        <div className="calendar-search-empty no-match">
                          <span aria-hidden="true">☁</span>
                          <strong>No events found</strong>
                          <p>Try another word or check the spelling.</p>
                        </div>
                      ) : (
                        calendarSearchGroups.map((group) => (
                          <section
                            className="calendar-search-group"
                            key={group.date}
                            aria-label={`Events for ${readableDate(group.date)}`}
                          >
                            <header>
                              <strong>
                                {dateFromKey(group.date).toLocaleDateString("en", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </strong>
                              <span>
                                {group.occurrences.length}{" "}
                                {group.occurrences.length === 1 ? "event" : "events"}
                              </span>
                            </header>
                            <div>
                              {group.occurrences.map(({ event, date }) => (
                                <button
                                  className="calendar-search-result"
                                  type="button"
                                  key={`${event.id}-${date}`}
                                  style={
                                    {
                                      "--search-accent":
                                        eventColors.find(
                                          (color) => color.value === event.color,
                                        )?.hex ?? "#ae96d8",
                                    } as CSSProperties
                                  }
                                  onClick={() =>
                                    openEventDetail(
                                      calendarEventAtOccurrence(event, date),
                                    )
                                  }
                                >
                                  <i aria-hidden="true" />
                                  <span className="calendar-search-result-copy">
                                    <span>
                                      <strong>{event.title}</strong>
                                      {event.calendar && (
                                        <small> — {event.calendar}</small>
                                      )}
                                    </span>
                                    <time>
                                      {eventStartTimeLabel(event)}
                                      {event.endTime
                                        ? ` – ${eventEndTimeLabel(event)}`
                                        : ""}
                                    </time>
                                    {event.note?.trim() && (
                                      <em>{notePreview(event.note, 92)}</em>
                                    )}
                                  </span>
                                  <b aria-hidden="true">›</b>
                                </button>
                              ))}
                            </div>
                          </section>
                        ))
                      )}
                    </div>

                    <footer className="calendar-search-footer">
                      ♡ Tap a result to open its full note
                    </footer>
                  </section>
                )}
                {calendarScheduleOpen && (
                  <div className="agenda-v2">
                    <div
                      className="agenda-v2-week"
                      onTouchStart={startScheduleSwipe}
                      onTouchEnd={finishScheduleSwipe}
                      aria-label="Week. Swipe left or right to change week."
                    >
                      <div
                        key={localDateKey(scheduleDays[0])}
                        className={[
                          "agenda-v2-week-content",
                          scheduleSlideDirection
                            ? `schedule-slide-${scheduleSlideDirection}`
                            : "",
                        ].filter(Boolean).join(" ")}
                        onAnimationEnd={() => setScheduleSlideDirection(null)}
                      >
                        <button
                          className="agenda-v2-week-arrow"
                          type="button"
                          onClick={() => shiftScheduleWeek(-1)}
                          aria-label="Previous week"
                        >
                          ‹
                        </button>
                        <div className="agenda-v2-days" aria-label="Choose a day">
                          {scheduleDays.map((date) => {
                            const dateKey = localDateKey(date);
                            return (
                              <button
                                key={dateKey}
                                className={[
                                  selectedCalendarDate === dateKey ? "selected" : "",
                                  todayKey === dateKey ? "today" : "",
                                ].filter(Boolean).join(" ")}
                                onClick={() => setSelectedCalendarDate(dateKey)}
                                aria-pressed={selectedCalendarDate === dateKey}
                                aria-current={todayKey === dateKey ? "date" : undefined}
                              >
                                <small>{date.toLocaleDateString("en", { weekday: "short" })}</small>
                                <strong>{date.getDate()}</strong>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          className="agenda-v2-week-arrow"
                          type="button"
                          onClick={() => shiftScheduleWeek(1)}
                          aria-label="Next week"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    <div className="section-heading agenda-v2-section-heading">
                      <div className="agenda-v2-heading-copy">
                        <p className="tiny-label">YOUR RHYTHM</p>
                        <h3>
                          <button
                            className="agenda-v2-heading-trigger"
                            type="button"
                            onClick={() => setScheduleFocusOpen(true)}
                            aria-expanded={scheduleFocusOpen}
                            aria-label={`Open ${selectedScheduleIsToday ? "today’s" : `${selectedScheduleWeekday}’s`} schedule full screen`}
                          >
                            {selectedScheduleIsToday
                              ? "Today’s schedule"
                              : `${selectedScheduleWeekday}’s schedule`}
                          </button>
                        </h3>
                        <span className="agenda-v2-plan-count">
                          {selectedScheduleAgendaEvents.length === 0
                            ? "A clear day"
                            : `${selectedScheduleAgendaEvents.length} ${selectedScheduleAgendaEvents.length === 1 ? "plan" : "plans"}`}
                        </span>
                      </div>
                      <div className="agenda-v2-heading-actions">
                        {!selectedScheduleIsToday && (
                          <button
                            className="text-button agenda-v2-return-today"
                            type="button"
                            onClick={goToScheduleToday}
                          >
                            Return to today
                          </button>
                        )}
                        <button
                          className="agenda-v2-quick-add"
                          type="button"
                          onClick={() => openNewEventAtMinute(selectedCalendarDate, scheduleAddMinute)}
                          aria-label={`Add an event to ${readableDate(selectedCalendarDate)}`}
                        >
                          <span aria-hidden="true">＋</span>
                          <small>Add</small>
                        </button>
                      </div>
                    </div>

                    {scheduleFocusOpen && (
                      <div
                        className="agenda-v2-focus-backdrop"
                        onClick={() => setScheduleFocusOpen(false)}
                        aria-hidden="true"
                      />
                    )}
                    <div
                      className={[
                        selectedScheduleAgendaEvents.length
                          ? `agenda-v2-board agenda-v2-timeline-board ${scheduleHasAllDayEvents ? "has-all-day" : ""}`
                          : "agenda-v2-board agenda-v2-list-board is-empty",
                        scheduleFocusOpen ? "is-focus-open" : "",
                      ].filter(Boolean).join(" ")}
                      role={scheduleFocusOpen ? "dialog" : undefined}
                      aria-modal={scheduleFocusOpen ? true : undefined}
                      aria-label={scheduleFocusOpen ? `${selectedScheduleWeekday} schedule` : undefined}
                    >
                      {selectedScheduleAgendaEvents.length === 0 ? (
                        <div className="agenda-v2-empty-state">
                          <div className="agenda-v2-empty-art" aria-hidden="true">
                            <span>✦</span>
                            <strong>♡</strong>
                            <i>✧</i>
                          </div>
                          <p>NOTHING PLANNED YET</p>
                          <h4>Your day is wide open.</h4>
                          <span>Add something when you&apos;re ready, or keep this little pocket of rest.</span>
                        </div>
                      ) : (
                        <>
                          {scheduleHasAllDayEvents && (
                            <>
                              <span className="agenda-v2-all-day-label">ALL DAY</span>
                              <div className="agenda-v2-all-day-list">
                                <div className="selected">
                                  {selectedScheduleAllDayEvents.slice(0, 2).map((event) => (
                                    <button
                                      key={event.id}
                                      className={`agenda-v2-all-day-event ${event.color}`}
                                      onClick={() => openEventDetail(event)}
                                    >
                                      {event.title}
                                    </button>
                                  ))}
                                  {selectedScheduleAllDayEvents.length > 2 && (
                                    <small>+{selectedScheduleAllDayEvents.length - 2}</small>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          <div className="agenda-v2-scroll" ref={scheduleTimelineScrollRef}>
                            <div className="agenda-v2-timeline">
                              <div className="agenda-v2-day-periods" aria-hidden="true">
                                <span className="night"><small>Night</small></span>
                                <span className="morning"><small>Morning</small></span>
                                <span className="afternoon"><small>Afternoon</small></span>
                                <span className="evening"><small>Evening</small></span>
                              </div>
                              <div className="agenda-v2-time-grid" aria-hidden="true">
                                <span className="agenda-v2-time-axis" />
                                {scheduleMarks.map((minute) => {
                                  const hour = Math.floor(minute / 60) % 24;
                                  const minutes = minute % 60;
                                  const isHour = minutes === 0;
                                  return (
                                    <span
                                      key={minute}
                                      className={isHour ? "hour" : "half-hour"}
                                      style={{ top: `${((minute - SCHEDULE_START_MINUTE) / SCHEDULE_TOTAL_MINUTES) * 100}%` }}
                                    >
                                      <span className="agenda-v2-time-label">
                                        <b>{String(hour % 12 || 12).padStart(2, "0")}:{String(minutes).padStart(2, "0")}</b>
                                        {isHour && <small>{hour >= 12 ? "PM" : "AM"}</small>}
                                      </span>
                                      <i />
                                    </span>
                                  );
                                })}
                              </div>
                              <div className="agenda-v2-day-wrap">
                                <div
                                  className={[
                                    "agenda-v2-day",
                                    "selected",
                                    selectedCalendarDate === todayKey ? "today" : "",
                                  ].filter(Boolean).join(" ")}
                                  onClick={(event) => {
                                    const bounds = event.currentTarget.getBoundingClientRect();
                                    const ratio = (event.clientY - bounds.top) / Math.max(1, bounds.height);
                                    openNewEventAtMinute(
                                      selectedCalendarDate,
                                      SCHEDULE_START_MINUTE + ratio * SCHEDULE_TOTAL_MINUTES,
                                    );
                                  }}
                                  aria-label={`Full-day schedule for ${readableDate(selectedCalendarDate)}. Tap an empty time to add an event.`}
                                >
                                  {selectedCalendarDate === todayKey && currentScheduleMinute >= SCHEDULE_START_MINUTE && currentScheduleMinute <= SCHEDULE_END_MINUTE && (
                                    <span
                                      className="agenda-v2-now"
                                      style={{ top: `${((currentScheduleMinute - SCHEDULE_START_MINUTE) / SCHEDULE_TOTAL_MINUTES) * 100}%` }}
                                    />
                                  )}
                                  {selectedTimedScheduleEvents.map(({ event, start, end, lane, laneCount }) => {
                                    const visibleStart = Math.max(SCHEDULE_START_MINUTE, start);
                                    const visibleEnd = Math.min(SCHEDULE_END_MINUTE, end);
                                    const duration = visibleEnd - visibleStart;
                                    const densityClass = duration < 30
                                      ? "is-short"
                                      : duration < 60
                                        ? "is-compact"
                                        : "";
                                    return (
                                      <button
                                        key={event.id}
                                        className={`agenda-v2-event ${event.color} ${densityClass} ${laneCount > 1 ? "is-overlap" : ""}`.trim()}
                                        style={{
                                          top: `${((visibleStart - SCHEDULE_START_MINUTE) / SCHEDULE_TOTAL_MINUTES) * 100}%`,
                                          height: `${(duration / SCHEDULE_TOTAL_MINUTES) * 100}%`,
                                          left: `calc(${(lane / laneCount) * 100}% + 6px)`,
                                          width: `calc(${100 / laneCount}% - 12px)`,
                                        }}
                                        onClick={(pointerEvent) => {
                                          pointerEvent.stopPropagation();
                                          openEventDetail(event);
                                        }}
                                      >
                                        {duration < 30 ? (
                                          <span className="agenda-v2-event-shortline">
                                            <time>{eventStartTimeLabel(event)}</time>
                                            <strong>{event.title}</strong>
                                          </span>
                                        ) : (
                                          <>
                                            <span className="agenda-v2-event-icon" aria-hidden="true">{scheduleEventIcon(event)}</span>
                                            <span className="agenda-v2-event-copy">
                                              <strong>{event.title}</strong>
                                              <small>
                                                {eventStartTimeLabel(event)}
                                                {event.endTime ? ` – ${eventEndTimeLabel(event)}` : ""}
                                              </small>
                                              {event.reminder && <span className="agenda-v2-event-reminder">◷ {event.reminder}</span>}
                                              {duration >= 75 && (event.memo || event.note?.trim() || event.todos?.length || event.files?.length || event.location) && (
                                                <span className="agenda-v2-event-extras">
                                                  {(event.memo || event.note?.trim()) && (
                                                    <span title={event.note || "Memo attached"}>
                                                      ✎ {event.note?.trim() ? notePreview(event.note, 38) : "Memo"}
                                                    </span>
                                                  )}
                                                  {event.todos?.slice(0, 2).map((todo, todoIndex) => (
                                                    <span key={`${event.id}-agenda-todo-${todoIndex}`} title={todo}>
                                                      {event.todoStates?.[todoIndex] === "done" ? "✓" : "○"} {todo}
                                                    </span>
                                                  ))}
                                                  {(event.todos?.length ?? 0) > 2 && <span>+{event.todos!.length - 2} steps</span>}
                                                  {event.location && <span title={event.location}>⌖ {event.location}</span>}
                                                  {!!event.files?.length && <span>▣ {event.files.length}</span>}
                                                </span>
                                              )}
                                            </span>
                                            {event.calendar && <span className="agenda-v2-event-category">{event.calendar}</span>}
                                          </>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <nav className="bottom-nav agenda-v2-home-nav" aria-label="Primary navigation">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          className={[
                            "nav-item",
                            tab.id === activeTab ? "active" : "",
                            tab.id === "add" ? "nav-add-event" : "",
                          ].filter(Boolean).join(" ")}
                          type="button"
                          onClick={() => {
                            if (tab.id === "add") {
                              openNewEvent(selectedCalendarDate);
                              return;
                            }
                            setCalendarScheduleOpen(false);
                            setCalendarOpen(false);
                            changeTab(tab.id);
                          }}
                        >
                          <span aria-hidden="true">{tab.icon}</span>
                          <small>{tab.label}</small>
                        </button>
                      ))}
                    </nav>
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
                  {calendarDays.map(({ date, currentMonth }) => {
                    const day = date.getDate();
                    const dayKey = localDateKey(date);
                    const dayEvents = calendarEvents.filter((event) =>
                      eventOccursOn(event, dayKey),
                    );
                    const dayMood = moods.find(
                      (mood) => mood.label === moodHistory[dayKey],
                    );
                    const dayComplete = completedDays[dayKey] === true;
                    return (
                      <button
                        key={dayKey}
                        className={[
                          currentMonth ? "" : "outside-month",
                          selectedCalendarDate === dayKey ? "selected" : "",
                          dayEvents.length > 0 ? "has-event" : "",
                          dayMood ? "has-mood" : "",
                          dayComplete ? "day-complete" : "",
                          date.getDay() === 0 || date.getDay() === 6 ? "weekend" : "",
                          dayKey === todayKey ? "today" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onPointerDown={(event) => beginCalendarLongPress(dayKey, event)}
                        onPointerMove={moveCalendarLongPress}
                        onPointerUp={cancelCalendarLongPress}
                        onPointerCancel={cancelCalendarLongPress}
                        onContextMenu={(event) => event.preventDefault()}
                        onClick={() => {
                          setSelectedCalendarDate(dayKey);
                        }}
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
                        {dayComplete && (
                          <i
                            className="calendar-day-status complete"
                            title="Everything completed"
                          >
                            ✓
                          </i>
                        )}
                        {dayEvents.length > 0 && !calendarExpanded && (
                          <>
                            <span className="calendar-event-dots">
                              {dayEvents.slice(0, 3).map((event) => (
                                <b
                                  className={`event-dot ${event.color}`}
                                  key={event.id}
                                />
                              ))}
                            </span>
                            <small className="calendar-compact-event-label">
                              {dayEvents.length === 1
                                ? dayEvents[0].title
                                : `${dayEvents.length} plans`}
                            </small>
                          </>
                        )}
                        {dayEvents.length > 0 && calendarExpanded && (
                          <span className="calendar-cell-events">
                            {dayEvents.slice(0, 3).map((calendarEvent) => (
                              <span
                                className={`calendar-cell-event ${calendarEvent.color}`}
                                key={calendarEvent.id}
                                title={calendarEvent.title}
                              >
                                <strong>{calendarEvent.title}</strong>
                                <small>{eventStartTimeLabel(calendarEvent)}</small>
                              </span>
                            ))}
                            {dayEvents.length > 3 && (
                              <small className="calendar-more-events">+{dayEvents.length - 3}</small>
                            )}
                          </span>
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
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span>
                      {selectedDayComplete
                        ? "✓"
                        : "○"}
                    </span>
                    <div>
                      <strong>
                        {selectedDayComplete
                          ? "Everything completed"
                          : selectedCalendarDate > todayKey
                              ? "This day hasn’t arrived yet"
                              : "Finished everything today?"}
                      </strong>
                      <small>
                        Add a check whenever you want to mark the day complete.
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
                      {selectedDateEvents.map((calendarEvent) => (
                        <article
                          className={`event-chip ${calendarEvent.color}`}
                          key={calendarEvent.id}
                        >
                          <span>{eventCompactTimeLabel(calendarEvent)}</span>
                          <button
                            type="button"
                            className="event-chip-main"
                            onClick={() => openEventEditor(calendarEvent)}
                            aria-label={`Edit ${calendarEvent.title}`}
                          >
                            <strong>{calendarEvent.title}</strong>
                            <small>
                              {calendarEvent.calendar ?? "Personal"}
                              {(calendarEvent.repeat ?? "Never") !== "Never"
                                ? ` · ${eventRepeatLabel(calendarEvent)}`
                                : ""}
                              {calendarEvent.location
                                ? ` · ${calendarEvent.location}`
                                : ""}
                            </small>
                          </button>
                          <button
                            type="button"
                            className="event-chip-delete"
                            onClick={() =>
                              setEventDeleteRequest({
                                eventId: calendarEvent.id,
                                occurrenceDate: selectedCalendarDate,
                              })
                            }
                            aria-label={`Delete ${calendarEvent.title}`}
                          >
                            ×
                          </button>
                        </article>
                      ))}
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

      {categoryEditorOpen && (
        <div
          className="modal-backdrop category-editor-backdrop"
          role="presentation"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setCategoryEditorOpen(false);
          }}
        >
          <section
            className="category-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit calendar event types"
          >
            <header>
              <div>
                <p className="tiny-label">YOUR EVENT TYPES</p>
                <h2>Make the calendar yours</h2>
                <p>Add as many types as you need, then rename or recolor them anytime.</p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryEditorOpen(false)}
                aria-label="Close event type editor"
              >
                ×
              </button>
            </header>

            <div className="category-editor-list">
              {calendarCategories.map((category) => (
                <article
                  className={editingCategoryId === category.id ? "editing" : ""}
                  key={category.id}
                >
                  <i
                    style={
                      {
                        "--category-color":
                          eventColors.find((color) => color.value === category.color)
                            ?.hex ?? "#ae96d8",
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <strong>{category.name}</strong>
                  <small>{eventColors.find((color) => color.value === category.color)?.label}</small>
                  <button
                    type="button"
                    onClick={() => openCalendarCategoryEditor(category)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="category-delete"
                    onClick={() => deleteCalendarCategory(category.id)}
                    aria-label={`Delete ${category.name}`}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>

            <form
              className="category-editor-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveCalendarCategory();
              }}
            >
              <div className="category-editor-form-heading">
                <strong>{editingCategoryId ? "Edit this type" : "Add another type"}</strong>
                {editingCategoryId && (
                  <button type="button" onClick={startNewCalendarCategory}>
                    ＋ New instead
                  </button>
                )}
              </div>
              <label>
                Name
                <input
                  value={categoryDraft.name}
                  onChange={(event) => {
                    setCategoryDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                    setCategoryEditorError("");
                  }}
                  placeholder="Work, birthdays, appointments…"
                />
              </label>
              <fieldset>
                <legend>Color</legend>
                {eventColors.map((color) => (
                  <button
                    type="button"
                    key={color.value}
                    className={categoryDraft.color === color.value ? "active" : ""}
                    style={{ "--category-color": color.hex } as CSSProperties}
                    onClick={() =>
                      setCategoryDraft((current) => ({
                        ...current,
                        color: color.value,
                      }))
                    }
                    aria-label={color.label}
                    aria-pressed={categoryDraft.color === color.value}
                  />
                ))}
              </fieldset>
              {categoryEditorError && (
                <p className="category-editor-error" role="alert">
                  {categoryEditorError}
                </p>
              )}
              <button className="category-save" type="submit">
                {editingCategoryId ? "Save changes" : "Add event type"}
              </button>
            </form>
          </section>
        </div>
      )}

      {daySummaryDate && (() => {
        const summaryEvents = calendarEvents.filter((event) =>
          eventOccursOn(event, daySummaryDate),
        );
        return (
          <div className="modal-backdrop day-summary-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) setDaySummaryDate(null); }}>
            <section className="day-summary-card" role="dialog" aria-modal="true" aria-label={`Plans for ${readableDate(daySummaryDate)}`}>
              <span className="day-summary-orbs" aria-hidden="true"><i /><i /><i /></span>
              <header>
                <div className="day-summary-heading">
                  <p className="tiny-label">DAY POCKET</p>
                  <h2>{readableDate(daySummaryDate)}</h2>
                  <div className="day-summary-subline">
                    <small>{summaryEvents.length === 0 ? "a quiet day ♡" : `${summaryEvents.length} ${summaryEvents.length === 1 ? "plan" : "plans"} tucked inside`}</small>
                    <span className="day-summary-doodle" aria-hidden="true">
                      <svg className="day-summary-cloud" viewBox="0 0 102 56" focusable="false">
                        <path d="M24 46h54c10 0 17-6 17-15 0-9-7-15-16-15-3 0-5 .4-7 1.5C68 8 60 3 50 3 37 3 27 12 25 24h-2C13 24 6 30 6 35s7 11 18 11Z" />
                      </svg>
                      <span className="day-summary-sparkles"><i>✦</i><i>✦</i><i>✦</i></span>
                    </span>
                  </div>
                </div>
                <button className="day-summary-close" onClick={() => setDaySummaryDate(null)} aria-label="Close day summary">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M7 7 17 17M17 7 7 17" />
                  </svg>
                </button>
              </header>
              {summaryEvents.length === 0 ? (
                <div className="day-summary-empty"><span>☁</span><strong>Nothing written here yet</strong><p>This little page is completely yours.</p></div>
              ) : (
                <div className="day-summary-events">
                  {summaryEvents.map((event, index) => {
                    const hasDetails = Boolean(event.note?.trim() || event.todos?.length);
                    return (
                      <article
                        className={`day-summary-event ${event.color} pocket-tone-${index % 4} ${hasDetails ? "expanded" : "compact"}`}
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          const returnDate = daySummaryDate;
                          setDaySummaryDate(null);
                          openEventDetail(
                            calendarEventAtOccurrence(event, returnDate),
                            returnDate,
                          );
                        }}
                        onKeyDown={(keyboardEvent) => {
                          if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                            keyboardEvent.preventDefault();
                            const returnDate = daySummaryDate;
                            setDaySummaryDate(null);
                            openEventDetail(
                              calendarEventAtOccurrence(event, returnDate),
                              returnDate,
                            );
                          }
                        }}
                      >
                        <div className="day-summary-event-heading">
                          <span className="day-summary-event-heart" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                              <path d="M12 20.5C10.9 19.5 3.2 14.7 3.2 9.7C3.2 6.8 5.2 4.8 8 4.8C9.8 4.8 11.2 5.7 12 7.2C12.8 5.7 14.2 4.8 16 4.8C18.8 4.8 20.8 6.8 20.8 9.7C20.8 14.7 13.1 19.5 12 20.5Z" />
                            </svg>
                          </span>
                          <div><strong>{event.title}</strong><small>{eventStartTimeLabel(event)}</small></div>
                          <i aria-hidden="true">›</i>
                        </div>
                        {event.note?.trim() && <p className="day-summary-memo">{event.note}</p>}
                        {!!event.todos?.length && (
                          <ul>{event.todos.map((todo, index) => <li key={`${event.id}-${index}`} className={event.todoStates?.[index] === "done" ? "done" : ""}><span>{event.todoStates?.[index] === "done" ? "✓" : "○"}</span>{todo}</li>)}</ul>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
              <div className="day-summary-divider" aria-hidden="true"><span>✦</span></div>
              <button className="day-summary-add" onClick={() => { setDaySummaryDate(null); openNewEvent(daySummaryDate); }}>
                <span className="day-summary-add-icon" aria-hidden="true">
                  <svg viewBox="0 0 42 42" focusable="false">
                    <rect x="5" y="8" width="32" height="28" rx="7" />
                    <path d="M13 4v9M29 4v9M5 16h32" />
                    <path d="M21 31s-7-4.3-7-8.1c0-3.5 4.7-4.7 7-1.5 2.3-3.2 7-2 7 1.5 0 3.8-7 8.1-7 8.1Z" />
                  </svg>
                </span>
                <strong>+ Add event</strong>
                <span className="day-summary-add-sparkle" aria-hidden="true">✦</span>
              </button>
              <p className="day-summary-hint">♡&nbsp; tap a plan to see everything</p>
            </section>
          </div>
        );
      })()}

      {selectedJournalEntry && (
        <NoteDetailDialog
          date={selectedJournalEntry.date}
          face={selectedJournalEntry.mood || "♡"}
          label="A FULL LITTLE MOMENT"
          text={selectedJournalEntry.text}
          onClose={() => setSelectedJournalEntry(null)}
          onDelete={() => deleteJournalEntry(selectedJournalEntry.id)}
        />
      )}

      {selectedEventDetail &&
        (() => {
          const detailTime = eventDetailTimeParts(selectedEventDetail);
          return (
            <div
              className="modal-backdrop event-detail-backdrop"
              role="presentation"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeEventDetail();
                }
              }}
            >
              <section
                className={`event-detail-note ${selectedEventDetail.color}`}
                role="dialog"
                aria-modal="true"
                aria-label={`Details for ${selectedEventDetail.title}`}
              >
                <span className="event-detail-corner" aria-hidden="true" />
                <header className="event-detail-header">
                  <div className="event-detail-heading-copy">
                    <div className="event-detail-category-row">
                      {eventDetailReturnDayPocket && (
                        <button
                          className="event-detail-back"
                          type="button"
                          onClick={returnToDayPocket}
                          aria-label={`Back to Day Pocket for ${readableDate(eventDetailReturnDayPocket)}`}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="m14.5 5.5-6.5 6.5 6.5 6.5M8.5 12H19" />
                          </svg>
                        </button>
                      )}
                      <p className="event-detail-category">
                        {selectedEventDetail.calendar ?? "PERSONAL"}
                      </p>
                    </div>
                    <div className="event-detail-title-row">
                      <h2>{selectedEventDetail.title}</h2>
                      <div className="event-detail-doodle" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/assets/event-modal-cloud-sparkles.png"
                          alt=""
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeEventDetail}
                    aria-label="Close event details"
                  >
                    ×
                  </button>
                </header>

                <div className="event-detail-divider" aria-hidden="true">
                  <span>✦</span>
                </div>

                <div className="event-detail-time">
                  <span className="event-detail-time-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8" />
                      <path d="M12 7v5l3 2M12 2v2M12 20v2M2 12h2M20 12h2" />
                    </svg>
                  </span>
                  <div>
                    <strong>
                      <span>{detailTime.range}</span>
                      {detailTime.period && <em>{detailTime.period}</em>}
                    </strong>
                    <small>
                      {eventDetailDate(selectedEventDetail.date)}
                      {selectedEventDetail.endDate &&
                      selectedEventDetail.endDate !== selectedEventDetail.date
                        ? ` → ${eventDetailDate(selectedEventDetail.endDate)}`
                        : ""}
                    </small>
                  </div>
                </div>

                <div className="event-detail-reminder">
                  <span className="event-detail-reminder-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
                      <path d="M10 20h4" />
                    </svg>
                  </span>
                  <div>
                    <small>REMINDER</small>
                    <strong>
                      {selectedEventDetail.reminder || "No reminder"}
                    </strong>
                  </div>
                  <b aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21C10.7 19.9 4.2 15.3 2.6 11.6C1 7.9 3 4.2 6.7 4.2C9 4.2 10.5 5.6 12 7.4C13.5 5.6 15 4.2 17.3 4.2C21 4.2 23 7.9 21.4 11.6C19.8 15.3 13.3 19.9 12 21Z" />
                    </svg>
                  </b>
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

            {(selectedEventDetail.files ?? []).length > 0 && (
              <section className="event-detail-section">
                <p className="tiny-label">ATTACHED FILES</p>
                <div className="event-detail-files">
                  {selectedEventDetail.files?.map((file) => (
                    <span key={file}>⌕ {file}</span>
                  ))}
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

                <button
                  className="event-detail-edit"
                  onClick={() => {
                    const event =
                      calendarEvents.find(
                        (calendarEvent) =>
                          calendarEvent.id === selectedEventDetail.id,
                      ) ?? selectedEventDetail;
                    const eventDate = dateFromKey(event.date);
                    setSelectedCalendarDate(event.date);
                    setViewMonth(
                      new Date(
                        eventDate.getFullYear(),
                        eventDate.getMonth(),
                        1,
                      ),
                    );
                    closeEventDetail();
                    setCalendarSearchOpen(false);
                    setCalendarSearchQuery("");
                    setCalendarOpen(true);
                    openEventEditor(event);
                  }}
                >
                  <span aria-hidden="true">✎</span>
                  Edit this event
                  <i aria-hidden="true">✦</i>
                </button>
              </section>
            </div>
          );
        })()}

      {eventDeleteRequest &&
        (() => {
          const eventToDelete = calendarEvents.find(
            (event) => event.id === eventDeleteRequest.eventId,
          );
          if (!eventToDelete) return null;
          const isRepeating =
            (eventToDelete.repeat ?? "Never") !== "Never";

          return (
            <div
              className="modal-backdrop event-delete-backdrop"
              role="presentation"
              onPointerDown={(pointerEvent) => {
                if (pointerEvent.target === pointerEvent.currentTarget) {
                  closeEventDelete();
                }
              }}
            >
              <section
                className="event-delete-dialog"
                role="dialog"
                aria-modal="true"
                aria-label={`Delete ${eventToDelete.title}`}
              >
                {isRepeating ? (
                  <>
                    <p className="tiny-label">REPEATING EVENT</p>
                    <h2>Which plans should disappear?</h2>
                    <small>
                      This only affects the cycle that created this event.
                    </small>
                    <div className="event-delete-series-actions">
                      <button type="button" onClick={deleteOnlyOccurrence}>
                        <strong>Delete only this event</strong>
                        <span>Keep the rest of the cycle.</span>
                      </button>
                      <button
                        type="button"
                        onClick={deleteThisAndFutureOccurrences}
                      >
                        <strong>Delete this and future events</strong>
                        <span>Keep earlier occurrences.</span>
                      </button>
                      <button type="button" onClick={deleteWholeEvent}>
                        <strong>Delete all events</strong>
                        <span>Remove the complete repeating cycle.</span>
                      </button>
                    </div>
                    <button
                      className="event-delete-cancel"
                      type="button"
                      onClick={closeEventDelete}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <p className="tiny-label">DELETE EVENT</p>
                    <h2>Are you sure you want to delete this event?</h2>
                    <small>
                      “{eventToDelete.title}” is not part of a repeating cycle.
                    </small>
                    <div className="event-delete-confirm-actions">
                      <button type="button" onClick={closeEventDelete}>
                        Cancel
                      </button>
                      <button
                        className="danger"
                        type="button"
                        onClick={deleteWholeEvent}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          );
        })()}

      {false && metricsOpen && (
        <div className="metrics-backdrop metrics-v2-backdrop" role="presentation">
          <section
            className="metrics-screen metrics-screen-v2"
            role="dialog"
            aria-modal="true"
            aria-label="aérea metrics"
          >
            <header className="metrics-v2-topbar">
              <button
                className="metrics-v2-back"
                type="button"
                onClick={() => setMetricsOpen(false)}
                aria-label="Back to My Little Day"
              >
                <span aria-hidden="true">←</span>
                <span>
                  <small>MY LITTLE DAY</small>
                  <strong>Your rhythm</strong>
                </span>
              </button>
              <button
                className="metrics-v2-close"
                type="button"
                onClick={() => setMetricsOpen(false)}
                aria-label="Close metrics"
              >
                ×
              </button>
            </header>

            <section className="metrics-v2-hero">
              <div>
                <p>A SOFT LOOK AT YOUR DAYS</p>
                <h1>
                  Little progress,
                  <span>gathered gently.</span>
                </h1>
                <small>No pressure, no perfect streaks—just the shape of your days.</small>
              </div>
              <div className="metrics-v2-keepsake" aria-hidden="true">
                <span>☁</span>
                <strong>♡</strong>
                <small>{metricsPeriod === "all" ? "all your days" : metricsPeriod}</small>
              </div>
            </section>

            <div className="metrics-controls metrics-v2-controls">
              <div className="metrics-period-tabs" role="group" aria-label="Metrics period">
                {([
                  ["week", "Week"],
                  ["month", "Month"],
                  ["year", "Year"],
                  ["all", "All time"],
                ] as Array<[MetricsPeriod, string]>).map(([period, label]) => (
                  <button
                    key={period}
                    type="button"
                    className={metricsPeriod === period ? "active" : ""}
                    onClick={() => {
                      setMetricsPeriod(period);
                      setMetricsAnchorDate(new Date());
                    }}
                    aria-pressed={metricsPeriod === period}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="metrics-date-nav">
                <button
                  type="button"
                  onClick={() => shiftMetricsRange(-1)}
                  disabled={metricsPeriod === "all"}
                  aria-label="Previous metrics period"
                >
                  ‹
                </button>
                <strong>{metricsRangeLabel}</strong>
                <button
                  type="button"
                  onClick={() => shiftMetricsRange(1)}
                  disabled={metricsPeriod === "all"}
                  aria-label="Next metrics period"
                >
                  ›
                </button>
              </div>
            </div>

            <section className="metrics-summary-grid metrics-v2-summary" aria-label="Period summary">
              {[
                { icon: "💧", value: hydratedDays, goal: metricGoal, label: "Hydrated days", progress: metricProgress.hydration, tint: "blue" },
                { icon: "🎓", value: classDays, goal: metricGoal, label: "Class days", progress: metricProgress.classes, tint: "lilac" },
                { icon: "⭐", value: completedMetricDays, goal: metricGoal, label: "Days completed", progress: metricProgress.completed, tint: "yellow" },
                { icon: "♥", value: averageMood, goal: 100, label: "Average mood", progress: averageMood, tint: "pink", percent: true },
              ].map((metric) => (
                <article className={`metrics-summary-card ${metric.tint}`} key={metric.label}>
                  <span aria-hidden="true">{metric.icon}</span>
                  <div>
                    <p>
                      <strong>{metric.value}</strong>
                      {metric.percent ? "%" : <small>/{metric.goal} days</small>}
                    </p>
                    <h2>{metric.label}</h2>
                    <div className="metrics-v2-progress" aria-hidden="true">
                      <i style={{ width: `${metric.progress}%` }} />
                    </div>
                    <em>{metric.progress > 0 ? `${metric.progress}% of this ${metricsPeriod === "all" ? "journey" : metricsPeriod}` : "Ready for your first check-in"}</em>
                  </div>
                </article>
              ))}
            </section>

            <section className="metrics-overview-card metrics-v2-week">
              <header>
                <span aria-hidden="true">☁</span>
                <div>
                  <small>weekly overview</small>
                  <strong>A tiny week at a glance</strong>
                </div>
              </header>
              <div className="metrics-overview-grid metrics-v2-week-grid">
                {metricsWeekKeys.map((dateKey) => {
                  const future = dateKey > todayKey;
                  const statuses = [
                    { icon: "💧", label: "Water", done: dayHasHydration(dateKey) },
                    { icon: "🎓", label: "Class", done: dayHasClass(dateKey) },
                    { icon: "▤", label: "Study", done: dayHasStudy(dateKey) },
                    { icon: "⭐", label: "Day", done: completedDays[dateKey] === true },
                  ];
                  return (
                    <article className={future ? "future" : ""} key={dateKey}>
                      <header>
                        <span>{dateFromKey(dateKey).toLocaleDateString("en", { weekday: "short" })}</span>
                        <strong>{dateFromKey(dateKey).getDate()}</strong>
                      </header>
                      <div>
                        {statuses.map((status) => (
                          <span
                            className={status.done ? "done" : ""}
                            key={status.label}
                            title={`${status.label}: ${status.done ? "done" : "not checked"}`}
                          >
                            {status.icon}
                          </span>
                        ))}
                      </div>
                      <small>
                        {future
                          ? "ahead"
                          : `${statuses.filter((status) => status.done).length}/4 little marks`}
                      </small>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="metrics-v2-detail-grid">
              <article className="metrics-chart-card metrics-v2-progress-card">
                <header><span>💧</span><strong>Water rhythm</strong></header>
                <div className="metrics-donut-row">
                  <div
                    className="metrics-donut blue"
                    style={{ "--metric-progress": `${metricProgress.hydration}%` } as CSSProperties}
                  >
                    <strong>{hydratedDays}<small>/{metricGoal}</small></strong>
                    <span>days</span>
                  </div>
                  <p>Current gentle streak<br /><strong>{metricStreaks.hydration} days</strong><br /><small>One glass still counts.</small></p>
                </div>
              </article>

              <article className="metrics-chart-card metrics-v2-progress-card">
                <header><span>🎓</span><strong>Class rhythm</strong></header>
                <div className="metrics-donut-row">
                  <div
                    className="metrics-donut lilac"
                    style={{ "--metric-progress": `${metricProgress.classes}%` } as CSSProperties}
                  >
                    <strong>{classDays}<small>/{metricGoal}</small></strong>
                    <span>days</span>
                  </div>
                  <p>Current class streak<br /><strong>{metricStreaks.classes} days</strong><br /><small>Based on calendar plans.</small></p>
                </div>
              </article>

              <article className="metrics-chart-card mood-chart-card metrics-v2-mood-card">
                <header><span>♥</span><strong>Mood ribbon</strong></header>
                <div className="metrics-mood-chart">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Mood trend this week">
                    <line x1="7" y1="87" x2="94" y2="87" />
                    <line x1="7" y1="58" x2="94" y2="58" />
                    <line x1="7" y1="29" x2="94" y2="29" />
                    <polyline points={moodLinePoints} />
                    {moodWeekValues.map((value, index) => (
                      <circle key={metricsWeekKeys[index]} cx={8 + index * 14} cy={86 - value * .64} r="2.3" />
                    ))}
                  </svg>
                  <div>{metricsWeekKeys.map((dateKey) => <span key={dateKey}>{dateFromKey(dateKey).toLocaleDateString("en", { weekday: "narrow" })}</span>)}</div>
                </div>
                <footer>{averageMood > 0 ? `Your recorded average is ${averageMood}%.` : "Mood stickers will draw this ribbon."}</footer>
              </article>

              <article className="metrics-insights-card metrics-v2-insight-card">
                <header><span>✦</span><strong>A small note</strong></header>
                {hydratedDays + classDays + completedMetricDays + moodMetricValues.length > 0 ? (
                  <p>Your fullest rhythm has appeared on <strong>{consistentWeekday}</strong>. Keep what helps and leave the rest.</p>
                ) : (
                  <p>Your first check-in will begin the pattern. Nothing here needs to be perfect.</p>
                )}
                <div aria-hidden="true">☁<br />softly,<br />one day at a time ♡</div>
              </article>
            </section>
          </section>
        </div>
      )}

      {postItEditorOpen && (
        <div className="modal-backdrop post-it-editor-backdrop" role="presentation">
          <section
            className="post-it-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingPostItId ? "Edit post-it" : "Create a post-it"}
          >
            <header>
              <div>
                <p className="tiny-label">A NOTE FOR THIS PAGE</p>
                <h2>{editingPostItId ? "Edit your post-it" : "Make a post-it"}</h2>
                <p>Write it, choose its paper, then place it anywhere on this page.</p>
              </div>
              <button
                type="button"
                onClick={() => setPostItEditorOpen(false)}
                aria-label="Close post-it editor"
              >
                ×
              </button>
            </header>

            <div className={`post-it-editor-preview ${postItDraft.color}`}>
              <span className="post-it-tape" aria-hidden="true" />
              <textarea
                autoFocus
                value={postItDraft.text}
                onChange={(event) =>
                  setPostItDraft((current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
                placeholder={"Tomorrow:\n• Class at 8:00\n• Hand in report"}
                maxLength={220}
                aria-label="Post-it text"
              />
            </div>

            <div className="post-it-editor-options">
              <fieldset>
                <legend>Paper color</legend>
                {postItColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={postItDraft.color === color.value ? "active" : ""}
                    style={{ "--post-it-swatch": color.hex } as CSSProperties}
                    onClick={() =>
                      setPostItDraft((current) => ({
                        ...current,
                        color: color.value,
                      }))
                    }
                    aria-label={color.label}
                    aria-pressed={postItDraft.color === color.value}
                  >
                    <span />
                  </button>
                ))}
              </fieldset>
            </div>

            <footer>
              {editingPostItId ? (
                <button
                  className="post-it-delete"
                  type="button"
                  onClick={() => deletePostIt(editingPostItId)}
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <button
                className="post-it-cancel"
                type="button"
                onClick={() => setPostItEditorOpen(false)}
              >
                Cancel
              </button>
              <button
                className="post-it-save"
                type="button"
                onClick={savePostIt}
                disabled={!postItDraft.text.trim()}
              >
                {editingPostItId ? "Save changes" : "Stick it here"}
              </button>
            </footer>
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
                    onClick={() => {
                      setAppTheme(theme.id);
                      if (theme.id === "ao3night") setColorMode("dark");
                    }}
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
                      {theme.interfaceIdea && (
                        <span className="theme-interface-chip">
                          <b>{theme.featured ? "NEW UI" : "UI"}</b>
                          {theme.interfaceIdea}
                        </span>
                      )}
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
  themeId,
  pending,
  completed,
  reminders,
  saveReminder,
  deleteReminder,
  completeReminder,
  restoreReminder,
  openCalendar,
  selectedDate,
  selectDate,
  selectedDateEvents,
  openEventDetail,
  now,
  todayKey,
  weekDays,
  yesterdayDoneCount,
  dayCharm,
  dayCharmLabel,
  dayCharmText,
  showDayCharm,
  isNight,
}: {
  themeId: AppTheme;
  pending: Reminder[];
  completed: Reminder[];
  reminders: Reminder[];
  saveReminder: (reminder: Reminder) => void;
  deleteReminder: (reminderId: number) => void;
  completeReminder: (id: number) => void;
  restoreReminder: (id: number) => void;
  openCalendar: () => void;
  selectedDate: string;
  selectDate: (dateKey: string) => void;
  selectedDateEvents: CalendarEvent[];
  openEventDetail: (event: CalendarEvent) => void;
  now: Date;
  todayKey: string;
  weekDays: { key: string; day: string; date: string }[];
  yesterdayDoneCount: number;
  dayCharm: string;
  dayCharmLabel: string;
  dayCharmText: string;
  showDayCharm: boolean;
  isNight: boolean;
}) {
  const [reminderDraft, setReminderDraft] = useState<Reminder | null>(null);
  const scheduleLongPressTimerRef = useRef<number | null>(null);
  const scheduleLongPressedRef = useRef(false);
  const schedulePressStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectedDateObject = dateFromKey(selectedDate);
  const selectedIsToday = selectedDate === todayKey;
  const isNoirRest = themeId === "noirrest";
  const comingUpEvent = selectedIsToday
    ? findComingUpEvent(selectedDateEvents, now)
    : null;
  const selectedWeekday = selectedDateObject.toLocaleDateString("en", {
    weekday: "long",
  });

  const cancelScheduleLongPress = () => {
    if (scheduleLongPressTimerRef.current) {
      window.clearTimeout(scheduleLongPressTimerRef.current);
    }
    scheduleLongPressTimerRef.current = null;
    schedulePressStartRef.current = null;
  };

  const beginScheduleLongPress = (
    event: ReactPointerEvent<HTMLButtonElement>,
    calendarEvent: CalendarEvent,
  ) => {
    scheduleLongPressedRef.current = false;
    schedulePressStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    cancelScheduleLongPress();
    schedulePressStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    scheduleLongPressTimerRef.current = window.setTimeout(() => {
      scheduleLongPressedRef.current = true;
      scheduleLongPressTimerRef.current = null;
      openEventDetail(calendarEvent);
    }, 520);
  };

  const moveScheduleLongPress = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const start = schedulePressStartRef.current;
    if (
      start &&
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10
    ) {
      cancelScheduleLongPress();
    }
  };

  const openScheduleEvent = (calendarEvent: CalendarEvent) => {
    if (scheduleLongPressedRef.current) {
      scheduleLongPressedRef.current = false;
      return;
    }
    openEventDetail(calendarEvent);
  };

  useEffect(
    () => () => {
      if (scheduleLongPressTimerRef.current) {
        window.clearTimeout(scheduleLongPressTimerRef.current);
      }
    },
    [],
  );

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
          <h2
            aria-label={
              selectedIsToday
                ? isNoirRest
                  ? `${isNight ? "Good evening" : "Good morning"}, Rhea.`
                  : isNight
                    ? "Good evening, lovely."
                    : "Good morning, lovely."
                : `A little look at ${selectedWeekday}.`
            }
          >
            {selectedIsToday && isNoirRest ? (
              <>
                <span className="noir-greeting-kicker">
                  {isNight ? "Good evening," : "Good morning,"}
                </span>
                <span className="noir-greeting-name">
                  Rhea <i aria-hidden="true">✦</i>
                </span>
              </>
            ) : selectedIsToday ? (
              <>
                <span>{isNight ? "Good evening," : "Good morning,"}</span>{" "}
                <span className="greeting-lovely">lovely.</span>
              </>
            ) : (
              `A little look at ${selectedWeekday}.`
            )}
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
        {isNoirRest && (
          <div className="noir-week-header">
            <span>
              {selectedDateObject
                .toLocaleDateString("en", { month: "long", year: "numeric" })
                .toUpperCase()}
            </span>
            <button type="button" onClick={openCalendar}>See calendar</button>
          </div>
        )}
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

      {selectedIsToday && comingUpEvent && (
        <section
          className="coming-up noir-coming-up"
          aria-label="Coming up next"
          aria-live="polite"
        >
          <p className="coming-up-label noir-section-label">COMING UP NEXT</p>
          <button
            type="button"
            className={`schedule-card ${comingUpEvent.color}-card`}
            onPointerDown={(pointerEvent) =>
              beginScheduleLongPress(pointerEvent, comingUpEvent)
            }
            onPointerMove={moveScheduleLongPress}
            onPointerUp={cancelScheduleLongPress}
            onPointerCancel={cancelScheduleLongPress}
            onContextMenu={(contextEvent) => contextEvent.preventDefault()}
            onClick={() => openScheduleEvent(comingUpEvent)}
            aria-label={`Open details for ${comingUpEvent.title}`}
            title="Hold to preview event"
          >
            <div className="time-block">
              <strong>{comingUpEvent.time}</strong>
              <span>TIME</span>
            </div>
            <div className="schedule-line" />
            <div className="schedule-copy">
              <p className="card-tag">{comingUpEvent.calendar ?? "AÉREA"}</p>
              <h4>{comingUpEvent.title}</h4>
              <span>
                {comingUpEvent.location ||
                  comingUpEvent.note ||
                  "Saved in your calendar"}
              </span>
            </div>
            <div className="mini-people">
              {isNoirRest ? "•••" : "✦"}
            </div>
          </button>
        </section>
      )}

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
                className={`schedule-card ${event.color}-card`}
                key={event.id}
                onPointerDown={(pointerEvent) =>
                  beginScheduleLongPress(pointerEvent, event)
                }
                onPointerMove={moveScheduleLongPress}
                onPointerUp={cancelScheduleLongPress}
                onPointerCancel={cancelScheduleLongPress}
                onContextMenu={(contextEvent) => contextEvent.preventDefault()}
                onClick={() => openScheduleEvent(event)}
                aria-label={`Open details for ${event.title}`}
                title="Hold to preview event"
              >
                <div className="time-block">
                  <strong>{event.allDay ? "ALL" : event.time}</strong>
                  <span>{event.allDay ? "DAY" : "TIME"}</span>
                </div>
                <div className="schedule-line" />
                <div className="schedule-copy">
                  <p className="card-tag">{event.calendar ?? "AÉREA"}</p>
                  <h4>{event.title}</h4>
                  <span>
                    {event.location || event.note || "Saved in your calendar"}
                  </span>
                </div>
                <div className="mini-people">
                  {isNoirRest ? "•••" : "✦"}
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
                {completed.length}/{reminders.length}
              </span>
              <button
                className="reminder-add-button"
                type="button"
                aria-label="Add reminder"
                onClick={() =>
                  setReminderDraft({
                    id: Math.max(0, ...reminders.map((item) => item.id)) + 1,
                    title: "New reminder",
                    detail: "A gentle reminder",
                    icon: "♡",
                    tint: "pink",
                  })
                }
              >
                +
              </button>
            </div>
          </div>
          <div className="reminder-card">
            {pending.length === 0 ? (
              <div className="all-done">
                <span>🌈</span>
                <strong>Everything is complete!</strong>
                <p>Your little list is resting for the day.</p>
              </div>
            ) : (
              pending.map((item) => (
                <div
                  className={`reminder-row ${item.tint}`}
                  key={item.id}
                >
                  <button
                    className="reminder-icon"
                    type="button"
                    aria-label={`Edit ${item.title}`}
                    onClick={() => setReminderDraft({ ...item })}
                  >
                    {item.icon}
                  </button>
                  <span className="reminder-copy">
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <button
                    className="check-circle"
                    type="button"
                    aria-label={`Complete ${item.title}`}
                    onClick={() => completeReminder(item.id)}
                  >
                    ✓
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="completed-wrap">
            <div className="completed-history-line">
              <p className="completed-title">COMPLETED TODAY</p>
              <span>Yesterday {yesterdayDoneCount}/{reminders.length}</span>
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

      {reminderDraft && (
        <div
          className="reminder-editor-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReminderDraft(null);
          }}
        >
          <section
            className="reminder-editor-note"
            role="dialog"
            aria-modal="true"
            aria-label="Edit reminder"
          >
            <div className="reminder-editor-sparkles" aria-hidden="true">
              ✦　♡　✦
            </div>
            <span className="reminder-editor-preview" aria-hidden="true">
              {reminderDraft.icon || "♡"}
            </span>
            <p className="tiny-label">LITTLE REMINDER</p>
            <h3>Make it yours</h3>
            <p className="reminder-editor-subtitle">
              A tiny note to take gentle care of you.
            </p>
            <label>
              <small>Emoji</small>
              <input
                className="reminder-emoji-input"
                value={reminderDraft.icon}
                maxLength={8}
                onChange={(event) =>
                  setReminderDraft((current) =>
                    current ? { ...current, icon: event.target.value } : current,
                  )
                }
              />
            </label>
            <label>
              <small>Name</small>
              <input
                value={reminderDraft.title}
                onChange={(event) =>
                  setReminderDraft((current) =>
                    current ? { ...current, title: event.target.value } : current,
                  )
                }
              />
            </label>
            <footer>
              {reminders.some((item) => item.id === reminderDraft.id) && (
                <button
                  className="delete-reminder-button"
                  type="button"
                  onClick={() => {
                    deleteReminder(reminderDraft.id);
                    setReminderDraft(null);
                  }}
                >
                  Delete
                </button>
              )}
              <span />
              <button type="button" onClick={() => setReminderDraft(null)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!reminderDraft.icon.trim() || !reminderDraft.title.trim()}
                onClick={() => {
                  saveReminder({
                    ...reminderDraft,
                    icon: reminderDraft.icon.trim(),
                    title: reminderDraft.title.trim(),
                  });
                  setReminderDraft(null);
                }}
              >
                Save
              </button>
            </footer>
          </section>
        </div>
      )}

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
  onClose,
  onDelete,
}: {
  date: string;
  face: string;
  label: string;
  text: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="modal-backdrop note-detail-backdrop" role="presentation">
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
        <p className="note-detail-text">{text}</p>
        <footer>
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
