import fs from "node:fs";
import path from "node:path";

import { asc, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  categoryGroups,
  mealCategories,
  mealHistory,
  meals,
  priceHistory,
} from "@/lib/db/schema";
import { createTestDatabase } from "@/lib/db/testing/test-database";
import {
  mergeTranslations,
  type MenuItem,
} from "../scraper/merge-translations";
import { parseMenu } from "../scraper/parse-menu";
import type { ScrapedMenu } from "../scraper/scrape-menu";
import {
  recomputePriceHistory,
  syncMenu,
  type MensaDatabase,
} from "./sync-menu";

let db: MensaDatabase;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ db, close } = await createTestDatabase());
});
afterEach(() => close());

function fixtureMenu(date: string): ScrapedMenu {
  const read = (lang: string) =>
    parseMenu(
      fs.readFileSync(
        path.join(
          import.meta.dirname,
          "../scraper/__fixtures__",
          `${date}.${lang}.html`,
        ),
        "utf8",
      ),
    );
  const de = read("de");
  const en = read("en");
  if (de.status !== "open" || en.status !== "open") throw new Error("closed");
  return { date, status: "open", items: mergeTranslations(de.meals, en.meals) };
}

function item(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    position: 0,
    category: "VEGAN",
    name: "Tikka Masala mit veganem Hähnchen",
    nameEn: null,
    soldOut: false,
    allergens: [],
    types: ["van"],
    prices: {
      studentCents: 465,
      employeeCents: 675,
      guestCents: 885,
      note: null,
    },
    nutrition: {
      energyKj: null,
      energyKcal: null,
      proteinG: null,
      fatG: null,
      saturatedFatG: null,
      carbohydratesG: null,
      sugarG: null,
      saltG: null,
      co2G: null,
    },
    ...overrides,
  };
}

const day = (date: string, ...items: MenuItem[]): ScrapedMenu => ({
  date,
  status: "open",
  items: items.map((entry, position) => ({ ...entry, position })),
});

const allMeals = () => db.select().from(meals).orderBy(asc(meals.name));
const historyOf = (date: string) =>
  db
    .select()
    .from(mealHistory)
    .where(eq(mealHistory.date, date))
    .orderBy(asc(mealHistory.position));

