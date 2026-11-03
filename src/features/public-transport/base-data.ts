import { distanceInMeters } from "./nearest-stops";
import { SwuApiError } from "./swu-api";

/**
 * Keeps `src/content/public-transport/stops.json` and the line config in sync with the SWU
 * base data. Used by `scripts/update-public-transport.ts` (`pnpm update:transport`).
 */

/**
 * Endpoints of the SWU base data (updated daily by SWU):
 * - `NETWORK_STOPS_ENDPOINT` ("extended"): the stops served by SWU lines (with departure
 *   announcements). New stops are only taken from here.
 * - `ALL_STOPS_ENDPOINT` ("basic"): additionally regional stops without SWU departures. A stop is
 *   only removed from `stops.json` once it is missing here as well.
 */
export const NETWORK_STOPS_ENDPOINT =
  "/stop/attributes/BaseData?ContentScope=extended";
export const ALL_STOPS_ENDPOINT = "/stop/attributes/BaseData";
export const LINES_ENDPOINT = "/route/attributes/BaseData";

/** Entry of `stops.json`. `short_name` is maintained by hand (shown on the stop tabs). */
export type StopEntry = {
  id: number;
  name: string;
  short_name: string;
  lat: number;
  long: number;
};

type ApiStop = Omit<StopEntry, "short_name">;

export type StopChanges = {
  added: StopEntry[];
  removed: StopEntry[];
  renamed: { id: number; from: string; to: string }[];
  /** Coordinates changed by more than `MOVED_THRESHOLD_METERS` */
  moved: { id: number; name: string; meters: number }[];
};

const MOVED_THRESHOLD_METERS = 10;

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API response */

export function parseSwuStops(json: any): ApiStop[] {
  const data = json?.StopAttributes?.StopData;
  if (!Array.isArray(data))
    throw new SwuApiError("Unexpected stop base data response");
  return data
    .filter((stop: any) => stop.StopCoordinates)
    .map((stop: any) => ({
      id: Number(stop.StopNumber),
      name: String(stop.StopName),
      lat: Number(stop.StopCoordinates.Latitude),
      long: Number(stop.StopCoordinates.Longitude),
    }));
}

/**
 * Applies the SWU stops to the current list: names and coordinates come from SWU, short names
 * are kept. Existing stops keep their order, new network stops are appended (small diffs).
 */
export function mergeStops(
  current: StopEntry[],
  { network, all }: { network: ApiStop[]; all: ApiStop[] },
): { stops: StopEntry[]; changes: StopChanges } {
  const networkById = new Map(network.map((stop) => [stop.id, stop]));
  const allById = new Map(all.map((stop) => [stop.id, stop]));
  const known = new Set(current.map((stop) => stop.id));
  const changes: StopChanges = {
    added: [],
    removed: [],
    renamed: [],
    moved: [],
  };
  const stops: StopEntry[] = [];

  for (const stop of current) {
    const update = networkById.get(stop.id) ?? allById.get(stop.id);
    if (!update) {
      changes.removed.push(stop);
      continue;
    }
    if (update.name !== stop.name) {
      changes.renamed.push({ id: stop.id, from: stop.name, to: update.name });
    }
    const meters = distanceInMeters(
      { latitude: stop.lat, longitude: stop.long },
      { latitude: update.lat, longitude: update.long },
    );
    if (meters > MOVED_THRESHOLD_METERS) {
      changes.moved.push({
        id: stop.id,
        name: update.name,
        meters: Math.round(meters),
      });
    }
    stops.push(entry(update, stop.short_name));
  }

  for (const stop of network) {
    if (known.has(stop.id)) continue;
    const added = entry(stop, shortenStopName(stop.name));
    changes.added.push(added);
    stops.push(added);
  }

  return { stops, changes };
}

/** Same key order as in `stops.json`, so updates produce minimal diffs */
function entry(stop: ApiStop, shortName: string): StopEntry {
  return {
    id: stop.id,
    name: stop.name,
    short_name: shortName,
    lat: stop.lat,
    long: stop.long,
  };
}

const ABBREVIATIONS: [RegExp, string][] = [
  [/^Universität /, "Uni "],
  [/^Hauptbahnhof$/, "Hbf"],
  [/straße\b/g, "str."],
  [/Straße\b/g, "Str."],
  [/platz\b/g, "pl."],
  [/Platz\b/g, "Pl."],
  [/^(Am|An der|Auf der|Auf dem|Beim|Im|In der) /, ""],
];

/** Suggestion for a new stop's short name; check and adjust it by hand in `stops.json` */
export function shortenStopName(name: string): string {
  return ABBREVIATIONS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    name,
  );
}

export type LineIssues = {
  /** Lines in the SWU network without a color in `lines.ts` */
  missingColor: string[];
  /** Lines whose badge shape doesn't match their SWU category */
  wrongShape: { name: string; expected: "tram" | "bus" }[];
  /** Colors in `lines.ts` for lines SWU doesn't run anymore (can be removed) */
  unused: string[];
};

/** SWU `RouteCategory`: 1 = tram, 5 = bus */
const TRAM_CATEGORY = 1;

export function checkLines(
  json: any,
  config: {
    colors: Record<string, string>;
    trams: string[];
    aliases: Record<string, string>;
  },
): LineIssues {
  const data = json?.RouteAttributes?.RouteData;
  if (!Array.isArray(data))
    throw new SwuApiError("Unexpected route base data response");

  const lines = new Map<string, boolean>(); // shown name → is tram
  for (const route of data) {
    const raw = String(route.RouteName);
    const name = config.aliases[raw] ?? raw;
    // Depot runs ("-") have no public line
    if (name === "-") continue;
    const tram = Number(route.RouteCategory) === TRAM_CATEGORY;
    // A bus replacing a tram line keeps the tram's name; the tram category wins
    lines.set(name, (lines.get(name) ?? false) || tram);
  }

  const names = [...lines.keys()];
  return {
    missingColor: names.filter((name) => !config.colors[name]),
    wrongShape: names
      .filter((name) => config.trams.includes(name) !== lines.get(name))
      .map((name) => ({
        name,
        expected: lines.get(name) ? ("tram" as const) : ("bus" as const),
      })),
    unused: Object.keys(config.colors).filter((name) => !lines.has(name)),
  };
}
