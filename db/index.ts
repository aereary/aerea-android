import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getRuntimeEnv } from "./runtime";

export function getDb() {
  return drizzle(getRuntimeEnv().DB, { schema });
}
