"use client";

import {
  LoaderCircle,
  MapPin,
  Search,
  Star,
  TramFront,
  X,
  type LucideIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useDeferredValue, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelEmpty, PanelHeader } from "@/components/ui/panel";
import {
  DEFAULT_STOP,
  FEATURED_STOPS,
} from "@/content/public-transport/featured-stops";
import { findNearestStops } from "@/features/public-transport/nearest-stops";
import { getStop, searchStops } from "@/features/public-transport/stops";
import type { Stop } from "@/features/public-transport/types";
import { getCurrentPosition, GeolocationError } from "@/lib/geolocation";
import { cn } from "@/lib/utils";
import { DepartureRow } from "./departure-row";
import { LiveIndicator } from "./live-indicator";
import { useDepartures } from "./use-departures";
import { useSavedStops } from "./use-saved-stops";

/** Search parameter with the selected stop, e.g. `/public-transport?stop=1240` */
const STOP_PARAM = "stop";
const DEPARTURES_LIMIT = 20;
const NEARBY_COUNT = 5;

/** Yellow star of saved stops (save button, saved tiles) */
const SAVED_STAR = "fill-yellow-400 text-yellow-500";

type ListedStop = Stop & { distance?: number };
type LocationError = GeolocationError["code"] | "noStopsNearby";

/**
 * Departures page. Left (top on mobile): the featured stops as tiles, the saved stops, and a
 * panel to search or find stops nearby. Right (below on mobile): the departures of the selected
 * stop. The selected stop is part of the URL, so it can be shared and the home page can link to it.
 */
