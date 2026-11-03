import type { createFormatter } from "next-intl";

import type { Locale } from "@/lib/i18n/routing";
import type { DisplayCategory } from "./queries";

type Formatter = ReturnType<typeof createFormatter>;

export function mealName(
  meal: { name: string; nameEn: string | null },
  locale: Locale,
) {
  return locale === "en" ? (meal.nameEn ?? meal.name) : meal.name;
}

export function categoryName(category: DisplayCategory, locale: Locale) {
  return locale === "en"
    ? (category.nameEn ?? category.nameDe)
    : category.nameDe;
}

export function formatPrice(format: Formatter, cents: number | null) {
  return cents === null
    ? "–"
    : format.number(cents / 100, { style: "currency", currency: "EUR" });
}

/** Fallback color for categories without one (e.g. not yet assigned to a group) */
export const DEFAULT_CATEGORY_COLOR = "#525252";
