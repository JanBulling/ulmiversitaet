"use client";

import { useFormatter, useTranslations } from "next-intl";

import {
  countdownLabel,
  delayStatus,
  formatDelay,
} from "@/features/public-transport/format";
import type { Departure } from "@/features/public-transport/types";
import { cn } from "@/lib/utils";
import { RouteIcon } from "./route-icon";

/**
 * One departure: line, direction, delay, and the countdown. `detailed` adds the platform and
 * the scheduled time (departures page).
 */
export function DepartureRow({
  departure,
  detailed = false,
}: {
  departure: Departure;
  detailed?: boolean;
}) {
  const t = useTranslations("HomePage.PublicTransport");
  const format = useFormatter();

  const delay = formatDelay(departure.deviation);
  const status = delayStatus(departure.deviation);
  const label = countdownLabel(
    departure.countdown,
    departure.actualTime,
    format,
  );
  const time = (date: Date) =>
    format.dateTime(date, { hour: "2-digit", minute: "2-digit" });

  return (
    <li className="flex items-center gap-4 px-4 py-2">
      <RouteIcon route={departure.route} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{departure.direction}</p>
        <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {detailed && (
            <span className="font-mono">{time(departure.scheduledTime)}</span>
          )}
          <span
            className={cn(
              status < 0 && "text-success",
              status > 0 && "text-destructive",
            )}
          >
            {delay ?? t("onTime")}
          </span>
          {detailed && departure.platform && (
            <span>{t("platform", { platform: departure.platform })}</span>
          )}
        </p>
      </div>
      <p className="shrink-0 font-mono font-semibold text-muted-foreground">
        {label.kind === "departed"
          ? t("departed")
          : label.kind === "now"
            ? t("now")
            : label.kind === "seconds"
              ? t("seconds", { count: label.value })
              : label.kind === "minutes"
                ? t("minutes", { count: label.value })
                : label.value}
      </p>
    </li>
  );
}
