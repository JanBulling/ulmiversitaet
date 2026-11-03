import type { IsoDate } from "@/lib/date";
import { fetchMenuHtml } from "./fetch-menu";
import { mergeTranslations, type MenuItem } from "./merge-translations";
import { parseMenu } from "./parse-menu";

export type ScrapedMenu =
  | { date: IsoDate; status: "closed" }
  | { date: IsoDate; status: "open"; items: MenuItem[] };

/** Fetches and parses the German and English menu of one day */
export async function scrapeMenu(date: IsoDate): Promise<ScrapedMenu> {
  const [htmlDe, htmlEn] = await Promise.all([
    fetchMenuHtml(date, "de"),
    fetchMenuHtml(date, "en"),
  ]);

  const de = parseMenu(htmlDe);
  if (de.status === "closed") return { date, status: "closed" };

  // A broken English page must not prevent saving the German menu
  let en: ReturnType<typeof parseMenu> = { status: "closed" };
  try {
    en = parseMenu(htmlEn);
  } catch (error) {
    console.warn(`[mensa] Could not parse English menu for ${date}`, error);
  }

  return {
    date,
    status: "open",
    items: mergeTranslations(de.meals, en.status === "open" ? en.meals : []),
  };
}
