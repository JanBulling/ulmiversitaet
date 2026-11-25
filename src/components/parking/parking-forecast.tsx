"use client";

import { Info } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import data from "@/content/parking/forecast.json";
import {
  CAMPUS_LOTS as CAMPUS_LOT_CODES,
  PARKING_LOTS,
} from "@/content/parking/parking-lots";
import {
  berlinTime,
  coarsen,
  combineLots,
  comparedToUsual,
  expectedFreeChange,
  type ForecastModel,
  forecastDay,
  formatMinutes,
  fullWindow,
  type LiveReading,
  type LotModel,
  mean,
} from "@/features/parking/forecast";
import { OCCUPANCY_COLORS, occupancyLevel } from "@/features/parking/occupancy";
import type { ParkingLotStatus } from "@/features/parking/queries";
import { addDays, isoWeekday, toDate, today } from "@/lib/date";
import { cn } from "@/lib/utils";

const MODEL = data as ForecastModel;
/** Time shown as bars, one per 30 minutes: 06:00 to 22:00 */
const FIRST_HOUR = 6;
const LAST_HOUR = 22;
/** Minutes per bar; the model's 15-minute slots are combined to this */
const SLOT = 30;
const FACTOR = SLOT / MODEL.slotMinutes;
const HOURS = Array.from(
  { length: LAST_HOUR - FIRST_HOUR },
  (_, i) => FIRST_HOUR + i,
);
const SLOTS = Array.from(
  { length: ((LAST_HOUR - FIRST_HOUR) * 60) / SLOT },
  (_, i) => (FIRST_HOUR * 60) / SLOT + i,
);

/** Whether there is forecast data for this lot (lots without a counter have none) */
export function hasForecast(lot: Pick<ParkingLotStatus, "counterId">): boolean {
  return lot.counterId !== null && String(lot.counterId) in MODEL.lots;
}

/** Lots of the campus forecast */
const CAMPUS_LOTS = PARKING_LOTS.filter((lot) =>
  CAMPUS_LOT_CODES.includes(lot.code),
);
const CAMPUS_MODEL = combineLots(
  CAMPUS_LOTS.map((lot) => MODEL.lots[lot.counterId!]),
);
/** Number of spaces of the campus forecast */
export const CAMPUS_TOTAL = CAMPUS_LOTS.reduce(
  (sum, lot) => sum + lot.total,
  0,
);

/**
 * "Popular times" of one lot: free spaces per 30 minutes for today and the next six days, today
 * corrected by the live reading. Renders nothing for lots without forecast data.
 * `updatedAt` is the time of the reading (`ParkingSnapshot.updatedAt`); "now" is taken from
 * it, so server and browser render the same.
 */
export function ParkingForecast({
  lot,
  updatedAt,
}: {
  lot: ParkingLotStatus;
  updatedAt: string;
}) {
  const model = lot.counterId ? MODEL.lots[lot.counterId] : undefined;
  if (!model) return null;
  return (
    <ForecastChart
      model={model}
      total={lot.total}
      free={lot.free}
      updatedAt={updatedAt}
    />
  );
}

/**
 * Expected change of a lot's free spaces `minutes` after the reading (positive: more free), or
 * `null` without a reading, forecast data, or when that is already tomorrow
 */
export function lotFreeChange(
  lot: ParkingLotStatus,
  updatedAt: string,
  minutes: number,
): number | null {
  const model = lot.counterId ? MODEL.lots[lot.counterId] : undefined;
  if (!model || lot.free === null) return null;
  const live = { parked: lot.total - lot.free, at: new Date(updatedAt) };
  return expectedFreeChange(MODEL, model, lot.total, live, minutes);
}

/**
 * The lots of `CAMPUS_LOTS` added up, today only, compact (home page). Without a reading from every lot,
 * it shows the typical day.
 */
export function CampusParkingForecast({
  lots,
  updatedAt,
}: {
  lots: ParkingLotStatus[];
  updatedAt: string;
}) {
  const free = CAMPUS_LOTS.map(
    (campusLot) => lots.find((lot) => lot.code === campusLot.code)?.free,
  );
  return (
    <ForecastChart
      model={CAMPUS_MODEL}
      total={CAMPUS_TOTAL}
      free={
        free.every((spaces) => typeof spaces === "number")
          ? free.reduce((sum, spaces) => sum + spaces, 0)
          : null
      }
      updatedAt={updatedAt}
      compact
    />
  );
}

