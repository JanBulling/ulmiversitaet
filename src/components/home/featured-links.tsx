import { getTranslations } from "next-intl/server";

import { Tile } from "@/components/ui/tile";
import { FEATURED_LINKS } from "@/content/home";

export async function FeaturedLinks() {
  const t = await getTranslations("HomePage.Featured.links");

  return (
    <section className="px-4 md:px-0">
      <h2 className="text-2xl font-bold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <ul className="mt-2 space-y-2">
        {FEATURED_LINKS.map((link) => (
          <li key={link.key}>
            <Tile
              href={link.href}
              external={!link.href.startsWith("/")}
              icon={link.icon}
              title={t(link.key)}
              description={t(`${link.key}Description`)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
