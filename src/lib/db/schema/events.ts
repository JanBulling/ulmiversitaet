import { sql } from "drizzle-orm";
import { check, date, index, text, uuid } from "drizzle-orm/pg-core";

import { createdAt, ulmiversitaet, updatedAt } from "./common";

/**
 * Events shown on the home page, managed in the admin dashboard.
 * Without times an event lasts the whole day(s); without `end_time` it is "open end".
 */
export const events = ulmiversitaet.table(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    /** Hex color, e.g. `#f83a22` */
    color: text("color"),

    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    /** `HH:MM`, local time (Europe/Berlin) */
    startTime: text("start_time"),
    endTime: text("end_time"),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("events_end_date_idx").on(t.endDate),
    check("events_dates_check", sql`end_date >= start_date`),
    check(
      "events_times_check",
      sql`(start_time is null or start_time ~ '^\\d{2}:\\d{2}$') and (end_time is null or end_time ~ '^\\d{2}:\\d{2}$')`,
    ),
  ],
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
