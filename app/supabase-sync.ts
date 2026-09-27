import { Capacitor } from "@capacitor/core";
import {
  createClient,
  type EmailOtpType,
} from "@supabase/supabase-js";
import {
  isBocaSportsEvent,
  type SportsEvent,
  type SportsSettings,
} from "./aerea-features";

const SUPABASE_URL = "https://wislppgaikbxgibrjizz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_tONK58MPqu6CkvnAWqgoww_k8D_dcu_";
export const AEREA_ACCOUNT = "aereaary@gmail.com";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  },
);

const STATE_KEY = "aerea-private-state-v1";
const STATE_TIME_KEY = "aerea-private-state-updated-at";
const SKETCH_KEY = "aerea-private-sketches-v1";
const FOOTBALL_MATCHES_KEY = "aerea-football-matches-v1";

export type FootballMatch = {
  external_event_id: string;
  team_key: "boca_juniors";
  match_date: string;
  kickoff_at: string | null;
  time_confirmed: boolean;
  home_team: string;
  away_team: string;
  competition: string | null;
  venue: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
};

export function validFootballMatches(value: unknown): FootballMatch[] | null {
  if (!Array.isArray(value)) return null;

  const matches = value.filter((item): item is FootballMatch => {
    if (!item || typeof item !== "object") return false;
    const match = item as Record<string, unknown>;
    return (
      typeof match.external_event_id === "string" &&
      match.external_event_id.length > 0 &&
      match.team_key === "boca_juniors" &&
      typeof match.match_date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(match.match_date) &&
      (typeof match.kickoff_at === "string" || match.kickoff_at === null) &&
      typeof match.time_confirmed === "boolean" &&
      typeof match.home_team === "string" &&
      match.home_team.length > 0 &&
      typeof match.away_team === "string" &&
      match.away_team.length > 0 &&
      (typeof match.competition === "string" || match.competition === null) &&
      (typeof match.venue === "string" || match.venue === null) &&
      typeof match.status === "string" &&
      (typeof match.home_score === "number" || match.home_score === null) &&
      (typeof match.away_score === "number" || match.away_score === null)
    );
  });

  if (matches.length !== value.length) return null;
  return Array.from(
    new Map(matches.map((match) => [match.external_event_id, match])).values(),
  );
}

export function readCachedFootballMatches(): FootballMatch[] {
  if (typeof window === "undefined") return [];
  try {
    return (
      validFootballMatches(
        JSON.parse(localStorage.getItem(FOOTBALL_MATCHES_KEY) || "[]"),
      ) ?? []
    );
  } catch {
    return [];
  }
}

export async function fetchFootballMatches(): Promise<FootballMatch[]> {
  const { data, error } = await supabase
    .from("football_matches")
    .select(
      "external_event_id,team_key,match_date,kickoff_at,time_confirmed,home_team,away_team,competition,venue,status,home_score,away_score",
    )
    .eq("team_key", "boca_juniors")
    .order("match_date", { ascending: true });

  if (error) throw error;
  const matches = validFootballMatches(data);
  if (!matches) {
    throw new Error("Supabase returned an invalid Boca fixture.");
  }

  try {
    localStorage.setItem(FOOTBALL_MATCHES_KEY, JSON.stringify(matches));
  } catch {
    // The valid live fixture remains useful if storage is unavailable.
  }
  return matches;
}

export function readBrowserState(): { state?: unknown } {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function writeBrowserState(payload: unknown) {
  localStorage.setItem(STATE_KEY, JSON.stringify(payload));
}

export function readBrowserSketches<T>(): T[] {
  try {
    return JSON.parse(localStorage.getItem(SKETCH_KEY) || "[]") as T[];
  } catch {
    return [];
  }
}

export function writeBrowserSketches<T>(pages: T[]) {
  localStorage.setItem(SKETCH_KEY, JSON.stringify(pages));
}

export async function requestAereaCode(email: string) {
  if (email.trim().toLowerCase() !== AEREA_ACCOUNT) {
    throw new Error("This aérea is private.");
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: AEREA_ACCOUNT,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: Capacitor.isNativePlatform()
        ? "aerea://auth/callback"
        : `${window.location.origin}/`,
    },
  });
  if (error) throw error;
}

export async function handleAereaAuthCallback(url: string) {
  const callback = new URL(url);
  const hash = new URLSearchParams(callback.hash.replace(/^#/, ""));
  const errorDescription =
    callback.searchParams.get("error_description") ||
    hash.get("error_description");
  if (errorDescription) throw new Error(errorDescription);

  const code = callback.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return "Email confirmed. Private sync is ready ♡";
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return "Email confirmed. Private sync is ready ♡";
  }

  const tokenHash = callback.searchParams.get("token_hash");
  const type = callback.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) throw error;
    return "Email confirmed. Private sync is ready ♡";
  }

  const { data } = await supabase.auth.getSession();
  if (data.session) return "This email was already confirmed ♡";
  throw new Error("This confirmation link is invalid or has expired.");
}

export async function verifyAereaCode(token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email: AEREA_ACCOUNT,
    token: token.trim(),
    type: "email",
  });
  if (error) throw error;
}

export async function currentAereaEmail() {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email?.toLowerCase() || null;
  return email === AEREA_ACCOUNT ? email : null;
}

