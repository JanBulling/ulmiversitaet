"use client";

import { ArrowLeft, ChevronRight, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, PanelEmpty } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampusPlaces, isBuilding } from "@/features/campus-map/places";
import {
  CATEGORIES,
  placesInCategory,
  roomsInBuilding,
  searchPlaces,
  type Category,
} from "@/features/campus-map/search";
import type { Locale } from "@/lib/i18n/routing";
import { KIND_ICONS } from "./kind-icon";
import { PlaceDetails } from "./place-details";
import { PlaceRow } from "./place-row";

// MapLibre needs the browser (WebGL), and is only loaded on this page
const MapView = dynamic(
  () => import("./map-view").then((module) => module.MapView),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full rounded-none" />,
  },
);

/** Search parameter with the selected place, e.g. `/campus-map?p=o25-h1` */
const PLACE_PARAM = "p";

/**
 * Campus map with search ("Hörsaalfinder"): search or pick a category on the left (top on
 * mobile), the map on the right. The selected place is part of the URL, so links can be shared
 * and the back button closes the details.
 */
export function CampusMap() {
  const t = useTranslations("CampusMap");
  const locale = useLocale() as Locale;
  const places = useMemo(() => getCampusPlaces(locale), [locale]);
  const placesById = useMemo(
    () => new Map(places.map((place) => [place.id, place])),
    [places],
  );

  const selectedId = useSearchParams().get(PLACE_PARAM);
  const selected = (selectedId && placesById.get(selectedId)) || null;

  const [query, setQuery] = useState("");
  const searchQuery = useDeferredValue(query.trim());
  const [category, setCategory] = useState<Category | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  // Incremented to move the map back to the whole campus
  const [resetView, setResetView] = useState(0);

  const results = useMemo(
    () => searchPlaces(places, searchQuery),
    [places, searchQuery],
  );
  const categoryPlaces = useMemo(
    () => (category ? placesInCategory(places, category) : []),
    [places, category],
  );
  const listed = searchQuery ? results : categoryPlaces;
  const mapPlaces = useMemo(
    () =>
      selected && isBuilding(selected)
        ? roomsInBuilding(places, selected.id)
        : listed,
    [selected, places, listed],
  );

  /** `fromList`: picked in the list, which is below the map on mobile, so scroll up to the map */
  function select(id: string | null, { fromList = false } = {}) {
    if (id !== selectedId) {
      const url = new URL(window.location.href);
      if (id) url.searchParams.set(PLACE_PARAM, id);
      else url.searchParams.delete(PLACE_PARAM);
      // Next.js picks this up in `useSearchParams`; back closes the details again
      window.history.pushState(null, "", url);
    }
    if (id && fromList && window.matchMedia("(max-width: 1023px)").matches) {
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const selectFromList = (id: string) => select(id, { fromList: true });

  /** Back to the start: no selection, search or category, the whole campus on the map */
  function goHome() {
    if (selected) select(null);
    setQuery("");
    setCategory(null);
    setResetView((count) => count + 1);
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (index) => (index + step + results.length) % results.length,
      );
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      selectFromList(results[activeIndex].id);
    } else if (event.key === "Escape") {
      setQuery("");
    }
  }

  const showResults = Boolean(searchQuery) && !selected;

  return (
    <div className="grid grid-cols-1 gap-4 lg:h-[calc(100svh-14rem)] lg:min-h-140 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-y-0">
      {/* ── Search ── */}
      <Panel className="py-3 lg:col-start-1 lg:row-start-1 lg:border-b-0">
        <div className="relative px-4">
          <Search
            className="pointer-events-none absolute top-2.5 left-7 size-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              if (selected) select(null);
            }}
            onKeyDown={onSearchKeyDown}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            role="combobox"
            aria-expanded={showResults && results.length > 0}
            aria-controls="campus-results"
            aria-autocomplete="list"
            aria-activedescendant={
              showResults && results[activeIndex]
                ? `campus-result-${results[activeIndex].id}`
                : undefined
            }
            autoComplete="off"
            enterKeyHint="search"
            className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1.5 right-5 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label={t("clearSearch")}
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </Panel>

      {/* ── Map ── (`svh`: the height stays the same when the mobile browser bar hides while scrolling) */}
      <Panel
        ref={mapRef}
        className="relative h-[55svh] min-h-80 scroll-mt-20 overflow-hidden py-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto"
      >
        {mapFailed ? (
          <Alert variant="warning" className="m-4 w-auto">
            <AlertDescription>{t("mapError")}</AlertDescription>
          </Alert>
        ) : (
          <MapView
            places={mapPlaces}
            fitPlaces={!searchQuery && !selected && Boolean(category)}
            resetView={resetView}
            selected={selected}
            onSelect={select}
            onError={() => setMapFailed(true)}
            labels={{ map: t("mapLabel") }}
          />
        )}
      </Panel>

      {/* ── List / details ── */}
      <Panel className="py-3 lg:col-start-1 lg:row-start-2 lg:overflow-y-auto lg:border-t-0 lg:pt-0">
        {selected ? (
          <PlaceDetails
            key={selected.id}
            place={selected}
            places={places}
            onSelect={selectFromList}
            onBack={goHome}
          />
        ) : searchQuery ? (
          <>
            <p
              className="px-4 pb-1 text-sm text-muted-foreground"
              aria-live="polite"
            >
              {t("results", { count: results.length })}
            </p>
            {results.length === 0 ? (
              <PanelEmpty className="my-4">{t("noResults")}</PanelEmpty>
            ) : (
              <ul
                id="campus-results"
                role="listbox"
                aria-label={t("searchLabel")}
                className="divide-y divide-border"
              >
                {results.map((place, index) => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    option={{ id: `campus-result-${place.id}` }}
                    active={index === activeIndex}
                    onSelect={selectFromList}
                  />
                ))}
              </ul>
            )}
          </>
        ) : category ? (
          <>
            <div className="flex items-center gap-2 px-2 pb-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={goHome}
                aria-label={t("back")}
              >
                <ArrowLeft />
              </Button>
              <h2 className="text-lg font-semibold">
                {t(`categories.${category}`)}
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {categoryPlaces.map((place) => (
                <PlaceRow
                  key={place.id}
                  place={place}
                  withKind={place.kind !== category}
                  onSelect={selectFromList}
                />
              ))}
            </ul>
          </>
        ) : (
          <Categories places={places} onSelect={setCategory} />
        )}
      </Panel>
    </div>
  );
}

function Categories({
  places,
  onSelect,
}: {
  places: ReturnType<typeof getCampusPlaces>;
  onSelect: (category: Category) => void;
}) {
  const t = useTranslations("CampusMap");
  return (
    <>
      <ul className="divide-y divide-border">
        {CATEGORIES.map((category) => {
          const Icon = KIND_ICONS[category];
          return (
            <li key={category}>
              <button
                type="button"
                onClick={() => onSelect(category)}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted"
              >
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="flex-1 font-semibold">
                  {t(`categories.${category}`)}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {placesInCategory(places, category).length}
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 px-4 text-xs text-muted-foreground">
        {t.rich("source", {
          hsf: (chunks) => (
            <a
              href="https://www.uni-ulm.de/einrichtungen/kiz/weiteres/campus-navigation/hoersaalfinder/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              {chunks}
            </a>
          ),
          mail: (chunks) => (
            <a
              href="mailto:info@ulmiversitaet.de"
              className="underline underline-offset-4"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </>
  );
}
