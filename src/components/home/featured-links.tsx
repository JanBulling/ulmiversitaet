import { LinkIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { MoreTile, Tile } from "@/components/ui/tile";
import { FEATURED_LINKS } from "@/content/home";
import { getLink } from "@/features/links/links";

export async function FeaturedLinks() {
  const [t, locale] = await Promise.all([
    getTranslations("HomePage.Featured.links"),
    getLocale(),
  ]);

  return (
    <section className="px-4 md:px-0">
      <h2 className="text-2xl font-bold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <ul className="mt-2 space-y-2">
        {FEATURED_LINKS.map(({ linkId, icon }) => {
          const link = getLink(linkId, locale);
          return (
            <li key={link.id}>
              <Tile
                href={link.href}
                external={!link.internal}
                icon={icon}
                title={link.label}
                description={link.description ?? undefined}
              />
            </li>
          );
        })}
        <li>
          <MoreTile href="/links" icon={LinkIcon} title={t("more")} />
        </li>
      </ul>
    </section>
  );
}
