import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n/routing";
import { siteConfig } from "@/lib/site";

/**
 * Open Graph fields of every page (root layout). Pages that set their own `openGraph` replace
 * the layout's completely, so they spread this in again.
 */
export function baseOpenGraph(locale: Locale) {
  return {
    type: "website",
    siteName: siteConfig.name,
    locale: locale === "de" ? "de_DE" : "en_US",
    alternateLocale: locale === "de" ? "en_US" : "de_DE",
  } satisfies Metadata["openGraph"];
}
