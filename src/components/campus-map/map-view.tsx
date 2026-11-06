"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  AttributionControl,
  GeolocateControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type ExpressionSpecification,
  type GeoJSONSource,
} from "maplibre-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import {
  BUILDINGS,
  CAMPUS_BOUNDS,
  CAMPUS_VIEW,
  MAIN_CAMPUS_BOUNDS,
  type BuildingFeature,
} from "@/content/campus-map";
import {
  getBuilding,
  isBuilding,
  type CampusPlace,
} from "@/features/campus-map/places";

// The worker is a separate file in maplibre-gl 6; the bundler copies it and gives us its URL
setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
);

/** Free vector tiles without API key or cookies (https://openfreemap.org) */
const STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

/**
 * Map colors. Buildings and the selected building are derived from `--primary` (#8199a9),
 * darker/lighter for contrast on the base map.
 */
const COLORS = {
  light: {
    building: "#8199a9",
    buildingLine: "#6b8494",
    label: "#2b3a44",
    halo: "#ffffff",
    selected: "#2f6f96",
  },
  dark: {
    building: "#8199a9",
    buildingLine: "#8ea5b4",
    label: "#e8edf0",
    halo: "#16191d",
    selected: "#7cc0e8",
  },
};

type Theme = keyof typeof COLORS;

/**
 * OpenFreeMap's dark style is almost black; these colors lighten it to a few steps above the
 * site's dark background (`#17171c`), so streets and areas stay readable. Keyed by layer id.
 */
type PaintProperty = Parameters<MapLibreMap["setPaintProperty"]>[1];

const DARK_BASE_MAP: Record<string, Partial<Record<PaintProperty, string>>> = {
  background: { "background-color": "#24242a" },
  water: { "fill-color": "#1d2733" },
  waterway: { "line-color": "#1d2733" },
  landuse_residential: { "fill-color": "#26262c" },
  landcover_wood: { "fill-color": "#283029" },
  landuse_park: { "fill-color": "#283029" },
  building: { "fill-color": "#2e2e35", "fill-outline-color": "#3a3a42" },
  road_area_pier: { "fill-color": "#24242a" },
  road_pier: { "line-color": "#24242a" },
  highway_path: { "line-color": "#3a3a42" },
  highway_minor: { "line-color": "#3d3d45" },
  highway_major_casing: { "line-color": "#4a4a53" },
  highway_major_inner: { "line-color": "#36363d" },
  highway_major_subtle: { "line-color": "#3d3d45" },
  highway_motorway_casing: { "line-color": "#4a4a53" },
  highway_motorway_inner: { "line-color": "#36363d" },
  highway_motorway_subtle: { "line-color": "#3d3d45" },
  railway_transit: { "line-color": "#45454d" },
  railway_transit_dashline: { "line-color": "#24242a" },
  railway_minor: { "line-color": "#45454d" },
  railway_minor_dashline: { "line-color": "#24242a" },
  railway: { "line-color": "#45454d" },
  railway_dashline: { "line-color": "#24242a" },
};

type PlaceColor = "default" | "printer" | "stop" | "parking";

/**
 * Dots, their names and the pin: red by default, so they stand out from the blue buildings;
 * places with a printer green (also PC pools with one), stops yellow, parking blue. Names are a bit
 * darker (lighter in dark mode) to be readable.
 */
const PLACE_COLORS: Record<
  Theme,
  Record<PlaceColor, { dot: string; text: string }>
> = {
  light: {
    default: { dot: "#e03131", text: "#c92a2a" },
    printer: { dot: "#2f9e44", text: "#2b8a3e" },
    stop: { dot: "#f59f00", text: "#b35c00" },
    parking: { dot: "#1c7ed6", text: "#1864ab" },
  },
  dark: {
    default: { dot: "#ff6b6b", text: "#ff8787" },
    printer: { dot: "#51cf66", text: "#69db7c" },
    stop: { dot: "#fcc419", text: "#ffd43b" },
    parking: { dot: "#4dabf7", text: "#74c0fc" },
  },
};

/** The color of a place depends only on the place, so a dot and its pin always match */
function placeColor(place: CampusPlace): PlaceColor {
  if (place.kind === "printer" || place.printer) return "printer";
  if (place.kind === "stop" || place.kind === "parking") return place.kind;
  return "default";
}

/** Paint expression choosing the color of a dot or name by its `color` property */
function byPlaceColor(
  theme: Theme,
  part: "dot" | "text",
): ExpressionSpecification {
  const colors = PLACE_COLORS[theme];
  return [
    "match",
    ["get", "color"],
    "printer",
    colors.printer[part],
    "stop",
    colors.stop[part],
    "parking",
    colors.parking[part],
    colors.default[part],
  ];
}

const FONT = ["Noto Sans Bold"];

