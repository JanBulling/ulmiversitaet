import "server-only";

import { asc, gte, sql } from "drizzle-orm";
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
