import "server-only";

import { asc, count, eq, inArray } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/session";
import type { IsoDate } from "@/lib/date";
import { db } from "@/lib/db";
import {
  categoryGroups,
  mealCategories,
  mealHistory,
  meals,
} from "@/lib/db/schema";

/** Admin reads are not cached: the dashboard always shows the current state */

/** Number of meals on the menu per day */
export async function getMealCounts(dates: IsoDate[]) {
  await requireAdmin();
  const rows = await db
    .select({ date: mealHistory.date, count: count() })
    .from(mealHistory)
    .where(inArray(mealHistory.date, dates))
    .groupBy(mealHistory.date);
  return new Map(rows.map((row) => [row.date, row.count]));
}

/** The menu of a day with the raw category and its group, in menu order */
export async function getAdminMenu(date: IsoDate) {
  await requireAdmin();
  return db
    .select({
      mealId: meals.id,
      name: mealHistory.name,
      priceStudentCents: mealHistory.priceStudentCents,
      category: mealCategories.name,
      group: categoryGroups.nameDe,
      color: categoryGroups.color,
    })
    .from(mealHistory)
    .innerJoin(meals, eq(meals.id, mealHistory.mealId))
    .innerJoin(mealCategories, eq(mealCategories.id, mealHistory.categoryId))
    .leftJoin(categoryGroups, eq(categoryGroups.id, mealCategories.groupId))
    .where(eq(mealHistory.date, date))
    .orderBy(asc(mealHistory.position));
}
