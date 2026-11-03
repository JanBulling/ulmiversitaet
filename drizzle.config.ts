import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"], quiet: true });

/**
 * All tables live in the Postgres schema `ulmiversitaet`. The legacy tables of the
 * old deployments (`public.mensa_*`, `public.ulmiversitaet_*`) are ignored.
 */
export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // A role with DDL rights, falling back to the app role
    url:
      process.env.NEON_DATABASE_URL_ADMIN ??
      process.env.NEON_DATABASE_URL ??
      "",
  },
  schemaFilter: ["ulmiversitaet"],
  strict: true,
  verbose: true,
});