function ForecastChart({
  model,
  total,
  free: liveFree,
  updatedAt,
  compact = false,
}: {
  model: LotModel;
  total: number;
  /** Free spaces now, `null` without a reading */
  free: number | null;
  updatedAt: string;
  /**
   * Today only, for a narrow panel: no day selector, a lower chart, no disclaimer
   */
  compact?: boolean;
}) {
  const t = useTranslations("Parking.forecast");
  const format = useFormatter();

  const at = new Date(updatedAt);
  const now = berlinTime(at);
  const day0 = today(at);
  const [dayOffset, setDayOffset] = useState(0);
  const nowSlot = Math.floor(now.minute / SLOT);
  const [slot, setSlot] = useState(
    Math.min(Math.max(nowSlot, SLOTS[0]), SLOTS[SLOTS.length - 1]),
  );

  const day = addDays(day0, dayOffset);
  const weekday = isoWeekday(day) - 1;
  const live: LiveReading | undefined =
    liveFree === null ? undefined : { parked: total - liveFree, at };
  const isToday = dayOffset === 0;
  const slots = coarsen(
    forecastDay(MODEL, model, weekday, total, isToday ? live : undefined),
    FACTOR,
    mean,
  );
  // The current slot shows the live reading, like the big number next to it
  if (isToday && live) slots[nowSlot] = Math.min(total, live.parked);
  const full = fullWindow(slots, total, SLOT, isToday ? nowSlot : 0);
  /** Nothing full ahead today: say until when tomorrow there is probably space */
  const freeUntilTomorrow = () => {
    const tomorrow = fullWindow(
      coarsen(
        forecastDay(MODEL, model, (weekday + 1) % 7, total),
        FACTOR,
        mean,
      ),
      total,
      SLOT,
    );
    return tomorrow
      ? t("freeUntilTomorrow", { from: formatMinutes(tomorrow[0]) })
      : t("notFullToday");
  };
  const fullMessage = full
    ? isToday
      ? full[0] <= now.minute
        ? // "Full" also covers a few spaces left (≤ 5 %), so name them when there are any
          liveFree
          ? t("almostFullNow", { free: liveFree, to: formatMinutes(full[1]) })
          : t("fullNow", { to: formatMinutes(full[1]) })
        : t("fullToday", {
            from: formatMinutes(full[0]),
            to: formatMinutes(full[1]),
          })
      : t("fullUsually", {
          from: formatMinutes(full[0]),
          to: formatMinutes(full[1]),
        })
    : isToday
      ? freeUntilTomorrow()
      : t("notFullUsually");

  const free = Math.max(0, total - slots[slot]);
  const message =
    isToday && live && slot === nowSlot
      ? "now"
      : isToday && slot > nowSlot
        ? "expected"
        : "usually";

  const daySelector = !compact && (
    <div className="flex gap-1.5 overflow-x-auto px-4 pb-1" role="group">
      {/* Monday to Sunday, "today" in its place; earlier weekdays are next week's */}
      {[0, 1, 2, 3, 4, 5, 6]
        .map((weekday) => (weekday - now.weekday + 7) % 7)
        .map((offset) => (
          <Button
            key={offset}
            size="sm"
            variant={offset === dayOffset ? "default" : "outline"}
            className="rounded-full"
            aria-pressed={offset === dayOffset}
            onClick={() => setDayOffset(offset)}
          >
            {offset === 0
              ? t("today")
              : format.dateTime(toDate(addDays(day0, offset)), {
                  weekday: "short",
                })}
          </Button>
        ))}
    </div>
  );

  if (model.days[weekday] === 0) {
    return (
      <div className={cn("space-y-3", !compact && "py-3")}>
        {daySelector}
        <p className="px-4 text-sm text-muted-foreground italic">
          {t("noData")}
        </p>
      </div>
    );
  }

  /** Select the bar under the pointer: hover with a mouse, drag a finger along the chart */
  const scrub = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const index = Math.floor(
      ((event.clientX - rect.left) / rect.width) * SLOTS.length,
    );
    setSlot(SLOTS[Math.min(SLOTS.length - 1, Math.max(0, index))]);
  };

  const slotTime = `${formatMinutes(slot * SLOT)}–${formatMinutes((slot + 1) * SLOT)}`;
  const freeColor = OCCUPANCY_COLORS[occupancyLevel(free, total)];
  const occupied = format.number((total - free) / total, {
    style: "percent",
    maximumFractionDigits: 0,
  });

  return (
    <div className={cn("space-y-3", !compact && "py-3")}>
      {daySelector}

      <div className="flex items-start gap-3 px-4 text-sm">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p
            className="font-semibold"
            style={full ? { color: OCCUPANCY_COLORS.full } : undefined}
          >
            {fullMessage}
          </p>
          {isToday && live && (
            <p className="text-muted-foreground">
              {t(comparedToUsual(MODEL, model, total, live))}
            </p>
          )}
        </div>
        {/* Readout of the selected bar, next to the headline and above the chart, so a finger
            doesn't cover it. Fixed width, so the headline doesn't rewrap while scrubbing.
            Compact: share of spaces occupied instead of free spaces */}
        <div
          className={cn("shrink-0 text-right", compact ? "w-24" : "w-16")}
          aria-live="polite"
        >
          <p
            className="font-mono text-2xl leading-none font-bold"
            style={{ color: freeColor }}
            aria-hidden
          >
            {compact ? occupied : free}
          </p>
          <p className="mt-1 text-xs text-muted-foreground" aria-hidden>
            {compact && `${t("occupied")} · `}
            <span className="font-mono">
              {message === "now" ? t("nowShort") : formatMinutes(slot * SLOT)}
            </span>
          </p>
          <p className="sr-only">
            {slotTime}:{" "}
            {compact ? `${occupied} ${t("occupied")}` : t(message, { free })}
          </p>
        </div>
      </div>

      {/* Bars: parked cars per 15 minutes, colored like the live numbers */}
      <div className="px-4">
        <div
          className={cn(
            "flex touch-pan-y items-end gap-px border-b border-border",
            compact ? "h-24" : "h-28",
          )}
          role="group"
          aria-label={t("chartLabel")}
          onPointerMove={scrub}
          onPointerDown={scrub}
        >
          {SLOTS.map((s) => {
            const cars = slots[s];
            const level = occupancyLevel(total - cars, total);
            const isNow = isToday && s === nowSlot;
            const isPast = isToday && s < nowSlot;
            return (
              <button
                key={s}
                type="button"
                className="relative flex h-full flex-1 cursor-pointer items-end outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-pressed={s === slot}
                aria-label={t("barLabel", {
                  hour: formatMinutes(s * SLOT),
                  free: Math.max(0, total - cars),
                })}
                onClick={() => setSlot(s)}
              >
                {isNow && (
                  <span
                    className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/60"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "relative w-full rounded-t-[2px] transition-opacity",
                    // Past slots of today: gray, so the rest of the day stands out
                    isPast
                      ? s === slot
                        ? "opacity-40"
                        : "opacity-20"
                      : s === slot
                        ? "opacity-100"
                        : "opacity-60",
                  )}
                  style={{
                    height: `${Math.max(2, (cars / total) * 100)}%`,
                    // Past slots: mostly gray with a hint of the occupancy color
                    backgroundColor: isPast
                      ? `color-mix(in oklab, ${OCCUPANCY_COLORS[level]} 50%, var(--muted-foreground))`
                      : OCCUPANCY_COLORS[level],
                  }}
                />
              </button>
            );
          })}
        </div>
        <div className="flex font-mono text-[11px] text-muted-foreground">
          {HOURS.map((h) => (
            <span key={h} className="flex-1">
              {h % 3 === 0 && (
                <span className="inline-block -translate-x-1/2">{h}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {!compact && (
        <p className="flex gap-1.5 px-4 text-xs text-muted-foreground">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          {t("disclaimer")}
        </p>
      )}
    </div>
  );
}
