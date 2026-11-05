"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

import { db } from "@/lib/db";
import { mealRatings, meals } from "@/lib/db/schema";
import { invalidateMensa } from "./cache";
import {
  RATED_MEALS_COOKIE,
  RATING_INTERVAL_MS,
  parseRatedMeals,
  serializeRatedMeals,
} from "./rated-meals";

export type RatingFormState = {
  error?: "invalid" | "alreadyRated";
  saved?: boolean;
};

const stars = z.coerce.number().int().min(1).max(5);

const ratingSchema = z.object({
  mealId: z.uuid(),
  taste: stars,
  look: stars,
  price: stars,
  comment: z
    .string()
    .trim()
    .max(1000)
    .transform((value) => value || null),
});

/** Rates a meal with an optional comment; once per meal and day (see `rated-meals.ts`) */
export async function rateMeal(
  _previous: RatingFormState,
  formData: FormData,
): Promise<RatingFormState> {
  const parsed = ratingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { mealId, ...values } = parsed.data;

  const cookieStore = await cookies();
  const rated = parseRatedMeals(cookieStore.get(RATED_MEALS_COOKIE)?.value);
  if (rated.has(mealId)) return { error: "alreadyRated" };

  const [meal] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(eq(meals.id, mealId));
  if (!meal) return { error: "invalid" };

  await db.insert(mealRatings).values({ mealId, ...values });

  rated.set(mealId, Date.now());
  cookieStore.set(RATED_MEALS_COOKIE, serializeRatedMeals(rated), {
    // Read in the browser to hide the form
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: RATING_INTERVAL_MS / 1000,
  });

  invalidateMensa();
  return { saved: true };
}
