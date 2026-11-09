import { ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";

import { Panel, PanelEmpty, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  categoryName,
  DEFAULT_CATEGORY_COLOR,
  mealName,
} from "@/features/mensa/display";
import {
  getMealRanking,
  RANKING_MIN_RATINGS,
  type RankedMeal,
} from "@/features/mensa/statistics";
import { toDate } from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";
import { CategoryIcon } from "./icons";
import { RatingStars } from "./rating-stars";

/** Top 10 and bottom 10 main dishes next to each other, with a note on how they are ranked */
export async function RankingView() {
  const [t, { best, worst }] = await Promise.all([
    getTranslations("MensaRanking"),
    getMealRanking(),
  ]);

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <RankingPanel icon={ThumbsUp} title={t("best")} meals={best} />
        <RankingPanel icon={ThumbsDown} title={t("worst")} meals={worst} />
      </div>
      <p className="px-4 text-xs text-muted-foreground md:px-0">
        {t("hint", { count: RANKING_MIN_RATINGS })}
      </p>
    </>
  );
}

async function RankingPanel({
  icon,
  title,
  meals,
}: {
  icon: LucideIcon;
  title: string;
  meals: RankedMeal[];
}) {
  const [t, format, locale] = await Promise.all([
    getTranslations("MensaRanking"),
    getFormatter(),
    getLocale(),
  ]);

  return (
    <Panel>
      <PanelHeader icon={icon} title={title} />
      {meals.length === 0 ? (
        <PanelEmpty>{t("noData")}</PanelEmpty>
      ) : (
        <ol>
          {meals.map((meal, i) => (
            <li key={meal.id}>
              <Link
                href={`/mensa/meal/${meal.id}`}
                className="flex items-start gap-3 px-4 py-2 hover:bg-muted"
              >
                <span
                  className="w-6 shrink-0 pt-px text-right font-mono font-bold text-muted-foreground"
                  aria-label={t("rank", { rank: i + 1 })}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase"
                    style={{
                      color: meal.category.color ?? DEFAULT_CATEGORY_COLOR,
                    }}
                  >
                    {categoryName(meal.category, locale)}
                    <CategoryIcon icon={meal.category.icon} />
                  </div>
                  <h3 className="font-semibold">{mealName(meal, locale)}</h3>
                  {/* Below the name, so long names keep the full width on phones */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <RatingStars
                      size={14}
                      value={meal.rating.total}
                      count={meal.rating.count}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("lastServed", {
                        date: format.dateTime(toDate(meal.lastServedOn), {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }),
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function RankingViewSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
      {[0, 1].map((panel) => (
        <Panel key={panel} className="space-y-3 px-4">
          <Skeleton className="h-8 w-32" />
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </Panel>
      ))}
    </div>
  );
}
