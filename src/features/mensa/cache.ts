import { refresh, updateTag } from "next/cache";

/** Cache tag for everything that reads mensa data; invalidated after each menu sync */
export const MENSA_CACHE_TAG = "mensa";

/**
 * Lifetime of the menu and meal queries in the remote cache. The menu only changes once a
 * day; menu syncs, admin changes and ratings invalidate it through the tag anyway, so the
 * revalidation only catches the change of day in queries that read "today" (on weekdays the
 * morning sync already does that). After a week without requests an entry is dropped.
 */
export const MENSA_DATA_CACHE_LIFE = {
  stale: 5 * 60,
  revalidate: 12 * 60 * 60,
  expire: 7 * 24 * 60 * 60,
};

/**
 * After an admin change or a new rating: expire the cached public mensa pages immediately and
 * re-render the current page. Only callable from Server Actions.
 */
export function invalidateMensa() {
  updateTag(MENSA_CACHE_TAG);
  refresh();
}
