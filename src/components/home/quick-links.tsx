import { ArrowRight, LinkIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";

import { QUICK_LINKS } from "@/content/home";
import { getLink, localize } from "@/features/links/links";
import { Link } from "@/lib/i18n/navigation";

/** App-icon style shortcuts to the most used university services */
export async function QuickLinks() {
  const [t, locale] = await Promise.all([
    getTranslations("HomePage.QuickLinks"),
    getLocale(),
  ]);

  return (
    <nav className="grid w-full grid-cols-4 gap-4 px-4 md:grid-cols-8 md:px-0">
      {QUICK_LINKS.map((quickLink) => {
        const link = getLink(quickLink.linkId, locale);
        const label = quickLink.label
          ? localize(quickLink.label, locale)
          : link.label;
        const Icon = quickLink.lucideIcon ?? LinkIcon;
        return (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="relative mx-auto flex aspect-square size-16 items-center justify-center rounded-2xl border bg-card/25 backdrop-blur-lg group-hover:bg-muted/75 sm:size-24">
              {quickLink.image ? (
                <Image
                  src={quickLink.image}
                  alt=""
                  width={48}
                  height={48}
                  className="size-10 sm:size-12 dark:invert"
                />
              ) : (
                <Icon
                  className="size-10 text-foreground sm:size-12"
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
              <div className="pointer-events-none absolute inset-px rounded-2xl bg-radial-[at_30%_20%] from-primary/35 from-0% to-transparent to-70% mix-blend-overlay" />
            </div>
            <p className="mt-1 line-clamp-1 px-1 text-center text-xs font-bold">
              {label}
            </p>
          </a>
        );
      })}

      <Link href="/links" className="group">
        <div className="mx-auto flex aspect-square size-16 flex-col items-center justify-center gap-y-1 rounded-2xl border-2 border-dashed border-primary text-primary group-hover:border-primary/50 group-hover:text-primary/50 sm:size-24">
          <ArrowRight className="size-6 sm:size-8" aria-hidden />
        </div>
        <p className="mt-1 line-clamp-1 px-1 text-center text-xs font-bold text-primary">
          {t("more")}
        </p>
      </Link>
    </nav>
  );
}
