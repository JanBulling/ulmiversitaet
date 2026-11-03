"use server";

import { z } from "zod";

import { invalidateMensa } from "@/features/mensa/cache";
import {
  refreshMenus,
  type RefreshResult,
} from "@/features/mensa/sync/refresh-menus";
import { requireAdmin } from "@/lib/auth/session";
import { isIsoDate } from "@/lib/date";

export type RefreshState = { results?: RefreshResult[] };

const refreshSchema = z.array(z.string().refine(isIsoDate)).min(1).max(10);

/** Scrapes the given days again (form fields named `date`) */
export async function refreshDays(
  _previous: RefreshState,
  formData: FormData,
): Promise<RefreshState> {
  await requireAdmin();

  const dates = refreshSchema.parse(formData.getAll("date"));
  const results = await refreshMenus(dates);
  invalidateMensa();

  return { results };
}
