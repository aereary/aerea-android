import { createClient } from "npm:@supabase/supabase-js@2";
import { googleEmailFromToken } from "../_shared/google-auth.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const H = { "content-type": "application/json; charset=utf-8" };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: H });

function validSha(v: unknown): v is string {
  return typeof v === "string" && /^[A-Fa-f0-9]{64}$/.test(v);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return reply(401, { error: "Missing Google OAuth token" });
  const email = await googleEmailFromToken(m[1]);
  if (!email) return reply(403, { error: "Google token has no verified email" });

  let body: any;
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid JSON" }); }
  const raw = Array.isArray(body?.changes) ? body.changes : [];
  if (raw.length > 100) return reply(400, { error: "Too many changes" });

  const warnings: any[] = [];
  const valid: any[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const action = typeof item?.action === "string" ? item.action.toLowerCase() : "";
    const driveId = typeof item?.drive_file_id === "string" ? item.drive_file_id : "";
    const filename = typeof item?.filename === "string" ? item.filename : "";
    const sha = typeof item?.sha256 === "string" ? item.sha256.toUpperCase() : "";
    const previousSha = typeof item?.previous_sha256 === "string" ? item.previous_sha256.toUpperCase() : null;
    const kind = typeof item?.kind === "string" ? item.kind.toLowerCase() : "";
    const storagePath = typeof item?.storage_path === "string" ? item.storage_path : "";

    if (!["new","updated","metadata","relinked"].includes(action) || !driveId || !filename || !validSha(sha) || !["pdf","epub","document","file"].includes(kind) || !storagePath) {
      warnings.push({ type: "INVALID_ITEM", drive_file_id: driveId || null, filename: filename || null });
      continue;
    }
    if (action !== "new" && !validSha(previousSha)) {
      warnings.push({ type: "MISSING_PREVIOUS_SHA256", drive_file_id: driveId });
      continue;
    }
    if (action === "new" || action === "updated") {
      const snapshotDriveId = typeof item?.snapshot_drive_file_id === "string" ? item.snapshot_drive_file_id : "";
      const snapshotFilename = typeof item?.snapshot_filename === "string" ? item.snapshot_filename : "";
      const snapshotStoragePath = typeof item?.snapshot_storage_path === "string" ? item.snapshot_storage_path : "";
      if (!snapshotDriveId || !snapshotFilename || !snapshotStoragePath || !snapshotFilename.toUpperCase().includes(sha)) {
        warnings.push({ type: "MISSING_OR_INVALID_PROTECTED_SNAPSHOT", drive_file_id: driveId });
        continue;
      }
    }
    if (seen.has(driveId)) {
      warnings.push({ type: "DUPLICATE_DRIVE_FILE", drive_file_id: driveId });
      continue;
    }
    seen.add(driveId);
    valid.push({ ...item, action, drive_file_id: driveId, filename, sha256: sha, previous_sha256: previousSha, kind, storage_path: storagePath });
  }

  if (warnings.length || valid.length !== raw.length) {
    return reply(409, { error: "Generic library apply refused", warnings, received: raw.length, valid: valid.length, destructive_operations: 0 });
  }

  const { data, error } = await db.rpc("aerea_apply_library_sync_batch", { p_owner_email: email, p_items: valid });
  if (error) return reply(409, { error: "Atomic generic library sync failed", detail: error.message, warnings: [], destructive_operations: 0 });
  return reply(200, data);
});
