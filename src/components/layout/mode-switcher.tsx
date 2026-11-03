"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { META_THEME_COLORS } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Light/dark toggle; the icon is switched by CSS, so it renders correctly before hydration */
export function ModeSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const { setTheme, resolvedTheme } = useTheme();

  function toggle() {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", META_THEME_COLORS[next]);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-8", className)}
      onClick={toggle}
    >
      <SunIcon className="hidden [html.dark_&]:block" />
      <MoonIcon className="hidden [html.light_&]:block" />
      <span className="sr-only">{t("toggleTheme")}</span>
    </Button>
  );
}
