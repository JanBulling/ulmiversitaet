import {
  CalendarRange,
  LineChart,
  Minus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
} from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/features/mensa/display";
import {
  MOVING_AVERAGE_DAYS,
  monthlyAverages,
  priceTrend,
  type PriceKey,
} from "@/features/mensa/price-stats";
import { getPriceDays } from "@/features/mensa/statistics";
import { toDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { PriceChart } from "./price-chart";

/** Current prices with their change, the chart, and the averages per month */
export async function PriceView() {
  const [t, tMensa, format, days] = await Promise.all([
    getTranslations("MensaPrices"),
    getTranslations("Mensa"),
    getFormatter(),
    getPriceDays(),
  ]);

  if (days.length === 0) {
    return (
      <Panel>
        <PanelEmpty>{t("noData")}</PanelEmpty>
      </Panel>
    );
  }

  const price = (cents: number | null) =>
    formatPrice(format, cents && Math.round(cents));
  const month = (yearMonth: string) =>
    format.dateTime(toDate(`${yearMonth}-15`), {
      month: "short",
      year: "numeric",
    });
  const summary: { key: PriceKey; label: string }[] = [
    { key: "mainStudent", label: t("main") },
    { key: "dessert", label: t("dessert") },
  ];
  const months = monthlyAverages(days);

  return (
    <>
      <Panel>
        <PanelHeader icon={Wallet} title={t("summary")} />
        <dl className="grid grid-cols-2 divide-x">
          {summary.map(({ key, label }) => {
            const trend = priceTrend(days, key);
            const Icon =
              !trend || Math.abs(trend.change) < 0.005
                ? Minus
                : trend.change > 0
                  ? TrendingUp
                  : TrendingDown;
            return (
              <div key={key} className="px-4">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-mono text-lg font-bold">
                  {trend ? price(trend.now) : "-"}
                </dd>
                {trend && (
                  <dd
                    className={cn(
                      "flex items-center gap-1 font-mono text-xs",
                      Icon === Minus
                        ? "text-muted-foreground"
                        : trend.change > 0
                          ? "text-destructive"
                          : "text-success",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {format.number(trend.change, {
                      style: "percent",
                      maximumFractionDigits: 1,
                      signDisplay: "exceptZero",
                    })}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
        <PanelBody>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("summaryHint", {
              days: MOVING_AVERAGE_DAYS,
              since: format.dateTime(toDate(days[0].date), {
                month: "long",
                year: "numeric",
              }),
            })}
          </p>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader icon={LineChart} title={t("chart")} />
        <PriceChart days={days} />
      </Panel>

      <Panel>
        <PanelHeader icon={CalendarRange} title={t("months")} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th
                  rowSpan={2}
                  scope="col"
                  className="py-1 pr-1 pl-4 text-left font-normal"
                >
                  {t("month")}
                </th>
                <th
                  colSpan={3}
                  scope="colgroup"
                  className="px-1 pt-1 text-right font-semibold sm:px-2"
                >
                  {t("main")}
                </th>
                <th
                  rowSpan={2}
                  scope="col"
                  className="py-1 pr-4 pl-1 text-right align-bottom font-semibold sm:pl-2"
                >
                  {t("dessert")}
                </th>
              </tr>
              <tr>
                {(["student", "employee", "guest"] as const).map((group) => (
                  <th
                    key={group}
                    scope="col"
                    className="px-1 pb-1 text-right font-normal sm:px-2"
                  >
                    {/* Short labels on phones, so the table fits without scrolling */}
                    <abbr
                      title={tMensa(group)}
                      className="no-underline sm:hidden"
                    >
                      {t(`short.${group}`)}
                    </abbr>
                    <span className="hidden sm:inline">{tMensa(group)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border border-t font-mono whitespace-nowrap">
              {months.map((row) => (
                <tr key={row.month}>
                  <th
                    scope="row"
                    className="py-1.5 pr-1 pl-4 text-left font-normal"
                  >
                    {month(row.month)}
                  </th>
                  <td className="px-1 text-right font-semibold sm:px-2">
                    {price(row.mainStudent)}
                  </td>
                  <td className="px-1 text-right sm:px-2">
                    {price(row.mainEmployee)}
                  </td>
                  <td className="px-1 text-right sm:px-2">
                    {price(row.mainGuest)}
                  </td>
                  <td className="pr-4 pl-1 text-right sm:pl-2">
                    {price(row.dessert)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

export function PriceViewSkeleton() {
  return (
    <>
      <Panel className="space-y-3 px-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-14 w-full" />
      </Panel>
      <Panel className="space-y-3 px-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
      </Panel>
    </>
  );
}
