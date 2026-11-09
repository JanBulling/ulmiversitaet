import type { IsoDate } from "@/lib/date";

/** Average prices of one menu day in cents; `null` if nothing of that kind was on the menu */
export type PriceDay = {
  date: IsoDate;
  mainStudent: number | null;
  mainEmployee: number | null;
  mainGuest: number | null;
  dessert: number | null;
};

export type PriceKey = Exclude<keyof PriceDay, "date">;

/** Number of menu days in the moving average (about four weeks) */
export const MOVING_AVERAGE_DAYS = 20;

/** Average of the values, ignoring `null`; `null` if there are none */
export function average(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length === 0
    ? null
    : present.reduce((sum, value) => sum + value, 0) / present.length;
}

/**
 * Trailing moving average over the last `window` menu days (fewer at the start), so the
 * trend shows through the daily ups and downs of what happens to be on the menu
 */
export function movingAverage(
  days: PriceDay[],
  key: PriceKey,
  window = MOVING_AVERAGE_DAYS,
): (number | null)[] {
  return days.map((_, i) =>
    average(days.slice(Math.max(0, i - window + 1), i + 1).map((d) => d[key])),
  );
}

export type PriceMonth = { month: string } & Record<PriceKey, number | null>;

const KEYS: PriceKey[] = [
  "mainStudent",
  "mainEmployee",
  "mainGuest",
  "dessert",
];

/** Average per calendar month (`YYYY-MM`), newest first */
export function monthlyAverages(days: PriceDay[]): PriceMonth[] {
  const months = new Map<string, PriceDay[]>();
  for (const day of days) {
    const month = day.date.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), day]);
  }
  return [...months]
    .map(([month, monthDays]) => ({
      month,
      ...(Object.fromEntries(
        KEYS.map((key) => [key, average(monthDays.map((day) => day[key]))]),
      ) as Record<PriceKey, number | null>),
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * The average of the last `window` menu days compared to the first `window` days of the data:
 * `{ now, before, change }` (`change` as a fraction, `0.05` = +5 %)
 */
export function priceTrend(
  days: PriceDay[],
  key: PriceKey,
  window = MOVING_AVERAGE_DAYS,
) {
  const values = days.map((day) => day[key]).filter((v) => v !== null);
  if (values.length < 2 * window) return null;
  const before = average(values.slice(0, window))!;
  const now = average(values.slice(-window))!;
  return { now, before, change: now / before - 1 };
}
