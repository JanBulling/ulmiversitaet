"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop navigation, highlights the current section */
export function MainNav({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <NavLinks
      className={className}
      isCurrent={(href) => isActive(pathname, href)}
      label={t}
    />
  );
}

/** Same links without the current-page highlight, until the path is known */
export function MainNavFallback({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  return <NavLinks className={className} isCurrent={() => false} label={t} />;
}

function NavLinks({
  className,
  isCurrent,
  label,
}: {
  className?: string;
  isCurrent: (href: string) => boolean;
  label: (key: (typeof NAV_ITEMS)[number]["label"]) => string;
}) {
  return (
    <nav className={cn("items-center gap-0.5", className)}>
      {NAV_ITEMS.map((item) => (
        <Button key={item.href} variant="ghost" size="sm" asChild>
          <Link
            href={item.href}
            aria-current={isCurrent(item.href) ? "page" : undefined}
            className={cn(isCurrent(item.href) && "font-semibold text-primary")}
          >
            {label(item.label)}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
