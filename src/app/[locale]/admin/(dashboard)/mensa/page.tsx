import { CookingPot } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page";
import {
  MenuAdmin,
  MenuAdminSkeleton,
} from "@/features/mensa/admin/components/menu-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.nav");
  return { title: t("mensa") };
}

export default async function AdminMensaPage() {
  const t = await getTranslations("Admin.nav");

  return (
    <>
      <PageHeader icon={CookingPot} title={t("mensa")} />
      <Suspense fallback={<MenuAdminSkeleton />}>
        <MenuAdmin />
      </Suspense>
    </>
  );
}
