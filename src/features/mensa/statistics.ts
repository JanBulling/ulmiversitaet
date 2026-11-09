import "server-only";

import { and, asc, desc, eq, gte, lte, max, min, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { cacheLife } from "next/cache";

import { today, type IsoDate } from "@/lib/date";
import { db } from "@/lib/db";
import {
  categoryGroups,
  mealCategories,
  mealHistory,
  mealRatingStats,
  meals,
  type CategoryKind,
} from "@/lib/db/schema";
import type { PriceDay } from "./price-stats";
import { toDisplayCategory } from "./queries";

// The archive, price tracker, and ranking change slowly: they are cached for a day and not
// invalidated by new ratings or menu syncs (unlike the menu, which uses the mensa tag)

/** First and last day with a menu (for the archive's date picker) */
export async function getMenuRange(): Promise<{
  first: IsoDate;
  last: IsoDate;
} | null> {
  "use cache";
  cacheLife("days");

  const [range] = await db
    .select({ first: min(mealHistory.date), last: max(mealHistory.date) })
    .from(mealHistory);
  return range?.first && range.last
    ? { first: range.first, last: range.last }
    : null;
}

/**
 * Average prices per menu day up to today, from the menus themselves (`meal_history`), so
 * all days are included, also those before the separate `price_history` table started
 */
export async function getPriceDays(): Promise<PriceDay[]> {
  "use cache";
  cacheLife("days");

  const avg = (column: AnyPgColumn, kind: CategoryKind) =>
    sql<
      number | null
    >`(avg(${column}) filter (where ${categoryGroups.kind} = ${kind}))::real`;

  return db
    .select({
      date: mealHistory.date,
      mainStudent: avg(mealHistory.priceStudentCents, "main"),
      mainEmployee: avg(mealHistory.priceEmployeeCents, "main"),
      mainGuest: avg(mealHistory.priceGuestCents, "main"),
      dessert: avg(mealHistory.priceStudentCents, "dessert"),
    })
    .from(mealHistory)
    .innerJoin(mealCategories, eq(mealCategories.id, mealHistory.categoryId))
    .innerJoin(categoryGroups, eq(categoryGroups.id, mealCategories.groupId))
    .where(lte(mealHistory.date, today()))
    .groupBy(mealHistory.date)
    .orderBy(asc(mealHistory.date));
}

/** Main dishes need this many ratings to be ranked, so one enthusiastic vote isn't enough */
export const RANKING_MIN_RATINGS = 3;
const RANKING_SIZE = 10;

/**
 * The best and worst rated main dishes of all time, ordered by the weighted `score` of
 * `meal_rating_stats` (pulled towards 3 stars for meals with few ratings)
 */
export async function getMealRanking() {
  "use cache";
  cacheLife("days");

  const ranked = (order: typeof asc) =>
    db
      .select({
        id: meals.id,
        name: meals.name,
        nameEn: meals.nameEn,
        lastServedOn: meals.lastServedOn,
        categoryName: mealCategories.name,
        groupNameDe: categoryGroups.nameDe,
        groupNameEn: categoryGroups.nameEn,
        color: categoryGroups.color,
        icon: categoryGroups.icon,
        kind: categoryGroups.kind,
        showOnHome: categoryGroups.showOnHome,
        count: mealRatingStats.count,
        total: mealRatingStats.total,
      })
      .from(mealRatingStats)
      .innerJoin(meals, eq(meals.id, mealRatingStats.mealId))
      .innerJoin(mealCategories, eq(mealCategories.id, meals.categoryId))
      .innerJoin(categoryGroups, eq(categoryGroups.id, mealCategories.groupId))
      .where(
        and(
          eq(categoryGroups.kind, "main"),
          gte(mealRatingStats.count, RANKING_MIN_RATINGS),
        ),
      )
      .orderBy(order(mealRatingStats.score), desc(mealRatingStats.count))
      .limit(RANKING_SIZE);

  const [best, worst] = await Promise.all([ranked(desc), ranked(asc)]);
  const toEntry = (row: (typeof best)[number]) => ({
    id: row.id,
    name: row.name,
    nameEn: row.nameEn,
    lastServedOn: row.lastServedOn,
    category: toDisplayCategory(row),
    rating: { count: row.count, total: row.total },
  });
  return { best: best.map(toEntry), worst: worst.map(toEntry) };
}

export type RankedMeal = Awaited<
  ReturnType<typeof getMealRanking>
>["best"][number];
