/**
 * Calendar dates as `YYYY-MM-DD` strings in the Europe/Berlin time zone.
 * Matches Postgres `date` columns (Drizzle `mode: "string"`) and avoids time zone bugs
 * from doing arithmetic on `Date` objects in local time.
 */
export type IsoDate = string;

const TIME_ZONE = "Europe/Berlin";

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function isIsoDate(value: string): value is IsoDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = toUtcDate(value);
  // Rejects impossible dates: "2026-13-45" is invalid, "2026-02-30" rolls over to March
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** The current date in Berlin */
export function today(now: Date = new Date()): IsoDate {
  return isoFormatter.format(now);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 1 = Monday … 7 = Sunday */
export function isoWeekday(date: IsoDate): number {
  return toUtcDate(date).getUTCDay() || 7;
}

export function isWeekend(date: IsoDate): boolean {
  return isoWeekday(date) > 5;
}

/** Monday of the week containing `date` */
export function startOfWeek(date: IsoDate): IsoDate {
  return addDays(date, 1 - isoWeekday(date));
}

/** First day of the month of `date`, moved by `months` (negative goes back) */
export function startOfMonth(date: IsoDate, months = 0): IsoDate {
  const d = toUtcDate(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1))
    .toISOString()
    .slice(0, 10);
}

/** Monday to Friday of the week starting at `monday` */
export function weekdaysOf(monday: IsoDate): IsoDate[] {
  return [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
}

function toUtcDate(date: IsoDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** A `Date` for formatting an ISO date (noon UTC, so it is the same calendar day in Europe) */
export function toDate(date: IsoDate): Date {
  return new Date(`${date}T12:00:00Z`);
}

/** The date itself on weekdays, otherwise the following Monday */
export function nextWeekday(date: IsoDate): IsoDate {
  return isWeekend(date) ? addDays(startOfWeek(date), 7) : date;
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** The current time of day in Berlin as `HH:MM` (compares correctly as a string) */
export function timeOfDay(now: Date = new Date()): string {
  return timeFormatter.format(now);
}

/** `2026-11-04` → `04.11.2026` (or `04/11/2026` with `separator: "/"`), day first */
export function formatDayFirst(date: IsoDate, separator = "."): string {
  const [year, month, day] = date.split("-");
  return [day, month, year].join(separator);
}

/**
 * Reads a typed date, day first: `4.11.2026`, `04/11/2026`, `4-11-26` (→ 2026). `null` if it
 * isn't a valid date.
 */
export function parseDayFirst(text: string): IsoDate | null {
  const match = text
    .trim()
    .match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = `${year.length === 2 ? `20${year}` : year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return isIsoDate(date) ? date : null;
}