export async function reconcileCloudState<T>(
  localState: T | null,
): Promise<T | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.email?.toLowerCase() !== AEREA_ACCOUNT) return localState;

  const localUpdatedAt = Number(localStorage.getItem(STATE_TIME_KEY) || "0");
  const { data, error } = await supabase
    .from("aerea_sync")
    .select("state,client_updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  if (data && Number(data.client_updated_at) > localUpdatedAt) {
    localStorage.setItem(
      STATE_TIME_KEY,
      String(data.client_updated_at),
    );
    return data.state as T;
  }

  if (localState) await pushCloudState(localState);
  return localState;
}

export async function pushCloudState(state: unknown) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.email?.toLowerCase() !== AEREA_ACCOUNT) return false;

  const updatedAt = Date.now();
  const { error } = await supabase.from("aerea_sync").upsert({
    user_id: user.id,
    state,
    client_updated_at: updatedAt,
    updated_at: new Date(updatedAt).toISOString(),
  });
  if (error) throw error;
  localStorage.setItem(STATE_TIME_KEY, String(updatedAt));
  return true;
}

export async function fetchSportsFixtures(): Promise<SportsEvent[] | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.email?.toLowerCase() !== AEREA_ACCOUNT) return null;

  const from = new Date();
  from.setDate(from.getDate() - 7);
  const { data, error } = await supabase
    .from("sports_events")
    .select(
      "id,provider_external_id,sport_id,team_id,season,opponent,home_away,starts_at,venue,status,home_score,away_score,updated_at,competitions(name),teams(name,provider,provider_external_id)",
    )
    .gte("starts_at", from.toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const startsAt = new Date(row.starts_at as string);
    const competition = row.competitions as
      | { name?: string }
      | { name?: string }[]
      | null;
    const competitionName = Array.isArray(competition)
      ? competition[0]?.name
      : competition?.name;
    const relatedTeam = row.teams as
      | {
          name?: string;
          provider?: string;
          provider_external_id?: string;
        }
      | {
          name?: string;
          provider?: string;
          provider_external_id?: string;
        }[]
      | null;
    const team = Array.isArray(relatedTeam) ? relatedTeam[0] : relatedTeam;
    return {
      id: String(row.id),
      externalId: String(row.provider_external_id),
      sport: String(row.sport_id),
      competition: competitionName || "Football",
      season: row.season ? String(row.season) : undefined,
      teamId: String(row.team_id),
      opponent: String(row.opponent),
      homeAway: row.home_away as SportsEvent["homeAway"],
      startsAtUtc: startsAt.toISOString(),
      localDate: [
        startsAt.getFullYear(),
        String(startsAt.getMonth() + 1).padStart(2, "0"),
        String(startsAt.getDate()).padStart(2, "0"),
      ].join("-"),
      localTime: `${String(startsAt.getHours()).padStart(2, "0")}:${String(
        startsAt.getMinutes(),
      ).padStart(2, "0")}`,
      venue: row.venue ? String(row.venue) : undefined,
      status: row.status as SportsEvent["status"],
      homeScore:
        typeof row.home_score === "number" ? row.home_score : undefined,
      awayScore:
        typeof row.away_score === "number" ? row.away_score : undefined,
      provider: team?.provider,
      teamName: team?.name,
      teamProviderExternalId: team?.provider_external_id,
      updatedAt: String(row.updated_at),
    };
  }).filter((event) => !isBocaSportsEvent(event));
}

export async function syncFollowedSportsTeams(settings: SportsSettings) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.email?.toLowerCase() !== AEREA_ACCOUNT) return false;

  const { data: current, error: readError } = await supabase
    .from("user_followed_teams")
    .select("team_id")
    .eq("user_id", user.id);
  if (readError) throw readError;
  const currentIds = new Set((current ?? []).map((row) => String(row.team_id)));
  const desiredIds = new Set(settings.followedTeamIds);

  const removed = [...currentIds].filter((id) => !desiredIds.has(id));
  if (removed.length > 0) {
    const { error } = await supabase
      .from("user_followed_teams")
      .delete()
      .eq("user_id", user.id)
      .in("team_id", removed);
    if (error) throw error;
  }
  if (desiredIds.size > 0) {
    const { error } = await supabase.from("user_followed_teams").upsert(
      [...desiredIds].map((teamId) => ({
        user_id: user.id,
        team_id: teamId,
        notifications_enabled: settings.notifyBeforeMatches,
        notification_lead_minutes: settings.notificationLeadMinutes,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,team_id" },
    );
    if (error) throw error;
  }
  return true;
}

export async function uploadAereaLibraryFile(id: string, file: Blob) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.email?.toLowerCase() !== AEREA_ACCOUNT) return null;
  const path = `${user.id}/${id}`;
  const { error } = await supabase.storage
    .from("aerea-library")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  return path;
}

export async function downloadAereaLibraryFile(path: string) {
  const { data, error } = await supabase.storage
    .from("aerea-library")
    .download(path);
  if (error) throw error;
  return data;
}

export async function deleteAereaLibraryFile(path: string) {
  const { error } = await supabase.storage.from("aerea-library").remove([path]);
  if (error) throw error;
}
