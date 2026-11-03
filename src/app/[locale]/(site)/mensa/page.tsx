import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { MenuView, MenuViewSkeleton } from "@/components/mensa/menu-view";
import { MenuHeader } from "./menu-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Mensa");
  return { title: t("menuTitle") };
}

/** Today's menu (next Monday on weekends) */
export default function MensaPage() {
  return (
    <>
      <MenuHeader />
      <Suspense fallback={<MenuViewSkeleton />}>
        <MenuView />
      </Suspense>
    </>
  );
}
