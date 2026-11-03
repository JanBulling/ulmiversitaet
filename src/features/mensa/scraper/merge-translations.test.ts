import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { mergeTranslations } from "./merge-translations";
import { parseMenu, type ParsedMeal } from "./parse-menu";

function meals(name: string): ParsedMeal[] {
  const html = fs.readFileSync(
    path.join(import.meta.dirname, "__fixtures__", name),
    "utf8",
  );
  const menu = parseMenu(html);
  if (menu.status !== "open") throw new Error(`${name} is closed`);
  return menu.meals;
}

describe("mergeTranslations", () => {
  const de = meals("2026-11-02.de.html");
  const en = meals("2026-11-02.en.html");

  it("matches English names by position", () => {
    const merged = mergeTranslations(de, en);

    expect(merged[1]).toMatchObject({
      name: "Kartoffelgratin Elsässer Art mit Lauch und Zwiebeln",
      nameEn: "Potato gratin Alsace style with leek and onion",
    });
    // The English menu still shows the dish that is sold out in German
    expect(merged[3]).toMatchObject({
      soldOut: true,
      nameEn: "Kaiserschmarrn with apple compote",
    });
  });

  it("uses null for missing translations", () => {
    const merged = mergeTranslations(de, en);
    expect(merged[7]).toMatchObject({
      name: "Vegane Schokocreme mit Birnen",
      nameEn: null,
    });
  });

  it("falls back to category, price, and calories when the menus differ", () => {
    const merged = mergeTranslations(de, en.slice(1));

    expect(merged[0].nameEn).toBeNull();
    expect(merged[1].nameEn).toBe(
      "Potato gratin Alsace style with leek and onion",
    );
  });

  it("works without an English menu", () => {
    expect(
      mergeTranslations(de, []).every((meal) => meal.nameEn === null),
    ).toBe(true);
  });
});
