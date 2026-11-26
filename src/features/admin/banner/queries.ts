import "server-only";

import { desc, eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";

/** The visible banner and the latest 50 others, newest first */
export async function listBanners() {
  await requireAdmin();

  const [[visible], others] = await Promise.all([
    db.select().from(banners).where(eq(banners.visible, true)),
    db
      .select()
      .from(banners)
      .where(eq(banners.visible, false))
      .orderBy(desc(banners.createdAt))
      .limit(50),
  ]);

  return { visible: visible ?? null, others };
}

export async function getBanner(id: string) {
  await requireAdmin();
  const [banner] = await db.select().from(banners).where(eq(banners.id, id));
  return banner ?? null;
}
