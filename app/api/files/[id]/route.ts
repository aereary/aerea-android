import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { getRuntimeEnv } from "../../../../db/runtime";
import { studyFiles } from "../../../../db/schema";
import { authenticatedUserId, unauthorized } from "../../user";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();
  const { BUCKET } = getRuntimeEnv();
  const { id } = await context.params;

  const db = getDb();
  const [file] = await db
    .select()
    .from(studyFiles)
    .where(and(eq(studyFiles.id, id), eq(studyFiles.userId, userId)))
    .limit(1);

  if (!file) return new Response("File not found", { status: 404 });
  const object = await BUCKET.get(file.objectKey);
  if (!object) return new Response("Stored file not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "content-type": file.mediaType,
      "content-length": String(file.size),
      "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "cache-control": "private, max-age=60",
    },
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();
  const { BUCKET } = getRuntimeEnv();
  const { id } = await context.params;

  const db = getDb();
  const [file] = await db
    .select()
    .from(studyFiles)
    .where(and(eq(studyFiles.id, id), eq(studyFiles.userId, userId)))
    .limit(1);

  if (!file) return new Response("File not found", { status: 404 });
  await BUCKET.delete(file.objectKey);
  await db
    .delete(studyFiles)
    .where(and(eq(studyFiles.id, id), eq(studyFiles.userId, userId)));

  return Response.json({ deleted: true });
}
