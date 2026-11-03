"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

function Flag({ locale }: { locale: Locale }) {
  return (
    <Image
      src={`/icons/flags/${locale}.svg`}
      alt=""
      width={24}
      height={18}
      className="shrink-0"
    />
  );
}

/** Hook that switches to another locale on the current page */
export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  function switchLocale(locale: Locale) {
    startTransition(() => {
      // @ts-expect-error -- pathname and params always belong to the current route
      router.replace({ pathname, params }, { locale });
    });
  }

  return { switchLocale, pending };
}

/** Dropdown with flags (desktop header, footer) */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const current = useLocale();
  const { switchLocale, pending } = useSwitchLocale();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          className={cn("gap-1.5", className)}
        >
          <Flag locale={current} />
          <ChevronDown className="size-3.5 opacity-60" />
          <span className="sr-only">{t("language")}</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {routing.locales.map((locale) => (
            <DropdownMenu.Item
              key={locale}
              onSelect={() => switchLocale(locale)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-muted",
                locale === current && "font-semibold",
              )}
            >
              <Flag locale={locale} />
              {t(`languages.${locale}`)}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** Shown until the current path is known (dynamic routes) */
export function LocaleSwitcherFallback({ className }: { className?: string }) {
  const current = useLocale();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      className={cn("gap-1.5", className)}
    >
      <Flag locale={current} />
      <ChevronDown className="size-3.5 opacity-60" />
    </Button>
  );
}

/** Flag buttons side by side (mobile menu) */
export function LocaleButtons() {
  const t = useTranslations("Nav");
  const current = useLocale();
  const { switchLocale, pending } = useSwitchLocale();

  return (
    <div className="flex gap-2">
      {routing.locales.map((locale) => (
        <Button
          key={locale}
          variant={locale === current ? "default" : "outline"}
          size="sm"
          disabled={pending}
          aria-current={locale === current ? "true" : undefined}
          onClick={() => switchLocale(locale)}
        >
          <Flag locale={locale} />
          {t(`languages.${locale}`)}
        </Button>
      ))}
    </div>
  );
}
