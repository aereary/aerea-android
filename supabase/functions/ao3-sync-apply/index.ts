import { createClient } from "npm:@supabase/supabase-js@2";
import { googleEmailFromToken } from "../_shared/google-auth.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const H = { "content-type": "application/json; charset=utf-8" };
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: H });

function validSha(value: unknown): value is string {
  return typeof value === "string" && /^[A-Fa-f0-9]{64}$/.test(value);
}

function stringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((x) => typeof x === "string");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });

  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return reply(401, { error: "Missing Google OAuth token" });

  const email = await googleEmailFromToken(m[1]);
  if (!email) return reply(403, { error: "Google token has no verified email" });

  const { data: ownerCheck, error: ownerError } = await db
    .from("ao3_works")
    .select("owner_email")
    .eq("owner_email", email)
    .limit(1);

  if (ownerError || !ownerCheck?.length) {
    return reply(403, { error: "This Google account is not an AO3 library owner" });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Invalid JSON" });
  }

  const raw = Array.isArray(body?.changes) ? body.changes : [];
  if (raw.length > 100) return reply(400, { error: "Too many changes in one batch" });

  const warnings: any[] = [];
  const valid: any[] = [];
  const seenExact = new Set<string>();

  for (const item of raw) {
    const action = typeof item?.action === "string" ? item.action.toLowerCase() : "";
    const workId = Number(item?.work_id);
    const sha = typeof item?.sha256 === "string" ? item.sha256.toUpperCase() : "";
    const previousSha = typeof item?.previous_sha256 === "string"
      ? item.previous_sha256.toUpperCase()
      : null;
    const currentDriveId = typeof item?.current_drive_file_id === "string"
      ? item.current_drive_file_id
      : "";
    const currentFilename = typeof item?.current_filename === "string"
      ? item.current_filename
      : "";

    if (!["new", "updated", "relinked", "alternative"].includes(action)) {
      warnings.push({ type: "INVALID_ACTION", work_id: item?.work_id });
      continue;
    }
    if (!Number.isInteger(workId) || workId <= 0) {
      warnings.push({ type: "INVALID_WORK_ID", value: item?.work_id });
      continue;
    }
    const exactKey = `${workId}|${sha}|${action}|${currentDriveId}`;
    if (seenExact.has(exactKey)) {
      warnings.push({ type: "DUPLICATE_ITEM_IN_BATCH", work_id: workId, action });
      continue;
    }
    seenExact.add(exactKey);

    if (!validSha(sha)) {
      warnings.push({ type: "INVALID_SHA256", work_id: workId });
      continue;
    }
    if (["updated", "relinked"].includes(action) && !validSha(previousSha)) {
      warnings.push({ type: "MISSING_PREVIOUS_SHA256", work_id: workId });
      continue;
    }
    if (!currentDriveId || !currentFilename) {
      warnings.push({ type: "MISSING_CURRENT_FILE", work_id: workId });
      continue;
    }

    const normalized: any = {
      ...item,
      action,
      work_id: workId,
      sha256: sha,
      previous_sha256: previousSha,
      current_drive_file_id: currentDriveId,
      current_filename: currentFilename,
    };

    if (["new", "updated", "alternative"].includes(action)) {
      const snapshotDriveId = typeof item?.snapshot_drive_file_id === "string"
        ? item.snapshot_drive_file_id
        : "";
      const snapshotFilename = typeof item?.snapshot_filename === "string"
        ? item.snapshot_filename
        : "";
      const metadata = item?.metadata;

      if (!snapshotDriveId || !snapshotFilename) {
        warnings.push({ type: "MISSING_PROTECTED_SNAPSHOT", work_id: workId });
        continue;
      }
      if (!snapshotFilename.toUpperCase().includes(sha)) {
        warnings.push({ type: "SNAPSHOT_FILENAME_SHA_MISMATCH", work_id: workId });
        continue;
      }
      if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        warnings.push({ type: "MISSING_METADATA", work_id: workId });
        continue;
      }
      if (Number(metadata.work_id) !== workId) {
        warnings.push({ type: "METADATA_WORK_ID_MISMATCH", work_id: workId });
        continue;
      }
      if (typeof metadata.title !== "string" || !metadata.title.trim()) {
        warnings.push({ type: "MISSING_TITLE", work_id: workId });
        continue;
      }

      for (const key of [
        "fandoms", "warnings", "characters", "relationships", "tags", "categories"
      ]) {
        if (!stringArray(metadata[key])) {
          warnings.push({ type: "INVALID_METADATA_ARRAY", work_id: workId, field: key });
        }
      }
      if (!Array.isArray(metadata.series)) {
        warnings.push({ type: "INVALID_SERIES", work_id: workId });
      }

      normalized.snapshot_drive_file_id = snapshotDriveId;
      normalized.snapshot_filename = snapshotFilename;
      normalized.metadata = metadata;
    }

    valid.push(normalized);
  }

  if (warnings.length > 0 || valid.length !== raw.length) {
    return reply(409, {
      error: "Sync apply refused because payload validation failed",
      warnings,
      received: raw.length,
      valid: valid.length,
      destructive_operations: 0,
    });
  }

  const manifestSha = typeof body?.manifest_sha256 === "string"
    ? body.manifest_sha256.toUpperCase()
    : null;

  if (manifestSha && !validSha(manifestSha)) {
    return reply(409, {
      error: "Invalid manifest SHA256",
      warnings: [{ type: "INVALID_MANIFEST_SHA256" }],
      destructive_operations: 0,
    });
  }

  const { data, error } = await db.rpc("aerea_apply_ao3_sync_batch_v3", {
    p_owner_email: email,
    p_items: valid,
    p_manifest_sha256: manifestSha,
  });

  if (error) {
    return reply(409, {
      error: "Atomic sync apply failed; the transaction was rolled back",
      detail: error.message,
      warnings: [],
      destructive_operations: 0,
    });
  }

  return reply(200, data);
});
