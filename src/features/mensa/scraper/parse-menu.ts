import { HTMLElement, NodeType, parse } from "node-html-parser";

/**
 * Parses the menu HTML of the Studierendenwerk Ulm (`sw-ulm-spl51.maxmanager.xyz`).
 *
 * The document is a flat list of rows, in order:
 * - `.row.gruppenkopf` — category headline (`.gruppenname`)
 * - `.row.splMeal` — a meal of the preceding category. Its `lang` attribute holds all
 *   codes (allergens + diet icons), the mobile block (`.visible-xs-block`) holds the
 *   name, icons, prices, and nutrition table. The desktop blocks duplicate the content.
 */

export type ParsedMenu =
  { status: "closed" } | { status: "open"; meals: ParsedMeal[] };

export type ParsedMeal = {
  /** Order on the menu (0-based) */
  position: number;
  /** Category headline, normalized (`"PIZZA I"`, `"FLEISCH + FISCH"`) */
  category: string;
  name: string;
  /** The mensa replaces the name with "Ausverkauft" when a meal is sold out */
  soldOut: boolean;
  /** Allergen/additive codes, e.g. `["23", "27", "34W"]` */
  allergens: string[];
  /** Diet/meat codes, sorted, e.g. `["van"]`, `["S"]` */
  types: string[];
  prices: ParsedPrices;
  nutrition: ParsedNutrition;
};

export type ParsedPrices = {
  studentCents: number | null;
  employeeCents: number | null;
  guestCents: number | null;
  /** e.g. "je 100g" */
  note: string | null;
};

export type ParsedNutrition = {
  energyKj: number | null;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  saturatedFatG: number | null;
  carbohydratesG: number | null;
  sugarG: number | null;
  saltG: number | null;
  co2G: number | null;
};

/** Diet/meat icon codes (`assets/icons/<code>.png`). Icons found in the document are added automatically. */
const KNOWN_TYPE_CODES = ["van", "veg", "S", "R", "L", "W", "G", "F", "T"];

const SOLD_OUT = /^ausverkauft$/i;

export class MenuParseError extends Error {
  name = "MenuParseError";
}

export function parseMenu(html: string): ParsedMenu {
  const root = parse(html);

  if (root.querySelector(".nodata")) return { status: "closed" };

  const container = root.querySelector(".container-fluid");
  if (!container) throw new MenuParseError("Missing .container-fluid");

  const typeCodes = new Set(KNOWN_TYPE_CODES);
  for (const icon of root.querySelectorAll("img.icon")) {
    const code = iconCode(icon);
    if (code) typeCodes.add(code);
  }

  const meals: ParsedMeal[] = [];
  let category: string | null = null;

  for (const row of container.querySelectorAll(":scope > .row")) {
    if (row.classList.contains("gruppenkopf")) {
      category = normalizeCategory(
        row.querySelector(".gruppenname")?.text ?? "",
      );
    } else if (row.classList.contains("splMeal")) {
      if (!category) throw new MenuParseError("Meal before first category");
      meals.push(parseMeal(row, category, meals.length, typeCodes));
    }
  }

  if (meals.length === 0) throw new MenuParseError("No meals found");

  return { status: "open", meals };
}

function parseMeal(
  row: HTMLElement,
  category: string,
  position: number,
  typeCodes: Set<string>,
): ParsedMeal {
  const mobile = row.querySelector(".visible-xs-block");
  if (!mobile) throw new MenuParseError("Meal without mobile block");

  const name = parseName(mobile);

  const codes = unique(
    (row.getAttribute("lang") ?? "")
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean),
  );
  const icons = mobile
    .querySelectorAll("img.icon")
    .map(iconCode)
    .filter((code): code is string => !!code);

  return {
    position,
    category,
    name,
    soldOut: SOLD_OUT.test(name),
    allergens: codes.filter((code) => !typeCodes.has(code)),
    types: unique([
      ...icons,
      ...codes.filter((code) => typeCodes.has(code)),
    ]).sort(),
    prices: parsePrices(mobile),
    nutrition: parseNutrition(mobile),
  };
}

/** The name is the text of the second `.fltl`, without the code spans and the nutrition popup */
function parseName(mobile: HTMLElement): string {
  const nameElement = mobile.querySelectorAll(".fltl")[1];
  if (!nameElement) throw new MenuParseError("Meal without name element");

  const text = nameElement.childNodes
    .filter((node) => node.nodeType === NodeType.TEXT_NODE)
    .map((node) => node.text)
    .join(" ");

  return cleanName(text);
}

