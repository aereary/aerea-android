import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  PublishError,
  publishLibraryContent,
} from "./core.mjs";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BUCKET = "aerea-drive-library";
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function googleEmailFromToken(token: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`,
    );
    if (!response.ok) return null;
    const payload = await response.json();
    if (typeof payload?.email !== "string" || !payload.email.trim()) return null;
    if (payload.email_verified === false || payload.email_verified === "false") return null;
    return payload.email.trim().toLowerCase();
  } catch {
    return null;
  }
}

async function libraryOwnerExists(ownerEmail: string) {
  const { data, error } = await db.rpc("aerea_library_owner_exists", {
    p_owner_email: ownerEmail,
  });
  if (error) throw new PublishError("OWNER_LOOKUP_FAILED", 500);
  return data === true;
}

async function findLibraryItem(ownerEmail: string, driveFileId: string) {
  const { data, error } = await db
    .from("library_items")
    .select(
      "id,owner_user_id,owner_email,drive_file_id,sha256,extension,mime_type",
    )
    .eq("owner_email", ownerEmail)
    .eq("drive_file_id", driveFileId)
    .maybeSingle();
  if (error) throw new PublishError("LIBRARY_ITEM_LOOKUP_FAILED", 500);
  if (!data) return null;
  return {
    id: data.id,
    ownerUserId: data.owner_user_id,
    ownerEmail: data.owner_email,
    sha256: data.sha256,
    extension: data.extension,
    mimeType: data.mime_type,
  };
}

async function downloadDriveFile(driveFileId: string, token: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?alt=media&supportsAllDrives=true`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new PublishError("DRIVE_DOWNLOAD_FAILED", 502, {
      drive_status: response.status,
    });
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_FILE_BYTES) {
    throw new PublishError("DRIVE_FILE_TOO_LARGE", 413);
  }
  return bytes;
}

async function readContentObject(path: string) {
  const parts = path.split("/");
  const filename = parts.pop();
  const folder = parts.join("/");
  if (!filename || !folder) throw new PublishError("INVALID_CONTENT_PATH", 500);

  const { data: matches, error: listError } = await db.storage
    .from(BUCKET)
    .list(folder, { limit: 100, search: filename });
  if (listError) throw new PublishError("STORAGE_INSPECTION_FAILED", 502);
  if (!(matches ?? []).some((entry) => entry.name === filename)) return null;

  const { data, error } = await db.storage.from(BUCKET).download(path);
  if (error || !data) throw new PublishError("STORAGE_READ_FAILED", 502);
  return new Uint8Array(await data.arrayBuffer());
}

async function uploadContentObject(
  path: string,
  bytes: Uint8Array,
  contentType: string,
) {
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (!error) return "uploaded";
  const message = error.message.toLowerCase();
  if (message.includes("already exists") || message.includes("duplicate")) {
    return "already-exists";
  }
  throw new PublishError("STORAGE_UPLOAD_FAILED", 502);
}

async function saveContentObjectPath(input: {
  ownerUserId: string;
  itemId: string;
  sha256: string;
  contentObjectPath: string;
}) {
  const { data: itemRows, error: itemError } = await db
    .from("library_items")
    .update({ content_object_path: input.contentObjectPath })
    .eq("id", input.itemId)
    .eq("owner_user_id", input.ownerUserId)
    .eq("sha256", input.sha256)
    .select("id");
  if (itemError || itemRows?.length !== 1) {
    throw new PublishError("LIBRARY_ITEM_PATH_UPDATE_FAILED", 500);
  }

  const { data: versionRows, error: versionError } = await db
    .from("library_item_versions")
    .update({ content_object_path: input.contentObjectPath })
    .eq("library_item_id", input.itemId)
    .eq("owner_user_id", input.ownerUserId)
    .eq("sha256", input.sha256)
    .select("id");
  if (versionError) {
    throw new PublishError("LIBRARY_VERSION_PATH_UPDATE_FAILED", 500);
  }
  return versionRows?.length ?? 0;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return reply(405, { error: "POST only" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return reply(503, { error: "Supabase server environment is unavailable" });
  }

  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return reply(401, { error: "Missing Google OAuth token" });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return reply(400, { error: "Invalid JSON" });
  }

  try {
    const result = await publishLibraryContent(
      {
        googleOAuthToken: match[1],
        driveFileId: body.drive_file_id,
        expectedSha256: body.sha256,
        metadata: body.metadata,
      },
      {
        googleEmailFromToken,
        libraryOwnerExists,
        findLibraryItem,
        downloadDriveFile,
        readContentObject,
        uploadContentObject,
        saveContentObjectPath,
      },
    );
    return reply(200, result);
  } catch (error) {
    if (error instanceof PublishError) {
      return reply(error.status, {
        error: error.code,
        ...error.details,
        destructive_operations: 0,
      });
    }
    console.error("library-content-publish failed", error);
    return reply(500, {
      error: "LIBRARY_CONTENT_PUBLISH_FAILED",
      destructive_operations: 0,
    });
  }
});
