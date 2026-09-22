import { createClient } from "npm:@supabase/supabase-js@2";
import { googleEmailFromToken } from "../_shared/google-auth.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const HEADERS = { "content-type": "application/json; charset=utf-8" };
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function requireOwner(
  req: Request,
): Promise<{ email: string } | { error: Response }> {
  const match = (req.headers.get("authorization") || "")
    .match(/^Bearer\s+(.+)$/i);
  if (!match) return { error: reply(401, { error: "Missing Google OAuth token" }) };

  const email = await googleEmailFromToken(match[1]);
  if (!email) {
    return { error: reply(403, { error: "Google token has no verified email" }) };
  }

  const { data, error } = await db.rpc("aerea_library_owner_exists", {
    p_owner_email: email,
  });
  if (error || data !== true) {
    return { error: reply(403, { error: "Unknown library owner" }) };
  }

  return { email };
}

function validChannelId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value);
}

function validToken(value: unknown): value is string {
  return typeof value === "string" && value.length >= 32 && value.length <= 256;
}

function validGeneration(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

async function handleNotification(req: Request) {
  const channelId = req.headers.get("x-goog-channel-id") || "";
  const channelToken = req.headers.get("x-goog-channel-token") || "";
  const resourceId = req.headers.get("x-goog-resource-id") || "";
  const messageNumber = req.headers.get("x-goog-message-number") || "";
  const resourceState = req.headers.get("x-goog-resource-state") || "";

  if (!validChannelId(channelId) || !validToken(channelToken)) {
    return reply(401, { error: "Invalid notification channel" });
  }

  const { data, error } = await db.rpc("aerea_mark_drive_sync_pending", {
    p_channel_id: channelId,
    p_token_hash: await sha256(channelToken),
    p_resource_id: resourceId,
    p_message_number: messageNumber,
    p_resource_state: resourceState,
  });

  if (error) return reply(500, { error: "Could not record notification" });
  if (data == null) return reply(401, { error: "Unknown notification channel" });
  return new Response(null, { status: 204 });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });

  if (req.headers.has("x-goog-channel-id")) {
    return handleNotification(req);
  }

  const owner = await requireOwner(req);
  if ("error" in owner) return owner.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Invalid JSON" });
  }

  const action = String(body.action || "").toLowerCase();

  if (action === "register") {
    const channelId = body.channel_id;
    const channelToken = body.channel_token;
    const resourceId = typeof body.resource_id === "string" && body.resource_id
      ? body.resource_id
      : null;
    const expiresAtMs = Number(body.channel_expires_at_ms);

    if (!validChannelId(channelId) || !validToken(channelToken)) {
      return reply(400, { error: "Invalid channel registration" });
    }
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      return reply(400, { error: "Invalid channel expiration" });
    }

    const values = {
      active: true,
      channel_id: channelId,
      channel_token_hash: await sha256(channelToken),
      resource_id: resourceId,
      channel_expires_at: new Date(expiresAtMs).toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    };

    const { data: current, error: readError } = await db
      .from("aerea_drive_sync_signal")
      .select("singleton")
      .eq("singleton", true)
      .maybeSingle();
    if (readError) return reply(500, { error: "Could not inspect registration" });

    const result = current
      ? await db.from("aerea_drive_sync_signal").update(values).eq("singleton", true)
      : await db.from("aerea_drive_sync_signal").insert({ singleton: true, ...values });
    if (result.error) return reply(500, { error: "Could not save registration" });

    return reply(200, {
      mode: "registered",
      owner: owner.email,
      channel_id: channelId,
      channel_expires_at: values.channel_expires_at,
      destructive_operations: 0,
    });
  }

  if (action === "claim") {
    const { data, error } = await db
      .from("aerea_drive_sync_signal")
      .select("active,pending,generation,channel_expires_at,last_notification_at")
      .eq("singleton", true)
      .maybeSingle();
    if (error) return reply(500, { error: "Could not inspect signal" });

    if (!data?.active || !data.pending) {
      return reply(200, { mode: "claim", should_sync: false });
    }

    await db
      .from("aerea_drive_sync_signal")
      .update({ last_claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("singleton", true);

    return reply(200, {
      mode: "claim",
      should_sync: true,
      generation: Number(data.generation),
      channel_expires_at: data.channel_expires_at,
      last_notification_at: data.last_notification_at,
    });
  }

  if (action === "complete") {
    const generation = Number(body.generation);
    const success = body.success === true;
    if (!validGeneration(generation)) {
      return reply(400, { error: "Invalid generation" });
    }

    const now = new Date().toISOString();
    let query = db
      .from("aerea_drive_sync_signal")
      .update(success
        ? { pending: false, last_completed_at: now, last_error: null, updated_at: now }
        : { last_error: String(body.error || "Sync failed").slice(0, 2000), updated_at: now })
      .eq("singleton", true)
      .eq("generation", generation)
      .select("generation");

    const { data, error } = await query;
    if (error) return reply(500, { error: "Could not complete signal" });

    return reply(200, {
      mode: "complete",
      success,
      acknowledged: (data || []).length === 1,
    });
  }

  if (action === "deactivate") {
    const { error } = await db
      .from("aerea_drive_sync_signal")
      .update({ active: false, pending: false, updated_at: new Date().toISOString() })
      .eq("singleton", true);
    if (error) return reply(500, { error: "Could not deactivate channel" });
    return reply(200, { mode: "deactivated", destructive_operations: 0 });
  }

  if (action === "status") {
    const { data, error } = await db
      .from("aerea_drive_sync_signal")
      .select("active,pending,generation,channel_expires_at,last_notification_at,last_claimed_at,last_completed_at,last_error")
      .eq("singleton", true)
      .maybeSingle();
    if (error) return reply(500, { error: "Could not inspect signal" });
    return reply(200, { mode: "status", owner: owner.email, signal: data });
  }

  return reply(400, { error: "Unknown action" });
});
