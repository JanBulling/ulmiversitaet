import { describe, expect, it } from "vitest";

import {
  guruMeals,
  guruResponseSchema,
  guruSystemInstruction,
  parseGuruAnswer,
} from "./guru-prompt";
import type { Menu, MenuMeal } from "./queries";

const meal = (id: string, overrides: Partial<MenuMeal> = {}): MenuMeal => ({
  id,
  name: `Gericht ${id}`,
  nameEn: `Meal ${id}`,
  types: ["van"],
  allergens: [],
  prices: {
    studentCents: 385,
    employeeCents: null,
    guestCents: null,
    note: null,
  },
  energyKcal: 576,
  proteinG: 11.2,
  rating: null,
  ...overrides,
});

const menu: Menu = {
  date: "2026-11-06",
  categories: [
    {
      key: "group-1",
      nameDe: "Vegan",
      nameEn: "Vegan",
      color: null,
      icon: null,
      kind: "main",
      showOnHome: true,
      meals: [
        meal("a", {
          rating: { count: 3, total: 4.333, taste: 4.5, look: 4, price: 4.25 },
        }),
      ],
    },
    {
      key: "category-9",
      nameDe: "Dessert",
      nameEn: null,
      color: null,
      icon: null,
      kind: null,
      showOnHome: false,
      meals: [
        meal("b", { prices: { ...meal("b").prices, studentCents: null } }),
      ],
    },
  ],
};

describe("mensa guru", () => {
  it("passes every meal with its rating in the selected language", () => {
    const [first, second] = guruMeals(menu, "en");
    expect(first).toEqual({
      id: "a",
      name: "Meal a",
      category: "Vegan",
      kind: "main",
      diet: ["Vegan"],
      priceStudentEur: 3.85,
      kcal: 576,
      proteinG: 11.2,
      rating: {
        count: 3,
        overall: 4.3,
        taste: 4.5,
        look: 4,
        valueForMoney: 4.3,
      },
    });
    expect(second).toMatchObject({
      name: "Meal b",
      kind: "other",
      priceStudentEur: null,
      rating: null,
    });
    expect(guruMeals(menu, "de")[0].name).toBe("Gericht a");
  });

  it("asks for an answer in the selected language", () => {
    expect(guruSystemInstruction("de")).toContain("Answer in German");
    expect(guruSystemInstruction("en")).toContain("Answer in English");
  });

  it("limits the answer to the meals of the day", () => {
    const meals = guruMeals(menu, "de");
    expect(guruResponseSchema(meals).properties.mealId.enum).toEqual([
      "a",
      "b",
    ]);
  });

  it("accepts a valid answer and rejects anything else", () => {
    const meals = guruMeals(menu, "de");
    expect(
      parseGuruAnswer('{"mealId":"a","message":" Iss das Curry. "}', meals),
    ).toEqual({ mealId: "a", message: "Iss das Curry." });

    expect(() =>
      parseGuruAnswer('{"mealId":"x","message":"Hm"}', meals),
    ).toThrow();
    expect(() =>
      parseGuruAnswer('{"mealId":"a","message":""}', meals),
    ).toThrow();
    expect(() => parseGuruAnswer("not json", meals)).toThrow();
    expect(() => parseGuruAnswer(undefined, meals)).toThrow();
  });
});
