import { describe, expect, it } from "vitest";

import {
  addDays,
  formatDayFirst,
  isIsoDate,
  isWeekend,
  parseDayFirst,
  startOfMonth,
  startOfWeek,
  today,
  weekdaysOf,
} from "./date";

describe("date", () => {
  it("returns today's date in Berlin", () => {
    // 23:30 UTC on Sunday is already Monday in Berlin (UTC+1 in winter)
    expect(today(new Date("2026-11-01T23:30:00Z"))).toBe("2026-11-02");
    // 22:30 UTC in summer is already the next day in Berlin (UTC+2)
    expect(today(new Date("2026-07-05T22:30:00Z"))).toBe("2026-07-06");
  });

  it("adds days across month and DST boundaries", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
  });

  it("finds the Monday of a week", () => {
    expect(startOfWeek("2026-11-02")).toBe("2026-11-02");
    expect(startOfWeek("2026-11-06")).toBe("2026-11-02");
    expect(startOfWeek("2026-11-08")).toBe("2026-11-02");
  });

  it("lists the weekdays of a week", () => {
    expect(weekdaysOf("2026-11-09")).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
    ]);
  });

  it("finds the first day of a month, also across years", () => {
    expect(startOfMonth("2026-11-05")).toBe("2026-11-01");
    expect(startOfMonth("2026-11-30", 2)).toBe("2027-01-01");
    expect(startOfMonth("2026-01-31", -1)).toBe("2025-12-01");
  });

  it("detects weekends", () => {
    expect(isWeekend("2026-11-06")).toBe(false);
    expect(isWeekend("2026-11-07")).toBe(true);
    expect(isWeekend("2026-11-08")).toBe(true);
  });

  it("validates ISO dates", () => {
    expect(isIsoDate("2026-11-02")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-13-45")).toBe(false);
    expect(isIsoDate("02.11.2026")).toBe(false);
  });

  it("formats and reads dates day first", () => {
    expect(formatDayFirst("2026-11-04")).toBe("04.11.2026");
    expect(formatDayFirst("2026-11-04", "/")).toBe("04/11/2026");
    expect(parseDayFirst("04.11.2026")).toBe("2026-11-04");
    expect(parseDayFirst(" 4/11/2026 ")).toBe("2026-11-04");
    expect(parseDayFirst("4-11-26")).toBe("2026-11-04");
    expect(parseDayFirst("30.02.2026")).toBeNull();
    expect(parseDayFirst("2026-11-04")).toBeNull();
    expect(parseDayFirst("")).toBeNull();
  });
});
