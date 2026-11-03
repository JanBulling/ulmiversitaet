"use server";

import { asc, eq, max } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { isIsoDate } from "@/lib/date";
import { db } from "@/lib/db";
import { categoryGroups, categoryKind, mealCategories } from "@/lib/db/schema";
import { getPathname } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { MENSA_CACHE_TAG } from "../cache";
import { ICON_NAMES } from "../components/icons";
import { refreshMenus, type RefreshResult } from "../sync/refresh-menus";
import { recomputePriceHistory } from "../sync/sync-menu";

/** Public mensa pages are cached; expire them so changes show up immediately */
function invalidate() {
  updateTag(MENSA_CACHE_TAG);
  refresh(); // admin pages read uncached data
}

const id = z.coerce.number().int().positive();
const locale = z.enum(routing.locales).catch(routing.defaultLocale);

// ─── Menu ────────────────────────────────────────────────────────────────────

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
  invalidate();

  return { results };
}

// ─── Categories ──────────────────────────────────────────────────────────────

const assignSchema = z.object({
  categoryId: id,
  // "" = not assigned
  groupId: z.union([z.literal("").transform(() => null), id]),
});

export async function assignCategory(formData: FormData) {
  await requireAdmin();
  const { categoryId, groupId } = assignSchema.parse(
    Object.fromEntries(formData),
  );

  await db
    .update(mealCategories)
    .set({ groupId })
    .where(eq(mealCategories.id, categoryId));
  await recomputePriceHistory(db, [categoryId]);

  invalidate();
}

export type GroupFormState = {
  error?: "invalid" | "duplicateName";
  saved?: boolean;
};

const createSchema = z.object({
  nameDe: z.string().trim().min(1).max(100),
  locale,
});

export async function createGroup(
  _previous: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  await requireAdmin();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };

  const [last] = await db
    .select({ sortOrder: max(categoryGroups.sortOrder) })
    .from(categoryGroups);
  const [group] = await db
    .insert(categoryGroups)
    .values({
      nameDe: parsed.data.nameDe,
      sortOrder: (last?.sortOrder ?? 0) + 10,
    })
    .onConflictDoNothing({ target: categoryGroups.nameDe })
    .returning({ id: categoryGroups.id });

  if (!group) return { error: "duplicateName" };

  invalidate();
  redirect(
    getPathname({
      href: `/admin/mensa/categories/${group.id}`,
      locale: parsed.data.locale,
    }),
  );
}

const updateSchema = z.object({
  id,
  nameDe: z.string().trim().min(1).max(100),
  nameEn: z
    .string()
    .trim()
    .max(100)
    .transform((value) => value || null),
  kind: z.enum(categoryKind.enumValues),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  icon: z.enum(ICON_NAMES as [string, ...string[]]),
  // Unchecked checkboxes are not sent
  showOnHome: z
    .literal("on")
    .optional()
    .transform((value) => value === "on"),
});

export async function updateGroup(
  _previous: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  await requireAdmin();

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { id: groupId, ...values } = parsed.data;

  const [before] = await db
    .select({ kind: categoryGroups.kind })
    .from(categoryGroups)
    .where(eq(categoryGroups.id, groupId));
  if (!before) return { error: "invalid" };

  try {
    await db
      .update(categoryGroups)
      .set(values)
      .where(eq(categoryGroups.id, groupId));
  } catch {
    return { error: "duplicateName" };
  }

  if (before.kind !== values.kind) {
    await recomputePriceHistory(db, await categoryIdsOf(groupId));
  }

  invalidate();
  return { saved: true };
}

export async function deleteGroup(formData: FormData) {
  await requireAdmin();
  const { id: groupId, locale: target } = z
    .object({ id, locale })
    .parse(Object.fromEntries(formData));

  const categoryIds = await categoryIdsOf(groupId);
  // Assigned categories become unassigned (`on delete set null`)
  await db.delete(categoryGroups).where(eq(categoryGroups.id, groupId));
  await recomputePriceHistory(db, categoryIds);

  invalidate();
  redirect(getPathname({ href: "/admin/mensa/categories", locale: target }));
}

const toggleSchema = z.object({
  id,
  showOnHome: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export async function setShowOnHome(formData: FormData) {
  await requireAdmin();
  const { id: groupId, showOnHome } = toggleSchema.parse(
    Object.fromEntries(formData),
  );

  await db
    .update(categoryGroups)
    .set({ showOnHome })
    .where(eq(categoryGroups.id, groupId));

  invalidate();
}

const moveSchema = z.object({ id, direction: z.enum(["up", "down"]) });

/** Swaps a group with its neighbor and renumbers all groups in steps of 10 */
export async function moveGroup(formData: FormData) {
  await requireAdmin();
  const { id: groupId, direction } = moveSchema.parse(
    Object.fromEntries(formData),
  );

  const groups = await db
    .select({ id: categoryGroups.id })
    .from(categoryGroups)
    .orderBy(asc(categoryGroups.sortOrder), asc(categoryGroups.id));

  const index = groups.findIndex((group) => group.id === groupId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= groups.length) return;

  [groups[index], groups[target]] = [groups[target], groups[index]];

  const [first, ...rest] = groups.map((group, position) =>
    db
      .update(categoryGroups)
      .set({ sortOrder: (position + 1) * 10 })
      .where(eq(categoryGroups.id, group.id)),
  );
  await db.batch([first, ...rest]);

  invalidate();
}

async function categoryIdsOf(groupId: number) {
  const rows = await db
    .select({ id: mealCategories.id })
    .from(mealCategories)
    .where(eq(mealCategories.groupId, groupId));
  return rows.map((row) => row.id);
}
