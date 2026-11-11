import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  MenuDays,
  MenuView,
  MenuViewSkeleton,
} from "@/components/mensa/menu-view";
import { MensaMore } from "@/components/mensa/mensa-more";
import { MenuHeader } from "./menu-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Mensa");
  return { title: t("menuTitle"), description: t("metaDescription") };
}

/** Today's menu (next Monday on weekends) */
export default function MensaPage() {
  return (
    <>
      <MenuHeader />
      {/* Cached and data-free: part of the prerendered page, no skeleton */}
      <MenuDays />
      <Suspense fallback={<MenuViewSkeleton />}>
        <MenuView />
      </Suspense>
      <MensaMore />
    </>
  );
}
