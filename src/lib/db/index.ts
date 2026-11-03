import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Neon serverless (HTTP) driver. Use `db.batch([...])` for statements that must run
 * in one transaction. Wrap reads in `"use cache"` functions.
 */
export const db = drizzle({
  client: neon(env.NEON_DATABASE_URL),
  schema,
});
