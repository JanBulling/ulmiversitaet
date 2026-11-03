import stops from "@/content/public-transport/stops.json";
import type { Stop } from "./types";

export type Coordinates = { latitude: number; longitude: number };

const METERS_PER_DEGREE = 111_320;

/** Distance in meters; an equirectangular approximation is exact enough within a city */
export function distanceInMeters(a: Coordinates, b: Coordinates): number {
  const meanLatitude = ((a.latitude + b.latitude) / 2) * (Math.PI / 180);
  const dy = (b.latitude - a.latitude) * METERS_PER_DEGREE;
  const dx =
    (b.longitude - a.longitude) * METERS_PER_DEGREE * Math.cos(meanLatitude);
  return Math.hypot(dx, dy);
}

/** The `count` nearest SWU stops within `maxDistance` meters, nearest first */
export function findNearestStops(
  position: Coordinates,
  count = 3,
  maxDistance = 5000,
): (Stop & { distance: number })[] {
  return stops
    .map((stop) => ({
      stopId: stop.id,
      name: stop.short_name,
      distance: distanceInMeters(position, {
        latitude: stop.lat,
        longitude: stop.long,
      }),
    }))
    .filter((stop) => stop.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}
