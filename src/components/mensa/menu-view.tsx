import { Salad, Utensils } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { cacheLife, cacheTag } from "next/cache";

import { Panel, PanelEmpty, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { nextWeekday, today, toDate, type IsoDate } from "@/lib/date";
import { MENSA_CACHE_TAG, TODAY_CACHE_LIFE } from "@/features/mensa/cache";
import { getMenu, type MenuCategory } from "@/features/mensa/queries";
import { CategoryLabel } from "./category-label";
import { DaySelector } from "./day-selector";
import { MealRow } from "./meal-row";
import { RatingStars } from "./rating-stars";

/** Without a date: today, or next Monday on weekends */
function selectedDate(date: IsoDate | undefined, now: IsoDate) {
  return date ?? nextWeekday(now);
}

/**
 * Weekday selector and the full date above the menu. Needs no data, so it is cached on its
 * own and shown right away instead of waiting for the menu.
 */
export async function MenuDays({ date }: { date?: IsoDate }) {
  "use cache";
  cacheLife(TODAY_CACHE_LIFE); // "today" moves with the change of day
  const now = today();
  const selected = selectedDate(date, now);
  const format = await getFormatter();

  return (
    <div className="space-y-2">
      <DaySelector selected={selected} today={now} />
      <p className="text-center text-sm text-muted-foreground">
        {format.dateTime(toDate(selected), { dateStyle: "full" })}
      </p>
    </div>
  );
}

/** Keeps the space of `MenuDays` while the date of the route is resolved */
export function MenuDaysPlaceholder() {
  return <div className="h-16" aria-hidden />;
}

/**
 * Menu of one day: main dishes and everything else (sides, salads, desserts, unassigned
 * categories) in two panels. Cached like the home page section: invalidated by the mensa
 * tag, revalidated every 30 minutes for the change of day.
 */
export async function MenuView({ date }: { date?: IsoDate }) {
  "use cache";
  cacheTag(MENSA_CACHE_TAG);
  cacheLife(TODAY_CACHE_LIFE);
  const selected = selectedDate(date, today());

  const [t, menu] = await Promise.all([
    getTranslations("Mensa"),
    getMenu(selected),
  ]);

  const main = menu.categories.filter((category) => category.kind === "main");
  const other = menu.categories.filter((category) => category.kind !== "main");

  if (menu.categories.length === 0) {
    return (
      <Panel>
        <PanelEmpty>{t("closed")}</PanelEmpty>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
      {main.length > 0 && (
        <CategoryPanel
          icon={Utensils}
          title={t("mainDishes")}
          categories={main}
        />
      )}
      {other.length > 0 && (
        <CategoryPanel
          icon={Salad}
          title={t("sidesAndDesserts")}
          categories={other}
        />
      )}
    </div>
  );
}

/** Same layout as the loaded panels, with small placeholders instead of large blocks */
export function MenuViewSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
      {[0, 1].map((panel) => (
        <Panel key={panel}>
          <div className="mb-2 flex items-center gap-4 px-4">
            <Skeleton className="size-6 md:size-8" />
            <Skeleton className="h-6 w-40" />
          </div>
          {[0, 1].map((category) => (
            <div key={category} className="space-y-2 px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </Panel>
      ))}
    </div>
  );
}

/**
 * Like on the home page: a category with one meal shows its rating next to the label
 * (in the category color), categories with several meals show it in each row.
 */
function MenuCategoryBlock({ category }: { category: MenuCategory }) {
  const single = category.meals.length === 1 ? category.meals[0] : null;

  return (
    <div className="py-2">
      <CategoryLabel category={category} className="px-4">
        {single?.rating && (
          <RatingStars
            value={single.rating.total}
            count={single.rating.count}
          />
        )}
      </CategoryLabel>
      {category.meals.map((meal) => (
        <MealRow key={meal.id} meal={meal} showRating={!single} />
      ))}
    </div>
  );
}

function CategoryPanel({
  icon,
  title,
  categories,
}: {
  icon: typeof Utensils;
  title: string;
  categories: MenuCategory[];
}) {
  return (
    <Panel>
      <PanelHeader icon={icon} title={title} />
      <div className="divide-y divide-border">
        {categories.map((category) => (
          <MenuCategoryBlock key={category.key} category={category} />
        ))}
      </div>
    </Panel>
  );
}