export function cleanName(text: string): string {
  return text
    .replace(/\u00a0/g, " ") // non-breaking spaces
    .replace(/\(.*?\)/g, "") // "(siehe Auswahl vor Ort)", stray code lists
    .replace(/\s+/g, " ")
    .replace(/(\p{L})- (\p{Lu})/gu, "$1-$2") // "Gemüse- Frikadelle" → "Gemüse-Frikadelle"
    .replace(/(\p{L})- (\p{Ll})/gu, "$1$2") // hyphenation "Kartof- feln" → "Kartoffeln"
    .replace(/\s+,/g, ",")
    .replace(/,(?=\S)/g, ", ")
    .replace(/[\s,;]+$/, "") // left over before removed markup: "Spätzle, <i>EXTRA …</i>"
    .trim();
}

function parsePrices(mobile: HTMLElement): ParsedPrices {
  const marker = mobile.querySelector(".preisgramm");
  const container = marker?.parentNode;
  if (!marker || !container) {
    return {
      studentCents: null,
      employeeCents: null,
      guestCents: null,
      note: null,
    };
  }

  const note = marker.text.replace(/[()]/g, "").trim() || null;
  const amounts = (container.text.match(/\d+,\d{2}/g) ?? []).map((amount) =>
    Math.round(Number(amount.replace(",", ".")) * 100),
  );

  return {
    studentCents: amounts[0] ?? null,
    employeeCents: amounts[1] ?? null,
    guestCents: amounts[2] ?? null,
    note,
  };
}

function parseNutrition(mobile: HTMLElement): ParsedNutrition {
  const nutrition: ParsedNutrition = {
    energyKj: null,
    energyKcal: null,
    proteinG: null,
    fatG: null,
    saturatedFatG: null,
    carbohydratesG: null,
    sugarG: null,
    saltG: null,
    co2G: null,
  };

  const popup = mobile.querySelector(".azn");
  if (!popup) return nutrition;

  const co2 = popup.text.match(
    /Fu(?:ß|ss)abdruck pro Portion\s*([\d.,]+)\s*g/i,
  );
  nutrition.co2G = co2 ? Math.round(germanNumber(co2[1])!) : null;

  // Rows are identified by label, not position. Only the German document has
  // consistent labels ("Energie", "Fett", …), so nutrition is taken from it.
  for (const row of popup.querySelectorAll("tbody tr")) {
    const [labelCell, valueCell] = row.querySelectorAll("td");
    if (!labelCell || !valueCell) continue;

    const label = labelCell.text.trim().toLowerCase();
    const value = valueCell.text.replace(/\s+/g, " ").trim();
    const [first] = numbers(value);

    if (label.startsWith("energ")) {
      const kj = value.match(/([\d.,]+)\s*kJ/i);
      const kcal = value.match(/([\d.,]+)\s*kcal/i);
      nutrition.energyKj = kj ? Math.round(germanNumber(kj[1])!) : null;
      nutrition.energyKcal = kcal ? Math.round(germanNumber(kcal[1])!) : null;
    } else if (label.startsWith("protein")) {
      nutrition.proteinG = first;
    } else if (label.startsWith("fett")) {
      nutrition.fatG = first;
      nutrition.saturatedFatG = numberAfter(value, /gesättigt/i);
    } else if (label.startsWith("kohlenhydrate")) {
      nutrition.carbohydratesG = first;
      nutrition.sugarG = numberAfter(value, /zucker/i);
    } else if (label.startsWith("salz")) {
      nutrition.saltG = first;
    }
  }

  return nutrition;
}

/** Normalizes a category headline: single spaces, upper case */
export function normalizeCategory(text: string): string {
  return text.replace(/\s+/g, " ").trim().toUpperCase();
}

function iconCode(icon: HTMLElement): string | null {
  const src = icon.getAttribute("src") ?? "";
  return src.match(/([^/]+)\.png$/)?.[1] ?? null;
}

function numbers(text: string): number[] {
  return (text.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => germanNumber(n)!);
}

function numberAfter(text: string, label: RegExp): number | null {
  const index = text.search(label);
  if (index < 0) return null;
  return numbers(text.slice(index))[0] ?? null;
}

/** German number format: "3.302,5" → 3302.5, "1.037" → 1037 (`.` groups thousands, `,` is the decimal separator) */
function germanNumber(text: string | undefined): number | null {
  if (!text) return null;
  const value = Number(text.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
