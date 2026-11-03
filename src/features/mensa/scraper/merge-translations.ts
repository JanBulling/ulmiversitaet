import type { ParsedMeal } from "./parse-menu";

export type MenuItem = ParsedMeal & { nameEn: string | null };

/**
 * Adds the English names to the German meals. Both documents list the meals in the
 * same order, so they are matched by position. If the documents differ (e.g. one was
 * updated in between), fall back to matching by category, price, and calories.
 */
export function mergeTranslations(
  de: ParsedMeal[],
  en: ParsedMeal[],
): MenuItem[] {
  const sameLayout =
    de.length === en.length &&
    de.every((meal, i) => meal.category === en[i].category);

  return de.map((meal, i) => {
    const translation = sameLayout
      ? en[i]
      : en.find(
          (candidate) =>
            candidate.category === meal.category &&
            candidate.prices.studentCents === meal.prices.studentCents &&
            candidate.nutrition.energyKcal === meal.nutrition.energyKcal,
        );

    return { ...meal, nameEn: translation?.name || null };
  });
}
