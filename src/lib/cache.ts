/**
 * Lifetime of cached views that depend on "today" (home page sections, `/mensa`). Data
 * changes invalidate them through their tags; the 30-minute revalidation only has to catch
 * the change of day. The views render from `"use cache: remote"` queries, so revalidating
 * them doesn't query the database.
 */
export const TODAY_CACHE_LIFE = {
  stale: 5 * 60,
  revalidate: 30 * 60,
  expire: 24 * 60 * 60,
};
