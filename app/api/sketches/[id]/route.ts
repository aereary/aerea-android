import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { getRuntimeEnv } from "../../../../db/runtime";
import { sketchPages } from "../../../../db/schema";
import { authenticatedUserId, unauthorized } from "../../user";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();
  const { BUCKET } = getRuntimeEnv();

  const { id } = await context.params;
  const db = getDb();
  const [page] = await db
    .select()
    .from(sketchPages)
    .where(and(eq(sketchPages.id, id), eq(sketchPages.userId, userId)))
    .limit(1);

  if (!page) return new Response("Sketch not found", { status: 404 });
  const object = await BUCKET.get(page.objectKey);
  if (!object) return new Response("Sketch file not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "image/png",
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
  const [page] = await db
    .select()
    .from(sketchPages)
    .where(and(eq(sketchPages.id, id), eq(sketchPages.userId, userId)))
    .limit(1);

  if (!page) return new Response("Sketch not found", { status: 404 });
  await BUCKET.delete(page.objectKey);
  await db
    .delete(sketchPages)
    .where(and(eq(sketchPages.id, id), eq(sketchPages.userId, userId)));

  return Response.json({ deleted: true });
}
