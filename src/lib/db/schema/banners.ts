import { sql } from "drizzle-orm";
import { boolean, check, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { BANNER_COLORS } from "./banner-colors";
import { createdAt, ulmiversitaet, updatedAt } from "./common";

/**
 * Banners above the site header, managed in the admin dashboard. Old banners are kept, so they
 * can be shown again. At most one is visible (unique index on the visible rows).
 * The English texts are optional; without them the German ones are shown.
 */
export const banners = ulmiversitaet.table(
  "banners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    titleEn: text("title_en"),
    descriptionEn: text("description_en"),
    /** `https://…` or a path of the site (`/mensa`) */
    link: text("link"),
    color: text("color", { enum: BANNER_COLORS }).notNull().default("default"),
    visible: boolean("visible").notNull().default(false),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("banners_one_visible_idx")
      .on(t.visible)
      .where(sql`visible`),
    check(
      "banners_color_check",
      sql.raw(
        `color in (${BANNER_COLORS.map((color) => `'${color}'`).join(", ")})`,
      ),
    ),
  ],
);

export type Banner = typeof banners.$inferSelect;
