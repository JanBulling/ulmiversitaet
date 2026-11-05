import { refresh, updateTag } from "next/cache";

/** Cache tag for everything that reads mensa data; invalidated after each menu sync */
export const MENSA_CACHE_TAG = "mensa";

/**
 * After an admin change or a new rating: expire the cached public mensa pages immediately and
 * re-render the current page. Only callable from Server Actions.
 */
export function invalidateMensa() {
  updateTag(MENSA_CACHE_TAG);
  refresh();
}
