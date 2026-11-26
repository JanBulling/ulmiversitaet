import { EVENT_COLOR_PRESETS } from "@/features/events/format";
import type { Banner } from "@/lib/db/schema";
import type { BannerColor } from "@/lib/db/schema/banner-colors";

/** What the banner bar shows, in the language of the page */
export type BannerContent = Pick<Banner, "id" | "color" | "link"> & {
  title: string;
  description: string | null;
};

/**
 * Texts for `locale`: English pages use the English texts where there are any. A banner with an
 * English title but no English description shows no description, rather than a German one.
 */
export function localizeBanner(banner: Banner, locale: string): BannerContent {
  const english = locale === "en" && banner.titleEn !== null;
  return {
    id: banner.id,
    color: banner.color,
    link: banner.link,
    title: english ? banner.titleEn! : banner.title,
    description: english ? banner.descriptionEn : banner.description,
  };
}

/** Links to other websites open in a new tab; paths of the site use the localized router */
export function isExternalLink(link: string): boolean {
  return !link.startsWith("/");
}

/**
 * `https://…`, `http://…`, or a path of the site (`/mensa`, not `//host`). Rejects everything
 * else, e.g. `javascript:` links.
 */
export function isAllowedBannerLink(link: string): boolean {
  if (link.startsWith("/")) return !link.startsWith("//");
  try {
    const { protocol } = new URL(link);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/** CSS color of a banner color: the brand color, or the muted color of the event presets */
export function bannerColorValue(color: BannerColor): string {
  if (color === "default") return "var(--primary)";
  return EVENT_COLOR_PRESETS.find((preset) => preset.name === color)!.value;
}
