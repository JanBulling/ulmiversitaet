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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-6 px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          {t("title")}
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/mensa">{t("nav.mensa")}</Link>
          <Link href="/admin/mensa/categories">{t("nav.categories")}</Link>
          <Link href="/admin/events">{t("nav.events")}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" target="_blank">
              {t("nav.site")}
              <ExternalLink className="size-3" />
            </Link>
          </Button>
          <form action={logout}>
            <input type="hidden" name="locale" value={locale} />
            <Button variant="outline" size="sm" type="submit">
              <LogOut />
              {t("nav.logout")}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
