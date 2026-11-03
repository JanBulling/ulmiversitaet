"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { LocaleButtons } from "./locale-switcher";
import { isActive } from "./main-nav";
import { ModeSwitcher } from "./mode-switcher";
import { NAV_ITEMS } from "./nav-items";

/** Full-screen menu that slides in from the top (below `md`) */
export function MobileNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="size-6" />
          <span className="sr-only">{t("menu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="h-full"
        closeLabel={t("close")}
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
        <nav
          className="my-auto flex flex-col items-center gap-6 text-xl"
          onClick={() => setOpen(false)}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                isActive(pathname, item.href) && "font-semibold text-primary",
              )}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <div className="mb-8 flex flex-col items-center gap-4">
          <LocaleButtons />
          <ModeSwitcher className="size-10" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The menu button before the current path is known */
export function MobileNavFallback() {
  const t = useTranslations("Nav");
  return (
    <Button variant="outline" size="icon" className="md:hidden" disabled>
      <Menu className="size-6" />
      <span className="sr-only">{t("menu")}</span>
    </Button>
  );
}
