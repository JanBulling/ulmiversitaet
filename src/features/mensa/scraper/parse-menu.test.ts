import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  cleanName,
  MenuParseError,
  parseMenu,
  type ParsedMeal,
} from "./parse-menu";

const fixture = (name: string) =>
  fs.readFileSync(path.join(import.meta.dirname, "__fixtures__", name), "utf8");

function openMenu(name: string): ParsedMeal[] {
  const menu = parseMenu(fixture(name));
  if (menu.status !== "open") throw new Error(`${name} is closed`);
  return menu.meals;
}

describe("parseMenu", () => {
  it("detects closed days", () => {
    expect(parseMenu(fixture("closed.de.html"))).toEqual({ status: "closed" });
  });

  it("parses all meals with their categories in menu order", () => {
    const meals = openMenu("2026-11-02.de.html");

    expect(meals.map((meal) => [meal.position, meal.category])).toEqual([
      [0, "VEGAN"],
      [1, "VEGETARISCH"],
      [2, "FLEISCH + FISCH"],
      [3, "SPECIALS"],
      [4, "PIZZA I"],
      [5, "PIZZA II"],
      [6, "SALATBUFFET"],
      [7, "DESSERT"],
      [8, "DESSERT"],
    ]);
  });

  it("parses name, codes, prices, and nutrition", () => {
    const [tikka] = openMenu("2026-11-02.de.html");

    expect(tikka).toEqual({
      position: 0,
      category: "VEGAN",
      // Name is split by two code spans in the HTML
      name: "Tikka Masala mit veganem Hähnchen und Fladenbrot",
      soldOut: false,
      allergens: ["23", "27", "28", "34W"],
      types: ["van"],
      prices: {
        studentCents: 465,
        employeeCents: 675,
        guestCents: 885,
        note: null,
      },
      nutrition: {
        energyKj: 3276,
        energyKcal: 783,
        proteinG: 35.4,
        fatG: 27.8,
        saturatedFatG: 9.4,
        carbohydratesG: 90.5,
        sugarG: 10,
        saltG: 5.3,
        co2G: 419,
      },
    });
  });

  it("reads thousands separators in the CO2 footprint", () => {
    const pizzas = openMenu("2026-11-02.de.html").filter((meal) =>
      meal.category.startsWith("PIZZA"),
    );
    expect(pizzas.map((meal) => meal.nutrition.co2G)).toEqual([1037, 1511]);
  });

  it("parses per-weight prices and diet codes without an icon", () => {
    const buffet = openMenu("2026-11-02.de.html").find(
      (meal) => meal.category === "SALATBUFFET",
    )!;

    expect(buffet.name).toBe("Salatbuffet");
    expect(buffet.prices).toEqual({
      studentCents: 100,
      employeeCents: 145,
      guestCents: 190,
      note: "je 100g",
    });
    // "veg" only appears in the `lang` attribute, not as an icon
    expect(buffet.types).toEqual(["veg"]);
    // Unknown codes like 34G (Gerste) are kept
    expect(buffet.allergens).toContain("34G");
    expect(buffet.nutrition.energyKcal).toBeNull();
  });

  it("flags sold-out meals", () => {
    const specials = openMenu("2026-11-02.de.html")[3];
    expect(specials.name).toBe("Ausverkauft");
    expect(specials.soldOut).toBe(true);
  });

  it("parses the prettified, double-quoted markup of older menus", () => {
    const meals = openMenu("legacy-prettified.de.html");

    expect(meals).toHaveLength(13);
    expect(meals[0]).toMatchObject({
      category: "TOPF + PFANNE",
      name: "Samosas - gefüllte Teigtaschen auf indischem Salat mit Joghurt-Dip",
      types: ["van"],
    });
    expect(meals.find((meal) => meal.name === "Langkornreis")).toMatchObject({
      allergens: [],
      types: ["van"],
    });
    expect(
      meals.find((meal) => meal.name === "Panna Cotta mit Erdbeeren")
        ?.allergens,
    ).toEqual(["18R", "24"]);
  });

  it("ignores add-on hints in italics", () => {
    // "Linsen mit … Spätzle …, <i>EXTRA Wienerle auf Wunsch</i>"
    const lentils = openMenu("2026-11-04.de.html").find((meal) =>
      meal.name.startsWith("Linsen"),
    );
    expect(lentils?.name).toBe("Linsen mit Spätzle");
  });

  it("throws on unexpected markup", () => {
    expect(() => parseMenu("<p>Wartungsarbeiten</p>")).toThrow(MenuParseError);
    expect(() => parseMenu("<div class='container-fluid'></div>")).toThrow(
      MenuParseError,
    );
  });
});

describe("cleanName", () => {
  it.each([
    ["Salatbuffet (siehe Auswahl vor Ort)", "Salatbuffet"],
    ["Spätzle  mit\u00a0Soße", "Spätzle mit Soße"],
    ["Gemüse- Frikadelle", "Gemüse-Frikadelle"],
    ["Kartof- feln", "Kartoffeln"],
    ["Reis ,Gemüse,Soße", "Reis, Gemüse, Soße"],
    ["Linsen mit Spätzle , ", "Linsen mit Spätzle"],
    ["Samosas - gefüllte Teigtaschen", "Samosas - gefüllte Teigtaschen"],
  ])("%s → %s", (input, expected) => {
    expect(cleanName(input)).toBe(expected);
  });
});
