import { describe, expect, it } from "vitest";

import model from "@/content/parking/forecast.json";
import {
  berlinTime,
  coarsen,
  combineLots,
  comparedToUsual,
  expectedFreeChange,
  type ForecastModel,
  forecastDay,
  formatMinutes,
  fullWindow,
  mean,
  type LotModel,
} from "./forecast";

// Tiny model: 4 slots of 6 hours, a lot of 100 spaces that is busy from 06:00 to 18:00
const MODEL: ForecastModel = {
  generated: "",
  dataFrom: "2026-11-11",
  dataTo: "2026-11-25",
  slotMinutes: 360,
  weight: [1, 0.5],
  lots: {},
};
const busyDay = [10, 50, 60, 10];
const LOT: LotModel = {
  code: "P99",
  capacity: 100,
  days: [2, 2, 2, 2, 2, 2, 2],
  typical: Array(7).fill(busyDay),
  low: Array(7).fill(busyDay),
  high: Array(7).fill(busyDay),
};
// Wednesday 25.11.2026, 07:00 in Berlin (06:00 UTC): slot 1
const WEDNESDAY_7AM = new Date("2026-11-25T06:00:00Z");

describe("parking forecast", () => {
  it("reads weekday and time in Berlin, also in summer time", () => {
    expect(berlinTime(WEDNESDAY_7AM)).toEqual({ weekday: 2, minute: 420 });
    expect(berlinTime(new Date("2026-07-05T22:30:00Z"))).toEqual({
      weekday: 0, // Monday 00:30
      minute: 30,
    });
  });

  it("returns the typical day without a live reading", () => {
    expect(forecastDay(MODEL, LOT, 2, 100)).toEqual(busyDay);
  });

  it("carries today's deviation forward and lets it fade", () => {
    const live = { parked: 70, at: WEDNESDAY_7AM }; // 20 more than typical
    expect(forecastDay(MODEL, LOT, 2, 100, live)).toEqual([10, 70, 70, 10]);
  });

  it("ignores a reading from another weekday", () => {
    const live = { parked: 70, at: WEDNESDAY_7AM };
    expect(forecastDay(MODEL, LOT, 3, 100, live)).toEqual(busyDay);
  });

  it("stays between 0 and the total", () => {
    const live = { parked: 200, at: WEDNESDAY_7AM };
    expect(forecastDay(MODEL, LOT, 2, 100, live)).toEqual([10, 100, 100, 10]);
  });

  it("compares the reading to usual", () => {
    expect(
      comparedToUsual(MODEL, LOT, 100, { parked: 70, at: WEDNESDAY_7AM }),
    ).toBe("busier");
    expect(
      comparedToUsual(MODEL, LOT, 100, { parked: 55, at: WEDNESDAY_7AM }),
    ).toBe("usual");
    expect(
      comparedToUsual(MODEL, LOT, 100, { parked: 20, at: WEDNESDAY_7AM }),
    ).toBe("quieter");
  });

  it("expects the change of free spaces in the next slots", () => {
    // 07:00, 20 more cars than typical: 70 now, 60 + 20 × 0.5 = 70 in 6 hours
    const live = { parked: 70, at: WEDNESDAY_7AM };
    expect(expectedFreeChange(MODEL, LOT, 100, live, 360)).toBe(0);
    // Typical now: 50 now, 60 in 6 hours, so 10 fewer free
    expect(
      expectedFreeChange(MODEL, LOT, 100, { ...live, parked: 50 }, 360),
    ).toBe(-10);
    // 13:00 → 19:00: from 60 parked down to 10
    const afternoon = { parked: 60, at: new Date("2026-11-25T12:00:00Z") };
    expect(expectedFreeChange(MODEL, LOT, 100, afternoon, 360)).toBe(50);
    // Past midnight: no forecast
    expect(expectedFreeChange(MODEL, LOT, 100, afternoon, 720)).toBeNull();
  });

  it("adds up several lots", () => {
    const other: LotModel = {
      ...LOT,
      code: "P98",
      capacity: 50,
      days: [1, 2, 2, 2, 2, 2, 0],
      typical: Array(7).fill([0, 20, 20, 0]),
    };
    const both = combineLots([LOT, other]);
    expect(both).toMatchObject({ code: "P99+P98", capacity: 150 });
    expect(both.days).toEqual([1, 2, 2, 2, 2, 2, 0]);
    expect(both.typical[2]).toEqual([10, 70, 80, 10]);
    // The forecast of the sum is the sum of the forecasts
    const live = { parked: 100, at: WEDNESDAY_7AM }; // 70 + 30
    expect(forecastDay(MODEL, both, 2, 150, live)).toEqual(
      forecastDay(MODEL, LOT, 2, 100, { ...live, parked: 70 }).map(
        (cars, slot) =>
          cars +
          forecastDay(MODEL, other, 2, 50, { ...live, parked: 30 })[slot],
      ),
    );
  });

  it("finds the first stretch the lot is full", () => {
    expect(fullWindow([0, 96, 100, 50, 98], 100, 15)).toEqual([15, 45]);
    expect(fullWindow([0, 50], 100, 15)).toBeNull();
    // From slot 3 on: the first stretch is over, the second one counts
    expect(fullWindow([0, 96, 100, 50, 98], 100, 15, 3)).toEqual([60, 75]);
  });

  it("combines 15-minute slots into 30 minutes", () => {
    expect(coarsen([10, 20, 30, 41], 2, mean)).toEqual([15, 36]);
    expect(coarsen([10, 20, 30, 41], 2, Math.max)).toEqual([20, 41]);
  });

  it("formats minutes as HH:MM", () => {
    expect(formatMinutes(525)).toBe("08:45");
    expect(formatMinutes(1440)).toBe("00:00");
  });

  it("has a full week for every lot in the shipped model", () => {
    const shipped = model as ForecastModel;
    expect(shipped.weight[0]).toBe(1);
    for (const lot of Object.values(shipped.lots)) {
      for (const series of [lot.typical, lot.low, lot.high]) {
        expect(series).toHaveLength(7);
        for (const day of series)
          expect(day).toHaveLength((24 * 60) / shipped.slotMinutes);
      }
    }
  });
});
