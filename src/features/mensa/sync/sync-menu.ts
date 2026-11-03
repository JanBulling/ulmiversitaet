import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import type {
  AnyPgColumn,
  PgDatabase,
  PgQueryResultHKT,
} from "drizzle-orm/pg-core";

import type { IsoDate } from "@/lib/date";
import * as schema from "@/lib/db/schema";
import type { MenuItem } from "../scraper/merge-translations";
import type { ScrapedMenu } from "../scraper/scrape-menu";

const { categoryGroups, mealCategories, mealHistory, meals, priceHistory } =
  schema;

/** Any Drizzle Postgres database with our schema (Neon in the app, PGlite in tests) */
export type MensaDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

export type SyncResult = {
  date: IsoDate;
  status: "open" | "closed";
  meals: number;
  newMeals: number;
  newCategories: string[];
  soldOut: number;
};

/** Minimum trigram similarity for two differently written names to count as the same meal */
const SIMILARITY_THRESHOLD = 0.75;

/**
 * Writes the menu of one day to the database:
 * 1. unknown categories are added (auto-assigned to a group with the same name)
 * 2. each meal is matched to an existing meal or created, its current data updated
 * 3. `meal_history` is replaced with the menu of this day
 * 4. `price_history` is recomputed for this day
 *
 * Idempotent: syncing the same menu twice leaves the database unchanged.
 */
export async function syncMenu(
  db: MensaDatabase,
  menu: ScrapedMenu,
): Promise<SyncResult> {
  const { date } = menu;

  if (menu.status === "closed") {
    await db.delete(mealHistory).where(eq(mealHistory.date, date));
    await db.delete(priceHistory).where(eq(priceHistory.date, date));
    return {
      date,
      status: "closed",
      meals: 0,
      newMeals: 0,
      newCategories: [],
      soldOut: 0,
    };
  }

  const { ids: categoryIds, created: newCategories } = await ensureCategories(
    db,
    menu.items.map((item) => item.category),
  );

  // Sold-out meals have no name; they are skipped and keep their existing history entry
  const available = menu.items.filter((item) => !item.soldOut);
  const soldOut = menu.items.length - available.length;

  const historyRows = new Map<string, typeof mealHistory.$inferInsert>();
  let newMeals = 0;

  for (const item of available) {
    const categoryId = categoryIds.get(item.category)!;
    let mealId = await findMeal(db, item);

    if (mealId) {
      await updateMeal(db, mealId, item, categoryId, date);
    } else {
      mealId = await insertMeal(db, item, categoryId, date);
      newMeals++;
    }

    // If two entries resolve to the same meal, the first one wins
    if (!historyRows.has(mealId)) {
      historyRows.set(mealId, {
        date,
        mealId,
        categoryId,
        name: item.name,
        priceStudentCents: item.prices.studentCents,
        priceEmployeeCents: item.prices.employeeCents,
        priceGuestCents: item.prices.guestCents,
        priceNote: item.prices.note,
        position: item.position,
      });
    }
  }

  const mealIds = [...historyRows.keys()];

  if (mealIds.length > 0) {
    await db
      .insert(mealHistory)
      .values([...historyRows.values()])
      .onConflictDoUpdate({
        target: [mealHistory.date, mealHistory.mealId],
        set: {
          categoryId: sql`excluded.category_id`,
          name: sql`excluded.name`,
          priceStudentCents: sql`excluded.price_student_cents`,
          priceEmployeeCents: sql`excluded.price_employee_cents`,
          priceGuestCents: sql`excluded.price_guest_cents`,
          priceNote: sql`excluded.price_note`,
          position: sql`excluded.position`,
        },
      });
  }

  // Remove meals the mensa took off the menu. Skipped while something is sold out,
  // because the sold-out meal can't be identified and must not be removed.
  if (soldOut === 0) {
    await db
      .delete(mealHistory)
      .where(
        and(
          eq(mealHistory.date, date),
          mealIds.length > 0
            ? notInArray(mealHistory.mealId, mealIds)
            : undefined,
        ),
      );
  }

  await updatePriceHistory(db, [date]);

  return {
    date,
    status: "open",
    meals: mealIds.length,
    newMeals,
    newCategories,
    soldOut,
  };
}

async function ensureCategories(db: MensaDatabase, names: string[]) {
  const unique = [...new Set(names)];

  const created = await db
    .insert(mealCategories)
    .values(
      unique.map((name) => ({
        name,
        // Auto-assign to a group with the same name, e.g. "VEGAN" → "Vegan"
        groupId: sql`(select id from ${categoryGroups} where upper(name_de) = ${name})`,
      })),
    )
    .onConflictDoNothing({ target: mealCategories.name })
    .returning({ name: mealCategories.name });

  const rows = await db
    .select({ id: mealCategories.id, name: mealCategories.name })
    .from(mealCategories)
    .where(inArray(mealCategories.name, unique));

  return {
    ids: new Map(rows.map((row) => [row.name, row.id])),
    created: created.map((row) => row.name),
  };
}

