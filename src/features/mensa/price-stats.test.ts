import { describe, expect, it } from "vitest";

import {
  average,
  monthlyAverages,
  movingAverage,
  priceTrend,
  type PriceDay,
} from "./price-stats";

const day = (date: string, mainStudent: number | null) =>
  ({
    date,
    mainStudent,
    mainEmployee: mainStudent && mainStudent + 200,
    mainGuest: null,
    dessert: null,
  }) satisfies PriceDay;

describe("price statistics", () => {
  it("averages and ignores missing values", () => {
    expect(average([400, null, 500])).toBe(450);
    expect(average([null])).toBeNull();
    expect(average([])).toBeNull();
  });

  it("computes a trailing moving average", () => {
    const days = [
      day("2026-01-05", 400),
      day("2026-01-06", null),
      day("2026-01-07", 500),
      day("2026-01-08", 600),
    ];
    expect(movingAverage(days, "mainStudent", 2)).toEqual([400, 400, 500, 550]);
  });

  it("groups by month, newest first", () => {
    const months = monthlyAverages([
      day("2026-01-30", 400),
      day("2026-02-02", 450),
      day("2026-02-03", 550),
    ]);
    expect(months.map((m) => [m.month, m.mainStudent, m.mainGuest])).toEqual([
      ["2026-02", 500, null],
      ["2026-01", 400, null],
    ]);
  });

  it("compares the latest days with the first ones", () => {
    const days = [400, 400, 420, 440].map((cents, i) =>
      day(`2026-01-0${i + 5}`, cents),
    );
    const trend = priceTrend(days, "mainStudent", 2)!;
    expect([trend.before, trend.now]).toEqual([400, 430]);
    expect(trend.change).toBeCloseTo(0.075);
    // Not enough data for two separate periods
    expect(priceTrend(days, "mainStudent", 3)).toBeNull();
    expect(priceTrend(days, "dessert", 2)).toBeNull();
  });
});
