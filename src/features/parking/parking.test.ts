import { describe, expect, it } from "vitest";

import {
  HOME_LOTS,
  HOME_LOTS_MOBILE,
  PARKING_AREAS,
  PARKING_LOTS,
} from "@/content/parking/parking-lots";
import { ParkingApiError, parseParkedCars } from "./duu-api";
import { freeSpaces, occupancyLevel } from "./occupancy";

describe("DUU API", () => {
  it("parses the number of parked cars", () => {
    expect(parseParkedCars("225")).toBe(225);
    expect(parseParkedCars(" 0\n")).toBe(0);
  });

  it("keeps negative readings of drifted counters", () => {
    expect(parseParkedCars("-4")).toBe(-4);
  });

  it("rejects unexpected responses", () => {
    expect(() => parseParkedCars("<html>Error</html>")).toThrow(
      ParkingApiError,
    );
    expect(() => parseParkedCars("12.5")).toThrow(ParkingApiError);
    expect(() => parseParkedCars("")).toThrow(ParkingApiError);
  });
});

describe("occupancy", () => {
  it("keeps free spaces between 0 and the total", () => {
    expect(freeSpaces(100, 30)).toBe(70);
    expect(freeSpaces(100, 120)).toBe(0);
    expect(freeSpaces(301, -4)).toBe(301);
  });

  it.each([
    [50, 100, "free"],
    [10, 100, "filling"],
    [5, 100, "full"],
    [2, 20, "full"],
    [0, 300, "full"],
  ] as const)("%i of %i free → %s", (free, total, level) => {
    expect(occupancyLevel(free, total)).toBe(level);
  });
});

describe("parking lot config", () => {
  it("has unique codes", () => {
    const codes = PARKING_LOTS.map((lot) => lot.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("only refers to existing lots with a live counter on the home page", () => {
    for (const code of HOME_LOTS) {
      expect(
        PARKING_LOTS.find((lot) => lot.code === code)?.counterId,
      ).not.toBeNull();
    }
    expect(HOME_LOTS_MOBILE.every((code) => HOME_LOTS.includes(code))).toBe(
      true,
    );
  });

  it("lists every area", () => {
    expect(new Set(PARKING_LOTS.map((lot) => lot.area))).toEqual(
      new Set(PARKING_AREAS),
    );
  });
});
