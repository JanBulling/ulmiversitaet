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

export function MenuViewSkeleton() {
  return (
    <>
      <div className="space-y-2 px-4 md:px-0">
        <Skeleton className="mx-auto h-9 w-full max-w-xl" />
        <Skeleton className="mx-auto h-5 w-48" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Panel key={i} className="space-y-3 px-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </Panel>
        ))}
      </div>
    </>
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
      <div className="divide-y divide-accent">
        {categories.map((category) => (
          <div key={category.key} className="py-2">
            <CategoryLabel category={category} className="px-4" />
            {category.meals.map((meal) => (
              <MealRow key={meal.id} meal={meal} />
            ))}
          </div>
        ))}
      </div>
    </Panel>
  );
}
