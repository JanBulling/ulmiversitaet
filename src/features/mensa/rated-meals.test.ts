import { describe, expect, it } from "vitest";

import {
  RATED_MEALS_COOKIE,
  RATING_INTERVAL_MS,
  parseRatedMeals,
  ratedMealsFromCookieHeader,
  serializeRatedMeals,
} from "./rated-meals";

const MEAL_A = "0b9a3c1e-5f2d-4e8a-9b7c-1d2e3f4a5b6c";
const MEAL_B = "7c6b5a4f-3e2d-4c1b-8a9f-0e1d2c3b4a59";
const NOW = Date.UTC(2026, 10, 5, 12);

describe("rated meals cookie", () => {
  it("round-trips the rated meals", () => {
    const rated = new Map([
      [MEAL_A, NOW - 1000],
      [MEAL_B, NOW],
    ]);
    expect(parseRatedMeals(serializeRatedMeals(rated), NOW)).toEqual(rated);
  });

  it("drops ratings older than a day", () => {
    const value = serializeRatedMeals(
      new Map([
        [MEAL_A, NOW - RATING_INTERVAL_MS],
        [MEAL_B, NOW - RATING_INTERVAL_MS + 1],
      ]),
    );
    expect([...parseRatedMeals(value, NOW).keys()]).toEqual([MEAL_B]);
  });

  it("ignores missing and malformed values", () => {
    expect(parseRatedMeals(undefined, NOW).size).toBe(0);
    expect(parseRatedMeals("", NOW).size).toBe(0);
    expect(parseRatedMeals(`garbage_${MEAL_A}.abc_.123`, NOW).size).toBe(0);
  });

  it("keeps only the latest entries", () => {
    const rated = new Map(
      Array.from({ length: 60 }, (_, i) => [`meal-${i}`, NOW] as const),
    );
    const parsed = parseRatedMeals(serializeRatedMeals(rated), NOW);
    expect(parsed.size).toBe(50);
    expect(parsed.has("meal-59")).toBe(true);
    expect(parsed.has("meal-0")).toBe(false);
  });

  it("reads the cookie from a cookie header", () => {
    const value = serializeRatedMeals(new Map([[MEAL_A, NOW]]));
    const header = `theme=dark; ${RATED_MEALS_COOKIE}=${encodeURIComponent(value)}; NEXT_LOCALE=de`;
    expect(ratedMealsFromCookieHeader(header, NOW).has(MEAL_A)).toBe(true);
    expect(ratedMealsFromCookieHeader("theme=dark", NOW).size).toBe(0);
  });
});
