export type InboxKind =
  | "text"
  | "task"
  | "note"
  | "photo"
  | "pdf"
  | "file"
  | "link";

export type InboxItem = {
  id: string;
  kind: InboxKind;
  text: string;
  createdAt: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  dataUrl?: string;
  nativeFileId?: string;
  cloudPath?: string;
  libraryItemId?: string;
  processedAs?: string[];
  dismissedAt?: string;
};

export type TaskItem = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  skipped?: boolean;
  notes?: string;
  checklist?: string[];
  checklistDone?: boolean[];
  attachmentIds?: string[];
  tags?: string[];
  priority?: "gentle" | "important" | "urgent";
  createdAt: string;
  updatedAt: string;
  rescheduleHistory?: { from: string; to: string; at: string }[];
};

export type LibraryKind =
  | "pdf"
  | "epub"
  | "document"
  | "image"
  | "audio"
  | "note"
  | "file";

export type ReaderLocation = {
  page?: number;
  offset?: number;
  chapter?: string;
  percentage?: number;
  zoom?: number;
};

export type LibraryAnnotation = {
  id: string;
  type: "bookmark" | "highlight" | "note";
  location: ReaderLocation;
  excerpt?: string;
  color?: string;
  text?: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryItem = {
  id: string;
  name: string;
  kind: LibraryKind;
  mimeType?: string;
  size?: number;
  dataUrl?: string;
  nativeFileId?: string;
  cloudPath?: string;
  textContent?: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  favorite?: boolean;
  collectionIds?: string[];
  readerLocation?: ReaderLocation;
  annotations?: LibraryAnnotation[];
  archived?: boolean;
};

export type LibraryCollection = {
  id: string;
  name: string;
  order: number;
  createdAt: string;
};

export type EntityType =
  | "event"
  | "task"
  | "file"
  | "note"
  | "recording"
  | "class";

export type EntityLink = {
  id: string;
  fromType: EntityType;
  fromId: string;
  toType: EntityType;
  toId: string;
  createdAt: string;
};

export type PostIt = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  color: string;
  style: "plain" | "lined" | "checklist";
  pinned: boolean;
  locked: boolean;
  groupId?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostItGroup = {
  id: string;
  name: string;
  locked: boolean;
  archived: boolean;
  createdAt: string;
};

export type TrashKind =
  | "event"
  | "task"
  | "note"
  | "post-it"
  | "file";

export type TrashItem = {
  id: string;
  kind: TrashKind;
  label: string;
  payload: unknown;
  deletedAt: string;
  purgeAt: string;
};

export type ResetPreferences = {
  morningEnabled: boolean;
  nightEnabled: boolean;
  lastMorningDate?: string;
  lastNightDate?: string;
};

export type SportsSettings = {
  followedTeamIds: string[];
  addAutomatically: boolean;
  showSpecialCards: boolean;
  notifyBeforeMatches: boolean;
  notificationLeadMinutes: number;
  showLiveScore: boolean;
  showFinalScore: boolean;
};

export type SportsTeam = {
  id: string;
  externalId: string;
  sport: "football" | "f1" | "other";
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  icon: string;
};

export type SportsEvent = {
  id: string;
  externalId: string;
  sport: string;
  competition: string;
  season?: string;
  teamId: string;
  opponent: string;
  homeAway: "home" | "away" | "neutral";
  startsAtUtc: string;
  localDate: string;
  localTime: string;
  venue?: string;
  status: "scheduled" | "postponed" | "cancelled" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
  provider?: string;
  teamName?: string;
  teamProviderExternalId?: string;
  updatedAt: string;
};

export const INITIAL_SPORTS_TEAMS: SportsTeam[] = [
  {
    id: "boca-juniors",
    externalId: "451",
    sport: "football",
    name: "Boca Juniors",
    shortName: "Boca",
    primaryColor: "#0b2f78",
    secondaryColor: "#f6cf2f",
    icon: "💙💛",
  },
];

const BOCA_TEAM_SLUGS = new Set(["boca-juniors", "boca_juniors"]);

function normalizedSportsIdentity(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isBocaSportsTeam(identity: {
  id?: string;
  teamId?: string;
  name?: string;
  shortName?: string;
  externalId?: string;
  providerExternalId?: string;
}) {
  const slugs = [identity.id, identity.teamId, identity.name, identity.shortName]
    .map(normalizedSportsIdentity)
    .filter(Boolean);
  const providerExternalId =
    identity.providerExternalId ?? identity.externalId ?? "";
  return (
    slugs.some((slug) => BOCA_TEAM_SLUGS.has(slug)) ||
    slugs.some((slug) => slug === "boca" || slug.includes("boca-juniors")) ||
    providerExternalId === "451"
  );
}

export function isBocaSportsEvent(event: SportsEvent) {
  const registeredTeam = INITIAL_SPORTS_TEAMS.find(
    (team) => team.id === event.teamId,
  );
  return isBocaSportsTeam({
    teamId: event.teamId,
    name: event.teamName ?? registeredTeam?.name,
    shortName: registeredTeam?.shortName,
    providerExternalId:
      event.teamProviderExternalId ?? registeredTeam?.externalId,
  });
}

export const DEFAULT_RESET_PREFERENCES: ResetPreferences = {
  morningEnabled: true,
  nightEnabled: true,
};

export const DEFAULT_SPORTS_SETTINGS: SportsSettings = {
  followedTeamIds: [],
  addAutomatically: true,
  showSpecialCards: true,
  notifyBeforeMatches: false,
  notificationLeadMinutes: 60,
  showLiveScore: false,
  showFinalScore: true,
};

export function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function createTrashItem(
  kind: TrashKind,
  label: string,
  payload: unknown,
): TrashItem {
  const deletedAt = new Date();
  const purgeAt = new Date(deletedAt);
  purgeAt.setDate(purgeAt.getDate() + 30);
  return {
    id: crypto.randomUUID(),
    kind,
    label,
    payload,
    deletedAt: deletedAt.toISOString(),
    purgeAt: purgeAt.toISOString(),
  };
}

export function trashDaysRemaining(item: TrashItem) {
  return Math.max(
    0,
    Math.ceil((new Date(item.purgeAt).getTime() - Date.now()) / 86_400_000),
  );
}

export function inferInboxKind(text: string, file?: File | null): InboxKind {
  if (file) {
    if (file.type.startsWith("image/")) return "photo";
    if (file.type === "application/pdf") return "pdf";
    return "file";
  }
  if (/^https?:\/\//i.test(text.trim())) return "link";
  return "text";
}

export function fileKind(file: File): LibraryKind {
  const lower = file.name.toLowerCase();
  if (file.type === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".epub")) return "epub";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("text/") || /\.(docx?|odt|rtf|txt)$/i.test(lower)) {
    return "document";
  }
  return "file";
}

export function eventMinutes(time: string | undefined) {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function rangesOverlap(
  startA: string,
  endA: string | undefined,
  startB: string,
  endB: string | undefined,
) {
  const aStart = eventMinutes(startA);
  const aEnd = Math.max(aStart + 1, eventMinutes(endA) || aStart + 60);
  const bStart = eventMinutes(startB);
  const bEnd = Math.max(bStart + 1, eventMinutes(endB) || bStart + 60);
  return aStart < bEnd && bStart < aEnd;
}
