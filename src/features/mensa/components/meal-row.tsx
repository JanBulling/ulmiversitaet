import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";
import { formatPrice, mealName } from "../display";
import type { MenuMeal } from "../queries";
import { MealTypeIcon } from "./icons";
import { RatingStars } from "./rating-stars";

/** One meal as a full-width row inside a panel: name, diet icons, price, nutrition, rating */
export async function MealRow({ meal }: { meal: MenuMeal }) {
  const [t, format, locale] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
    getLocale(),
  ]);

  return (
    <Link
      href={`/mensa/meal/${meal.id}`}
      className="block px-4 py-2 hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="font-semibold">{mealName(meal, locale)}</h4>
          {meal.types.map((code) => (
            <MealTypeIcon key={code} code={code} locale={locale} />
          ))}
        </div>
        <p className="shrink-0 font-mono text-sm text-muted-foreground">
          {meal.prices.note && <span className="mr-1">{meal.prices.note}</span>}
          {formatPrice(format, meal.prices.studentCents)}
        </p>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex gap-2">
          {meal.energyKcal !== null && (
            <p>
              <b>{t("calories")}:</b> {meal.energyKcal} kcal
            </p>
          )}
          {meal.proteinG !== null && (
            <p>
              <b>{t("protein")}:</b> {format.number(meal.proteinG)} g
            </p>
          )}
        </div>
        <RatingStars
          size={14}
          value={meal.rating?.total}
          count={meal.rating?.count}
        />
      </div>
    </Link>
  );
}
