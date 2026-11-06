import { BookText } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { MoreTile, Tile } from "@/components/ui/tile";
import { FEATURED_GUIDES } from "@/content/home";
import { getGuides } from "@/features/guides/guides";

export async function FeaturedGuides() {
  const locale = await getLocale();
  const [t, guides] = await Promise.all([
    getTranslations("HomePage.Featured.guides"),
    getGuides(locale),
  ]);
  const featured = FEATURED_GUIDES.flatMap((slug) =>
    guides.filter((guide) => guide.slug === slug),
  );

  return (
    <section className="px-4 md:px-0">
      <h2 className="text-2xl font-bold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {featured.map((guide) => (
          <li key={guide.slug}>
            <Tile
              href={`/guides/${guide.slug}`}
              prefetch
              title={guide.frontmatter.title}
              description={guide.frontmatter.summary}
              align="top"
              className="h-full"
            />
          </li>
        ))}
        <li className="sm:col-span-2">
          <MoreTile href="/guides" icon={BookText} title={t("more")} />
        </li>
      </ul>
    </section>
  );
}
