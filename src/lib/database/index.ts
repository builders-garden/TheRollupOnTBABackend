import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as dbSchema from "./db.schema";
import { env } from "../../config/env";

export const tursoClient = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_DATABASE_TOKEN,
});

export const db = drizzle(tursoClient, {
  schema: { ...dbSchema },
});
