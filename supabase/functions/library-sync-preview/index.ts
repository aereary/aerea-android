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

function sameInstant(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  const ta = Date.parse(String(a));
  const tb = Date.parse(String(b));
  if (Number.isNaN(ta) || Number.isNaN(tb)) return String(a) === String(b);
  return ta === tb;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return reply(401, { error: "Missing Google OAuth token" });
  const email = await googleEmailFromToken(m[1]);
  if (!email) return reply(403, { error: "Google token has no verified email" });

  const { data: ownerExists, error: ownerErr } = await db.rpc("aerea_library_owner_exists", { p_owner_email: email });
  if (ownerErr || ownerExists !== true) return reply(403, { error: "Unknown library owner" });

  let body: any;
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid JSON" }); }
  const raw = Array.isArray(body?.current_items) ? body.current_items : [];
  if (raw.length > 5000) return reply(400, { error: "Too many current items" });

  const warnings: any[] = [];
  const current: any[] = [];
  const seenDrive = new Set<string>();
  const seenPath = new Set<string>();

  for (const item of raw) {
    const driveId = typeof item?.drive_file_id === "string" ? item.drive_file_id : "";
    const sha = typeof item?.sha256 === "string" ? item.sha256.toUpperCase() : "";
    const filename = typeof item?.filename === "string" ? item.filename : "";
    const kind = typeof item?.kind === "string" ? item.kind.toLowerCase() : "";
    const storagePath = typeof item?.storage_path === "string" ? item.storage_path : "";
    if (!driveId || !filename || !storagePath || !validSha(sha) || !["pdf","epub","document","file"].includes(kind)) {
      warnings.push({ type: "INVALID_ITEM", drive_file_id: driveId || null, filename: filename || null });
      continue;
    }
    if (seenDrive.has(driveId)) {
      warnings.push({ type: "DUPLICATE_DRIVE_FILE", drive_file_id: driveId });
      continue;
    }
    if (seenPath.has(storagePath)) {
      warnings.push({ type: "DUPLICATE_STORAGE_PATH", storage_path: storagePath });
      continue;
    }
    seenDrive.add(driveId);
    seenPath.add(storagePath);
    current.push({ ...item, drive_file_id: driveId, sha256: sha, filename, kind, storage_path: storagePath });
  }

  const { data: existing, error } = await db.rpc("aerea_library_current_for_owner", { p_owner_email: email });
  if (error) return reply(500, { error: "Database read failed", detail: error.message });

  const byDrive = new Map<string, any>();
  const byPath = new Map<string, any>();
  const bySha = new Map<string, any[]>();
  for (const row of existing ?? []) {
    byDrive.set(row.drive_file_id, row);
    byPath.set(row.storage_path, row);
    const key = String(row.sha256).toUpperCase();
    const list = bySha.get(key) ?? [];
    list.push(row);
    bySha.set(key, list);
  }

  const currentDriveIds = new Set(current.map((x:any) => x.drive_file_id));
  const currentPaths = new Set(current.map((x:any) => x.storage_path));
  const changes: any[] = [];
  const matchedIds = new Set<string>();
  const duplicateDetails: any[] = [];
  let unchanged = 0;
  let metadataUpdates = 0;
  let updated = 0;
  let added = 0;
  let relinked = 0;
  let exactDuplicatesIgnored = 0;

  for (const item of current) {
    const oldByDrive = byDrive.get(item.drive_file_id);
    const oldByPath = byPath.get(item.storage_path);

    if (oldByDrive && oldByPath && oldByDrive.id !== oldByPath.id) {
      warnings.push({ type: "IDENTITY_COLLISION", drive_file_id: item.drive_file_id, storage_path: item.storage_path });
      continue;
    }

    let old = oldByDrive ?? oldByPath;

    if (!old) {
      const shaMatches = bySha.get(item.sha256) ?? [];
      if (shaMatches.length === 1) {
        const same = shaMatches[0];
        const canonicalStillPresent = currentDriveIds.has(same.drive_file_id) || currentPaths.has(same.storage_path);
        matchedIds.add(String(same.id));
        if (canonicalStillPresent) {
          exactDuplicatesIgnored++;
          duplicateDetails.push({ drive_file_id: item.drive_file_id, filename: item.filename, sha256: item.sha256, same_as_drive_file_id: same.drive_file_id });
          continue;
        }
        changes.push({ action: "relinked", ...item, previous_sha256: String(same.sha256).toUpperCase() });
        relinked++;
        continue;
      }
      if (shaMatches.length > 1) {
        warnings.push({ type: "AMBIGUOUS_SAME_SHA", drive_file_id: item.drive_file_id, sha256: item.sha256 });
        continue;
      }
      changes.push({ action: "new", ...item, previous_sha256: null });
      added++;
      continue;
    }

    matchedIds.add(String(old.id));

    if (String(old.sha256).toUpperCase() !== item.sha256) {
      changes.push({ action: "updated", ...item, previous_sha256: String(old.sha256).toUpperCase() });
      updated++;
      continue;
    }

    const metadataChanged =
      old.drive_file_id !== item.drive_file_id ||
      old.filename !== item.filename ||
      (old.title ?? null) !== (item.title ?? null) ||
      (old.author ?? null) !== (item.author ?? null) ||
      old.kind !== item.kind ||
      (old.mime_type ?? null) !== (item.mime_type ?? null) ||
      (old.extension ?? null) !== (item.extension ?? null) ||
      Number(old.size_bytes ?? 0) !== Number(item.size_bytes ?? 0) ||
      (old.storage_path ?? "") !== (item.storage_path ?? "") ||
      !sameInstant(old.source_modified_at, item.source_modified_at);

    if (metadataChanged) {
      changes.push({ action: "metadata", ...item, previous_sha256: String(old.sha256).toUpperCase() });
      metadataUpdates++;
    } else {
      unchanged++;
    }
  }

  return reply(200, {
    mode: "library_sync_preview",
    owner: email,
    current_items_received: raw.length,
    valid_current_items: current.length,
    database_items: (existing ?? []).length,
    unchanged_items: unchanged,
    new_items: added,
    updated_items: updated,
    metadata_updates: metadataUpdates,
    relinked_items: relinked,
    exact_duplicates_ignored: exactDuplicatesIgnored,
    exact_duplicate_details: duplicateDetails,
    changes,
    warnings,
    missing_from_drive_ignored: Math.max(0, (existing ?? []).length - matchedIds.size),
    destructive_operations: 0,
  });
});
