import { getTranslations } from "next-intl/server";

import { routing, type Locale } from "@/lib/i18n/routing";
import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/constants";
import { ogImage } from "@/lib/og/og-image";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Prerendered at build time for every locale */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Link preview of the home page and every page without its own image */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Metadata",
  });
  return ogImage({
    title: t("ogTitle"),
    description: t("description"),
    tags: t.raw("tags") as string[],
  });
}
