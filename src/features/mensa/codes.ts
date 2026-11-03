import type { Locale } from "@/lib/i18n/routing";

/**
 * Names for the codes printed on the menu. Meals store the raw codes, so a code missing
 * here is still kept and shown as-is until it is added.
 */

type Label = { de: string; en: string };

/** Allergens and additives, keyed by code (upper case, without spaces) */
const ALLERGENS: Record<string, Label> = {
  "1": { de: "Farbstoff", en: "Colouring" },
  "2": { de: "Konservierungsstoff", en: "Preservative" },
  "3": { de: "Antioxidationsmittel", en: "Antioxidant" },
  "4": { de: "Geschmacksverstärker", en: "Flavour enhancer" },
  "5": { de: "Geschwefelt", en: "Sulphured" },
  "6": { de: "Geschwärzt", en: "Blackened" },
  "7": { de: "Gewachst", en: "Waxed" },
  "8": { de: "Phosphat", en: "Phosphate" },
  "9": { de: "Süßungsmittel", en: "Sweetener" },
  "10": { de: "Phenylalaninquelle", en: "Source of phenylalanine" },
  "13": { de: "Krebstiere", en: "Crustaceans" },
  "14": { de: "Eier", en: "Eggs" },
  "18": { de: "Gelatine (Schwein)", en: "Gelatine (pork)" },
  "18R": { de: "Gelatine (Rind)", en: "Gelatine (beef)" },
  "22": { de: "Erdnüsse", en: "Peanuts" },
  "23": { de: "Soja", en: "Soy" },
  "24": { de: "Milch", en: "Milk" },
  "25H": { de: "Haselnuss", en: "Hazelnut" },
  "25W": { de: "Walnuss", en: "Walnut" },
  "25P": { de: "Pistazie", en: "Pistachio" },
  "25MN": { de: "Mandel", en: "Almond" },
  "25C": { de: "Cashew", en: "Cashew" },
  "25MA": { de: "Macadamia", en: "Macadamia" },
  "25PK": { de: "Pekannuss", en: "Pecan" },
  "26": { de: "Sellerie", en: "Celery" },
  "27": { de: "Senf", en: "Mustard" },
  "28": { de: "Sesam", en: "Sesame" },
  "29": { de: "Schwefeldioxid", en: "Sulphur dioxide" },
  "30": { de: "Sulfite", en: "Sulphites" },
  "31": { de: "Lupine", en: "Lupin" },
  "32": { de: "Weichtiere", en: "Molluscs" },
  "34W": { de: "Weizen", en: "Wheat" },
  "34H": { de: "Hafer", en: "Oats" },
  "34R": { de: "Roggen", en: "Rye" },
  "34D": { de: "Dinkel", en: "Spelt" },
  "34G": { de: "Gerste", en: "Barley" },
  "35": { de: "Fisch", en: "Fish" },
  GL: { de: "Gluten", en: "Gluten" },
};

/** Diet and meat markers (the icons on the menu) */
export const MEAL_TYPES = {
  van: { de: "Vegan", en: "Vegan", color: "#65a30d", icon: "vegan" },
  veg: {
    de: "Vegetarisch",
    en: "Vegetarian",
    color: "#16a34a",
    icon: "carrot",
  },
  S: { de: "Schwein", en: "Pork", color: "#e11d48", icon: "ham" },
  R: { de: "Rind", en: "Beef", color: "#854d0e", icon: "beef" },
  L: { de: "Lamm", en: "Lamb", color: "#a21caf", icon: "drumstick" },
  W: { de: "Wild", en: "Game", color: "#713f12", icon: "ham" },
  G: { de: "Geflügel", en: "Poultry", color: "#f97316", icon: "bird" },
  F: { de: "Fisch", en: "Fish", color: "#0284c7", icon: "fish" },
  T: { de: "Tintenfisch", en: "Squid", color: "#3730a3", icon: "shrimp" },
} as const;

export type MealTypeInfo = {
  code: string;
  name: string;
  color: string;
  icon: string | null;
};

export function allergenName(code: string, locale: Locale): string {
  return ALLERGENS[code.toUpperCase().replace(/\s+/g, "")]?.[locale] ?? code;
}

export function mealTypeInfo(code: string, locale: Locale): MealTypeInfo {
  const known = MEAL_TYPES[code as keyof typeof MEAL_TYPES];
  return known
    ? { code, name: known[locale], color: known.color, icon: known.icon }
    : { code, name: code, color: "#525252", icon: null };
}
