import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { userStates } from "../../../db/schema";
import { authenticatedUserId, unauthorized } from "../user";

export async function GET(request: Request) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const [row] = await db
    .select()
    .from(userStates)
    .where(eq(userStates.userId, userId))
    .limit(1);

  if (!row) return Response.json({ state: null });

  try {
    return Response.json({ state: JSON.parse(row.data) });
  } catch {
    return Response.json({ state: null });
  }
}

export async function PUT(request: Request) {
  const userId = authenticatedUserId(request);
  if (!userId) return unauthorized();

  const payload = (await request.json()) as { state?: unknown };
  if (!payload || typeof payload.state !== "object" || payload.state === null) {
    return Response.json({ error: "state is required" }, { status: 400 });
  }

  const data = JSON.stringify(payload.state);
  if (data.length > 750_000) {
    return Response.json({ error: "state is too large" }, { status: 413 });
  }

  const db = getDb();
  await db
    .insert(userStates)
    .values({ userId, data })
    .onConflictDoUpdate({
      target: userStates.userId,
      set: { data, updatedAt: new Date().toISOString() },
    });

  return Response.json({ saved: true });
}
