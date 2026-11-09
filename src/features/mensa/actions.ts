"use server";

import { and, eq } from "drizzle-orm";
import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { z } from "zod";

import { today } from "@/lib/date";
import { db } from "@/lib/db";
import { mealHistory, mealRatings } from "@/lib/db/schema";
import { routing } from "@/lib/i18n/routing";
import { invalidateMensa } from "./cache";
import { getGuruAdvice, isGuruEnabled } from "./guru";
import type { GuruAdvice } from "./guru-prompt";
import {
  RATED_MEALS_COOKIE,
  RATING_INTERVAL_MS,
  parseRatedMeals,
  serializeRatedMeals,
} from "./rated-meals";
import { ratingWindow, type RatingWindow } from "./rating-window";

export type RatingFormState = {
  error?: "invalid" | "alreadyRated" | Exclude<RatingWindow, "open">;
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

/**
 * Rates a meal with an optional comment: only on the day it is served, after the mensa opened
 * (see `rating-window.ts`), and once per meal and day (see `rated-meals.ts`)
 */
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

  // Also rejects unknown meals: they are never served
  const now = new Date();
  const servedToday = await db
    .select({ date: mealHistory.date })
    .from(mealHistory)
    .where(
      and(eq(mealHistory.mealId, mealId), eq(mealHistory.date, today(now))),
    );
  const status = ratingWindow(
    servedToday.map((row) => row.date),
    now,
  );
  if (status !== "open") return { error: status };

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

export type GuruResult =
  { advice: GuruAdvice } | { error: "unavailable" | "failed" };

/** The guru's recommendation for today in the given language (see `guru.ts`) */
export async function askGuru(locale: string): Promise<GuruResult> {
  if (!isGuruEnabled() || !hasLocale(routing.locales, locale)) {
    return { error: "unavailable" };
  }
  try {
    const advice = await getGuruAdvice(today(), locale);
    return advice ? { advice } : { error: "unavailable" };
  } catch (error) {
    console.error("[mensa-guru] Asking Gemini failed", error);
    return { error: "failed" };
  }
}
