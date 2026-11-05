export type OccupancyLevel = "free" | "filling" | "full";

/**
 * Free spaces between 0 and `total`: the counters drift, so they can report more cars than
 * there are spaces, or fewer than zero cars
 */
export function freeSpaces(total: number, parkedCars: number): number {
  return Math.min(total, Math.max(0, total - parkedCars));
}

/** Full at ≤ 5 % or ≤ 2 free spaces, filling at ≤ 10 % */
export function occupancyLevel(free: number, total: number): OccupancyLevel {
  if (free <= 2 || free / total <= 0.05) return "full";
  if (free / total <= 0.1) return "filling";
  return "free";
}

export const OCCUPANCY_COLORS: Record<OccupancyLevel, string> = {
  free: "#A7BF48",
  filling: "#f3c27b",
  full: "#f35b5b",
};
