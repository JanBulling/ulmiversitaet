import { isNull, relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  real,
  smallint,
  text,
  unique,
  uuid,
  timestamp,
} from "drizzle-orm/pg-core";

import { createdAt, nameKey, ulmiversitaet, updatedAt } from "./common";

/**
 * Mensa of Ulm University, scraped once per day from the Studierendenwerk menu.
 *
 * - `meals`: every dish that ever appeared, with its most recent data
 * - `meal_history`: which meal was on the menu on which day, at which price
 * - `meal_categories`: categories exactly as printed on the menu (added automatically)
 * - `category_groups`: display categories maintained in the admin dashboard
 * - `meal_ratings`: ratings and comments
 * - `price_history`: daily average prices
 */

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoryKind = ulmiversitaet.enum("category_kind", [
  "main", // counts as main dish (price tracking, best/worst meals, guru)
  "side",
  "dessert",
  "other",
]);

/** Display categories, created and maintained in the admin dashboard ("Pizza") */
export const categoryGroups = ulmiversitaet.table("category_groups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nameDe: text("name_de").notNull().unique(),
  nameEn: text("name_en"),
  kind: categoryKind("kind").notNull().default("main"),
  /** Hex color, e.g. `#22c55e` */
  color: text("color"),
  /** lucide-react icon name, e.g. `pizza` */
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(100),
  /** Shown in the mensa section of the home page */
  showOnHome: boolean("show_on_home").notNull().default(false),
  createdAt: createdAt(),
});

/**
 * Categories exactly as printed on the menu ("PIZZA I", "FLEISCH + FISCH").
 * Inserted automatically by the scraper; assigned to a group in the admin.
 */
export const mealCategories = ulmiversitaet.table("meal_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  /** `null` = not assigned yet → shown under its own name, never on the home page */
  groupId: integer("group_id").references(() => categoryGroups.id, {
    onDelete: "set null",
  }),
  createdAt: createdAt(),
});

// ─── Meals ───────────────────────────────────────────────────────────────────

/** Every dish that ever appeared, with its most recent data */
export const meals = ulmiversitaet.table(
  "meals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    nameKey: nameKey("name"),
    nameEn: text("name_en"),

    categoryId: integer("category_id")
      .notNull()
      .references(() => mealCategories.id),

    /** Codes as printed on the menu, e.g. `{"23","27","34W"}`; unknown codes are kept */
    allergens: text("allergens")
      .array()
      .notNull()
      .default(sql`'{}'`),
    /** Diet/meat icon codes, e.g. `{"van"}`, `{"veg"}`, `{"S"}` */
    types: text("types")
      .array()
      .notNull()
      .default(sql`'{}'`),

    priceStudentCents: integer("price_student_cents"),
    priceEmployeeCents: integer("price_employee_cents"),
    priceGuestCents: integer("price_guest_cents"),
    /** e.g. "je 100g" */
    priceNote: text("price_note"),

    // Nutrition per portion
    energyKcal: integer("energy_kcal"),
    energyKj: integer("energy_kj"),
    proteinG: real("protein_g"),
    fatG: real("fat_g"),
    saturatedFatG: real("saturated_fat_g"),
    carbohydratesG: real("carbohydrates_g"),
    sugarG: real("sugar_g"),
    saltG: real("salt_g"),
    co2G: integer("co2_g"),

    /** Date of the menu the current values come from; older menus never overwrite newer data */
    lastServedOn: date("last_served_on", { mode: "string" }).notNull(),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("meals_name_key_idx").on(t.nameKey),
    index("meals_name_trgm_idx").using("gin", sql`${t.name} gin_trgm_ops`),
    index("meals_category_idx").on(t.categoryId),
  ],
);

/** Which meal was on the menu on which day, with that day's name, category, and prices */
export const mealHistory = ulmiversitaet.table(
  "meal_history",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    date: date("date", { mode: "string" }).notNull(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => mealCategories.id),

    /** Name as printed that day (the meal's current name may change later) */
    name: text("name").notNull(),
    nameKey: nameKey("name"),

    priceStudentCents: integer("price_student_cents"),
    priceEmployeeCents: integer("price_employee_cents"),
    priceGuestCents: integer("price_guest_cents"),
    priceNote: text("price_note"),

    /** Order on the menu that day */
    position: smallint("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    unique("meal_history_date_meal_key").on(t.date, t.mealId),
    index("meal_history_meal_date_idx").on(t.mealId, t.date.desc()),
    index("meal_history_name_key_idx").on(t.nameKey),
  ],
);

