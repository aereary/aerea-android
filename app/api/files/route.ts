import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { getRuntimeEnv } from "../../../db/runtime";
import { studyFiles } from "../../../db/schema";
import { authenticatedUserId, unauthorized } from "../user";

const MAX_STUDY_FILE_BYTES = 40 * 1024 * 1024;

function fileKind(file: File) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    file.type === "application/epub+zip" ||
    name.endsWith(".epub")
  ) {
    return "epub";
  }
  return "file";
}

async function ownerPrefix(userId: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(userId),
  );
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET(request: Request) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const files = await db
    .select({
      id: studyFiles.id,
      name: studyFiles.name,
      mediaType: studyFiles.mediaType,
      kind: studyFiles.kind,
      size: studyFiles.size,
      createdAt: studyFiles.createdAt,
      updatedAt: studyFiles.updatedAt,
    })
    .from(studyFiles)
    .where(eq(studyFiles.userId, userId))
    .orderBy(desc(studyFiles.updatedAt));

  return Response.json({ files });
}

export async function POST(request: Request) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();
  const { BUCKET } = getRuntimeEnv();

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose a file to import." }, { status: 400 });
  }
  if (file.size > MAX_STUDY_FILE_BYTES) {
    return Response.json(
      { error: "This file is larger than 40 MB." },
      { status: 413 },
    );
  }

  const id = crypto.randomUUID();
  const kind = fileKind(file);
  const mediaType =
    file.type ||
    (kind === "pdf"
      ? "application/pdf"
      : kind === "epub"
        ? "application/epub+zip"
        : "application/octet-stream");
  const safeName = file.name.trim().slice(0, 180) || `Imported ${kind}`;
  const objectKey = `study-files/${await ownerPrefix(userId)}/${id}`;

  await BUCKET.put(objectKey, file.stream(), {
    httpMetadata: {
      contentType: mediaType,
      contentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    },
    customMetadata: { originalName: safeName, kind },
  });

  const db = getDb();
  await db.insert(studyFiles).values({
    id,
    userId,
    name: safeName,
    mediaType,
    kind,
    size: file.size,
    objectKey,
  });

  const now = new Date().toISOString();
  return Response.json(
    {
      file: {
        id,
        name: safeName,
        mediaType,
        kind,
        size: file.size,
        createdAt: now,
        updatedAt: now,
      },
    },
    { status: 201 },
  );
}
