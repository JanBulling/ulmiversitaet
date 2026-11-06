import { ChevronRight, CookingPot, ExternalLink } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { cacheLife, cacheTag } from "next/cache";

import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelEmpty,
  PanelFooter,
  PanelHeader,
} from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { today, toDate } from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";
import {
  categoryName,
  DEFAULT_CATEGORY_COLOR,
  formatPrice,
  mealName,
} from "@/features/mensa/display";
import { MENSA_CACHE_TAG, TODAY_CACHE_LIFE } from "@/features/mensa/cache";
import { isGuruEnabled } from "@/features/mensa/guru";
import { getMenu, type MenuCategory } from "@/features/mensa/queries";
import { CategoryLabel } from "./category-label";
import { MensaGuru } from "./mensa-guru";
import { RatingStars } from "./rating-stars";

const ORDER_WEST_URL = "https://stwulm.my-mensa.de/mensatogo.php?mensa=2";

/**
 * Today's meals on the home page, only categories with "show on home".
 * Categories with one meal are shown as a row, categories with several as a list.
 *
 * Cached as a whole (part of the prerendered page): menu syncs, admin changes and ratings
 * invalidate it through the mensa tag, and it revalidates every 30 minutes for the change
 * of day.
 */
export async function MensaSection({ className }: { className?: string }) {
  "use cache";
  cacheTag(MENSA_CACHE_TAG);
  cacheLife(TODAY_CACHE_LIFE);
  const date = today();

  const [t, format, menu] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
    getMenu(date),
  ]);

  const categories = menu.categories.filter((category) => category.showOnHome);
  const single = categories.filter((category) => category.meals.length === 1);
  const lists = categories.filter((category) => category.meals.length > 1);

  return (
    <Panel className={className}>
      <MensaHeader
        date={t("todayDate", {
          date: format.dateTime(toDate(date), {
            weekday: "short",
            day: "2-digit",
            month: "short",
          }),
        })}
      />

      {categories.length === 0 ? (
        <PanelEmpty>{t("closedToday")}</PanelEmpty>
      ) : (
        <>
          {/* Separated by whitespace only, like on the previous site */}
          <div>
            {single.map((category) => (
              <SingleMeal key={category.key} category={category} />
            ))}
          </div>
          {lists.map((category) => (
            <MealList key={category.key} category={category} />
          ))}
        </>
      )}

      <PanelFooter>
        <Button variant="outline" asChild>
          <Link href="/mensa">
            {t("fullMenu")}
            <ChevronRight />
          </Link>
        </Button>
      </PanelFooter>
      {/* Only with a Gemini API key, and only on days with a menu */}
      {isGuruEnabled() && categories.length > 0 && <MensaGuru />}
    </Panel>
  );
}

export function MensaSectionSkeleton({ className }: { className?: string }) {
  return (
    <Panel className={className}>
      <MensaHeader />
      <div className="space-y-2 px-4">
        <Skeleton className="h-18 w-full" />
        <Skeleton className="h-18 w-full" />
        <Skeleton className="h-18 w-full" />
      </div>
    </Panel>
  );
}

/** Link to the Studierendenwerk's pre-order page for Cafeteria West */
export async function OrderWestButton() {
  const t = await getTranslations("Mensa");
  return (
    <Button size="sm" asChild>
      <a href={ORDER_WEST_URL} target="_blank" rel="noopener noreferrer">
        {t("orderWest")}
        <ExternalLink className="size-3" />
      </a>
    </Button>
  );
}

async function MensaHeader({ date }: { date?: string }) {
  const t = await getTranslations("Mensa");
  return (
    <PanelHeader icon={CookingPot} title={t("title")}>
      {date && <span className="hidden sm:inline">{date}</span>}
      <OrderWestButton />
    </PanelHeader>
  );
}

async function SingleMeal({ category }: { category: MenuCategory }) {
  const [t, format, locale] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
    getLocale(),
  ]);
  const [meal] = category.meals;

  return (
    <Link
      href={`/mensa/meal/${meal.id}`}
      className="block px-4 py-2 hover:bg-muted"
    >
      <div
        className="flex items-center justify-between"
        style={{ color: category.color ?? DEFAULT_CATEGORY_COLOR }}
      >
        <h3 className="font-mono font-bold uppercase">
          {categoryName(category, locale)}
        </h3>
        <RatingStars value={meal.rating?.total} count={meal.rating?.count} />
      </div>
      <div className="mt-1 flex items-center justify-between gap-4">
        <h4 className="font-semibold">{mealName(meal, locale)}</h4>
        <p className="shrink-0 font-mono text-sm text-muted-foreground">
          {formatPrice(format, meal.prices.studentCents)}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
    </Link>
  );
}

async function MealList({ category }: { category: MenuCategory }) {
  const [format, locale] = await Promise.all([getFormatter(), getLocale()]);

  return (
    <div className="py-4">
      <CategoryLabel category={category} className="px-4" />
      {category.meals.map((meal) => (
        <Link
          key={meal.id}
          href={`/mensa/meal/${meal.id}`}
          className="flex items-center justify-between gap-4 px-4 py-1 hover:bg-muted"
        >
          <h4 className="flex-1 text-xs font-semibold md:text-sm">
            {mealName(meal, locale)}
          </h4>
          <RatingStars
            className="shrink-0"
            size={16}
            value={meal.rating?.total}
            count={meal.rating?.count}
          />
          <p className="shrink-0 font-mono text-sm text-muted-foreground">
            {formatPrice(format, meal.prices.studentCents)}
          </p>
        </Link>
      ))}
    </div>
  );
}