/**
 * 1. Exact: same name ignoring case, spaces, and punctuation — compared with the current
 *    name and every name the meal had on earlier menus.
 * 2. Fuzzy: trigram similarity ≥ 0.75, but only if the diet/meat types are identical
 *    (so "… mit Speck" and "… mit veganem Schmand" stay separate meals).
 */
async function findMeal(
  db: MensaDatabase,
  item: MenuItem,
): Promise<string | null> {
  const key = sql`lower(regexp_replace(${item.name}::text, '[^[:alnum:]]+', '', 'g'))`;

  const [exact] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(
      or(
        eq(meals.nameKey, key),
        inArray(
          meals.id,
          db
            .select({ id: mealHistory.mealId })
            .from(mealHistory)
            .where(eq(mealHistory.nameKey, key)),
        ),
      ),
    )
    .orderBy(desc(meals.lastServedOn))
    .limit(1);
  if (exact) return exact.id;

  const similarity = sql<number>`similarity(${meals.name}, ${item.name})`;
  const [similar] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(
      and(
        sql`${meals.name} % ${item.name}`, // uses the trigram index
        gte(similarity, SIMILARITY_THRESHOLD),
        eq(meals.types, item.types),
      ),
    )
    .orderBy(desc(similarity))
    .limit(1);

  return similar?.id ?? null;
}

function currentValues(item: MenuItem, categoryId: number, date: IsoDate) {
  return {
    name: item.name,
    // Keep the existing translation if the English menu had none
    nameEn: item.nameEn ?? undefined,
    categoryId,
    allergens: item.allergens,
    types: item.types,
    priceStudentCents: item.prices.studentCents,
    priceEmployeeCents: item.prices.employeeCents,
    priceGuestCents: item.prices.guestCents,
    priceNote: item.prices.note,
    ...item.nutrition,
    lastServedOn: date,
  };
}

async function insertMeal(
  db: MensaDatabase,
  item: MenuItem,
  categoryId: number,
  date: IsoDate,
): Promise<string> {
  const [meal] = await db
    .insert(meals)
    .values(currentValues(item, categoryId, date))
    .returning({ id: meals.id });
  return meal.id;
}

/** Updates the current values, unless the meal already has data from a later menu */
async function updateMeal(
  db: MensaDatabase,
  mealId: string,
  item: MenuItem,
  categoryId: number,
  date: IsoDate,
) {
  await db
    .update(meals)
    .set(currentValues(item, categoryId, date))
    .where(and(eq(meals.id, mealId), lte(meals.lastServedOn, date)));
}

/**
 * Recomputes the average prices of the given days per category kind, in one statement.
 * Meals in categories without a group are ignored. Every day gets a row (null if empty).
 */
export async function updatePriceHistory(db: MensaDatabase, dates: IsoDate[]) {
  if (dates.length === 0) return;

  const days = sql.join(
    dates.map((date) => sql`${date}`),
    sql`, `,
  );
  const avg = (column: AnyPgColumn, kind: schema.CategoryKind) =>
    sql`avg(${column}) filter (where ${categoryGroups.kind} = ${kind})`;

  await db.execute(sql`
    insert into ${priceHistory} (
      date, avg_main_student_cents, avg_main_employee_cents, avg_main_guest_cents,
      avg_dessert_student_cents, avg_side_student_cents
    )
    select
      day.date,
      ${avg(mealHistory.priceStudentCents, "main")},
      ${avg(mealHistory.priceEmployeeCents, "main")},
      ${avg(mealHistory.priceGuestCents, "main")},
      ${avg(mealHistory.priceStudentCents, "dessert")},
      ${avg(mealHistory.priceStudentCents, "side")}
    from unnest(array[${days}]::date[]) as day(date)
    left join ${mealHistory} on ${mealHistory.date} = day.date
    left join ${mealCategories} on ${mealCategories.id} = ${mealHistory.categoryId}
    left join ${categoryGroups} on ${categoryGroups.id} = ${mealCategories.groupId}
    group by day.date
    on conflict (date) do update set
      avg_main_student_cents = excluded.avg_main_student_cents,
      avg_main_employee_cents = excluded.avg_main_employee_cents,
      avg_main_guest_cents = excluded.avg_main_guest_cents,
      avg_dessert_student_cents = excluded.avg_dessert_student_cents,
      avg_side_student_cents = excluded.avg_side_student_cents
  `);
}

/** After categories changed group or kind: recompute every day these categories were served */
export async function recomputePriceHistory(
  db: MensaDatabase,
  categoryIds: number[],
) {
  if (categoryIds.length === 0) return;

  const rows = await db
    .selectDistinct({ date: mealHistory.date })
    .from(mealHistory)
    .where(inArray(mealHistory.categoryId, categoryIds));

  await updatePriceHistory(
    db,
    rows.map((row) => row.date),
  );
}
