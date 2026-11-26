"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { getPathname } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { BANNER_CACHE_TAG } from "@/features/banner/cache";
import { bannerSchema } from "./schema";

export type BannerFormState = {
  error?: "invalid" | "link";
  saved?: boolean;
};

const hideAll = () =>
  db.update(banners).set({ visible: false }).where(eq(banners.visible, true));

/** Creates (empty `id`, shown right away instead of the current one) or updates a banner */
export async function saveBanner(
  _previous: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  await requireAdmin();

  const parsed = bannerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const linkIssue = parsed.error.issues.some((issue) =>
      issue.path.includes("link"),
    );
    return { error: linkIssue ? "link" : "invalid" };
  }
  const { id, locale, ...values } = parsed.data;

  if (id) {
    await db.update(banners).set(values).where(eq(banners.id, id));
  } else {
    // One transaction, so there is never a moment with two visible banners
    await db.batch([
      hideAll(),
      db.insert(banners).values({ ...values, visible: true }),
    ]);
  }

  updateTag(BANNER_CACHE_TAG);
  if (!id) redirect(getPathname({ href: "/admin/banner", locale }));
  refresh();
  return { saved: true };
}

/** Shows a banner (hiding the current one) or hides it */
export async function setBannerVisibility(formData: FormData) {
  await requireAdmin();
  const { id, visible } = z
    .object({ id: z.uuid(), visible: z.enum(["true", "false"]) })
    .parse(Object.fromEntries(formData));

  if (visible === "true") {
    await db.batch([
      hideAll(),
      db.update(banners).set({ visible: true }).where(eq(banners.id, id)),
    ]);
  } else {
    await db.update(banners).set({ visible: false }).where(eq(banners.id, id));
  }

  updateTag(BANNER_CACHE_TAG);
  refresh();
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin();
  const { id, locale } = z
    .object({
      id: z.uuid(),
      locale: z.enum(routing.locales).catch(routing.defaultLocale),
    })
    .parse(Object.fromEntries(formData));

  await db.delete(banners).where(eq(banners.id, id));

  updateTag(BANNER_CACHE_TAG);
  redirect(getPathname({ href: "/admin/banner", locale }));
}
