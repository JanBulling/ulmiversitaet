"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MOVING_AVERAGE_DAYS,
  movingAverage,
  type PriceDay,
} from "@/features/mensa/price-stats";
import { toDate } from "@/lib/date";

const GROUPS = [
  { key: "mainStudent", label: "student" },
  { key: "mainEmployee", label: "employee" },
  { key: "mainGuest", label: "guest" },
] as const;

const HEIGHT = 280;
// Left: room for the price labels plus the usual 16 px padding (the panel is full-bleed on mobile)
const MARGIN = { top: 12, right: 16, bottom: 28, left: 64 };
/** Price steps of the y axis in cents */
const STEPS = [10, 20, 25, 50, 100, 200];

/**
 * Average price of the main dishes per day (dots) with the moving average as trend line,
 * for one group of customers. Hover or arrow keys show the values of a day.
 */
export function PriceChart({ days }: { days: PriceDay[] }) {
  const t = useTranslations("MensaPrices");
  const tMensa = useTranslations("Mensa");
  const format = useFormatter();
  const [group, setGroup] = useState<(typeof GROUPS)[number]["key"]>(
    GROUPS[0].key,
  );
  const [active, setActive] = useState<number | null>(null);
  // `null` until measured in the browser: the chart is only drawn there (dates and prices are
  // formatted slightly differently on the server, which would break hydration)
  const [measured, measure] = useWidth();
  const width = measured ?? 800;

  const points = useMemo(() => {
    const trend = movingAverage(days, group);
    return days
      .map((day, i) => ({
        date: day.date,
        time: toDate(day.date).getTime(),
        value: day[group],
        trend: trend[i],
      }))
      .filter((point) => point.value !== null);
  }, [days, group]);

  const chart = useMemo(() => {
    const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 1);
    const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const values = points.map((point) => point.value!);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const step =
      STEPS.find((candidate) => (high - low) / candidate <= 5) ?? 500;
    const yMin = Math.floor(low / step) * step;
    const yMax = Math.max(Math.ceil(high / step) * step, yMin + step);
    const tMin = points[0]?.time ?? 0;
    const tMax = Math.max(points.at(-1)?.time ?? 1, tMin + 1);

    const x = (time: number) =>
      MARGIN.left + ((time - tMin) / (tMax - tMin)) * plotWidth;
    const y = (cents: number) =>
      MARGIN.top + (1 - (cents - yMin) / (yMax - yMin)) * plotHeight;

    const yTicks: number[] = [];
    for (let cents = yMin; cents <= yMax; cents += step) yTicks.push(cents);

    // One tick per month, thinned out so the labels don't overlap
    const months = points.filter(
      (point, i) =>
        i === 0 || point.date.slice(0, 7) !== points[i - 1].date.slice(0, 7),
    );
    const every = Math.ceil(months.length / Math.max(plotWidth / 72, 1));
    const xTicks = months.filter((_, i) => i % every === 0);

    const trendPath = points
      .filter((point) => point.trend !== null)
      .map(
        (point, i) =>
          `${i === 0 ? "M" : "L"}${x(point.time).toFixed(1)},${y(point.trend!).toFixed(1)}`,
      )
      .join("");

    return { plotWidth, x, y, yTicks, xTicks, trendPath };
  }, [points, width]);

  const price = (cents: number | null) =>
    cents === null
      ? "-"
      : format.number(cents / 100, { style: "currency", currency: "EUR" });

  /** Index of the day closest to the pointer */
  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const scale = width / box.width;
    const pointerX = (event.clientX - box.left) * scale;
    let nearest = 0;
    points.forEach((point, i) => {
      if (
        Math.abs(chart.x(point.time) - pointerX) <
        Math.abs(chart.x(points[nearest].time) - pointerX)
      )
        nearest = i;
    });
    setActive(nearest);
  }

  function onKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      PageUp: -MOVING_AVERAGE_DAYS,
      PageDown: MOVING_AVERAGE_DAYS,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive((index) =>
        Math.min(
          Math.max((index ?? points.length) + moves[event.key], 0),
          points.length - 1,
        ),
      );
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : points.length - 1);
    }
  }

  const point = active !== null ? points[active] : null;

  return (
    <div className="space-y-3">
      {/* Group filter and legend */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4">
        <div className="flex gap-1" role="group">
          {GROUPS.map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={group === key ? "default" : "ghost"}
              aria-pressed={group === key}
              onClick={() => setGroup(key)}
            >
              {tMensa(label)}
            </Button>
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/50" />
            {t("daily")}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-primary" />
            {t("trend", { days: MOVING_AVERAGE_DAYS })}
          </li>
        </ul>
      </div>

      <div className="relative">
        <div ref={measure}>
          {measured === null ? (
            <div style={{ height: HEIGHT }} />
          ) : (
            <svg
              viewBox={`0 0 ${width} ${HEIGHT}`}
              className="block h-auto w-full touch-pan-y outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              role="img"
              aria-label={t("chartLabel")}
              tabIndex={0}
              onPointerMove={onPointerMove}
              onPointerLeave={() => setActive(null)}
              onKeyDown={onKeyDown}
              onBlur={() => setActive(null)}
            >
              {chart.yTicks.map((cents) => (
                <g key={cents}>
                  <line
                    x1={MARGIN.left}
                    x2={MARGIN.left + chart.plotWidth}
                    y1={chart.y(cents)}
                    y2={chart.y(cents)}
                    className="stroke-border"
                  />
                  <text
                    x={MARGIN.left - 8}
                    y={chart.y(cents)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted-foreground font-mono text-[11px]"
                  >
                    {price(cents)}
                  </text>
                </g>
              ))}
              {chart.xTicks.map((tick) => (
                <text
                  key={tick.date}
                  x={chart.x(tick.time)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {format.dateTime(toDate(tick.date), {
                    month: "short",
                    year: "2-digit",
                  })}
                </text>
              ))}

              {points.map((p) => (
                <circle
                  key={p.date}
                  cx={chart.x(p.time)}
                  cy={chart.y(p.value!)}
                  r={2}
                  className="fill-muted-foreground/50"
                />
              ))}
              <path
                d={chart.trendPath}
                fill="none"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="stroke-primary"
              />

              {point && (
                <g>
                  <line
                    x1={chart.x(point.time)}
                    x2={chart.x(point.time)}
                    y1={MARGIN.top}
                    y2={HEIGHT - MARGIN.bottom}
                    className="stroke-foreground/30"
                  />
                  <circle
                    cx={chart.x(point.time)}
                    cy={chart.y(point.value!)}
                    r={4}
                    strokeWidth={2}
                    className="fill-muted-foreground stroke-card"
                  />
                  {point.trend !== null && (
                    <circle
                      cx={chart.x(point.time)}
                      cy={chart.y(point.trend)}
                      r={4}
                      strokeWidth={2}
                      className="fill-primary stroke-card"
                    />
                  )}
                </g>
              )}
            </svg>
          )}
        </div>

        {point && (
          <div
            className="pointer-events-none absolute top-0 rounded-md border bg-card px-3 py-2 text-xs"
            style={
              chart.x(point.time) > width / 2
                ? {
                    right: `${((width - chart.x(point.time)) / width) * 100}%`,
                    marginRight: 12,
                  }
                : {
                    left: `${(chart.x(point.time) / width) * 100}%`,
                    marginLeft: 12,
                  }
            }
            aria-live="polite"
          >
            <p className="mb-1 font-mono text-muted-foreground">
              {format.dateTime(toDate(point.date), {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
            <p className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-muted-foreground/50" />
              <b className="font-mono">{price(point.value)}</b>
              <span className="text-muted-foreground">{t("daily")}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-2 rounded-full bg-primary" />
              <b className="font-mono">{price(point.trend)}</b>
              <span className="text-muted-foreground">
                {t("trend", { days: MOVING_AVERAGE_DAYS })}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Width of an element in CSS pixels, so the chart draws text at its real size */
function useWidth() {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width) || null),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [width, setElement] as const;
}
