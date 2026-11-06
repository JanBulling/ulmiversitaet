import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { logout } from "@/features/admin/auth/actions";

/** Top bar of the admin dashboard (the public site header is not shown here) */
export async function AdminNav() {
  const [t, locale] = await Promise.all([
    getTranslations("Admin"),
    getLocale(),
  ]);

  const links = [
    { href: "/admin/mensa", label: t("nav.mensa") },
    { href: "/admin/mensa/categories", label: t("nav.categories") },
    { href: "/admin/events", label: t("nav.events") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-6 px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          {t("title")}
        </Link>
        <nav className="hidden gap-4 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {/* Labels only from `sm` on, so the bar fits on phones */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" target="_blank" aria-label={t("nav.site")}>
              <span className="hidden sm:inline">{t("nav.site")}</span>
              <ExternalLink className="size-3" />
            </Link>
          </Button>
          <form action={logout}>
            <input type="hidden" name="locale" value={locale} />
            <Button
              variant="outline"
              size="sm"
              type="submit"
              aria-label={t("nav.logout")}
            >
              <LogOut />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </Button>
          </form>
        </div>
      </div>
      {/* Phones: links in their own scrollable row below */}
      <nav className="flex gap-4 overflow-x-auto px-4 pb-3 text-sm whitespace-nowrap md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
