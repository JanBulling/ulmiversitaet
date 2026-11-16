import { describe, expect, it } from "vitest";

import { isOpenMenuDay, openMenuDays } from "./history";

describe("openMenuDays", () => {
  it("spans a week before and after today", () => {
    expect(openMenuDays("2026-11-15")).toEqual({
      from: "2026-11-08",
      to: "2026-11-22",
    });
  });
});

describe("isOpenMenuDay", () => {
  const now = "2026-11-15";

  it("includes today and both ends of the window", () => {
    expect(isOpenMenuDay(now, now)).toBe(true);
    expect(isOpenMenuDay("2026-11-08", now)).toBe(true);
    expect(isOpenMenuDay("2026-11-22", now)).toBe(true);
  });

  it("excludes days outside the window", () => {
    expect(isOpenMenuDay("2026-11-07", now)).toBe(false);
    expect(isOpenMenuDay("2026-11-23", now)).toBe(false);
    expect(isOpenMenuDay("2019-03-04", now)).toBe(false);
  });
});
