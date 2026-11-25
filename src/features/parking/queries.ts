import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { PARKING_LOTS, type ParkingLot } from "@/content/parking/parking-lots";
import { getParkedCars } from "./duu-api";
import { freeSpaces } from "./occupancy";

export const PARKING_CACHE_TAG = "parking";

export type ParkingLotStatus = ParkingLot & {
  /** `null` if the counter couldn't be read */
  free: number | null;
};

export type ParkingSnapshot = {
  lots: ParkingLotStatus[];
  /** ISO timestamp of the reading */
  updatedAt: string;
  /** No counter could be read at all */
  failed: boolean;
};

/**
 * Current free spaces of all lots with a counter. Cached for a minute, so visitors (home page
 * and parking page) share one reading of the counters.
 */
export async function getParkingSnapshot(): Promise<ParkingSnapshot> {
  "use cache";
  cacheTag(PARKING_CACHE_TAG);
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });

  const lots = PARKING_LOTS.filter((lot) => lot.counterId !== null);

  // One request per counter (some lots share a counter)
  const counterIds = [...new Set(lots.map((lot) => lot.counterId!))];
  const readings = await Promise.all(
    counterIds.map((id) =>
      getParkedCars(id).catch((error) => {
        console.error(`[parking] Reading counter ${id} failed`, error);
        return null;
      }),
    ),
  );
  const parked = new Map(counterIds.map((id, index) => [id, readings[index]]));

  const statuses = lots.map((lot) => {
    const cars = parked.get(lot.counterId!);
    return { ...lot, free: cars == null ? null : freeSpaces(lot.total, cars) };
  });

  return {
    lots: statuses,
    updatedAt: new Date().toISOString(),
    failed: statuses.every((lot) => lot.free === null),
  };
}
