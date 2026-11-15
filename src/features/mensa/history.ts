import { addDays, type IsoDate } from "@/lib/date";

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
