import { Salad, Utensils } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Panel, PanelEmpty, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { nextWeekday, today, toDate, type IsoDate } from "@/lib/date";
import { getMenu, type MenuCategory } from "@/features/mensa/queries";
import { CategoryLabel } from "./category-label";
import { DaySelector } from "./day-selector";
import { MealRow } from "./meal-row";
import { RatingStars } from "./rating-stars";

/**
 * Full menu of one day: weekday selector, then main dishes and everything else
 * (sides, salads, desserts, unassigned categories) in two panels.
 * Without `date`: today, or next Monday on weekends.
 */
export async function MenuView({ date }: { date?: IsoDate }) {
  await connection(); // "today" is evaluated per request
  const now = today();
  const selected = date ?? nextWeekday(now);

  const [t, format, menu] = await Promise.all([
    getTranslations("Mensa"),
    getFormatter(),
    getMenu(selected),
  ]);

  const main = menu.categories.filter((category) => category.kind === "main");
  const other = menu.categories.filter((category) => category.kind !== "main");

  return (
    <>
      <div className="space-y-2">
        <DaySelector selected={selected} today={now} />
        <p className="text-center text-sm text-muted-foreground">
          {format.dateTime(toDate(selected), { dateStyle: "full" })}
        </p>
      </div>

      {menu.categories.length === 0 ? (
        <Panel>
          <PanelEmpty>{t("closed")}</PanelEmpty>
        </Panel>
      ) : (
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
      )}
    </>
  );
}

/** Same layout as the loaded page, with small placeholders instead of large blocks */
export function MenuViewSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <div className="flex h-9 items-center justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-12 sm:w-20" />
          ))}
        </div>
        {/* Date line: keeps its space without a placeholder */}
        <div className="h-5" />
      </div>
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
    </>
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
