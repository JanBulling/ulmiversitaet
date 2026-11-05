"use client";

import { LoaderCircle, MapPin, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_STOP,
  FEATURED_STOPS,
} from "@/content/public-transport/featured-stops";
import {
  countdownLabel,
  delayStatus,
  formatDelay,
} from "@/features/public-transport/format";
import { getDepartures } from "@/features/public-transport/swu-api";
import type { Departure, Stop } from "@/features/public-transport/types";
import { getCurrentPosition, GeolocationError } from "@/lib/geolocation";
import { cn } from "@/lib/utils";
import { RouteIcon } from "./route-icon";

const REFRESH_INTERVAL_MS = 15_000;

type LocationError = GeolocationError["code"] | "noStopsNearby";

/**
 * Departures of the selected stop, refreshed every 15 s directly from the SWU API
 * (it allows cross-origin requests) with a countdown that ticks every second.
 */
export function DeparturesBoard({
  initialDepartures,
}: {
  /** `null` if the server couldn't load them */
  initialDepartures: Departure[] | null;
}) {
  const t = useTranslations("HomePage.PublicTransport");
  const format = useFormatter();

  const [stops, setStops] = useState<readonly Stop[]>(FEATURED_STOPS);
  const [nearby, setNearby] = useState(false);
  const [stopId, setStopId] = useState<number>(DEFAULT_STOP.stopId);
  const [departures, setDepartures] = useState<Departure[] | null>(
    initialDepartures,
  );
  const [failed, setFailed] = useState(initialDepartures === null);
  const [switching, setSwitching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | null>(
    null,
  );

  async function load(id: number) {
    try {
      const next = await getDepartures(id);
      setDepartures(next);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  // Countdown every second, fresh data every 15 s (paused while the tab is hidden)
  useEffect(() => {
    const tick = setInterval(() => {
      setDepartures(
        (current) =>
          current?.map((departure) => ({
            ...departure,
            countdown: departure.countdown - 1,
          })) ?? null,
      );
    }, 1000);
    const refresh = setInterval(() => {
      if (document.visibilityState === "visible") void load(stopId);
    }, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [stopId]);

  async function selectStop(id: number) {
    setStopId(id);
    setSwitching(true);
    await load(id);
    setSwitching(false);
  }

  async function showNearbyStops() {
    setLocating(true);
    setLocationError(null);
    try {
      const position = await getCurrentPosition();
      // Loaded on demand to keep the stop list out of the initial bundle
      const { findNearestStops } =
        await import("@/features/public-transport/nearest-stops");
      const nearest = findNearestStops(position);
      if (nearest.length === 0) {
        setLocationError("noStopsNearby");
        return;
      }
      setStops(nearest);
      setNearby(true);
      await selectStop(nearest[0].stopId);
    } catch (error) {
      setLocationError(
        error instanceof GeolocationError ? error.code : "unavailable",
      );
    } finally {
      setLocating(false);
    }
  }

  async function showFeaturedStops() {
    setStops(FEATURED_STOPS);
    setNearby(false);
    setLocationError(null);
    await selectStop(DEFAULT_STOP.stopId);
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-4">
        <div
          role="tablist"
          className="flex min-w-0 flex-1 gap-1 rounded-lg bg-muted p-1"
        >
          {stops.map((stop) => (
            <button
              key={stop.stopId}
              role="tab"
              aria-selected={stop.stopId === stopId}
              onClick={() => selectStop(stop.stopId)}
              className={cn(
                "min-w-0 flex-1 truncate rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors",
                stop.stopId === stopId
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "hover:text-foreground",
              )}
            >
              {stop.name}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={locating}
          onClick={nearby ? showFeaturedStops : showNearbyStops}
          title={nearby ? t("backToCampus") : t("nearMe")}
          aria-label={nearby ? t("backToCampus") : t("nearMe")}
        >
          {locating ? (
            <LoaderCircle className="animate-spin" />
          ) : nearby ? (
            <X />
          ) : (
            <MapPin />
          )}
        </Button>
      </div>

      {locationError && (
        <p className="mt-2 px-4 text-sm text-destructive" role="alert">
          {t(`errors.location.${locationError}`)}
        </p>
      )}
      {failed && departures !== null && (
        <p className="mt-2 px-4 text-xs text-warning">{t("errors.stale")}</p>
      )}

      {departures === null ? (
        <p className="my-8 px-4 text-center text-muted-foreground italic">
          {t("errors.unavailable")}
        </p>
      ) : departures.length === 0 ? (
        <p className="my-8 px-4 text-center text-muted-foreground italic">
          {t("noDepartures")}
        </p>
      ) : (
        <ol
          className={cn(
            "mt-2 divide-y divide-border transition-opacity",
            switching && "opacity-50",
          )}
        >
          {departures.map((departure, index) => {
            const delay = formatDelay(departure.deviation);
            const status = delayStatus(departure.deviation);
            const label = countdownLabel(
              departure.countdown,
              departure.actualTime,
              format,
            );
            return (
              <li
                key={`${departure.route}-${departure.scheduledTime.getTime()}-${index}`}
                className="flex items-center gap-4 px-4 py-2"
              >
                <RouteIcon route={departure.route} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {departure.direction}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      status < 0
                        ? "text-success"
                        : status > 0
                          ? "text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    {delay ?? t("onTime")}
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
          })}
        </ol>
      )}
    </div>
  );
}
