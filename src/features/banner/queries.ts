import "server-only";

import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { BANNER_CACHE_TAG } from "./cache";

/**
 * The visible banner, or `null`. Shared remote cache without expiry: banners only change
 * through the admin, which invalidates the banner tag.
 */
export async function getVisibleBanner() {
  "use cache: remote";
  cacheTag(BANNER_CACHE_TAG);
  cacheLife("max");

  const [banner] = await db
    .select()
    .from(banners)
    .where(eq(banners.visible, true));
  return banner ?? null;
}
