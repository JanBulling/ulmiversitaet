import "server-only";

import { and, asc, gte, lte, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import type { IsoDate } from "@/lib/date";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { EVENTS_CACHE_TAG } from "./cache";

/** Events that haven't ended before `from`, soonest first */
export async function getUpcomingEvents(from: IsoDate, limit = 6) {
  "use cache";
  cacheTag(EVENTS_CACHE_TAG);
  cacheLife("hours");

  return db
    .select()
    .from(events)
    .where(gte(events.endDate, from))
    .orderBy(
      asc(events.startDate),
      asc(sql`coalesce(${events.startTime}, '00:00')`),
    )
    .limit(limit);
}

/** Events overlapping `from`…`to` (inclusive), for the calendar */
export async function getEventsBetween(from: IsoDate, to: IsoDate) {
  "use cache";
  cacheTag(EVENTS_CACHE_TAG);
  cacheLife("hours");

  return db
    .select({
      id: events.id,
      title: events.title,
      color: events.color,
      startDate: events.startDate,
      endDate: events.endDate,
    })
    .from(events)
    .where(and(gte(events.endDate, from), lte(events.startDate, to)))
    .orderBy(asc(events.startDate));
}
