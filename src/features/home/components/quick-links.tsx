import { LinkIcon } from "lucide-react";
import { getLocale } from "next-intl/server";
import Image from "next/image";

import { localized, QUICK_LINKS } from "@/content/home";

/** App-icon style shortcuts to the most used university services */
export async function QuickLinks() {
  const locale = await getLocale();

  return (
    <nav className="grid w-full grid-cols-4 gap-4 px-4 md:grid-cols-8 md:px-0">
      {QUICK_LINKS.map((link) => {
        const label = localized(link.label, locale);
        const Icon = link.lucideIcon ?? LinkIcon;
        return (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="relative mx-auto flex aspect-square size-16 items-center justify-center rounded-2xl border bg-card/25 backdrop-blur-lg group-hover:bg-muted/75 sm:size-24">
              {link.image ? (
                <Image
                  src={link.image}
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
    </nav>
  );
}
