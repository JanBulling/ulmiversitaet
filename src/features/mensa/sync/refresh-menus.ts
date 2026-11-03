import "server-only";

import { revalidateTag } from "next/cache";

import type { IsoDate } from "@/lib/date";
import { db } from "@/lib/db";
import { MENSA_CACHE_TAG } from "../cache";
import { scrapeMenu } from "../scraper/scrape-menu";
import { syncMenu, type SyncResult } from "./sync-menu";

export type RefreshResult =
  SyncResult | { date: IsoDate; status: "error"; error: string };

/**
 * Scrapes and saves the menus of the given days, one day after another.
 * A failing day doesn't stop the others.
 */
export async function refreshMenus(dates: IsoDate[]): Promise<RefreshResult[]> {
  const results: RefreshResult[] = [];

  for (const date of dates) {
    try {
      const menu = await scrapeMenu(date);
      results.push(await syncMenu(db, menu));
    } catch (error) {
      console.error(`[mensa] Failed to refresh menu for ${date}`, error);
      results.push({ date, status: "error", error: String(error) });
    }
  }

  revalidateTag(MENSA_CACHE_TAG, "max");
  console.info("[mensa] Refreshed menus", results);

  return results;
}
