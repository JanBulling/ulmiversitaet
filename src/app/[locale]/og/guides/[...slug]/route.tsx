import { getTranslations } from "next-intl/server";

import {
  formatFolderName,
  getGuide,
  getGuidePaths,
} from "@/features/guides/guides";
import type { Locale } from "@/lib/i18n/routing";
import { ogImage } from "@/lib/og/og-image";

/**
 * Link preview of a guide (its title and summary) or a guide folder, e.g. `/og/guides/eduroam/ios`.
 * A route handler because `opengraph-image.tsx` isn't allowed below a catch-all segment; the
 * guide page links it in `generateMetadata`.
 */
export async function generateStaticParams() {
  const paths = await getGuidePaths();
  return paths.map((path) => ({ slug: path.split("/") }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/og/guides/[...slug]">,
) {
  const { locale, slug } = await params;
  const path = slug.map(decodeURIComponent).join("/");
  const [guide, t] = await Promise.all([
    getGuide(path, locale as Locale),
    getTranslations({ locale: locale as Locale, namespace: "GuidesPage" }),
  ]);

  return ogImage({
    title: guide?.frontmatter.title ?? formatFolderName(path),
    description: guide?.frontmatter.summary ?? t("metaDescription"),
    icon: "bookText",
  });
}
