import { History, TrendingUp, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Tile } from "@/components/ui/tile";

/** Links to the archive, price tracker and ranking, at the end of the menu pages */
export async function MensaMore() {
  const t = await getTranslations("MensaMore");
  const links = [
    { href: "/mensa/archive", icon: History, key: "archive" },
    { href: "/mensa/prices", icon: TrendingUp, key: "prices" },
    { href: "/mensa/ranking", icon: Trophy, key: "ranking" },
  ] as const;

  return (
    <section className="space-y-2 px-4 pt-4 md:px-0">
      <h2 className="text-xl font-bold md:text-2xl">{t("title")}</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, icon, key }) => (
          <Tile
            key={key}
            href={href}
            icon={icon}
            title={t(key)}
            description={t(`${key}Description`)}
          />
        ))}
      </div>
    </section>
  );
}
