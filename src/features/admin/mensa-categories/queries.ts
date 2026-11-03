import "server-only";

import { asc, count, eq, isNull, max, sql } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { categoryGroups, mealCategories, mealHistory } from "@/lib/db/schema";

/** Admin reads are not cached: the dashboard always shows the current state */

export async function getCategoryOverview() {
  await requireAdmin();

  const [groups, categories] = await Promise.all([
    db
      .select()
      .from(categoryGroups)
      .orderBy(asc(categoryGroups.sortOrder), asc(categoryGroups.id)),
    db
      .select({
        id: mealCategories.id,
        name: mealCategories.name,
        groupId: mealCategories.groupId,
        servings: count(mealHistory.id),
        lastSeen: max(mealHistory.date),
      })
      .from(mealCategories)
      .leftJoin(mealHistory, eq(mealHistory.categoryId, mealCategories.id))
      .groupBy(mealCategories.id)
      // Unassigned first, then the most recently used
      .orderBy(
        sql`${mealCategories.groupId} is not null`,
        sql`max(${mealHistory.date}) desc nulls last`,
        asc(mealCategories.name),
      ),
  ]);

  return { groups, categories };
}

export async function getCategoryGroup(id: number) {
  await requireAdmin();

  const [group] = await db
    .select()
    .from(categoryGroups)
    .where(eq(categoryGroups.id, id));
  if (!group) return null;

  const assigned = await db
    .select({ name: mealCategories.name })
    .from(mealCategories)
    .where(eq(mealCategories.groupId, id))
    .orderBy(asc(mealCategories.name));

  return { ...group, assigned: assigned.map((row) => row.name) };
}

export async function countUnassignedCategories() {
  await requireAdmin();
  const [row] = await db
    .select({ count: count() })
    .from(mealCategories)
    .where(isNull(mealCategories.groupId));
  return row.count;
}
