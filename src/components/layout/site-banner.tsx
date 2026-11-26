import { getLocale } from "next-intl/server";

import { localizeBanner } from "@/features/banner/format";
import { getVisibleBanner } from "@/features/banner/queries";
import { BannerBar } from "./banner-bar";
import { HomeOnly } from "./home-only";

/**
 * The banner set in the admin, above the site header of the home page; nothing without one.
 * The site layout renders it on every page and `HomeOnly` shows it only on the home page (a
 * parallel route slot can't do this: `(site)` is a route group, so the slot would also apply
 * to the admin pages and make them 404). The banner comes
 * from the shared cache (invalidated by the admin), so pages don't query the database for it.
 * A database error only leaves it out instead of breaking the page (errors aren't cached).
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

  return (
    <HomeOnly>
      <BannerBar banner={localizeBanner(banner, locale)} />
    </HomeOnly>
  );
}
