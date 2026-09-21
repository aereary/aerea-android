import { createClient } from "npm:@supabase/supabase-js@2";
import { googleEmailFromToken } from "../_shared/google-auth.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const BUCKET = "aerea-drive-library";
const H = { "content-type": "application/json; charset=utf-8" };
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: H });

async function ownerContext(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return { error: reply(401, { error: "Missing Google OAuth token" }) };

  const email = await googleEmailFromToken(m[1]);
  if (!email) return { error: reply(403, { error: "Google token has no verified email" }) };

  const { data: ownerCheck, error: ownerError } = await db
    .from("ao3_works")
    .select("owner_email")
    .eq("owner_email", email)
    .limit(1);

  if (ownerError || !ownerCheck?.length) {
    return { error: reply(403, { error: "This Google account is not the aérea library owner" }) };
  }

  const { data: usersData, error: usersError } = await db.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) return { error: reply(500, { error: "Could not resolve app owner" }) };

  const user = usersData.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) return { error: reply(403, { error: "No matching aérea app account" }) };

  return { email, userId: user.id };
}

function validDriveId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{10,200}$/.test(value);
}

function validSha(value: unknown): value is string {
  return typeof value === "string" && /^[A-Fa-f0-9]{64}$/.test(value);
}

function validKind(value: unknown): value is "pdf" | "epub" | "document" | "file" {
  return ["pdf", "epub", "document", "file"].includes(String(value));
}

function safeExt(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.toLowerCase().replace(/^\./, "").replace(/[^a-z0-9]/g, "").slice(0, 12);
}

function normalizeItem(raw: any) {
  const driveId = raw?.drive_file_id;
  const filename = typeof raw?.filename === "string" ? raw.filename.trim() : "";
  const kind = raw?.kind;
  const size = Number(raw?.size_bytes);
  const modified = typeof raw?.source_modified_at === "string" ? raw.source_modified_at : null;
  const mime = typeof raw?.mime_type === "string" && raw.mime_type.trim()
    ? raw.mime_type.trim()
    : "application/octet-stream";
  const extension = safeExt(raw?.extension);
  const title = typeof raw?.title === "string" && raw.title.trim() ? raw.title.trim() : null;
  const author = typeof raw?.author === "string" && raw.author.trim() ? raw.author.trim() : null;

  if (!validDriveId(driveId)) return { error: "INVALID_DRIVE_FILE_ID" };
  if (!filename) return { error: "MISSING_FILENAME" };
  if (!validKind(kind)) return { error: "INVALID_KIND" };
  if (!Number.isFinite(size) || size < 0 || size > 40 * 1024 * 1024) {
    return { error: "INVALID_SIZE" };
  }
  if (modified && !Number.isFinite(Date.parse(modified))) {
    return { error: "INVALID_MODIFIED_TIME" };
  }

  return {
    drive_file_id: driveId,
    filename,
    kind,
    mime_type: mime,
    extension,
    size_bytes: Math.trunc(size),
    source_modified_at: modified,
    title,
    author,
  };
}

function sameTime(a: unknown, b: unknown) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const aa = Date.parse(String(a));
  const bb = Date.parse(String(b));
  return Number.isFinite(aa) && Number.isFinite(bb) && aa === bb;
}

