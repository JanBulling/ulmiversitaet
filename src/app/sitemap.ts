import type { MetadataRoute } from "next";

import { LINK_CATEGORIES } from "@/content/links";
import { getGuidePaths } from "@/features/guides/guides";
import { getPathname } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { BASE_URL } from "@/lib/site";

/**
 * Public pages for search engines, each with its German and English URL. Single meals and
 * menu days are left out: there are thousands, and search engines find them through the links.
 */
const PAGES: {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", changeFrequency: "daily" },
  { path: "/mensa", changeFrequency: "daily" },
  { path: "/mensa/prices", changeFrequency: "weekly" },
  { path: "/mensa/ranking", changeFrequency: "weekly" },
  { path: "/public-transport" },
  { path: "/parking-lots" },
  { path: "/campus-map" },
  { path: "/links" },
  { path: "/guides" },
  { path: "/exmatriculation" },
  { path: "/about" },
  { path: "/imprint" },
  { path: "/privacy" },
];

function url(path: string, locale: (typeof routing.locales)[number]) {
  return `${BASE_URL}${getPathname({ href: path, locale })}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guidePaths = await getGuidePaths();
  const pages: typeof PAGES = [
    ...PAGES,
    ...LINK_CATEGORIES.map((category) => ({
      path: `/links/${category.slug}`,
    })),
    ...guidePaths.map((path) => ({
      path: `/guides/${path.split("/").map(encodeURIComponent).join("/")}`,
    })),
  ];

  return pages.map(({ path, changeFrequency }) => ({
    url: url(path, routing.defaultLocale),
    changeFrequency,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, url(path, locale)]),
      ),
    },
  }));
}
