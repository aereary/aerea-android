import { createClient } from "@supabase/supabase-js";

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

function validFootballMatches(value: unknown): FootballMatch[] | null {
  if (!Array.isArray(value)) return null;

  const matches = value.filter((item): item is FootballMatch => {
    if (!item || typeof item !== "object") return false;
    const match = item as Record<string, unknown>;
    return (
      typeof match.external_event_id === "string" &&
      match.external_event_id.length > 0 &&
      match.team_key === "boca_juniors" &&
      typeof match.match_date === "string" &&
      (typeof match.kickoff_at === "string" || match.kickoff_at === null) &&
      typeof match.time_confirmed === "boolean" &&
      typeof match.home_team === "string" &&
      typeof match.away_team === "string" &&
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
    .eq("team_key", "boca_juniors");

  if (error) throw error;
  const matches = validFootballMatches(data);
  if (!matches) throw new Error("Supabase returned an invalid football fixture.");

  try {
    localStorage.setItem(FOOTBALL_MATCHES_KEY, JSON.stringify(matches));
  } catch {
    // A valid live fixture is still useful if local storage is unavailable.
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
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
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
