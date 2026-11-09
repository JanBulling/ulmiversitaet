import { timeOfDay, today, type IsoDate } from "@/lib/date";

/** The mensa opens at 11:30; before that nobody has eaten the meal yet */
export const RATING_OPENS_AT = "11:30";

/**
 * Whether a meal can be rated now: only on a day it is served, from the opening of the mensa
 * until midnight (Berlin time). Checked in the rating form and again in the Server Action.
 */
export type RatingWindow = "open" | "tooEarly" | "notToday";

export function ratingWindow(
  servedOn: IsoDate[],
  now: Date = new Date(),
): RatingWindow {
  if (!servedOn.includes(today(now))) return "notToday";
  return timeOfDay(now) >= RATING_OPENS_AT ? "open" : "tooEarly";
}