// ─── Ratings & comments ──────────────────────────────────────────────────────

export const mealRatings = ulmiversitaet.table(
  "meal_ratings",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),

    taste: smallint("taste").notNull(),
    look: smallint("look").notNull(),
    price: smallint("price").notNull(),
    /** Weighted total, computed by Postgres */
    total: real("total")
      .notNull()
      .generatedAlwaysAs(sql`(3 * taste + 2 * look + price)::real / 6`),

    comment: text("comment"),
    /** Set in the admin to hide spam; hidden ratings are excluded from all stats */
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("meal_ratings_meal_idx").on(t.mealId, t.createdAt.desc()),
    check(
      "meal_ratings_values_check",
      sql`taste between 1 and 5 and look between 1 and 5 and price between 1 and 5`,
    ),
    check("meal_ratings_comment_check", sql`char_length(comment) <= 1000`),
  ],
);

/** Rating aggregates per meal; `score` is a Bayesian average (prior 3.0, weight 2) for rankings */
export const mealRatingStats = ulmiversitaet
  .view("meal_rating_stats")
  .as((qb) =>
    qb
      .select({
        mealId: mealRatings.mealId,
        count: sql<number>`count(*)::int`.as("count"),
        taste: sql<number>`avg(${mealRatings.taste})::real`.as("taste"),
        look: sql<number>`avg(${mealRatings.look})::real`.as("look"),
        price: sql<number>`avg(${mealRatings.price})::real`.as("price"),
        total: sql<number>`avg(${mealRatings.total})::real`.as("total"),
        score:
          sql<number>`((count(*) * avg(${mealRatings.total}) + 2 * 3.0) / (count(*) + 2))::real`.as(
            "score",
          ),
      })
      .from(mealRatings)
      .where(isNull(mealRatings.hiddenAt))
      .groupBy(mealRatings.mealId),
  );

// ─── Price tracking ──────────────────────────────────────────────────────────

/** Average prices per day, written by the scraper (feeds the statistics chart) */
export const priceHistory = ulmiversitaet.table("price_history", {
  date: date("date", { mode: "string" }).primaryKey(),
  avgMainStudentCents: real("avg_main_student_cents"),
  avgMainEmployeeCents: real("avg_main_employee_cents"),
  avgMainGuestCents: real("avg_main_guest_cents"),
  avgDessertStudentCents: real("avg_dessert_student_cents"),
  avgSideStudentCents: real("avg_side_student_cents"),
});

// ─── Relations (for `db.query.*`) ────────────────────────────────────────────

export const categoryGroupsRelations = relations(
  categoryGroups,
  ({ many }) => ({
    categories: many(mealCategories),
  }),
);

export const mealCategoriesRelations = relations(
  mealCategories,
  ({ one, many }) => ({
    group: one(categoryGroups, {
      fields: [mealCategories.groupId],
      references: [categoryGroups.id],
    }),
    meals: many(meals),
    history: many(mealHistory),
  }),
);

export const mealsRelations = relations(meals, ({ one, many }) => ({
  category: one(mealCategories, {
    fields: [meals.categoryId],
    references: [mealCategories.id],
  }),
  history: many(mealHistory),
  ratings: many(mealRatings),
}));

export const mealHistoryRelations = relations(mealHistory, ({ one }) => ({
  meal: one(meals, { fields: [mealHistory.mealId], references: [meals.id] }),
  category: one(mealCategories, {
    fields: [mealHistory.categoryId],
    references: [mealCategories.id],
  }),
}));

export const mealRatingsRelations = relations(mealRatings, ({ one }) => ({
  meal: one(meals, { fields: [mealRatings.mealId], references: [meals.id] }),
}));

export type CategoryKind = (typeof categoryKind.enumValues)[number];
export type CategoryGroup = typeof categoryGroups.$inferSelect;
export type MealCategory = typeof mealCategories.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type MealHistoryEntry = typeof mealHistory.$inferSelect;
export type MealRating = typeof mealRatings.$inferSelect;
export type PriceHistoryEntry = typeof priceHistory.$inferSelect;