export function DeparturesExplorer() {
  const t = useTranslations("PublicTransport");
  const departuresRef = useRef<HTMLDivElement>(null);

  const stopParam = Number(useSearchParams().get(STOP_PARAM));
  const stop = getStop(stopParam) ?? getStop(DEFAULT_STOP.stopId)!;
  const { saved, toggle } = useSavedStops();
  const savedStops = saved.map(getStop).filter((s) => s !== undefined);

  function select(stopId: number) {
    if (stopId !== stop.stopId) {
      const url = new URL(window.location.href);
      url.searchParams.set(STOP_PARAM, String(stopId));
      // Next.js picks this up in `useSearchParams`; replace, so back leaves the page
      window.history.replaceState(null, "", url);
    }
    // The departures are below the stops on mobile
    if (window.matchMedia("(max-width: 767px)").matches) {
      departuresRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <div className="space-y-4 md:col-span-3">
        <div className="grid grid-cols-2 gap-2 px-4 md:px-0">
          {FEATURED_STOPS.map((featured) => (
            <StopTile
              key={featured.stopId}
              stop={getStop(featured.stopId) ?? featured}
              icon={TramFront}
              selected={featured.stopId === stop.stopId}
              onSelect={select}
            />
          ))}
        </div>

        <Panel className="py-3">
          <h2 className="mb-2 flex items-center gap-2 px-4 font-mono font-bold text-muted-foreground uppercase">
            <Star className={cn("size-4", SAVED_STAR)} aria-hidden />
            {t("saved")}
          </h2>
          {savedStops.length > 0 ? (
            <StopList
              stops={savedStops}
              selectedId={stop.stopId}
              onSelect={select}
            />
          ) : (
            <p className="px-4 text-sm text-muted-foreground">
              {t("savedHint")}
            </p>
          )}
        </Panel>

        <StopSearch selectedId={stop.stopId} onSelect={select} />
      </div>

      <div ref={departuresRef} className="scroll-mt-20 md:col-span-4">
        <StopDepartures
          stop={stop}
          saved={saved.includes(stop.stopId)}
          onToggleSaved={() => toggle(stop.stopId)}
        />
      </div>
    </div>
  );
}

function StopTile({
  stop,
  icon: Icon,
  selected,
  onSelect,
}: {
  stop: Stop;
  icon: LucideIcon;
  selected: boolean;
  onSelect: (stopId: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(stop.stopId)}
      aria-current={selected}
      className={cn(
        "flex h-14 w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors duration-200",
        selected
          ? "border-primary bg-background ring-1 ring-primary"
          : "bg-muted hover:bg-background",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
        <Icon className="size-4 text-primary" aria-hidden />
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-semibold",
          selected && "text-primary",
        )}
        title={stop.name}
      >
        {stop.name}
      </span>
    </button>
  );
}

/** Search field with a "near me" button; lists the matches or the nearest stops below */
function StopSearch({
  selectedId,
  onSelect,
}: {
  selectedId: number;
  onSelect: (stopId: number) => void;
}) {
  const t = useTranslations("PublicTransport");
  const tBoard = useTranslations("HomePage.PublicTransport");

  const [query, setQuery] = useState("");
  const searchQuery = useDeferredValue(query.trim());
  const results = searchQuery ? searchStops(searchQuery) : [];

  const [nearby, setNearby] = useState<ListedStop[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | null>(
    null,
  );

  async function locate() {
    setLocating(true);
    setLocationError(null);
    try {
      const nearest = findNearestStops(
        await getCurrentPosition(),
        NEARBY_COUNT,
      );
      if (nearest.length === 0) {
        setLocationError("noStopsNearby");
        return;
      }
      setQuery("");
      // Full names instead of the short ones of the home page tabs
      setNearby(
        nearest.map((near) => ({
          ...near,
          name: getStop(near.stopId)?.name ?? near.name,
        })),
      );
    } catch (error) {
      setLocationError(
        error instanceof GeolocationError ? error.code : "unavailable",
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <Panel className="py-3">
      <div className="flex items-center gap-2 px-4">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
              else if (event.key === "Enter" && results[0]) {
                event.preventDefault();
                onSelect(results[0].stopId);
              }
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            autoComplete="off"
            enterKeyHint="search"
            className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1.5 right-1 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label={t("clearSearch")}
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={locating}
          onClick={nearby ? () => setNearby(null) : locate}
          title={nearby ? t("closeNearby") : tBoard("nearMe")}
          aria-label={nearby ? t("closeNearby") : tBoard("nearMe")}
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
          {tBoard(`errors.location.${locationError}`)}
        </p>
      )}

      {searchQuery ? (
        results.length === 0 ? (
          <PanelEmpty className="my-4">{t("noResults")}</PanelEmpty>
        ) : (
          <StopList
            stops={results}
            selectedId={selectedId}
            onSelect={onSelect}
            className="mt-3"
          />
        )
      ) : (
        nearby && (
          <StopList
            stops={nearby}
            selectedId={selectedId}
            onSelect={onSelect}
            className="mt-3"
          />
        )
      )}
    </Panel>
  );
}

function StopList({
  stops,
  selectedId,
  onSelect,
  className,
}: {
  stops: ListedStop[];
  selectedId: number;
  onSelect: (stopId: number) => void;
  className?: string;
}) {
  const format = useFormatter();

  return (
    <ul className={cn("divide-y divide-border border-t", className)}>
      {stops.map((stop) => (
        <li key={stop.stopId}>
          <button
            type="button"
            onClick={() => onSelect(stop.stopId)}
            aria-current={stop.stopId === selectedId}
            className={cn(
              "flex w-full cursor-pointer items-center gap-4 px-4 py-2 text-left hover:bg-muted",
              stop.stopId === selectedId && "bg-muted font-semibold",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{stop.name}</span>
            {stop.distance !== undefined && (
              <span className="shrink-0 font-mono text-sm text-muted-foreground">
                {format.number(Math.round(stop.distance / 10) * 10, {
                  style: "unit",
                  unit: "meter",
                })}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function StopDepartures({
  stop,
  saved,
  onToggleSaved,
}: {
  stop: Stop;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const t = useTranslations("PublicTransport");
  const tBoard = useTranslations("HomePage.PublicTransport");
  const { departures, failed, loading } = useDepartures(stop.stopId, {
    limit: DEPARTURES_LIMIT,
  });

  return (
    <Panel>
      <PanelHeader
        title={
          <span className="block truncate" title={stop.name}>
            {stop.name}
          </span>
        }
      >
        <LiveIndicator label={tBoard("live")} />
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSaved}
          aria-pressed={saved}
          aria-label={saved ? t("saved") : t("save")}
          title={saved ? t("unsave") : t("save")}
          className={cn(
            saved &&
              "border-yellow-500/60 bg-yellow-400/10 text-foreground hover:bg-yellow-400/20 hover:text-foreground dark:border-yellow-500/60 dark:bg-yellow-400/10",
          )}
        >
          <Star className={cn(saved && SAVED_STAR)} />
          <span className="hidden sm:inline">
            {saved ? t("saved") : t("save")}
          </span>
        </Button>
      </PanelHeader>

      {failed && departures !== null && (
        <p className="px-4 text-xs text-warning">{tBoard("errors.stale")}</p>
      )}

      {departures === null && loading ? (
        <LoaderCircle
          className="mx-auto my-8 size-6 animate-spin text-muted-foreground"
          aria-hidden
        />
      ) : departures === null ? (
        <PanelEmpty>{tBoard("errors.unavailable")}</PanelEmpty>
      ) : departures.length === 0 && !loading ? (
        <PanelEmpty>{tBoard("noDepartures")}</PanelEmpty>
      ) : (
        <ol
          className={cn(
            "divide-y divide-border transition-opacity",
            loading && "opacity-50",
          )}
        >
          {departures.map((departure, index) => (
            <DepartureRow
              key={`${departure.route}-${departure.scheduledTime.getTime()}-${index}`}
              departure={departure}
              detailed
            />
          ))}
        </ol>
      )}
    </Panel>
  );
}
