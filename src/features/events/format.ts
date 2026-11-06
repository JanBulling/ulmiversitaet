import type { createFormatter } from "next-intl";

import { toDate } from "@/lib/date";
import type { Event } from "@/lib/db/schema";

type Formatter = ReturnType<typeof createFormatter>;

/** Muted preset colors offered in the admin form (any other color can still be picked) */
export const EVENT_COLOR_PRESETS = [
  { name: "red", value: "#c0564b" },
  { name: "orange", value: "#d0843f" },
  { name: "yellow", value: "#c9a43a" },
  { name: "green", value: "#5f9a6e" },
  { name: "teal", value: "#3f8f8f" },
  { name: "blue", value: "#4f74a8" },
  { name: "purple", value: "#7d64a3" },
  { name: "pink", value: "#b5607f" },
  { name: "gray", value: "#6b7280" },
] as const;

/** Color of events without their own color */
export const DEFAULT_EVENT_COLOR: string = EVENT_COLOR_PRESETS[0].value;

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
