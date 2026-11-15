import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Neon serverless (HTTP) driver. Use `db.batch([...])` for statements that must run
 * in one transaction.
 *
 * Wrap public reads in `"use cache: remote"` functions: plain `"use cache"` only lives in the
 * memory of one serverless instance, so on Vercel most requests would reach the database and
 * keep it from suspending.
 */
export const db = drizzle({
  client: neon(env.NEON_DATABASE_URL),
  schema,
  logger: {
    // Shows in the Vercel logs when (and by which route) the database is woken up.
    // Without the parameters, they may contain comments.
    logQuery: (query) => console.info(`[db] ${query.slice(0, 160)}`),
  },
});