/** Building labels, one per building (at `center`), so outlines in several parts get one label */
const BUILDING_LABELS: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: BUILDINGS.features
    .filter((feature) => feature.properties.center)
    .map((feature) => ({
      type: "Feature",
      properties: {
        id: feature.properties.id,
        label: feature.properties.label,
      },
      geometry: { type: "Point", coordinates: feature.properties.center! },
    })),
};

export type MapViewProps = {
  /** Shown as dots (search results or a category) */
  places: CampusPlace[];
  /** Zoom to `places` when they change (categories), instead of keeping the view (typing) */
  fitPlaces: boolean;
  /** Changes when the map should show the whole campus again */
  resetView: number;
  selected: CampusPlace | null;
  onSelect: (id: string) => void;
  /** WebGL not available or the map style can't be loaded */
  onError: () => void;
  labels: { map: string };
};

/** Interactive map with all building outlines; highlights the selected place */
export function MapView({
  places,
  fitPlaces,
  resetView,
  selected,
  onSelect,
  onError,
  labels,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const { resolvedTheme } = useTheme();
  const theme: Theme = resolvedTheme === "dark" ? "dark" : "light";

  // Latest props for the map callbacks (they are registered once)
  const state = useRef({ places, selected, theme, onSelect, onError });
  useEffect(() => {
    state.current = { places, selected, theme, onSelect, onError };
  });

  // ── Create the map once ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container,
        style: STYLES[state.current.theme],
        bounds: CAMPUS_VIEW.bounds,
        maxBounds: CAMPUS_BOUNDS,
        minZoom: 13,
        maxZoom: 20,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch {
      state.current.onError();
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new AttributionControl({ compact: true }));
    map.addControl(new NavigationControl({ showCompass: false }));
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
    );

    let styleLoaded = false;
    map.on("style.load", () => {
      styleLoaded = true;
      hideBaseMapLabels(map);
      if (state.current.theme === "dark") lightenDarkBaseMap(map);
      addCampusLayers(map, state.current.theme);
      showPlaces(map, state.current.places);
      highlightBuilding(map, state.current.selected?.buildingId);
    });
    map.on("error", (event) => {
      // Missing tiles are fine; without a style there is no map at all
      if (!styleLoaded) {
        console.error("[campus-map]", event.error);
        state.current.onError();
      }
    });

    map.on("click", (event) => {
      const [feature] = map.queryRenderedFeatures(event.point, {
        layers: ["campus-places", "campus-buildings-fill"],
      });
      const id = feature?.properties?.id;
      if (typeof id === "string") state.current.onSelect(id);
    });
    for (const layer of ["campus-places", "campus-buildings-fill"]) {
      map.on("mouseenter", layer, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
      });
    }

    return () => {
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  // ── Theme: swap the base map; `diff: false` replaces the whole style, so "style.load" fires
  // and adds the campus layers again (a diff would silently drop them) ──
  const initialTheme = useRef(theme);
  useEffect(() => {
    if (theme === initialTheme.current) return;
    initialTheme.current = theme;
    mapRef.current?.setStyle(STYLES[theme], { diff: false });
  }, [theme]);

  // ── Dots for the current results ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    showPlaces(map, places);
    if (!fitPlaces) return;
    // Places far away (Michelsberg, stops in the city) don't zoom the map out
    const [west, south, east, north] = MAIN_CAMPUS_BOUNDS;
    const onCampus = places.filter(
      (place) =>
        place.lng >= west &&
        place.lng <= east &&
        place.lat >= south &&
        place.lat <= north,
    );
    if (onCampus.length > 0) {
      map.fitBounds(boundsOf(onCampus.map((place) => [place.lng, place.lat])), {
        padding: 60,
        maxZoom: 17.5,
      });
    }
  }, [places, fitPlaces]);

  // ── Back to the start view ──
  useEffect(() => {
    if (resetView > 0) mapRef.current?.fitBounds(CAMPUS_VIEW.bounds);
  }, [resetView]);

  // ── Selection: highlight the building, pin the place, move the map there ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    highlightBuilding(map, selected?.buildingId);

    markerRef.current?.remove();
    markerRef.current = null;
    if (!selected) return;

    // A building is shown by its highlighted outline, everything else gets a pin
    const outline = isBuilding(selected)
      ? getBuilding(selected.id)?.geometry
      : undefined;
    if (!outline) {
      markerRef.current = new Marker({
        element: pinElement(
          PLACE_COLORS[theme][placeColor(selected)].dot,
          COLORS[theme].halo,
        ),
        anchor: "bottom",
      })
        .setLngLat([selected.lng, selected.lat])
        .addTo(map);
    }

    if (outline) {
      map.fitBounds(boundsOf(outlinePoints(outline)), {
        padding: 80,
        maxZoom: 18,
      });
    } else {
      map.flyTo({
        center: [selected.lng, selected.lat],
        zoom: Math.max(map.getZoom(), 17.5),
      });
    }
  }, [selected, theme]);

  return (
    <div
      ref={containerRef}
      className="size-full"
      role="region"
      aria-label={labels.map}
    />
  );
}

