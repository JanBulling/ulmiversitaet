import { describe, expect, it } from "vitest";

import { ratingWindow } from "./rating-window";

/** Berlin is UTC+1 in November */
const at = (time: string) => new Date(`2026-11-05T${time}:00+01:00`);

describe("rating window", () => {
  const servedToday = ["2026-11-12", "2026-11-05", "2026-10-29"];

  it("opens at 11:30 on a day the meal is served", () => {
    expect(ratingWindow(servedToday, at("11:29"))).toBe("tooEarly");
    expect(ratingWindow(servedToday, at("11:30"))).toBe("open");
    expect(ratingWindow(servedToday, at("23:59"))).toBe("open");
  });

  it("is closed on other days", () => {
    expect(ratingWindow(["2026-11-04", "2026-11-06"], at("12:00"))).toBe(
      "notToday",
    );
    expect(ratingWindow([], at("12:00"))).toBe("notToday");
  });

  it("uses Berlin time, not UTC", () => {
    // 00:30 in Berlin is still the previous day in UTC
    expect(ratingWindow(["2026-11-06"], new Date("2026-11-05T23:30:00Z"))).toBe(
      "tooEarly",
    );
    // 11:30 in Berlin is 10:30 UTC
    expect(ratingWindow(servedToday, new Date("2026-11-05T10:30:00Z"))).toBe(
      "open",
    );
  });
});
