import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { OCCUPANCY_COLORS } from "@/features/parking/occupancy";
import type { ParkingLotStatus } from "@/features/parking/queries";
import { cn } from "@/lib/utils";
import { lotFreeChange } from "./parking-forecast";

/** How far ahead the trend looks */
export const TREND_MINUTES = 30;

/**
 * Expected change of free spaces in `TREND_MINUTES`, next to the capacity like a stock ticker:
 * green, tilted up with "+n" (more free), red, tilted down with "−n" (fewer free), or an amber
 * flat arrow for less than 1 % of the lot (at least 2 spaces). The time span is in the tooltip
 * and for screen readers. Nothing without a forecast.
 */
export function FreeTrend({
  lot,
  updatedAt,
  className,
}: {
  lot: ParkingLotStatus;
  updatedAt: string;
  className?: string;
}) {
  const t = useTranslations("Parking.trend");
  const change = lotFreeChange(lot, updatedAt, TREND_MINUTES);
  if (change === null) return null;

  const same = Math.abs(change) < Math.max(2, lot.total * 0.01);
  const [Icon, color, label] = same
    ? [ArrowRight, OCCUPANCY_COLORS.filling, t("same")]
    : change > 0
      ? [ArrowUpRight, OCCUPANCY_COLORS.free, t("more", { count: change })]
      : [ArrowDownRight, OCCUPANCY_COLORS.full, t("fewer", { count: -change })];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono font-bold",
        className,
      )}
      style={{ color }}
      title={label}
    >
      <Icon className="size-3.5" strokeWidth={3} aria-hidden />
      {!same && (
        <span aria-hidden>
          {change > 0 ? "+" : "−"}
          {Math.abs(change)}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}
