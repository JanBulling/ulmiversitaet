import type { createFormatter } from "next-intl";

import { toDate } from "@/lib/date";
import type { Event } from "@/lib/db/schema";

type Formatter = ReturnType<typeof createFormatter>;

/** Color of events without their own color */
export const DEFAULT_EVENT_COLOR = "#f83a22";

/** "Mi., 4. Nov." or "4. Nov. – 6. Nov." */
export function formatEventDates(format: Formatter, event: Event): string {
  const day = (date: string, withWeekday: boolean) =>
    format.dateTime(toDate(date), {
      ...(withWeekday && { weekday: "short" }),
      day: "numeric",
      month: "short",
    });

  return event.startDate === event.endDate
    ? day(event.startDate, true)
    : `${day(event.startDate, false)} – ${day(event.endDate, false)}`;
}

/** "18:00–22:00", "ab 18:00" (open end), or null for whole-day events */
export function formatEventTimes(
  event: Event,
  openEnd: (time: string) => string,
): string | null {
  if (!event.startTime) return null;
  return event.endTime
    ? `${event.startTime}–${event.endTime}`
    : openEnd(event.startTime);
}
