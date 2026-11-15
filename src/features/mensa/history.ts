import { cacheLife } from "next/cache";

import { TODAY_CACHE_LIFE } from "@/lib/cache";
import { addDays, today, type IsoDate } from "@/lib/date";

/**
 * Menus this many days around today are open to everyone. Older (and later) days and their
 * meals need the human check: bots crawl them by the thousand, and every one of them would
 * wake up the database.
 */
export const OPEN_MENU_DAYS = 14;

/** First and last day open to everyone */
export function openMenuDays(now: IsoDate): { from: IsoDate; to: IsoDate } {
  return {
    from: addDays(now, -OPEN_MENU_DAYS),
    to: addDays(now, OPEN_MENU_DAYS),
  };
}

export function isOpenMenuDay(date: IsoDate, now: IsoDate): boolean {
  const { from, to } = openMenuDays(now);
  return date >= from && date <= to;
}

/**
 * `isOpenMenuDay` for the current day. Cached, because pages are prerendered per date, where
 * `today()` may only be read in a cache scope; revalidates every 30 minutes for the change of day.
 */
export async function isOpenMenuDayToday(date: IsoDate): Promise<boolean> {
  "use cache";
  cacheLife(TODAY_CACHE_LIFE);
  return isOpenMenuDay(date, today());
}
