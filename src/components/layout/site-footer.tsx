import { getTranslations } from "next-intl/server";
import { cacheLife } from "next/cache";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { siteConfig } from "@/lib/site";
import { LocaleSwitcher, LocaleSwitcherFallback } from "./locale-switcher";
import { Logo } from "./logo";
import { NetworkStatus } from "./network-status";
import { GitHubIcon, InstagramIcon } from "./social-icons";

export async function SiteFooter() {
  const t = await getTranslations("Nav");

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 pt-4 pb-2">
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <Logo size="sm" />
          <nav className="flex flex-1 items-center justify-center text-sm">
            <Button variant="link" asChild>
              <Link href="/imprint">{t("imprint")}</Link>
            </Button>
            <Button variant="link" asChild>
              <Link href="/privacy">{t("privacy")}</Link>
            </Button>
          </nav>
          <div className="flex">
            <Button variant="ghost" size="icon" asChild>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon className="size-6" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href={siteConfig.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon className="size-6" />
                <span className="sr-only">Instagram</span>
              </a>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 md:hidden">
          <Suspense>
            <NetworkStatus />
          </Suspense>
          <div className="ml-auto">
            <Suspense fallback={<LocaleSwitcherFallback />}>
              <LocaleSwitcher />
            </Suspense>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <span>
            © <CurrentYear />
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0.5 text-xs"
            asChild
          >
            <a
              href="https://jan-bulling.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jan Bulling
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0.5 text-xs"
            asChild
          >
            <a
              href="https://www.instagram.com/rau__stefan/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stefan Rau
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
