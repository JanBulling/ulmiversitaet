"use client";

import { ChevronRight, LoaderCircle, MapPin, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PanelFooter } from "@/components/ui/panel";
import {
  DEFAULT_STOP,
  FEATURED_STOPS,
} from "@/content/public-transport/featured-stops";
import type { Departure, Stop } from "@/features/public-transport/types";
import { getCurrentPosition, GeolocationError } from "@/lib/geolocation";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { DepartureRow } from "./departure-row";
import { useDepartures } from "./use-departures";

type LocationError = GeolocationError["code"] | "noStopsNearby";

/**
 * Departures of the selected stop (featured stops or the ones nearby), live via
 * `useDepartures`, with a link to the departures page for that stop.
 */
export function DeparturesBoard({
  initialDepartures,
}: {
  /** `null` if the server couldn't load them */
  initialDepartures: Departure[] | null;
}) {
  const t = useTranslations("HomePage.PublicTransport");

  const [stops, setStops] = useState<readonly Stop[]>(FEATURED_STOPS);
  const [nearby, setNearby] = useState(false);
  const [stopId, setStopId] = useState<number>(DEFAULT_STOP.stopId);
  const { departures, failed, loading } = useDepartures(stopId, {
    initial: { stopId: DEFAULT_STOP.stopId, departures: initialDepartures },
  });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | null>(
    null,
  );

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
      setStopId(nearest[0].stopId);
    } catch (error) {
      setLocationError(
        error instanceof GeolocationError ? error.code : "unavailable",
      );
    } finally {
      setLocating(false);
    }
  }

  function showFeaturedStops() {
    setStops(FEATURED_STOPS);
    setNearby(false);
    setLocationError(null);
    setStopId(DEFAULT_STOP.stopId);
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
              onClick={() => setStopId(stop.stopId)}
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

      {departures === null && loading ? (
        <LoaderCircle
          className="mx-auto my-8 size-6 animate-spin text-muted-foreground"
          aria-hidden
        />
      ) : departures === null ? (
        <p className="my-8 px-4 text-center text-muted-foreground italic">
          {t("errors.unavailable")}
        </p>
      ) : departures.length === 0 && !loading ? (
        <p className="my-8 px-4 text-center text-muted-foreground italic">
          {t("noDepartures")}
        </p>
      ) : (
        <ol
          className={cn(
            "mt-2 divide-y divide-border transition-opacity",
            loading && "opacity-50",
          )}
        >
          {departures.map((departure, index) => (
            <DepartureRow
              key={`${departure.route}-${departure.scheduledTime.getTime()}-${index}`}
              departure={departure}
            />
          ))}
        </ol>
      )}

      <PanelFooter>
        <Button variant="outline" asChild>
          <Link
            href={{
              pathname: "/public-transport",
              query: { stop: stopId },
            }}
          >
            {t("moreDepartures")}
            <ChevronRight />
          </Link>
        </Button>
      </PanelFooter>
    </div>
  );
}
