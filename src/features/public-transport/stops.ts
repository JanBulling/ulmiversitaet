import stops from "@/content/public-transport/stops.json";
import { normalize } from "@/features/links/search";
import type { Stop } from "./types";

const STOPS_BY_ID = new Map<number, Stop>(
  stops.map((stop) => [stop.id, { stopId: stop.id, name: stop.name }]),
);

/** SWU stop with its full name (`stops.json`), or undefined for unknown numbers */
export function getStop(stopId: number): Stop | undefined {
  return STOPS_BY_ID.get(stopId);
}

const SEARCH_INDEX = stops.map((stop) => ({
  stop: STOPS_BY_ID.get(stop.id)!,
  name: normalize(stop.name),
  text: normalize(`${stop.name} ${stop.short_name}`),
}));

/**
 * Stops whose full or short name contains every word of the query, stops starting with the
 * query first, then alphabetically. An empty query returns nothing.
 */
export function searchStops(query: string, limit = 20): Stop[] {
  const normalized = normalize(query.trim());
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  return SEARCH_INDEX.filter((entry) =>
    words.every((word) => entry.text.includes(word)),
  )
    .sort(
      (a, b) =>
        Number(b.name.startsWith(normalized)) -
          Number(a.name.startsWith(normalized)) ||
        a.name.localeCompare(b.name, "de"),
    )
    .slice(0, limit)
    .map((entry) => entry.stop);
}
