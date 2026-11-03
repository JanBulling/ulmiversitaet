import { sql } from "drizzle-orm";
import { pgSchema, text, timestamp } from "drizzle-orm/pg-core";

/** One Postgres schema for every table of the website */
export const ulmiversitaet = pgSchema("ulmiversitaet");

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

/**
 * Lower-case version of a name column without spaces or punctuation, computed by Postgres.
 * "Aprikosen Joghurt" and "Aprikosen-Joghurt" both become "aprikosenjoghurt".
 */
export const nameKey = (column: string) =>
  text("name_key")
    .notNull()
    .generatedAlwaysAs(
      sql.raw(`lower(regexp_replace("${column}", '[^[:alnum:]]+', '', 'g'))`),
    );
