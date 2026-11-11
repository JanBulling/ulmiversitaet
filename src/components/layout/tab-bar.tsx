"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { isActive } from "./main-nav";
import { NAV_ITEMS } from "./nav-items";

/**
 * Main navigation on mobile (below `md`): app-like tabs fixed to the bottom of the screen.
 * The site layout reserves its height plus the safe area, so the footer isn't hidden behind it.
 */
export function TabBar() {
  const pathname = usePathname();
  return <Tabs isCurrent={(href) => isActive(pathname, href)} />;
}

/** Same tabs without the current-page highlight, until the path is known */
export function TabBarFallback() {
  return <Tabs isCurrent={() => false} />;
}

function Tabs({ isCurrent }: { isCurrent: (href: string) => boolean }) {
  const t = useTranslations("Nav");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] backdrop-blur-md backdrop-saturate-200 md:hidden">
      <ul className="grid h-14 grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors select-none [-webkit-tap-highlight-color:transparent] active:text-foreground",
                  current && "font-semibold text-primary active:text-primary",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    current && "bg-primary/15",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="max-w-full truncate px-1">{t(label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
