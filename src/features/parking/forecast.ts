import { isoWeekday, timeOfDay, today } from "@/lib/date";
import { occupancyLevel } from "./occupancy";

/**
 * Occupancy forecast per parking lot: the typical week (median per weekday and 15-minute slot,
 * Berlin time) plus a live correction that carries today's deviation from typical a few hours
 * forward. The model (`src/content/parking/forecast.json`) is built from the recorded counter
 * readings by `forecast/build.py` in the parkingsim repo. See docs/parking-forecast.md.
 */
export type ForecastModel = {
  generated: string;
  /** First and last day of data, `YYYY-MM-DD` */
  dataFrom: string;
  dataTo: string;
  slotMinutes: number;
  /** `weight[h]`: share of the current deviation from typical still there `h` slots later */
  weight: number[];
  /** Keyed by DUU counter id (M1 and M2 share one) */
  lots: Record<string, LotModel>;
};

export type LotModel = {
  code: string;
  capacity: number;
  /** Days of data per weekday (0 = Monday) */
  days: number[];
  /** Parked cars per `[weekday][slot]`: median, and lowest/highest day seen */
  typical: number[][];
  low: number[][];
  high: number[][];
};

/** A reading of the live counter */
export type LiveReading = { parked: number; at: Date };

/** Weekday (0 = Monday) and minute of the day in Berlin */
export function berlinTime(date: Date): { weekday: number; minute: number } {
  const [hours, minutes] = timeOfDay(date).split(":").map(Number);
  return { weekday: isoWeekday(today(date)) - 1, minute: hours * 60 + minutes };
}

/**
 * Parked cars per slot of one weekday, between 0 and `total`. With a live reading from that
 * weekday, the slots from the reading on are shifted by today's deviation from typical, which
 * fades out over the next hours; earlier slots stay typical.
 */
export function forecastDay(
  model: ForecastModel,
  lot: LotModel,
  weekday: number,
  total: number,
  live?: LiveReading,
): number[] {
  const typical = lot.typical[weekday];
  const now = live && berlinTime(live.at);
  const start =
    now && now.weekday === weekday
      ? Math.floor(now.minute / model.slotMinutes)
      : typical.length;
  const deviation =
    live && start < typical.length ? live.parked - typical[start] : 0;
  return typical.map((cars, slot) =>
    limit(
      slot < start
        ? cars
        : cars + deviation * (model.weight[slot - start] ?? 0),
      total,
    ),
  );
}

/**
 * Expected change of free spaces `minutes` after the reading (positive: more free), or `null`
 * if that is already the next day
 */
export function expectedFreeChange(
  model: ForecastModel,
  lot: LotModel,
  total: number,
  live: LiveReading,
  minutes: number,
): number | null {
  const { weekday, minute } = berlinTime(live.at);
  const slots = forecastDay(model, lot, weekday, total, live);
  const later = slots[Math.floor((minute + minutes) / model.slotMinutes)];
  if (later === undefined) return null;
  return limit(live.parked, total) - later;
}

/**
 * Several lots as one: parked cars added up per weekday and slot. As `weight` is shared by all
 * lots, `forecastDay` of the sum with the summed live reading equals the sum of the forecasts
 * (up to the limits). `low` / `high` are sums of each lot's extremes, which were seen on
 * different days, so they overstate the range.
 */
export function combineLots(lots: LotModel[]): LotModel {
  const add = (series: (lot: LotModel) => number[][]) =>
    series(lots[0]).map((day, weekday) =>
      day.map((_, slot) =>
        lots.reduce((sum, lot) => sum + series(lot)[weekday][slot], 0),
      ),
    );
  return {
    code: lots.map((lot) => lot.code).join("+"),
    capacity: lots.reduce((sum, lot) => sum + lot.capacity, 0),
    days: lots[0].days.map((_, weekday) =>
      Math.min(...lots.map((lot) => lot.days[weekday])),
    ),
    typical: add((lot) => lot.typical),
    low: add((lot) => lot.low),
    high: add((lot) => lot.high),
  };
}

/** Combine `factor` neighboring slots into one with `combine` (e.g. 15 → 30 minutes) */
export function coarsen(
  slots: number[],
  factor: number,
  combine: (...values: number[]) => number,
): number[] {
  return Array.from({ length: Math.ceil(slots.length / factor) }, (_, i) =>
    Math.round(combine(...slots.slice(i * factor, (i + 1) * factor))),
  );
}

/** Mean of numbers, for `coarsen` */
export const mean = (...values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * First stretch the lot is full (red) from slot `start` on, as `[from, to)` in minutes, or
 * `null`. Pass the current slot for today, so stretches that are already over are skipped.
 */
export function fullWindow(
  slots: number[],
  total: number,
  slotMinutes: number,
  start = 0,
): [number, number] | null {
  const isFull = (cars: number) =>
    occupancyLevel(total - cars, total) === "full";
  const from = slots.findIndex((cars, slot) => slot >= start && isFull(cars));
  if (from < 0) return null;
  let to = from;
  while (to < slots.length && isFull(slots[to])) to++;
  return [from * slotMinutes, to * slotMinutes];
}

/** `"busier"` / `"quieter"` if the reading is more than 10 % of the lot off from typical */
export function comparedToUsual(
  model: ForecastModel,
  lot: LotModel,
  total: number,
  live: LiveReading,
): "busier" | "quieter" | "usual" {
  const { weekday, minute } = berlinTime(live.at);
  const deviation =
    live.parked - lot.typical[weekday][Math.floor(minute / model.slotMinutes)];
  if (deviation > total * 0.1) return "busier";
  if (deviation < -total * 0.1) return "quieter";
  return "usual";
}

/** `525` → `"08:45"` */
export function formatMinutes(minutes: number): string {
  const hours = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}

function limit(cars: number, total: number): number {
  return Math.min(total, Math.max(0, Math.round(cars)));
}