/**
 * Only street names stay from the base map; names of ponds, places, airports … are hidden so the
 * campus labels are the only other text. Street layers are called `highway…`/`road…` in both styles.
 */
function hideBaseMapLabels(map: MapLibreMap) {
  for (const layer of map.getStyle().layers) {
    if (layer.type === "symbol" && !/^(highway|road)/.test(layer.id)) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }
}

function lightenDarkBaseMap(map: MapLibreMap) {
  for (const [layer, paint] of Object.entries(DARK_BASE_MAP)) {
    if (!map.getLayer(layer)) continue;
    for (const [property, color] of Object.entries(paint)) {
      map.setPaintProperty(layer, property as PaintProperty, color);
    }
  }
}

function addCampusLayers(map: MapLibreMap, theme: Theme) {
  const colors = COLORS[theme];
  map.addSource("campus-buildings", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: BUILDINGS.features.filter((feature) => feature.geometry),
    } as GeoJSON.FeatureCollection,
    promoteId: "id",
  });
  map.addSource("campus-building-labels", {
    type: "geojson",
    data: BUILDING_LABELS,
  });
  map.addSource("campus-places", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  const selected: ExpressionSpecification = [
    "boolean",
    ["feature-state", "selected"],
    false,
  ];
  map.addLayer({
    id: "campus-buildings-fill",
    type: "fill",
    source: "campus-buildings",
    paint: {
      "fill-color": ["case", selected, colors.selected, colors.building],
      "fill-opacity": ["case", selected, 0.6, 0.3],
    },
  });
  map.addLayer({
    id: "campus-buildings-line",
    type: "line",
    source: "campus-buildings",
    paint: {
      "line-color": ["case", selected, colors.selected, colors.buildingLine],
      "line-width": ["case", selected, 2.5, 1],
    },
  });
  map.addLayer({
    id: "campus-building-labels",
    type: "symbol",
    source: "campus-building-labels",
    minzoom: 14.5,
    layout: {
      "text-field": ["get", "label"],
      "text-font": FONT,
      "text-size": ["interpolate", ["linear"], ["zoom"], 14.5, 10, 18, 17],
    },
    paint: {
      "text-color": colors.label,
      "text-halo-color": colors.halo,
      "text-halo-width": 1.5,
    },
  });
  map.addLayer({
    id: "campus-places",
    type: "circle",
    source: "campus-places",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 4, 18, 7],
      "circle-color": byPlaceColor(theme, "dot"),
      "circle-stroke-color": colors.halo,
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: "campus-place-labels",
    type: "symbol",
    source: "campus-places",
    minzoom: 16.5,
    layout: {
      "text-field": ["get", "name"],
      "text-font": FONT,
      "text-size": 12,
      "text-anchor": "top",
      "text-offset": [0, 0.8],
      "text-optional": true,
    },
    paint: {
      "text-color": byPlaceColor(theme, "text"),
      "text-halo-color": colors.halo,
      "text-halo-width": 1.5,
    },
  });
}

function showPlaces(map: MapLibreMap, places: CampusPlace[]) {
  const source = map.getSource<GeoJSONSource>("campus-places");
  source?.setData({
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      properties: {
        id: place.id,
        name: place.name,
        color: placeColor(place),
      },
      geometry: { type: "Point", coordinates: [place.lng, place.lat] },
    })),
  });
}

function highlightBuilding(map: MapLibreMap, buildingId: string | undefined) {
  if (!map.getSource("campus-buildings")) return;
  map.removeFeatureState({ source: "campus-buildings" });
  if (buildingId) {
    map.setFeatureState(
      { source: "campus-buildings", id: buildingId },
      { selected: true },
    );
  }
}

function outlinePoints(
  geometry: NonNullable<BuildingFeature["geometry"]>,
): [number, number][] {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon[0] as [number, number][]);
}

function boundsOf(points: [number, number][]): LngLatBounds {
  return points.reduce(
    (bounds, point) => bounds.extend(point),
    new LngLatBounds(points[0], points[0]),
  );
}

/** Map pin in the color of the place's dots */
function pinElement(color: string, halo: string): HTMLElement {
  const element = document.createElement("div");
  element.innerHTML = `<svg width="32" height="42" viewBox="0 0 32 42" aria-hidden="true"><path d="M16 41s14-13.6 14-25A14 14 0 0 0 2 16c0 11.4 14 25 14 25z" fill="${color}" stroke="${halo}" stroke-width="2"/><circle cx="16" cy="16" r="5.5" fill="${halo}"/></svg>`;
  element.style.lineHeight = "0";
  return element;
}
