import "server-only";

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import type { IsoDate } from "@/lib/date";
import { db } from "@/lib/db";
import {
  categoryGroups,
  mealCategories,
  mealHistory,
  mealRatings,
  mealRatingStats,
  meals,
  type CategoryKind,
} from "@/lib/db/schema";
import { MENSA_CACHE_TAG } from "./cache";

export type Prices = {
  studentCents: number | null;
  employeeCents: number | null;
  guestCents: number | null;
  note: string | null;
};

export type RatingSummary = {
  count: number;
  total: number;
  taste: number;
  look: number;
  price: number;
};

/** Display category: a group, or a raw menu category that isn't assigned to a group yet */
export type DisplayCategory = {
  nameDe: string;
  nameEn: string | null;
  color: string | null;
  icon: string | null;
  kind: CategoryKind | null;
  showOnHome: boolean;
};

export type MenuMeal = {
  id: string;
  name: string;
  nameEn: string | null;
  types: string[];
  allergens: string[];
  /** Prices of this day */
  prices: Prices;
  energyKcal: number | null;
  proteinG: number | null;
  rating: RatingSummary | null;
};

export type MenuCategory = DisplayCategory & { key: string; meals: MenuMeal[] };

export type Menu = { date: IsoDate; categories: MenuCategory[] };

const ratingColumns = {
  count: mealRatingStats.count,
  total: mealRatingStats.total,
  taste: mealRatingStats.taste,
  look: mealRatingStats.look,
  price: mealRatingStats.price,
};

const categoryColumns = {
  categoryId: mealCategories.id,
  categoryName: mealCategories.name,
  groupId: categoryGroups.id,
  groupNameDe: categoryGroups.nameDe,
  groupNameEn: categoryGroups.nameEn,
  color: categoryGroups.color,
  icon: categoryGroups.icon,
  kind: categoryGroups.kind,
  showOnHome: categoryGroups.showOnHome,
};

function toDisplayCategory(row: {
  categoryName: string;
  groupNameDe: string | null;
  groupNameEn: string | null;
  color: string | null;
  icon: string | null;
  kind: CategoryKind | null;
  showOnHome: boolean | null;
}): DisplayCategory {
  return {
    nameDe: row.groupNameDe ?? row.categoryName,
    nameEn: row.groupNameDe ? row.groupNameEn : null,
    color: row.color,
    icon: row.icon,
    kind: row.kind,
    showOnHome: row.showOnHome ?? false,
  };
}

function toRating(
  stats: { count: number | null } & Omit<RatingSummary, "count">,
) {
  return stats.count ? (stats as RatingSummary) : null;
}

/** The menu of one day, grouped by display category in their configured order */
export async function getMenu(date: IsoDate): Promise<Menu> {
  "use cache";
  cacheTag(MENSA_CACHE_TAG);
  cacheLife("hours");

  const rows = await db
    .select({
      ...categoryColumns,
      id: meals.id,
      name: mealHistory.name,
      nameEn: meals.nameEn,
      types: meals.types,
      allergens: meals.allergens,
      studentCents: mealHistory.priceStudentCents,
      employeeCents: mealHistory.priceEmployeeCents,
      guestCents: mealHistory.priceGuestCents,
      note: mealHistory.priceNote,
      energyKcal: meals.energyKcal,
      proteinG: meals.proteinG,
      rating: ratingColumns,
    })
    .from(mealHistory)
    .innerJoin(meals, eq(meals.id, mealHistory.mealId))
    .innerJoin(mealCategories, eq(mealCategories.id, mealHistory.categoryId))
    .leftJoin(categoryGroups, eq(categoryGroups.id, mealCategories.groupId))
    .leftJoin(mealRatingStats, eq(mealRatingStats.mealId, meals.id))
    .where(eq(mealHistory.date, date))
    // Unassigned categories come last, in menu order
    .orderBy(
      asc(sql`coalesce(${categoryGroups.sortOrder}, 100000)`),
      asc(mealHistory.position),
    );

  const categories = new Map<string, MenuCategory>();
  for (const row of rows) {
    const key = row.groupId
      ? `group-${row.groupId}`
      : `category-${row.categoryId}`;
    if (!categories.has(key)) {
      categories.set(key, { key, ...toDisplayCategory(row), meals: [] });
    }
    categories.get(key)!.meals.push({
      id: row.id,
      name: row.name,
      nameEn: row.nameEn,
      types: row.types,
      allergens: row.allergens,
      prices: {
        studentCents: row.studentCents,
        employeeCents: row.employeeCents,
        guestCents: row.guestCents,
        note: row.note,
      },
      energyKcal: row.energyKcal,
      proteinG: row.proteinG,
      rating: row.rating ? toRating(row.rating) : null,
    });
  }

  return { date, categories: [...categories.values()] };
}

export type MealDetails = Awaited<ReturnType<typeof getMeal>>;

/** A meal with its current data, rating summary, comments, and the days it was served */
export async function getMeal(id: string) {
  "use cache";
  cacheTag(MENSA_CACHE_TAG);
  cacheLife("hours");

  const [row] = await db
    .select({
      ...categoryColumns,
      meal: meals,
      rating: ratingColumns,
    })
    .from(meals)
    .innerJoin(mealCategories, eq(mealCategories.id, meals.categoryId))
    .leftJoin(categoryGroups, eq(categoryGroups.id, mealCategories.groupId))
    .leftJoin(mealRatingStats, eq(mealRatingStats.mealId, meals.id))
    .where(eq(meals.id, id));

  if (!row) return null;

  const [comments, servedOn] = await Promise.all([
    db
      .select({
        id: mealRatings.id,
        comment: mealRatings.comment,
        total: mealRatings.total,
        createdAt: mealRatings.createdAt,
      })
      .from(mealRatings)
      .where(
        and(
          eq(mealRatings.mealId, id),
          isNull(mealRatings.hiddenAt),
          sql`nullif(trim(${mealRatings.comment}), '') is not null`,
        ),
      )
      .orderBy(desc(mealRatings.createdAt))
      .limit(100),
    db
      .select({ date: mealHistory.date })
      .from(mealHistory)
      .where(eq(mealHistory.mealId, id))
      .orderBy(desc(mealHistory.date))
      .limit(10),
  ]);

  const { meal } = row;

  return {
    id: meal.id,
    name: meal.name,
    nameEn: meal.nameEn,
    category: toDisplayCategory(row),
    types: meal.types,
    allergens: meal.allergens,
    prices: {
      studentCents: meal.priceStudentCents,
      employeeCents: meal.priceEmployeeCents,
      guestCents: meal.priceGuestCents,
      note: meal.priceNote,
    } satisfies Prices,
    nutrition: {
      energyKcal: meal.energyKcal,
      energyKj: meal.energyKj,
      proteinG: meal.proteinG,
      fatG: meal.fatG,
      saturatedFatG: meal.saturatedFatG,
      carbohydratesG: meal.carbohydratesG,
      sugarG: meal.sugarG,
      saltG: meal.saltG,
      co2G: meal.co2G,
    },
    rating: row.rating ? toRating(row.rating) : null,
    comments: comments.map((c) => ({ ...c, comment: c.comment! })),
    servedOn: servedOn.map((s) => s.date),
  };
}
