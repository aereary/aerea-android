type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    venue?: { name?: string | null };
    status: { short: string };
  };
  league: { id: number; name: string; country?: string; season?: number };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals?: { home?: number | null; away?: number | null };
};

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SPORTS_API_KEY = Deno.env.get("SPORTS_API_KEY") ?? "";
const SYNC_SECRET = Deno.env.get("SPORTS_SYNC_SECRET") ?? "";
const PROVIDER_URL =
  Deno.env.get("SPORTS_PROVIDER_URL") ?? "https://v3.football.api-sports.io";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizedStatus(short: string) {
  if (["PST", "SUSP", "INT"].includes(short)) return "postponed";
  if (["CANC", "ABD", "AWD", "WO"].includes(short)) return "cancelled";
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(short)) return "live";
  return "scheduled";
}

async function rest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation,resolution=merge-duplicates",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = request.headers.get("x-sports-sync-secret") ?? "";
  if (
    (!SYNC_SECRET || suppliedSecret !== SYNC_SECRET) &&
    authorization !== `Bearer ${SERVICE_ROLE_KEY}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SPORTS_API_KEY) {
    return Response.json({ error: "Sports secrets are not configured" }, { status: 503 });
  }

  try {
    const teams = await rest(
      "teams?select=id,provider,provider_external_id,name&active=eq.true&provider=eq.api-football",
    ) as Array<{
      id: string;
      provider: string;
      provider_external_id: string;
      name: string;
    }>;
    const now = new Date();
    const until = new Date(now);
    until.setUTCDate(until.getUTCDate() + 180);
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - 7);
    let imported = 0;

    for (const team of teams) {
      const url = new URL("/fixtures", PROVIDER_URL);
      url.searchParams.set("team", team.provider_external_id);
      url.searchParams.set("from", dateKey(from));
      url.searchParams.set("to", dateKey(until));
      url.searchParams.set("timezone", "UTC");
      const providerResponse = await fetch(url, {
        headers: { "x-apisports-key": SPORTS_API_KEY },
      });
      if (!providerResponse.ok) {
        throw new Error(`Provider ${providerResponse.status}: ${await providerResponse.text()}`);
      }
      const providerBody = await providerResponse.json() as {
        response?: ApiFixture[];
        errors?: unknown;
      };
      if (!Array.isArray(providerBody.response)) {
        throw new Error(`Provider returned no fixtures: ${JSON.stringify(providerBody.errors ?? {})}`);
      }

      for (const match of providerBody.response) {
        const competitionRows = await rest(
          "competitions?on_conflict=provider,provider_external_id",
          {
            method: "POST",
            body: JSON.stringify({
              sport_id: "football",
              provider: "api-football",
              provider_external_id: String(match.league.id),
              name: match.league.name,
              country: match.league.country ?? null,
              updated_at: new Date().toISOString(),
            }),
          },
        ) as Array<{ id: string }>;
        const isHome = String(match.teams.home.id) === team.provider_external_id;
        const opponent = isHome ? match.teams.away : match.teams.home;
        await rest("sports_events?on_conflict=provider,provider_external_id,team_id", {
          method: "POST",
          body: JSON.stringify({
            provider: "api-football",
            provider_external_id: String(match.fixture.id),
            sport_id: "football",
            competition_id: competitionRows[0]?.id ?? null,
            team_id: team.id,
            season: match.league.season ? String(match.league.season) : null,
            opponent: opponent.name,
            home_away: isHome ? "home" : "away",
            starts_at: match.fixture.date,
            venue: match.fixture.venue?.name ?? null,
            status: normalizedStatus(match.fixture.status.short),
            home_score: match.goals?.home ?? null,
            away_score: match.goals?.away ?? null,
            provider_payload: match,
            updated_at: new Date().toISOString(),
          }),
        });
        imported += 1;
      }
    }

    return Response.json({ ok: true, teams: teams.length, fixtures: imported });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown sync error" },
      { status: 500 },
    );
  }
});
