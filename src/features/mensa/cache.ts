import { refresh, updateTag } from "next/cache";

/** Cache tag for everything that reads mensa data; invalidated after each menu sync */
export const MENSA_CACHE_TAG = "mensa";

/**
 * Lifetime of cached views that show "today's" menu (home page section, `/mensa`). Data
 * changes invalidate them through the tag; the 30-minute revalidation only has to catch
 * the change of day.
 */
export const TODAY_CACHE_LIFE = {
  stale: 5 * 60,
  revalidate: 30 * 60,
  expire: 24 * 60 * 60,
};

/**
 * After an admin change or a new rating: expire the cached public mensa pages immediately and
 * re-render the current page. Only callable from Server Actions.
 */
export function invalidateMensa() {
  updateTag(MENSA_CACHE_TAG);
  refresh();
}
