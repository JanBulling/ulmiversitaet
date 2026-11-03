import "server-only";

import { asc, desc, eq, gte, lt } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/session";
import type { IsoDate } from "@/lib/date";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";

/** Upcoming events (soonest first) and past events (most recent first) */
export async function listEvents(today: IsoDate) {
  await requireAdmin();

  const [upcoming, past] = await Promise.all([
    db
      .select()
      .from(events)
      .where(gte(events.endDate, today))
      .orderBy(asc(events.startDate), asc(events.startTime)),
    db
      .select()
      .from(events)
      .where(lt(events.endDate, today))
      .orderBy(desc(events.startDate))
      .limit(20),
  ]);

  return { upcoming, past };
}

export async function getEvent(id: string) {
  await requireAdmin();
  const [event] = await db.select().from(events).where(eq(events.id, id));
  return event ?? null;
}