describe("syncMenu", () => {
  it("saves a real menu", async () => {
    const result = await syncMenu(db, fixtureMenu("2026-11-02"));

    // The sold-out special is skipped
    expect(result).toEqual({
      date: "2026-11-02",
      status: "open",
      meals: 8,
      newMeals: 8,
      newCategories: [],
      soldOut: 1,
    });

    const [tikka] = await db
      .select()
      .from(meals)
      .where(
        eq(meals.name, "Tikka Masala mit veganem Hähnchen und Fladenbrot"),
      );
    expect(tikka).toMatchObject({
      nameEn: "Tikka masala with with vegan chicken and flatbread",
      allergens: ["23", "27", "28", "34W"],
      types: ["van"],
      priceStudentCents: 465,
      energyKcal: 783,
      co2G: 419,
      lastServedOn: "2026-11-02",
    });

    const history = await historyOf("2026-11-02");
    expect(history).toHaveLength(8);
    expect(history[0]).toMatchObject({
      name: "Tikka Masala mit veganem Hähnchen und Fladenbrot",
      priceStudentCents: 465,
      position: 0,
    });
  });

  it("is idempotent", async () => {
    await syncMenu(db, fixtureMenu("2026-11-02"));
    const before = {
      meals: await allMeals(),
      history: await historyOf("2026-11-02"),
    };

    const result = await syncMenu(db, fixtureMenu("2026-11-02"));

    expect(result.newMeals).toBe(0);
    expect(await allMeals()).toHaveLength(before.meals.length);
    expect(await historyOf("2026-11-02")).toHaveLength(before.history.length);
  });

  it("computes the daily average prices per category kind", async () => {
    await syncMenu(db, fixtureMenu("2026-11-02"));

    const [prices] = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.date, "2026-11-02"));

    // Main dishes: 465, 400, 480, 395, 530 (the sold-out special is not in the history)
    expect(prices.avgMainStudentCents).toBeCloseTo(454);
    expect(prices.avgDessertStudentCents).toBeCloseTo(110);
    expect(prices.avgSideStudentCents).toBeCloseTo(100);
  });

  it("recomputes past averages when a category changes its group", async () => {
    await syncMenu(
      db,
      day(
        "2026-11-02",
        item({
          category: "VEGAN",
          name: "Linsen-Dal",
          prices: {
            studentCents: 400,
            employeeCents: null,
            guestCents: null,
            note: null,
          },
        }),
        item({
          category: "KAFFEEBAR",
          name: "Bircher Müsli",
          prices: {
            studentCents: 200,
            employeeCents: null,
            guestCents: null,
            note: null,
          },
        }),
      ),
    );
    const average = async () =>
      (
        await db
          .select()
          .from(priceHistory)
          .where(eq(priceHistory.date, "2026-11-02"))
      )[0].avgMainStudentCents;

    // KAFFEEBAR is unassigned, so only the vegan meal counts
    expect(await average()).toBeCloseTo(400);

    const [vegan] = await db
      .select({ id: categoryGroups.id })
      .from(categoryGroups)
      .where(eq(categoryGroups.nameDe, "Vegan"));
    const [kaffeebar] = await db
      .update(mealCategories)
      .set({ groupId: vegan.id })
      .where(eq(mealCategories.name, "KAFFEEBAR"))
      .returning({ id: mealCategories.id });
    await recomputePriceHistory(db, [kaffeebar.id]);

    expect(await average()).toBeCloseTo(300);
  });

  describe("categories", () => {
    it("adds unknown categories without a group", async () => {
      const result = await syncMenu(
        db,
        day(
          "2026-11-02",
          item({ category: "KAFFEEBAR", name: "Bircher Müsli" }),
        ),
      );

      expect(result.newCategories).toEqual(["KAFFEEBAR"]);
      const [category] = await db
        .select()
        .from(mealCategories)
        .where(eq(mealCategories.name, "KAFFEEBAR"));
      expect(category.groupId).toBeNull();
    });

    it("assigns new categories to a group with the same name", async () => {
      await db.insert(categoryGroups).values({ nameDe: "Grill" });
      await syncMenu(
        db,
        day("2026-11-02", item({ category: "GRILL", name: "Bratwurst" })),
      );

      const [category] = await db
        .select({ group: categoryGroups.nameDe })
        .from(mealCategories)
        .innerJoin(
          categoryGroups,
          eq(categoryGroups.id, mealCategories.groupId),
        )
        .where(eq(mealCategories.name, "GRILL"));
      expect(category.group).toBe("Grill");
    });
  });

  describe("meal matching", () => {
    it("matches names that only differ in spacing and punctuation", async () => {
      await syncMenu(
        db,
        day("2026-11-02", item({ name: "Aprikosen Joghurt" })),
      );
      const result = await syncMenu(
        db,
        day("2026-11-03", item({ name: "Aprikosen-Joghurt" })),
      );

      expect(result.newMeals).toBe(0);
      const [meal] = await allMeals();
      // The current name follows the latest menu, the history keeps the old one
      expect(meal.name).toBe("Aprikosen-Joghurt");
      expect((await historyOf("2026-11-02"))[0].name).toBe("Aprikosen Joghurt");
    });

    it("matches slightly different names (fuzzy)", async () => {
      await syncMenu(
        db,
        day(
          "2026-11-02",
          item({ name: "Tikka Masala mit veganem Curry-Hähnchen" }),
        ),
      );
      const result = await syncMenu(
        db,
        day("2026-11-03", item({ name: "Tikka Masala mit veganem Hähnchen" })),
      );

      expect(result.newMeals).toBe(0);
    });

    it("matches any name the meal had before", async () => {
      await syncMenu(
        db,
        day("2026-11-02", item({ name: "Mousse Joghurt Heidelbeer" })),
      );
      await syncMenu(
        db,
        day("2026-11-03", item({ name: "Mousse Joghurt Heidelbeer-Himbeer" })),
      );
      const result = await syncMenu(
        db,
        day("2026-11-04", item({ name: "Mousse Joghurt Heidelbeer" })),
      );

      expect(result.newMeals).toBe(0);
      expect(await allMeals()).toHaveLength(1);
    });

    it("keeps similar meals with different diet types apart", async () => {
      await syncMenu(
        db,
        day(
          "2026-11-02",
          item({
            name: "Pizza Flammkuchen-Art mit Schmand, Speck und Lauchzwiebeln",
            types: ["S"],
          }),
        ),
      );
      const result = await syncMenu(
        db,
        day(
          "2026-11-03",
          item({
            name: "Pizza Flammkuchen-Art mit veganem Schmand und Lauchzwiebeln",
            types: ["van"],
          }),
        ),
      );

      expect(result.newMeals).toBe(1);
    });

    it("does not overwrite current data with an older menu", async () => {
      await syncMenu(
        db,
        day(
          "2026-11-09",
          item({
            prices: {
              studentCents: 500,
              employeeCents: null,
              guestCents: null,
              note: null,
            },
          }),
        ),
      );
      await syncMenu(
        db,
        day(
          "2026-11-02",
          item({
            prices: {
              studentCents: 465,
              employeeCents: null,
              guestCents: null,
              note: null,
            },
          }),
        ),
      );

      const [meal] = await allMeals();
      expect(meal).toMatchObject({
        priceStudentCents: 500,
        lastServedOn: "2026-11-09",
      });
      expect((await historyOf("2026-11-02"))[0].priceStudentCents).toBe(465);
    });

    it("keeps an existing English name if the new menu has none", async () => {
      await syncMenu(
        db,
        day("2026-11-02", item({ nameEn: "Vegan tikka masala" })),
      );
      await syncMenu(db, day("2026-11-03", item({ nameEn: null })));

      expect((await allMeals())[0].nameEn).toBe("Vegan tikka masala");
    });
  });

  describe("history", () => {
    it("removes meals that were taken off the menu", async () => {
      await syncMenu(
        db,
        day(
          "2026-11-02",
          item({ name: "Linsen-Dal" }),
          item({ name: "Spätzle-Pfanne", types: ["veg"] }),
        ),
      );
      await syncMenu(db, day("2026-11-02", item({ name: "Linsen-Dal" })));

      expect((await historyOf("2026-11-02")).map((row) => row.name)).toEqual([
        "Linsen-Dal",
      ]);
      // The meal itself (and its ratings) stays
      expect(await allMeals()).toHaveLength(2);
    });

    it("keeps the history of a day while a meal is sold out", async () => {
      await syncMenu(
        db,
        day(
          "2026-11-02",
          item({ name: "Linsen-Dal" }),
          item({ name: "Kaiserschmarrn", types: ["veg"] }),
        ),
      );
      await syncMenu(
        db,
        day(
          "2026-11-02",
          item({ name: "Linsen-Dal" }),
          item({ name: "Ausverkauft", soldOut: true }),
        ),
      );

      expect(await historyOf("2026-11-02")).toHaveLength(2);
      expect(await allMeals()).toHaveLength(2);
    });

    it("clears closed days", async () => {
      await syncMenu(db, day("2026-11-02", item()));
      await syncMenu(db, { date: "2026-11-02", status: "closed" });

      expect(await historyOf("2026-11-02")).toHaveLength(0);
    });
  });
});
