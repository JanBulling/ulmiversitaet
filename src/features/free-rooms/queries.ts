import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { isWeekend, type IsoDate } from "@/lib/date";
import type { Slot } from "./availability";
import { fetchOccupancyHtml } from "./fetch-occupancy";
import { parseOccupancy } from "./parse-occupancy";
import { slotsByRoom } from "./rooms";

export const FREE_ROOMS_CACHE_TAG = "free-rooms";

export type DayOccupancy =
  /** Weekend: the buildings are locked */
  | { status: "closed" }
  /** campusonline couldn't be read; never shown as "all rooms free" */
  | { status: "error" }
  | {
      status: "ok";
      /** Bookings per room id of the campus map; rooms without bookings are missing */
      rooms: Record<string, Slot[]>;
      /** ISO timestamp of the reading */
      updatedAt: string;
    };

export async function getDayOccupancy(date: IsoDate): Promise<DayOccupancy> {
  if (isWeekend(date)) return { status: "closed" };
  try {
    return { status: "ok", ...(await getOccupancy(date)) };
  } catch (error) {
    console.error(`[free-rooms] Reading the bookings of ${date} failed`, error);
    return { status: "error" };
  }
}

/**
 * Bookings of a day from campusonline, shared by all visitors for 10 minutes. Errors are
 * thrown, so they aren't cached and the next visitor tries again.
 */
async function getOccupancy(date: IsoDate) {
  "use cache";
  cacheTag(FREE_ROOMS_CACHE_TAG);
  cacheLife({ stale: 5 * 60, revalidate: 10 * 60, expire: 60 * 60 });

  const bookings = parseOccupancy(await fetchOccupancyHtml(date), date);
  return { rooms: slotsByRoom(bookings), updatedAt: new Date().toISOString() };
}
