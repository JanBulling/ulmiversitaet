import { getLocale } from "next-intl/server";

import { localizeBanner } from "@/features/banner/format";
import { getVisibleBanner } from "@/features/banner/queries";
import { BannerBar } from "./banner-bar";

/**
 * The banner set in the admin, above the site header; nothing without one. The banner comes
 * from the shared cache (invalidated by the admin), so pages don't query the database for it.
 * It is on every page, so a database error only leaves it out (errors aren't cached).
 */
export async function SiteBanner() {
  const [banner, locale] = await Promise.all([
    getVisibleBanner().catch((error) => {
      console.error("[banner] Loading the banner failed", error);
      return null;
    }),
    getLocale(),
  ]);
  if (!banner) return null;

  return <BannerBar banner={localizeBanner(banner, locale)} />;
}
