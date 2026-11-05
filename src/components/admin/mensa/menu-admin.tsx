import { CalendarDays, ExternalLink, RefreshCw, Utensils } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
} from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, startOfWeek, today, toDate, weekdaysOf } from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";
import { formatPrice, DEFAULT_CATEGORY_COLOR } from "@/features/mensa/display";
import { getAdminMenu, getMealCounts } from "@/features/admin/mensa/queries";
import { RefreshButton } from "./refresh-button";

/** Refresh actions, the days of this and next week, and today's menu with its raw categories */
export async function MenuAdmin() {
  await connection(); // "today" is evaluated per request
  const now = today();
  const thisWeek = weekdaysOf(startOfWeek(now));
  const nextWeek = weekdaysOf(addDays(startOfWeek(now), 7));

  const [t, format, counts, menu] = await Promise.all([
    getTranslations("Admin.mensa"),
    getFormatter(),
    getMealCounts([...thisWeek, ...nextWeek]),
    getAdminMenu(now),
  ]);

  return (
    <>
      <Panel>
        <PanelHeader icon={RefreshCw} title={t("refreshTitle")} />
        <PanelBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("refreshDescription")}
          </p>
          <div className="flex flex-wrap items-start gap-4">
            <RefreshButton
              dates={[now]}
              label={t("refreshToday")}
              variant="default"
              size="default"
            />
            <RefreshButton
              dates={thisWeek}
              label={t("refreshThisWeek")}
              size="default"
            />
            <RefreshButton
              dates={nextWeek}
              label={t("refreshNextWeek")}
              size="default"
            />
          </div>
        </PanelBody>
      </Panel>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
        <Panel className="md:col-span-3">
          <PanelHeader icon={CalendarDays} title={t("daysTitle")} />
          <ul className="divide-y divide-border">
            {[...thisWeek, ...nextWeek].map((date) => (
              <li
                key={date}
                className={`flex items-start justify-between gap-4 px-4 py-2 ${date === now ? "bg-muted" : ""}`}
              >
                <div>
                  <p className="font-mono text-sm font-semibold">
                    {format.dateTime(toDate(date), {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("mealCount", { count: counts.get(date) ?? 0 })}
                  </p>
                </div>
                <div className="flex items-start gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={`/mensa/${date}`}
                      target="_blank"
                      aria-label={t("show")}
                    >
                      <ExternalLink />
                    </Link>
                  </Button>
                  <RefreshButton
                    dates={[date]}
                    label={t("refresh")}
                    variant="ghost"
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="md:col-span-4">
          <PanelHeader icon={Utensils} title={t("todayTitle")} />
          {menu.length === 0 ? (
            <PanelEmpty>{t("mealCount", { count: 0 })}</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {menu.map((row) => (
                <li key={row.mealId}>
                  <Link
                    href={`/mensa/meal/${row.mealId}`}
                    target="_blank"
                    className="flex items-start justify-between gap-4 px-4 py-2 hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p
                        className="font-mono text-xs font-bold uppercase"
                        style={{ color: row.color ?? DEFAULT_CATEGORY_COLOR }}
                      >
                        {row.category}
                        {row.group && (
                          <span className="font-normal text-muted-foreground normal-case">
                            {" → "}
                            {row.group}
                          </span>
                        )}
                      </p>
                      <p className="font-semibold">{row.name}</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm text-muted-foreground">
                      {formatPrice(format, row.priceStudentCents)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

export function MenuAdminSkeleton() {
  return (
    <>
      <Panel className="space-y-3 px-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-9 w-full max-w-md" />
      </Panel>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
        <Panel className="space-y-3 px-4 md:col-span-3">
          <Skeleton className="h-64 w-full" />
        </Panel>
        <Panel className="space-y-3 px-4 md:col-span-4">
          <Skeleton className="h-64 w-full" />
        </Panel>
      </div>
    </>
  );
}
