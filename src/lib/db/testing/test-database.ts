import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "../schema";

/**
 * In-memory Postgres (PGlite) with all migrations applied, for tests.
 * Behaves like Neon for everything we use (schemas, generated columns, pg_trgm).
 */
export async function createTestDatabase() {
  const client = new PGlite({ extensions: { pg_trgm } });
  const db = drizzle({ client, schema });
  await migrate(db, {
    migrationsFolder: path.resolve(import.meta.dirname, "../migrations"),
  });
  return { db, close: () => client.close() };
}
