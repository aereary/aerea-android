import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { getRuntimeEnv } from "../../../db/runtime";
import { sketchPages } from "../../../db/schema";
import { authenticatedUserId, unauthorized } from "../user";

export async function GET(request: Request) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const pages = await db
    .select({
      id: sketchPages.id,
      title: sketchPages.title,
      pageStyle: sketchPages.pageStyle,
      createdAt: sketchPages.createdAt,
      updatedAt: sketchPages.updatedAt,
    })
    .from(sketchPages)
    .where(eq(sketchPages.userId, userId))
    .orderBy(desc(sketchPages.updatedAt));

  return Response.json({ pages });
}

export async function POST(request: Request) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();
  const { BUCKET } = getRuntimeEnv();

  const form = await request.formData();
  const file = form.get("file");
  const title = String(form.get("title") || "Untitled page").trim();
  const pageStyle = String(form.get("pageStyle") || "plain");
  const allowedStyles = new Set(["grid", "lined", "dotted", "plain"]);

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "A drawing is required." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "This page is too large." }, { status: 413 });
  }
  if (!allowedStyles.has(pageStyle)) {
    return Response.json({ error: "Invalid page style." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const ownerKey = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(userId),
  );
  const ownerHash = Array.from(new Uint8Array(ownerKey))
    .slice(0, 12)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  const objectKey = `sketches/${ownerHash}/${id}.png`;

  await BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { contentType: "image/png" },
  });

  const db = getDb();
  await db.insert(sketchPages).values({
    id,
    userId,
    title: title || "Untitled page",
    pageStyle,
    objectKey,
  });

  return Response.json(
    {
      page: {
        id,
        title: title || "Untitled page",
        pageStyle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    { status: 201 },
  );
}
