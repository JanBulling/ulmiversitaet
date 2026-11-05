/**
 * Remembers in a cookie which meals this browser rated in the last 24 hours, so each meal can
 * be rated and commented once per day. Readable in the browser to hide the form; the Server
 * Action checks it again. Only a soft limit: clearing the cookies resets it.
 *
 * Value: `<meal id>.<rated at, ms>` entries joined by `_`; expired entries are dropped on write.
 */
export const RATED_MEALS_COOKIE = "ulm_mensa_rated";

export const RATING_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Keeps the cookie small even if someone rates the whole menu */
const MAX_ENTRIES = 50;

/** Meal id → time of the rating; only entries younger than 24 hours */
export function parseRatedMeals(
  value: string | undefined,
  now: number = Date.now(),
): Map<string, number> {
  const rated = new Map<string, number>();
  for (const entry of value?.split("_") ?? []) {
    const [id, time] = entry.split(".");
    const ratedAt = Number(time);
    if (id && Number.isInteger(ratedAt) && now - ratedAt < RATING_INTERVAL_MS)
      rated.set(id, ratedAt);
  }
  return rated;
}

export function serializeRatedMeals(rated: Map<string, number>): string {
  return [...rated]
    .slice(-MAX_ENTRIES)
    .map(([id, ratedAt]) => `${id}.${ratedAt}`)
    .join("_");
}

/** Reads the cookie from `document.cookie` */
export function ratedMealsFromCookieHeader(header: string, now?: number) {
  const value = header
    .split("; ")
    .find((cookie) => cookie.startsWith(`${RATED_MEALS_COOKIE}=`))
    ?.slice(RATED_MEALS_COOKIE.length + 1);
  return parseRatedMeals(value && decodeURIComponent(value), now);
}