async function objectExists(storagePath: string) {
  const pieces = storagePath.split("/");
  const name = pieces.pop();
  const folder = pieces.join("/");
  if (!name || !folder) return false;
  const { data, error } = await db.storage.from(BUCKET).list(folder, {
    limit: 100,
    search: name,
  });
  if (error) throw error;
  return (data ?? []).some((item) => item.name === name);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply(405, { error: "POST only" });

  const owner = await ownerContext(req);
  if ("error" in owner) return owner.error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Invalid JSON" });
  }

  const action = String(body?.action || "").toLowerCase();

  if (action === "probe") {
    const [{ count: items }, { count: versions }] = await Promise.all([
      db.from("library_items").select("id", { head: true, count: "exact" }).eq("owner_user_id", owner.userId),
      db.from("library_item_versions").select("id", { head: true, count: "exact" }).eq("owner_user_id", owner.userId),
    ]);
    return reply(200, {
      mode: "probe",
      owner: owner.email,
      items: items ?? 0,
      versions: versions ?? 0,
      destructive_operations: 0,
    });
  }

  if (action === "preview") {
    const raw = Array.isArray(body?.current_items) ? body.current_items : [];
    if (raw.length > 5000) return reply(400, { error: "Too many current items" });

    const warnings: any[] = [];
    const current: any[] = [];
    const seen = new Set<string>();

    for (const row of raw) {
      const item: any = normalizeItem(row);
      if (item.error) {
        warnings.push({ type: item.error, filename: row?.filename ?? null });
        continue;
      }
      if (seen.has(item.drive_file_id)) {
        warnings.push({ type: "DUPLICATE_DRIVE_FILE_ID", drive_file_id: item.drive_file_id });
        continue;
      }
      seen.add(item.drive_file_id);
      current.push(item);
    }

    const { data: existing, error } = await db
      .from("library_items")
      .select("drive_file_id,filename,kind,mime_type,extension,size_bytes,source_modified_at,sha256,storage_path")
      .eq("owner_user_id", owner.userId);
    if (error) return reply(500, { error: "Database read failed" });

    const byDrive = new Map((existing ?? []).map((x: any) => [x.drive_file_id, x]));
    const actions: any[] = [];
    let unchanged = 0;

    for (const item of current) {
      const old: any = byDrive.get(item.drive_file_id);
      if (!old) {
        actions.push({ action: "new", ...item });
        continue;
      }
      const changed =
        old.filename !== item.filename ||
        old.kind !== item.kind ||
        (old.mime_type || "application/octet-stream") !== item.mime_type ||
        (old.extension || "") !== item.extension ||
        Number(old.size_bytes || 0) !== item.size_bytes ||
        !sameTime(old.source_modified_at, item.source_modified_at);

      if (changed) actions.push({ action: "updated", ...item, previous_sha256: old.sha256 });
      else unchanged++;
    }

    const currentIds = new Set(current.map((x: any) => x.drive_file_id));
    const retainedMissing = (existing ?? []).filter((x: any) => !currentIds.has(x.drive_file_id)).length;

    return reply(200, {
      mode: "preview",
      owner: owner.email,
      current_items_received: raw.length,
      valid_current_items: current.length,
      database_items: (existing ?? []).length,
      unchanged_items: unchanged,
      new_items: actions.filter((x) => x.action === "new").length,
      updated_items: actions.filter((x) => x.action === "updated").length,
      retained_missing_from_drive: retainedMissing,
      actions,
      warnings,
      destructive_operations: 0,
    });
  }

  if (action === "ticket") {
    const item: any = normalizeItem(body?.item);
    if (item.error) return reply(409, { error: item.error });
    const sha = typeof body?.sha256 === "string" ? body.sha256.toUpperCase() : "";
    if (!validSha(sha)) return reply(409, { error: "INVALID_SHA256" });

    const suffix = item.extension ? `.${item.extension}` : "";
    const storagePath = `${owner.userId}/${item.drive_file_id}/${sha}${suffix}`;

    try {
      if (await objectExists(storagePath)) {
        return reply(200, {
          mode: "ticket",
          storage_path: storagePath,
          upload_required: false,
          destructive_operations: 0,
        });
      }
    } catch {
      return reply(500, { error: "Could not inspect Storage" });
    }

    const { data, error } = await db.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: true });
    if (error || !data?.signedUrl) {
      return reply(500, { error: "Could not create signed upload URL", detail: error?.message ?? null });
    }

    return reply(200, {
      mode: "ticket",
      storage_path: storagePath,
      upload_required: true,
      signed_url: data.signedUrl,
      token: data.token ?? null,
      destructive_operations: 0,
    });
  }

  if (action === "commit") {
    const item: any = normalizeItem(body?.item);
    if (item.error) return reply(409, { error: item.error });
    const sha = typeof body?.sha256 === "string" ? body.sha256.toUpperCase() : "";
    const storagePath = typeof body?.storage_path === "string" ? body.storage_path : "";
    if (!validSha(sha)) return reply(409, { error: "INVALID_SHA256" });

    const expectedPrefix = `${owner.userId}/${item.drive_file_id}/${sha}`;
    if (!storagePath.startsWith(expectedPrefix)) {
      return reply(409, { error: "STORAGE_PATH_MISMATCH" });
    }

    try {
      if (!(await objectExists(storagePath))) {
        return reply(409, { error: "STORAGE_OBJECT_MISSING" });
      }
    } catch {
      return reply(500, { error: "Could not verify Storage object" });
    }

    const { data: before, error: beforeErr } = await db
      .from("library_items")
      .select("id,sha256")
      .eq("owner_user_id", owner.userId)
      .eq("drive_file_id", item.drive_file_id)
      .maybeSingle();
    if (beforeErr) return reply(500, { error: "Could not read current library item" });

    const { data: saved, error: saveErr } = await db
      .from("library_items")
      .upsert({
        owner_user_id: owner.userId,
        owner_email: owner.email,
        drive_file_id: item.drive_file_id,
        filename: item.filename,
        title: item.title,
        author: item.author,
        kind: item.kind,
        mime_type: item.mime_type,
        extension: item.extension || null,
        size_bytes: item.size_bytes,
        sha256: sha,
        storage_path: storagePath,
        source_modified_at: item.source_modified_at,
        source: "drive",
        archived: false,
      }, { onConflict: "owner_user_id,drive_file_id" })
      .select("id")
      .single();

    if (saveErr || !saved) {
      return reply(409, { error: "Could not save library item", detail: saveErr?.message ?? null });
    }

    const { data: oldVersion, error: versionReadErr } = await db
      .from("library_item_versions")
      .select("id")
      .eq("owner_user_id", owner.userId)
      .eq("drive_file_id", item.drive_file_id)
      .eq("sha256", sha)
      .maybeSingle();
    if (versionReadErr) return reply(500, { error: "Could not inspect version history" });

    if (!oldVersion) {
      const { error: versionErr } = await db.from("library_item_versions").insert({
        library_item_id: saved.id,
        owner_user_id: owner.userId,
        owner_email: owner.email,
        drive_file_id: item.drive_file_id,
        sha256: sha,
        storage_path: storagePath,
        filename: item.filename,
        title: item.title,
        author: item.author,
        kind: item.kind,
        mime_type: item.mime_type,
        extension: item.extension || null,
        size_bytes: item.size_bytes,
        source_modified_at: item.source_modified_at,
      });
      if (versionErr) {
        return reply(409, { error: "Could not save immutable file version", detail: versionErr.message });
      }
    }

    return reply(200, {
      mode: "commit",
      result: before ? (before.sha256 === sha ? "metadata_refreshed" : "updated") : "new",
      drive_file_id: item.drive_file_id,
      item_id: saved.id,
      version_inserted: !oldVersion,
      destructive_operations: 0,
    });
  }

  return reply(400, { error: "Unknown action" });
});
